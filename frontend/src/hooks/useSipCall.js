/**
 * useSipCall.js
 * Custom hook managing a WebRTC/SIP call via SIP.js 0.21.x
 *
 * FusionPBX setup required:
 *   - WSS binding enabled on port 7443 (Sofia profile "internal")
 *   - Extension 1001 exists and can receive calls
 *   - A dedicated "ivr-caller" extension (e.g. 1099) created for this widget
 *     with a known password — set in SIP_CONFIG below.
 *
 * Security: the caller credentials are intentionally a low-privilege,
 * outbound-only extension. Do NOT reuse agent credentials here.
 */

import { useRef, useState, useCallback, useEffect } from "react";
import {
  UserAgent,
  Registerer,
  Inviter,
  SessionState,
  RegistererState,
  Web,
} from "sip.js";

// ─── FusionPBX / SIP configuration ───────────────────────────────────────────
// Server IP is read from the VITE_SIP_SERVER_IP env variable (set in .env).
const _SIP_IP = import.meta.env.VITE_SIP_SERVER_IP ?? "192.168.1.9";
const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
const _host = typeof window !== "undefined" && window.location.host ? window.location.host : "192.168.1.5:5173";

export const SIP_CONFIG = {
  /** WebSocket URI — uses FastAPI relay on HTTPS, direct WS on HTTP */
  wsServer: isHttps ? `wss://${_host}/api/sip-relay` : `ws://${_SIP_IP}:5066`,
  /** SIP domain — must match the FusionPBX domain */
  domain: _SIP_IP,
  /** Low-privilege extension dedicated to this widget (ivr-caller) */
  extension: "1099",
  password: "abc123",
  displayName: "Visual IVR",
  /** Extension to dial when "Speak with Agent" is pressed */
  targetExtension: "1002",
  /** Ring timeout in seconds before auto-cancel */
  ringTimeout: 30,
  /** Pre-flight WS probe timeout in ms */
  preflightTimeoutMs: 6000,
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call phase enum — drives the UI state machine.
 * idle → preflight → requesting_mic → connecting → registering → ringing → active → ending → ended
 *    └──────────────────────────────────────────────────────────────────────────────────────┘ error
 */
export const CallPhase = {
  IDLE:           "idle",
  PREFLIGHT:      "preflight",
  REQUESTING_MIC: "requesting_mic",
  CONNECTING:     "connecting",
  REGISTERING:    "registering",
  RINGING:        "ringing",
  ACTIVE:         "active",
  ENDING:         "ending",
  ENDED:          "ended",
  ERROR:          "error",
};

// ─── Pre-flight: open a raw WebSocket and read the close code ─────────────────
/**
 * Tries to open a WebSocket to the SIP server with a short timeout.
 * Returns a resolved promise with { ok, closeCode, closeReason, timedOut }.
 * Never rejects — all paths resolve so the caller can act on the result.
 */
function probeWebSocket(url, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    let ws;

    const done = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Clean up the probe socket — don't let it linger
      try { if (ws && ws.readyState < 2) ws.close(); } catch (_) {}
      resolve(result);
    };

    const timer = setTimeout(() => {
      done({ ok: false, timedOut: true, closeCode: null, closeReason: "" });
    }, timeoutMs);

    try {
      // SIP.js uses the "sip" sub-protocol; use same to get past protocol guards
      ws = new WebSocket(url, ["sip"]);

      ws.onopen = () => {
        // A clean open means the server is reachable and cert is trusted
        done({ ok: true, timedOut: false, closeCode: null, closeReason: "" });
      };

      ws.onclose = (ev) => {
        // Log every close event so devs can diagnose quickly
        console.debug(
          `[SIP preflight] WebSocket closed — code: ${ev.code}, ` +
          `reason: "${ev.reason || "(none)"}", wasClean: ${ev.wasClean}, ` +
          `url: ${url}`
        );
        done({
          ok: false,
          timedOut: false,
          closeCode: ev.code,
          closeReason: ev.reason,
          wasClean: ev.wasClean,
        });
      };

      ws.onerror = () => {
        // onerror always fires before onclose — let onclose capture the code
      };
    } catch (err) {
      // new WebSocket() itself threw (invalid URL, etc.)
      done({ ok: false, timedOut: false, closeCode: -1, closeReason: err.message });
    }
  });
}

