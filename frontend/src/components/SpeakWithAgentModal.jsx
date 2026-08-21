import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useSipCall, CallPhase, SIP_CONFIG } from "../hooks/useSipCall";

/* Cert URL derived from SIP config */
const CERT_URL = `https://${SIP_CONFIG.domain}:7443`;

/* ── SVG Icons ──────────────────────────────────────────────────────────────── */
const PhoneIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07
      A19.5 19.5 0 0 1 4.07 12 19.79 19.79 0 0 1 1 3.18 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72
      c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27
      a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const PhoneOffIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45
      c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2
      A19.79 19.79 0 0 1 1 3.18 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72
      c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91"/>
    <line x1="23" y1="1" x2="1" y2="23"/>
  </svg>
);

const MicIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const MicOffIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const VolumeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const AlertIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

/* ── Localised strings ───────────────────────────────────────────────────────── */
const CONTENT = {
  en: {
    title:          "Speak with an Agent",
    subtitle:       "We'll connect you to a live support agent right now.",
    ttsText:        "You are being connected to a live support agent. Please hold the line.",
    ctaIdle:        "Tap to Call",
    replay:         "Replay voice message",
    close:          "Cancel",
    hint:           "Available 24/7 · Average wait: 2 min",
    labelPreflight:  "Checking server reachability…",
    labelMic:       "Requesting microphone…",
    labelConnecting:"Connecting to server…",
    labelRegistering:"Registering…",
    labelRinging:   "Ringing…",
    labelActive:    "Connected",
    labelEnding:    "Ending call…",
    labelEnded:     "Call ended",
    labelError:     "Connection failed",
    mute:           "Mute",
    unmute:         "Unmute",
    hangUp:         "End Call",
    tryAgain:       "Try Again",
    targetExt:      `Calling ext. ${SIP_CONFIG.targetExtension}`,
  },
  am: {
    title:          "ከወኪል ጋር ይነጋገሩ",
    subtitle:       "አሁን ወዲያው ከቀጥታ አጋዥ ወኪል ጋር እናገናኝዎታለን።",
    ttsText:        "ወደ ቀጥታ አጋዥ ወኪል በመዘዋወር ላይ ነዎት። እባክዎ ስልኩን ይያዙ።",
    ctaIdle:        "ለመደወል ይጫኑ",
    replay:         "የድምፅ መልዕክቱን እንደገና ያዳምጡ",
    close:          "ይቅር",
    hint:           "24/7 ክፍት ነው · አማካኝ የጥበቃ ጊዜ: 2 ደቂቃ",
    labelPreflight:  "የአገልጋዩ ተደራሽነት እየተፈተሸ…",
    labelMic:       "ማይክሮፎን እየጠየቁ…",
    labelConnecting:"ወደ አገልጋይ በማገናኘት ላይ…",
    labelRegistering:"እየተመዘገቡ…",
    labelRinging:   "እየደወሉ…",
    labelActive:    "ተገናኝቷል",
    labelEnding:    "ጥሪ እያቆሙ…",
    labelEnded:     "ጥሪ ተጠናቋል",
    labelError:     "ግንኙነቱ አልተሳካም",
    mute:           "ድምፅ ዝጋ",
    unmute:         "ድምፅ ክፈት",
    hangUp:         "ጥሪ ጨርስ",
    tryAgain:       "እንደገና ሞክር",
    targetExt:      `ቁ. ${SIP_CONFIG.targetExtension} ይደወላል`,
  },
};

/* ── TTS helper ─────────────────────────────────────────────────────────────── */
const speakText = (text, lang) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang  = lang === "am" ? "am-ET" : "en-US";
  u.rate  = 0.92;
  u.pitch = 1.05;
  window.speechSynthesis.speak(u);
};

/* ── Duration formatter ─────────────────────────────────────────────────────── */
const fmtTime = (secs) => {
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
};

/* ── Phase → ring-colour map ─────────────────────────────────────────────────── */
const ringColour = {
  [CallPhase.IDLE]:           "linear-gradient(135deg,#1A6B35,#2E9E57)",
  [CallPhase.REQUESTING_MIC]: "linear-gradient(135deg,#1A6B35,#2E9E57)",
  [CallPhase.CONNECTING]:     "linear-gradient(135deg,#2A4E78,#3D6491)",
  [CallPhase.REGISTERING]:    "linear-gradient(135deg,#2A4E78,#3D6491)",
  [CallPhase.RINGING]:        "linear-gradient(135deg,#B45309,#D97706)",
  [CallPhase.ACTIVE]:         "linear-gradient(135deg,#1A6B35,#2E9E57)",
  [CallPhase.ENDING]:         "linear-gradient(135deg,#6B1A1A,#9E2E2E)",
  [CallPhase.ENDED]:          "linear-gradient(135deg,#5A6478,#94A3B8)",
  [CallPhase.ERROR]:          "linear-gradient(135deg,#991B1B,#DC2626)",
};

