import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from "react";
import client from "../api/client";
import { useLanguage } from "./LanguageContext";

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const { locale } = useLanguage();
  const [sessionId, setSessionId] = useState(localStorage.getItem("ivr_session_id") || null);
  const [currentNode, setCurrentNode] = useState(null);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("ivr_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [menuTree, setMenuTree] = useState([]);
  const [actionState, setActionState] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  // Initialize or restore session on mount
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      setError(null);
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const querySessionId = urlParams.get("session_id") || urlParams.get("sid");
        let currentSessionId = querySessionId || sessionId;

        if (querySessionId && querySessionId !== sessionId) {
          currentSessionId = querySessionId;
          setSessionId(querySessionId);
          localStorage.setItem("ivr_session_id", querySessionId);
          localStorage.removeItem("ivr_history");
          localStorage.removeItem("ivr_current_node_id");
        } else if (!currentSessionId) {
          const res = await client.post("/api/sessions", { source: "web" });
          currentSessionId = res.data.id;
          setSessionId(currentSessionId);
          localStorage.setItem("ivr_session_id", currentSessionId);
        }

        // Fetch full tree
        const treeRes = await client.get("/api/menu/tree");
        setMenuTree(treeRes.data);

        // Restore node position or default to root
        let restoredNode = null;
        const savedNodeId = localStorage.getItem("ivr_current_node_id");
        if (savedNodeId && savedNodeId !== "null") {
          try {
            const nodeRes = await client.get(`/api/menu/node/${savedNodeId}`);
            if (nodeRes.data && nodeRes.data.id) {
              restoredNode = nodeRes.data;
            }
          } catch (e) {
            console.warn("Could not restore saved node, defaulting to root:", e);
            localStorage.removeItem("ivr_current_node_id");
          }
        }

        if (restoredNode) {
          setCurrentNode(restoredNode);
        } else if (treeRes.data && treeRes.data.length > 0) {
          setCurrentNode(treeRes.data[0]);
          localStorage.setItem("ivr_current_node_id", treeRes.data[0].id);
        }
      } catch (err) {
        console.error("Failed to initialize session:", err);
        setError("Could not connect to the IVR server.");
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem("ivr_history", JSON.stringify(history));
  }, [history]);

  // Audio / TTS Player — only auto-plays on the root menu (history empty)
  useEffect(() => {
    if (!currentNode) return;

    // Always stop any currently playing audio/TTS when navigating
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    // Only auto-play on the root/first menu
    if (history.length !== 0) return;

    const playPrompt = () => {
      const prompt = currentNode.prompt_texts[locale] || currentNode.prompt_texts["en"] || "";
      if (!prompt) return;

      if (currentNode.audio_url) {
        const url = currentNode.audio_url.startsWith("http")
          ? currentNode.audio_url
          : currentNode.audio_url;

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play().catch((err) => {
          console.warn("Audio autoplay blocked or failed, falling back to TTS:", err);
          speakTTS(prompt, locale);
        });
      } else {
        speakTTS(prompt, locale);
      }
    };

    // Delay slightly to give screen readers time to announce elements
    const timer = setTimeout(playPrompt, 500);
    return () => clearTimeout(timer);
  }, [currentNode, locale, history]);

  // Stop all audio immediately
  const stopAudio = useCallback(() => {
    try { window.speechSynthesis?.cancel(); } catch (_) {}
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsAudioPlaying(false);
  }, []);

  // Universal Voice / Audio Streamer (high-quality Amharic + English)
  const speakTTS = useCallback((text, lang = locale) => {
    if (!text) return;
    // Stop anything currently playing first
    try { window.speechSynthesis?.cancel(); } catch (_) {}
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    // For Amharic (or fallback), stream high-quality audio directly from server
    if (lang === "am") {
      const audioUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=am`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Robust HTML5 Audio event listeners
      audio.addEventListener("playing", () => setIsAudioPlaying(true));
      audio.addEventListener("pause", () => setIsAudioPlaying(false));
      audio.addEventListener("ended", () => setIsAudioPlaying(false));
      audio.addEventListener("error", () => setIsAudioPlaying(false));

      audio.play().catch((err) => {
        console.warn("Amharic audio playback was prevented by browser policy:", err);
        setIsAudioPlaying(false);
      });
      return;
    }

    // For English, use browser speech with server fallback
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === "es" ? "es-ES" : "en-US";
      utterance.rate = 0.95;
      utterance.onstart = () => setIsAudioPlaying(true);
      utterance.onend   = () => setIsAudioPlaying(false);
      utterance.onerror = () => setIsAudioPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      const audioUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=${lang}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Robust HTML5 Audio event listeners
      audio.addEventListener("playing", () => setIsAudioPlaying(true));
      audio.addEventListener("pause", () => setIsAudioPlaying(false));
      audio.addEventListener("ended", () => setIsAudioPlaying(false));
      audio.addEventListener("error", () => setIsAudioPlaying(false));

      audio.play().catch(() => setIsAudioPlaying(false));
    }
  }, [locale]);

  // Navigating to a node
  const selectNode = async (node) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      // 1. Log selection on backend
      await client.post(`/api/sessions/${sessionId}/select`, { node_id: node.id });

      // 2. If it is an action node, perform action
      if (node.action_type !== "navigate") {
        setActionState({
          type: node.action_type,
          message: node.prompt_texts[locale] || node.prompt_texts["en"],
          target: node.action_target,
          loading: true,
        });

        const actionRes = await client.post(`/api/sessions/${sessionId}/action`, {
          node_id: node.id,
          locale: locale,
        });

        setActionState({
          type: node.action_type,
          message: node.prompt_texts[locale] || node.prompt_texts["en"],
          target: node.action_target,
          loading: false,
          data: actionRes.data.result,
        });
      } else {
        // Normal navigation: update history and current node
        setActionState(null);
        setHistory((prev) => [...prev, currentNode]);
        setCurrentNode(node);
        localStorage.setItem("ivr_current_node_id", node.id);
      }
    } catch (err) {
      console.error("Navigation error:", err);
      setError("Failed to select option.");
    } finally {
      setLoading(false);
    }
  };

  // Navigate back
  const goBack = () => {
    // If we're showing an action result, just clear it (stay on same node)
    if (actionState) {
      setActionState(null);
      return;
    }
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((prevHistory) => prevHistory.slice(0, -1));
    setCurrentNode(prev);
    localStorage.setItem("ivr_current_node_id", prev.id);
  };

  // Reset/Restart Session
  const restartSession = async () => {
    setLoading(true);
    setActionState(null);
    setHistory([]);
    setError(null);
    try {
      const res = await client.post("/api/sessions", { source: "web" });
      setSessionId(res.data.id);
      localStorage.setItem("ivr_session_id", res.data.id);
      localStorage.removeItem("ivr_history");
      localStorage.removeItem("ivr_current_node_id");
      
      let tree = menuTree;
      if (!tree || tree.length === 0) {
        const treeRes = await client.get("/api/menu/tree");
        tree = treeRes.data;
        setMenuTree(tree);
      }
      
      if (tree && tree.length > 0) {
        setCurrentNode(tree[0]);
        localStorage.setItem("ivr_current_node_id", tree[0].id);
      }
    } catch (err) {
      console.error("Failed to restart session:", err);
      setError("Failed to connect to IVR server.");
    } finally {
      setLoading(false);
    }
  };

  // Switch language seamlessly in-place for unified bilingual tree
  const switchLanguageMenu = (newLocale) => {
    if (currentNode) {
      const prompt = currentNode.prompt_texts?.[newLocale] || currentNode.prompt_texts?.["en"] || "";
      if (prompt) {
        speakTTS(prompt, newLocale);
      }
    }
  };

  // Navigate directly to a specific node ID (used by AI Decision Box)
  const navigateToNodeId = useCallback(async (nodeId) => {
    if (!nodeId) return;
    setActionState(null);

    const findNode = (nodes) => {
      for (const n of nodes) {
        if (n.id === nodeId) return n;
        if (n.children && n.children.length > 0) {
          const found = findNode(n.children);
          if (found) return found;
        }
      }
      return null;
    };

    let target = findNode(menuTree);
    if (!target) {
      try {
        const res = await client.get(`/api/menu/node/${nodeId}`);
        if (res.data && res.data.id) target = res.data;
      } catch (e) {
        console.warn("Could not fetch target node by ID:", e);
      }
    }
    if (target) {
      if (currentNode && currentNode.id !== target.id) {
        setHistory((prev) => [...prev, currentNode]);
      }
      setCurrentNode(target);
      localStorage.setItem("ivr_current_node_id", target.id);
      if (sessionId) {
        try {
          await client.post(`/api/sessions/${sessionId}/select`, { node_id: target.id });
        } catch (_) {}
      }
    }
  }, [menuTree, currentNode, sessionId]);

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        currentNode,
        history,
        loading,
        error,
        actionState,
        menuTree,
        selectNode,
        navigateToNodeId,
        goBack,
        restartSession,
        setActionState,
        switchLanguageMenu,
        speakTTS,
        stopAudio,
        isAudioPlaying,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
