import React, { createContext, useState, useContext, useEffect, useRef } from "react";
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
  const [actionState, setActionState] = useState(null); // { type, message, target, data }
  const audioRef = useRef(null);

  // Initialize or restore session on mount
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      try {
        let currentSessionId = sessionId;
        if (!currentSessionId) {
          const res = await client.post("/api/sessions", { source: "web" });
          currentSessionId = res.data.id;
          setSessionId(currentSessionId);
          localStorage.setItem("ivr_session_id", currentSessionId);
        }

        // Fetch full tree
        const treeRes = await client.get("/api/menu/tree");
        setMenuTree(treeRes.data);

        // Restore node position or default to root
        const savedNodeId = localStorage.getItem("ivr_current_node_id");
        if (savedNodeId && savedNodeId !== "null") {
          const nodeRes = await client.get(`/api/menu/node/${savedNodeId}`);
          setCurrentNode(nodeRes.data);
        } else {
          // Find root node matching current sorted order
          if (treeRes.data.length > 0) {
            setCurrentNode(treeRes.data[0]);
            localStorage.setItem("ivr_current_node_id", treeRes.data[0].id);
          }
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

  // Audio / TTS Player
  useEffect(() => {
    if (!currentNode) return;
    
    // Stop current speech or audio
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    const playPrompt = () => {
      const prompt = currentNode.prompt_texts[locale] || currentNode.prompt_texts["en"] || "";
      if (!prompt) return;

      if (currentNode.audio_url) {
        // Use local /media folder URL or full URL
        const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const url = currentNode.audio_url.startsWith("http") 
          ? currentNode.audio_url 
          : `${backendUrl}${currentNode.audio_url}`;
        
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play().catch((err) => {
          console.warn("Audio autoplay blocked or failed, falling back to TTS:", err);
          speakTTS(prompt);
        });
      } else {
        speakTTS(prompt);
      }
    };

    // Delay slightly to give screen readers time to announce elements
    const timer = setTimeout(playPrompt, 500);
    return () => clearTimeout(timer);
  }, [currentNode, locale]);

  const speakTTS = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === "am" ? "am-ET" : locale === "es" ? "es-ES" : "en-US";
    window.speechSynthesis.speak(utterance);
  };

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
    try {
      const res = await client.post("/api/sessions", { source: "web" });
      setSessionId(res.data.id);
      localStorage.setItem("ivr_session_id", res.data.id);
      
      if (menuTree.length > 0) {
        setCurrentNode(menuTree[0]);
        localStorage.setItem("ivr_current_node_id", menuTree[0].id);
      }
    } catch (err) {
      setError("Failed to restart session.");
    } finally {
      setLoading(false);
    }
  };

  // Switch language AND navigate to the matching root menu node
  const switchLanguageMenu = (newLocale) => {
    if (menuTree.length === 0) return;
    // Map locale codes to root node name keywords (case-insensitive)
    const keywords = { en: "english", am: "amharic" };
    const keyword = keywords[newLocale] || "english";
    // Find a root node (parent_id === null) whose name includes the keyword
    const rootNode = menuTree.find(
      (n) => !n.parent_id && n.name.toLowerCase().includes(keyword)
    ) || menuTree[0];
    setCurrentNode(rootNode);
    setHistory([]);
    setActionState(null);
    localStorage.setItem("ivr_current_node_id", rootNode.id);
  };

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
        goBack,
        restartSession,
        setActionState,
        switchLanguageMenu,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