/* ════════════════════════════════════════════════════════════════════════════ */
const SpeakWithAgentModal = ({ onClose }) => {
  const { locale }   = useLanguage();
  const lang         = locale === "am" ? "am" : "en";
  const c            = CONTENT[lang];
  const overlayRef   = useRef(null);
  const [speaking, setSpeaking]   = useState(false);

  const { phase, errorMsg, muted, elapsed, startCall, hangUp, toggleMute, reset } =
    useSipCall();

  /* ── TTS auto-speak on open (idle state only) ─── */
  useEffect(() => {
    if (phase !== CallPhase.IDLE) return;
    const timer = setTimeout(() => {
      setSpeaking(true);
      speakText(c.ttsText, lang);
    }, 400);
    const synth = window.speechSynthesis;
    const poll  = setInterval(() => {
      if (!synth.speaking) { setSpeaking(false); clearInterval(poll); }
    }, 300);
    return () => { clearTimeout(timer); clearInterval(poll); synth.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, phase]);

  /* ── Escape key closes (only when call is not active) ── */
  useEffect(() => {
    const h = (e) => {
      if (e.key !== "Escape") return;
      if (phase === CallPhase.ACTIVE || phase === CallPhase.RINGING) return;
      onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, phase]);

  /* ── Overlay click closes (only when idle/ended/error) ── */
  const handleOverlayClick = (e) => {
    if (e.target !== overlayRef.current) return;
    if (phase === CallPhase.ACTIVE || phase === CallPhase.RINGING || phase === CallPhase.CONNECTING) return;
    onClose();
  };

  const handleReplay = () => {
    setSpeaking(true);
    speakText(c.ttsText, lang);
    const synth = window.speechSynthesis;
    const poll  = setInterval(() => {
      if (!synth.speaking) { setSpeaking(false); clearInterval(poll); }
    }, 300);
  };

  /* ── Status label for current phase ── */
  const phaseLabel = {
    [CallPhase.PREFLIGHT]:      c.labelPreflight,
    [CallPhase.REQUESTING_MIC]: c.labelMic,
    [CallPhase.CONNECTING]:     c.labelConnecting,
    [CallPhase.REGISTERING]:    c.labelRegistering,
    [CallPhase.RINGING]:        c.labelRinging,
    [CallPhase.ACTIVE]:         c.labelActive,
    [CallPhase.ENDING]:         c.labelEnding,
    [CallPhase.ENDED]:          c.labelEnded,
    [CallPhase.ERROR]:          c.labelError,
  }[phase] ?? null;

  const isInProgress = [
    CallPhase.PREFLIGHT, CallPhase.REQUESTING_MIC,
    CallPhase.CONNECTING, CallPhase.REGISTERING, CallPhase.RINGING,
  ].includes(phase);

  const isActive  = phase === CallPhase.ACTIVE;
  const isEnded   = phase === CallPhase.ENDED;
  const isError   = phase === CallPhase.ERROR;
  const isIdle    = phase === CallPhase.IDLE;

  /* ────────────────────────────────────────────────────────────────────────── */
  return (
    <div
      className="speak-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-label={c.title}
    >
      <div className="speak-modal">

        {/* ── Close button (hidden while active to prevent accidental close) ── */}
        {!isActive && (
          <button className="speak-close-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        )}

        {/* ── Animated ring icon ── */}
        <div className="speak-icon-wrap">
          <div
            className={`speak-icon-ring ${(speaking || isInProgress || isActive) ? "speak-ring-pulse" : ""}`}
            style={{ background: ringColour[phase] }}
          >
            {isError ? <AlertIcon size={28} /> : <PhoneIcon size={30} />}
          </div>
        </div>

        {/* ── Audio wave / call-active bars ── */}
        <div className="speak-wave-wrap">
          {[1,2,3,4,5,6,7,8].map((i) => (
            <div
              key={i}
              className={`speak-wave-bar ${(speaking || isActive) ? "speak-wave-active" : ""}`}
              style={{
                animationDelay: `${(i - 1) * 0.1}s`,
                ...(isActive ? { background: "#1A6B35" } : {}),
              }}
            />
          ))}
        </div>

        {/* ── Title & subtitle ── */}
        <h2 className="speak-title">{c.title}</h2>

        {/* ── Phase status label ── */}
        {phaseLabel && (
          <p className="speak-phase-label" aria-live="polite">
            {isError && <span className="speak-phase-icon-err">⚠ </span>}
            {phaseLabel}
            {isInProgress && <span className="speak-phase-dots" />}
          </p>
        )}

        {/* ── Error message detail with cert link ── */}
        {isError && errorMsg && (
          <div className="speak-error-detail">
            {/* Split on newlines so bullet points render on separate lines */}
            {errorMsg.split("\n").map((line, i) => {
              // Detect the cert-accept URL pattern and make it a real link
              if (line.includes(CERT_URL)) {
                const parts = line.split(CERT_URL);
                return (
                  <p key={i} style={{ margin: i === 0 ? "0 0 6px" : "4px 0 0" }}>
                    {parts[0]}
                    <a
                      href={CERT_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#1d4ed8", fontWeight: 500, wordBreak: "break-all" }}
                    >
                      {CERT_URL}
                    </a>
                    {parts[1]}
                  </p>
                );
              }
              return (
                <p key={i} style={{ margin: i === 0 ? "0 0 6px" : "4px 0 0" }}>
                  {line || <> </>}
                </p>
              );
            })}
          </div>
        )}

        {/* ── Ringing / active: extension info ── */}
        {(isInProgress || isActive) && (
          <p className="speak-subtitle" style={{ marginTop: 0 }}>{c.targetExt}</p>
        )}

        {/* ── Idle subtitle ── */}
        {isIdle && <p className="speak-subtitle">{c.subtitle}</p>}

        {/* ── Language pills (idle only) ── */}
        {isIdle && (
          <div className="speak-lang-row">
            <span className={`speak-lang-pill ${lang === "en" ? "active" : ""}`}>English</span>
            <span className="speak-lang-sep">·</span>
            <span className={`speak-lang-pill ${lang === "am" ? "active" : ""}`}>አማርኛ</span>
          </div>
        )}

        {/* ── Active call controls ── */}
        {isActive && (
          <div className="sip-call-controls">
            <div className="sip-call-timer" aria-live="polite" aria-label="Call duration">
              {fmtTime(elapsed)}
            </div>
            <div className="sip-call-btns">
              <button
                className={`sip-mute-btn ${muted ? "sip-muted" : ""}`}
                onClick={toggleMute}
                aria-label={muted ? c.unmute : c.mute}
                title={muted ? c.unmute : c.mute}
              >
                {muted ? <MicOffIcon /> : <MicIcon />}
                <span>{muted ? c.unmute : c.mute}</span>
              </button>
              <button
                className="sip-hangup-btn"
                onClick={hangUp}
                aria-label={c.hangUp}
              >
                <PhoneOffIcon />
                <span>{c.hangUp}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Idle: primary CTA ── */}
        {isIdle && (
          <button
            className="speak-call-btn"
            onClick={startCall}
            aria-label={c.ctaIdle}
          >
            <PhoneIcon size={20} />
            {c.ctaIdle}
          </button>
        )}

        {/* ── In-progress: cancel button ── */}
        {isInProgress && (
          <button className="sip-hangup-btn sip-hangup-btn--slim" onClick={hangUp} aria-label={c.close}>
            <PhoneOffIcon size={16} />
            <span>{c.close}</span>
          </button>
        )}

        {/* ── Ended: close ── */}
        {isEnded && (
          <button className="speak-cancel-btn" onClick={onClose}>{c.close}</button>
        )}

        {/* ── Error: try again or close ── */}
        {isError && (
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button
              className="speak-call-btn"
              style={{ flex: 1 }}
              onClick={() => { reset(); startCall(); }}
              aria-label={c.tryAgain}
            >
              <PhoneIcon size={18} /> {c.tryAgain}
            </button>
            <button className="speak-cancel-btn" onClick={onClose}>{c.close}</button>
          </div>
        )}

        {/* ── Idle: replay voice message ── */}
        {isIdle && (
          <button className="speak-replay-btn" onClick={handleReplay} aria-label={c.replay}>
            <VolumeIcon size={16} />
            {c.replay}
          </button>
        )}

        {/* ── Idle: hint ── */}
        {isIdle && <p className="speak-hint">{c.hint}</p>}

        {/* ── Idle: cancel ── */}
        {isIdle && (
          <button className="speak-cancel-btn" onClick={onClose}>{c.close}</button>
        )}
      </div>
    </div>
  );
};

export default SpeakWithAgentModal;