/**
 * Classify a WebSocket close code into a human-readable error message.
 * Code 1006 = abnormal closure — the most common case and the most ambiguous.
 */
/**
 * Classify a WebSocket close code and reason into a human-readable diagnostic error message.
 * Lookup table covering common errors like 1006 (network/abnormal), 1002 (protocol), 1015 (TLS).
 */
function classifyCloseDetails(code, reason = "") {
  if (code === null || code === undefined) {
    return "Abnormal network connectivity issue, target port not listening, or server not running.";
  }

  const explanations = {
    1000: "Normal closure (the connection was closed successfully).",
    1001: "Going away (the server is shutting down or SIP profile was stopped).",
    1002: "Protocol error (code 1002 — the server rejected the WebSocket handshake/sub-protocol). Ensure you configured 'sip' sub-protocol support in FusionPBX's mod_sofia.",
    1003: "Unsupported data type.",
    1005: "No status code was present.",
    1006: "Abnormal closure (code 1006 — network connectivity issue, target port not listening, or server not running).",
    1007: "Invalid frame payload data.",
    1008: "Policy violation.",
    1009: "Message too big.",
    1010: "Missing extension.",
    1011: "Internal server error.",
    1015: "TLS handshake failure (code 1015 — security certificate not trusted or invalid). Ensure FusionPBX has a valid SSL certificate.",
  };

  const host = SIP_CONFIG.wsServer.replace(/^wss?:\/\//, "").split("/")[0];
  const explanation = explanations[code] || `WebSocket close code ${code}.`;
  
  let detailed = explanation;
  if (code === 1006) {
    detailed += `\n\nPossible solutions:\n` +
                `• Verify that FusionPBX is reachable at ${SIP_CONFIG.wsServer} on the same LAN (${host}).\n` +
                `• Confirm port 5066 (or the Sofia profile port) is open and not blocked by a firewall.`;
  }
  
  if (reason) {
    detailed += `\nReason: ${reason}`;
  }
  return detailed;
}

/**
 * Classify a pre-flight WebSocket probe failure.
 */
function classifyWsError(probe) {
  const { closeCode, closeReason, timedOut } = probe;

  if (timedOut) {
    return (
      `Connection to ${SIP_CONFIG.wsServer} timed out after ${SIP_CONFIG.preflightTimeoutMs / 1000}s. ` +
      `Possible causes:\n` +
      `• The FusionPBX server is off or unreachable on your current network\n` +
      `• Port 5066 is blocked by a firewall\n` +
      `• You are not on the same LAN as the server`
    );
  }

  return classifyCloseDetails(closeCode, closeReason);
}

// ─── Custom Web Transport exposing raw socket close events and logging ───────
class CustomTransport extends Web.Transport {
  constructor(logger, options) {
    super(logger, options);
    this.lastCloseCode = null;
    this.lastCloseReason = "";
  }

  _connect() {
    const promise = super._connect();
    const ws = this.ws;
    if (ws) {
      console.info(`[SIP UA] Connecting to WebSocket URL: ${ws.url}`);
      ws.addEventListener("close", (ev) => {
        this.lastCloseCode = ev.code;
        this.lastCloseReason = ev.reason;
        console.warn(
          `[SIP UA WebSocket Close] URL: ${ws.url}\n` +
          `• Close Code: ${ev.code}\n` +
          `• Close Reason: "${ev.reason || "(none)"}"\n` +
          `• Was Clean: ${ev.wasClean}`
        );
      });
      ws.addEventListener("error", (ev) => {
        console.error(`[SIP UA WebSocket Error] URL: ${ws.url}\n• Error Event:`, ev);
      });
    }
    return promise;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export function useSipCall() {
  const [phase, setPhase]       = useState(CallPhase.IDLE);
  const [errorMsg, setErrorMsg] = useState("");
  const [muted, setMuted]       = useState(false);
  const [elapsed, setElapsed]   = useState(0);

  const uaRef           = useRef(null);
  const registererRef   = useRef(null);
  const inviterRef      = useRef(null);
  const remoteAudioRef  = useRef(null);
  const localStreamRef  = useRef(null);
  const ringTimerRef    = useRef(null);
  const elapsedTimerRef = useRef(null);
  const phaseRef        = useRef(CallPhase.IDLE);

  // Keep phaseRef mirrored so async callbacks read the latest value
  const updatePhase = useCallback((p) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // ── Timers ────────────────────────────────────────────────────────────────
  const stopElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const stopRingTimer = useCallback(() => {
    if (ringTimerRef.current) {
      clearTimeout(ringTimerRef.current);
      ringTimerRef.current = null;
    }
  }, []);

  const releaseLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
  }, []);

  // ── Full teardown ─────────────────────────────────────────────────────────
  const teardown = useCallback(async (nextPhase = CallPhase.ENDED) => {
    updatePhase(nextPhase);
    stopRingTimer();
    stopElapsedTimer();

    const inv = inviterRef.current;
    if (inv) {
      inviterRef.current = null;
      try {
        if (inv.state === SessionState.Establishing || inv.state === SessionState.Initial) {
          await inv.cancel();
        } else if (inv.state === SessionState.Established) {
          await inv.bye();
        }
      } catch (_) {}
    }

    const reg = registererRef.current;
    if (reg) {
      registererRef.current = null;
      try {
        if (reg.state === RegistererState.Registered) {
          await reg.unregister();
        }
        reg.dispose();
      } catch (_) {}
    }

    const ua = uaRef.current;
    if (ua) {
      uaRef.current = null;
      try { await ua.stop(); } catch (_) {}
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }

    releaseLocalStream();
    setElapsed(0);
    setMuted(false);
  }, [stopRingTimer, stopElapsedTimer, releaseLocalStream, updatePhase]);

  // ── Attach remote RTP audio ───────────────────────────────────────────────
  const attachRemoteMedia = useCallback((session) => {
    const sdh = session.sessionDescriptionHandler;
    if (!sdh) return;
    const pc = sdh.peerConnection;
    if (!pc) return;

    const remoteStream = new MediaStream();
    pc.getReceivers().forEach((r) => { if (r.track) remoteStream.addTrack(r.track); });

    let audioEl = remoteAudioRef.current;
    if (!audioEl) {
      audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.style.display = "none";
      document.body.appendChild(audioEl);
      remoteAudioRef.current = audioEl;
    }
    audioEl.srcObject = remoteStream;
    audioEl.play().catch(() => {});
  }, []);

  // ── Main: start call ──────────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    const cur = phaseRef.current;
    if (cur !== CallPhase.IDLE && cur !== CallPhase.ENDED && cur !== CallPhase.ERROR) {
      return; // already running
    }

    setErrorMsg("");
    setElapsed(0);
    setMuted(false);

    // Mixed Content Policy Check
    if (window.location.protocol === "https:" && SIP_CONFIG.wsServer.startsWith("ws://")) {
      console.warn("[SIP] Mixed content block warning triggered: ws:// connection over HTTPS page.");
      setErrorMsg(
        `Insecure WebSocket connection blocked (mixed content policy).\n\n` +
        `The Visual IVR page is served over secure HTTPS, which blocks plain ws:// connections.\n\n` +
        `To fix this, either:\n` +
        `• (a) Serve this Visual IVR page over plain HTTP (http://) for local testing, or\n` +
        `• (b) Configure WSS properly on your FusionPBX server (e.g. port 7443) instead of plain WS.`
      );
      updatePhase(CallPhase.ERROR);
      return;
    }

    // ── Step 1: Pre-flight WebSocket probe ────────────────────────────────
    updatePhase(CallPhase.PREFLIGHT);
    console.info(`[SIP preflight] Probing ${SIP_CONFIG.wsServer} (timeout: ${SIP_CONFIG.preflightTimeoutMs}ms)…`);

    const probe = await probeWebSocket(SIP_CONFIG.wsServer, SIP_CONFIG.preflightTimeoutMs);

    if (!probe.ok) {
      // Log the raw result for developer debugging
      console.warn("[SIP preflight] Connectivity check failed:", probe);
      setErrorMsg(classifyWsError(probe));
      updatePhase(CallPhase.ERROR);
      return;
    }

    console.info("[SIP preflight] Server reachable. Proceeding with SIP setup.");

    // ── Step 2: Microphone permission ─────────────────────────────────────
    updatePhase(CallPhase.REQUESTING_MIC);
    let localStream;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "WebRTC in-browser calling requires HTTPS. On mobile Wi-Fi (HTTP), please tap 'Call Agent Directly' to connect instantly via your phone dialer."
        );
      }
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = localStream;
    } catch (err) {
      const msg =
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Microphone access was denied. Please allow microphone permission in your browser settings."
          : (err.message || "Could not access microphone.");
      setErrorMsg(msg);
      updatePhase(CallPhase.ERROR);
      return;
    }

    // ── Step 3: Build and start the SIP UserAgent ─────────────────────────
    updatePhase(CallPhase.CONNECTING);
    let ua;
    try {
      const uri = UserAgent.makeURI(`sip:${SIP_CONFIG.extension}@${SIP_CONFIG.domain}`);
      if (!uri) throw new Error("Failed to parse SIP URI — check SIP_CONFIG.extension / domain.");

      ua = new UserAgent({
        uri,
        displayName: SIP_CONFIG.displayName,
        authorizationUsername: SIP_CONFIG.extension,
        authorizationPassword: SIP_CONFIG.password,
        transportConstructor: CustomTransport,
        transportOptions: {
          server: SIP_CONFIG.wsServer,
          traceSip: false,
          connectionTimeout: 8,
        },
        sessionDescriptionHandlerFactory: Web.SessionDescriptionHandler.defaultFactory,
        sessionDescriptionHandlerFactoryOptions: {
          peerConnectionConfiguration: {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          },
        },
        logBuiltinEnabled: false,
        logLevel: "warn",
        delegate: {
          onDisconnect: (err) => {
            console.warn("[SIP UA] Transport disconnected:", err);
            // Only handle unexpected drops when we are actively trying to connect/call
            if (
              phaseRef.current === CallPhase.CONNECTING ||
              phaseRef.current === CallPhase.REGISTERING ||
              phaseRef.current === CallPhase.RINGING ||
              phaseRef.current === CallPhase.ACTIVE
            ) {
              const transport = uaRef.current?.transport;
              const closeCode = transport?.lastCloseCode;
              const closeReason = transport?.lastCloseReason;
              
              let detail = "";
              if (closeCode !== null && closeCode !== undefined) {
                detail = classifyCloseDetails(closeCode, closeReason);
              } else {
                detail = err?.message || "no detail";
              }
              
              setErrorMsg(
                `Connection to SIP server dropped unexpectedly.\n\n${detail}`
              );
              teardown(CallPhase.ERROR);
            }
          },
        },
      });

      uaRef.current = ua;
      await ua.start();
    } catch (err) {
      console.error("[SIP UA] Failed to start:", err);
      setErrorMsg(
        `SIP transport failed to initialise: ${err.message}. ` +
        `Verify that ${SIP_CONFIG.wsServer} is reachable and the TLS certificate is trusted.`
      );
      releaseLocalStream();
      updatePhase(CallPhase.ERROR);
      return;
    }

    // ── Step 4: Register ──────────────────────────────────────────────────
    updatePhase(CallPhase.REGISTERING);
    let registerer;
    try {
      registerer = new Registerer(ua);
      registererRef.current = registerer;

      await new Promise((resolve, reject) => {
        let registerAttempted = false;

        const timeout = setTimeout(() => {
          registerer.stateChange.removeListener(stateListener);
          reject(new Error(
            "SIP REGISTER timed out.\n\nPossible causes:\n" +
            "• Extension 1099 password is wrong in FusionPBX\n" +
            "• Extension 1099 does not exist in FusionPBX\n" +
            "• FusionPBX is blocking the registration"
          ));
        }, 10000);

        const stateListener = (state) => {
          console.debug("[SIP Registerer] state →", state);
          if (state === RegistererState.Registered) {
            clearTimeout(timeout);
            registerer.stateChange.removeListener(stateListener);
            resolve();
          } else if (state === RegistererState.Terminated) {
            clearTimeout(timeout);
            registerer.stateChange.removeListener(stateListener);
            reject(new Error(
              "Registration was rejected by the server (Terminated).\n" +
              "Check extension 1099 exists in FusionPBX with password: abc123"
            ));
          } else if (state === RegistererState.Unregistered && registerAttempted) {
            // Fired AFTER we sent REGISTER → means auth failed (wrong password / 403)
            clearTimeout(timeout);
            registerer.stateChange.removeListener(stateListener);
            reject(new Error(
              "SIP authentication failed for extension 1099.\n\n" +
              "The password in FusionPBX for extension 1099 does not match.\n\n" +
              "Fix: In FusionPBX → Accounts → Extensions → Edit 1099 → " +
              "set Password to: abc123 → Save → Reload"
            ));
          }
        };

        registerer.stateChange.addListener(stateListener);
        registerAttempted = true;
        registerer.register().catch((err) => {
          clearTimeout(timeout);
          registerer.stateChange.removeListener(stateListener);
          reject(err);
        });
      });
    } catch (err) {
      console.error("[SIP Registerer] Failed:", err);
      setErrorMsg(err.message);
      await teardown(CallPhase.ERROR);
      return;
    }

    // ── Step 5: INVITE ────────────────────────────────────────────────────
    updatePhase(CallPhase.RINGING);
    const targetURI = UserAgent.makeURI(
      `sip:${SIP_CONFIG.targetExtension}@${SIP_CONFIG.domain}`
    );
    if (!targetURI) {
      setErrorMsg(`Invalid target extension: ${SIP_CONFIG.targetExtension}`);
      await teardown(CallPhase.ERROR);
      return;
    }

    const inviter = new Inviter(ua, targetURI, {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      },
    });
    inviterRef.current = inviter;

    // Ring timeout — fires if 1001 never answers
    ringTimerRef.current = setTimeout(async () => {
      if (phaseRef.current === CallPhase.RINGING) {
        console.warn(`[SIP] No answer from ext ${SIP_CONFIG.targetExtension} after ${SIP_CONFIG.ringTimeout}s — cancelling INVITE`);
        // Cancel the pending INVITE before tearing down
        try {
          const inv = inviterRef.current;
          if (inv && (inv.state === SessionState.Establishing || inv.state === SessionState.Initial)) {
            await inv.cancel();
          }
        } catch (_) {}
        setErrorMsg(
          `Extension ${SIP_CONFIG.targetExtension} did not answer within ${SIP_CONFIG.ringTimeout} seconds.` +
          `\n\nPossible causes:` +
          `\n• The softphone for ext ${SIP_CONFIG.targetExtension} is not open / registered` +
          `\n• The softphone is registered to the OLD server (192.168.1.10) — update it to ${SIP_CONFIG.domain}` +
          `\n• A FusionPBX dialplan is routing the call elsewhere`
        );
        await teardown(CallPhase.ERROR);
      }
    }, SIP_CONFIG.ringTimeout * 1000);

    // Session FSM
    inviter.stateChange.addListener(async (state) => {
      console.debug("[SIP Session] state →", state);
      switch (state) {
        case SessionState.Establishing:
          console.info(`[SIP] INVITE sent → waiting for 1xx/2xx from ${SIP_CONFIG.targetExtension}@${SIP_CONFIG.domain}`);
          break;

        case SessionState.Established:
          stopRingTimer();
          attachRemoteMedia(inviter);
          updatePhase(CallPhase.ACTIVE);
          setElapsed(0);
          elapsedTimerRef.current = setInterval(() => {
            setElapsed((s) => s + 1);
          }, 1000);
          break;

        case SessionState.Terminating:
          updatePhase(CallPhase.ENDING);
          break;

        case SessionState.Terminated: {
          stopRingTimer();
          stopElapsedTimer();

          // ── Capture SIP response code for diagnostics ──────────────────
          // The last response on the INVITE dialog is stored in the inviter's
          // internal _lastSIPResponse (SIP.js 0.21.x internal) or via the
          // underlying dialog's last final response.
          let sipDetail = "";
          try {
            const lastResp =
              inviter._lastSIPResponse ||
              inviter?.incomingInviteRequest?.message ||
              null;
            if (lastResp) {
              sipDetail = ` (SIP ${lastResp.statusCode} ${lastResp.reasonPhrase})`;
            }
          } catch (_) {}

          console.warn(`[SIP Session] Terminated${sipDetail} while phase=${phaseRef.current}`);

          if (
            phaseRef.current !== CallPhase.ERROR &&
            phaseRef.current !== CallPhase.ENDING
          ) {
            // Still in RINGING — got a non-2xx final response
            const reasonHint = sipDetail
              ? `\n\nSIP response: ${sipDetail.trim()}`
              : "";
            setErrorMsg(
              `Extension ${SIP_CONFIG.targetExtension} rejected the call or is not reachable.${reasonHint}` +
              `\n\nCommon causes:` +
              `\n• Extension 1001 softphone is not registered to ${SIP_CONFIG.domain}` +
              `\n• The softphone is still pointing to the old server IP (192.168.1.10)` +
              `\n• Extension 1001 does not exist on FusionPBX` +
              `\n• A FusionPBX dialplan or ACL is blocking the call`
            );
            await teardown(CallPhase.ERROR);
          } else {
            await teardown(CallPhase.ENDED);
          }
          break;
        }

        default:
          break;
      }
    });

    try {
      await inviter.invite();
    } catch (err) {
      console.error("[SIP] INVITE failed:", err);
      stopRingTimer();
      setErrorMsg(`Failed to send INVITE: ${err.message}`);
      await teardown(CallPhase.ERROR);
    }
  }, [updatePhase, attachRemoteMedia, stopRingTimer, stopElapsedTimer, releaseLocalStream, teardown]);

  // ── Hang up ───────────────────────────────────────────────────────────────
  const hangUp = useCallback(async () => {
    updatePhase(CallPhase.ENDING);
    await teardown(CallPhase.ENDED);
  }, [teardown, updatePhase]);

  // ── Mute / unmute ─────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;   // disable = muted
    setMuted(!track.enabled);
  }, []);

  // ── Reset to idle so the modal can retry without a page reload ────────────
  const reset = useCallback(() => {
    updatePhase(CallPhase.IDLE);
    setErrorMsg("");
    setElapsed(0);
    setMuted(false);
  }, [updatePhase]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => { teardown(CallPhase.IDLE); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { phase, errorMsg, muted, elapsed, startCall, hangUp, toggleMute, reset };
}
