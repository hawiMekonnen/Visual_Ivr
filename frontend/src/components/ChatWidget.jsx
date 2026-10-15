import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useSession } from "../contexts/SessionContext";
import { sendChatMessage, getChatInfo } from "../api/chat";

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

const VolumeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);

const ChatWidget = ({ onClose, onOpenSpeakModal }) => {
  const { locale } = useLanguage();
  const { currentNode, sessionId, navigateToNodeId, speakTTS } = useSession();
  const isEn = locale !== "am";

  const initialQuickReplies = isEn
    ? ["Airtime & Balance", "Internet Packages", "Telebirr", "Speak with Agent"]
    : ["ቀሪ ሂሳብ እና ካርድ", "የኢንተርኔት ፓኬጅ", "ቴሌብር", "ከወኪል ጋር ይነጋገሩ"];

  const [messages, setMessages] = useState([
    {
      id: 1,
      from: "agent",
      text: isEn
        ? "Hello! 👋 I am your Telecom Customer Care Assistant. Ask me anything about airtime recharge, Telebirr, internet packages, SIM/PUK, or request to speak with an agent."
        : "ሰላም! 👋 እኔ የደንበኞች ድጋፍ ረዳት ነኝ። ስለ ካርድ መሙላት፣ ቴሌብር፣ የኢንተርኔት ፓኬጆች፣ ሲም ካርድ መጠየቅ ወይም ወኪል ማነጋገር ይችላሉ።",
      time: now(),
      suggested_action: null,
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState(initialQuickReplies);
  const [aiModel, setAiModel] = useState("gemini-3.5-flash-lite");

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch model info on mount
  useEffect(() => {
    getChatInfo()
      .then((info) => {
        if (info?.model) setAiModel(info.model);
      })
      .catch(() => {});
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-focus input
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 250);
  }, []);

  const handleSendMessage = async (userText) => {
    const textToSend = (userText || input).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: Date.now(),
      from: "user",
      text: textToSend,
      time: now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userText) setInput("");
    setLoading(true);

    // Build history formatted for Gemini
    const historyPayload = messages.slice(-6).map((m) => ({
      role: m.from === "user" ? "user" : "model",
      text: m.text,
    }));

    try {
      const response = await sendChatMessage({
        message: textToSend,
        language: locale,
        history: historyPayload,
        currentNodeId: currentNode?.id || null,
        sessionId: sessionId || null,
      });

      const agentMsg = {
        id: Date.now() + 1,
        from: "agent",
        text: response.reply,
        suggested_action: response.suggested_action || null,
        time: now(),
      };

      setMessages((prev) => [...prev, agentMsg]);

      if (response.quick_replies && response.quick_replies.length > 0) {
        setQuickReplies(response.quick_replies);
      }
    } catch (err) {
      console.error("Failed to fetch AI chat response:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: "agent",
          text: isEn
            ? "I apologize, but I am having trouble connecting right now. Let me transfer you to an agent."
            : "ይቅርታ፣ አሁን ለመገናኘት ችግር አጋጥሞኛል። እባክዎ ከወኪል ጋር ይገናኙ።",
          suggested_action: {
            action_type: "connect_agent",
            target: "1002",
            label: isEn ? "Speak with Live Agent" : "ከወኪል ጋር ይነጋገሩ",
          },
          time: now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle Decision / Destination Box Action Execution
  const handleActionClick = (action) => {
    if (!action) return;

    if (action.action_type === "connect_agent" || action.action_type === "callback") {
      if (onOpenSpeakModal) {
        onOpenSpeakModal();
        onClose();
      } else {
        window.location.href = `tel:${action.target || "1002"}`;
      }
      return;
    }

    if (action.action_type === "navigate") {
      if (action.node_id && navigateToNodeId) {
        navigateToNodeId(action.node_id);
        onClose();
      }
      return;
    }

    if (action.action_type === "info" && action.target) {
      speakTTS(action.target, locale);
    }
  };

  return (
    <div className="chat-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="chat-panel" role="dialog" aria-label="AI Contact Center Assistant">
        {/* Header */}
        <div className="chat-panel-header">
          <div className="agent-avatar">
            <img src="/skyservice-icon.png" alt="Skyservice" style={{ width: "20px", height: "auto" }} />
          </div>
          <div className="agent-info">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="agent-name">
                {isEn ? "Ethio Telecom Assistant" : "የኢትዮ ቴሌኮም ድጋፍ ረዳት"}
              </span>
              <span className="chat-model-pill">
                <span className="sparkle">✦</span>
                {aiModel.includes("gemini") ? "Skyservice AI" : "AI Assistant"}
              </span>
            </div>
            <div className="agent-status">
              <div className="online-dot" />
              {isEn ? "Online • Instant AI responses & call routing" : "በመስመር ላይ • ፈጣን የ AI መልሶች እና ጥሪ አቅጣጫ"}
            </div>
          </div>
          <button
            className="chat-close-btn"
            onClick={onClose}
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages" role="log" aria-live="polite">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-msg ${msg.from}`}>
              <div className="msg-avatar">
                {msg.from === "agent" ? "🤖" : "👤"}
              </div>
              <div style={{ maxWidth: "82%" }}>
                <div className="msg-bubble">
                  {msg.text}

                  {/* Decision / Destination Box Card */}
                  {msg.suggested_action && (
                    <div className={`chat-decision-box ${msg.suggested_action.action_type}`}>
                      <div className="decision-badge">
                        {msg.suggested_action.action_type === "connect_agent" ? "🎧 Escalation / Transfer" : "👉 Recommended Next Step"}
                      </div>
                      <button
                        className="decision-action-btn"
                        onClick={() => handleActionClick(msg.suggested_action)}
                      >
                        {msg.suggested_action.action_type === "connect_agent" && "📞 "}
                        {msg.suggested_action.action_type === "navigate" && "🧭 "}
                        {msg.suggested_action.action_type === "info" && "ℹ️ "}
                        {msg.suggested_action.label}
                      </button>
                    </div>
                  )}
                </div>

                <div className="chat-bubble-footer">
                  <div className="msg-time">{msg.time}</div>
                  {msg.from === "agent" && (
                    <button
                      className="chat-tts-btn"
                      onClick={() => speakTTS(msg.text, locale)}
                      title={isEn ? "Listen to response" : "መልሱን ያዳምጡ"}
                    >
                      <VolumeIcon /> {isEn ? "Listen" : "ያዳምጡ"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="chat-msg agent">
              <div className="msg-avatar">🤖</div>
              <div>
                <div className="msg-bubble" style={{ padding: "12px 16px" }}>
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {quickReplies && quickReplies.length > 0 && (
          <div className="chat-quick-replies" role="group" aria-label="Suggested questions">
            {quickReplies.map((qr, index) => (
              <button
                key={index}
                className="quick-reply-chip"
                onClick={() => handleSendMessage(qr)}
                disabled={loading}
              >
                {qr}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="chat-input-row">
          <input
            ref={inputRef}
            className="chat-input"
            type="text"
            placeholder={isEn ? "Ask a question (e.g. buy package, recharge airtime, telebirr)..." : "ጥያቄዎን እዚህ ይጻፉ (ለምሳሌ፦ ፓኬጅ መግዛት፣ ካርድ መሙላት፣ ቴሌብር)..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            aria-label="Chat message input"
          />
          <button
            className="chat-send-btn"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
