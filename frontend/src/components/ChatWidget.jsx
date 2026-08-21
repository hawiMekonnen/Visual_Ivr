import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";

// ── Simulated agent reply logic ──────────────────────────────────────────────
const AGENT_REPLIES = {
  en: [
    "Hello! 👋 I'm here to help you. What can I assist you with today?",
    "I can see your account information. Could you please provide your account number?",
    "I understand your concern. Let me look into this for you right away.",
    "Your case has been noted. I'll escalate this to the right department.",
    "Is there anything else I can help you with?",
    "Thank you for your patience! Your request is being processed.",
    "I'm checking our system right now — please hold on for a moment.",
  ],
  am: [
    "ሰላም! 👋 እኔ እርስዎን ለመርዳት እዚህ ነኝ። ዛሬ በምን ልርዳዎት?",
    "የመለያዎን መረጃ ማየት እችላለሁ። እባክዎ የመለያ ቁጥርዎን ሊነግሩኝ ይችላሉ?",
    "ችግርዎን ተረድቻለሁ። እባክዎ ጉዳዩን ወዲያውኑ እንድመረምር ይፍቀዱልኝ።",
    "ጉዳይዎ ተመዝግቧል። ወደ ሚመለከተው ክፍል አስተላልፋለሁ።",
    "ሌላ ልረዳዎት የምችለው ነገር አለ?",
    "ለትዕግስትዎ እናመሰግናለን! ጥያቄዎ በመከናወን ላይ ነው።",
    "በአሁኑ ጊዜ የስርዓት ፍተሻ እያደረግኩ ነው — እባክዎ ትንሽ ይጠብቁ።",
  ],
};

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const ChatWidget = ({ onClose }) => {
  const { locale } = useLanguage();
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: "agent",
      text: locale === "am"
        ? "ሰላም! 👋 እርስዎን ለመርዳት ዝግጁ ነን። ማንኛውንም ጥያቄ ይጠይቁን።"
        : "Hello! 👋 We are here to help. Ask us anything.",
      time: now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [replyIndex, setReplyIndex] = useState(1);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Focus input on open
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg = { id: Date.now(), from: "user", text, time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Simulate agent typing delay (1.5 – 2.5s)
    const delay = 1500 + Math.random() * 1000;
    setTimeout(() => {
      const replies = AGENT_REPLIES[locale] || AGENT_REPLIES.en;
      const agentText = replies[replyIndex % replies.length];
      setReplyIndex((i) => i + 1);
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: "agent", text: agentText, time: now() },
      ]);
    }, delay);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isEn = locale !== "am";

  return (
    <div className="chat-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="chat-panel" role="dialog" aria-label="Chat with agent">
        {/* Header */}
        <div className="chat-panel-header">
          <div className="agent-avatar">🎧</div>
          <div className="agent-info">
            <div className="agent-name">
              {isEn ? "Support Agent" : "የደንበኞች ድጋፍ ሰጪ"}
            </div>
            <div className="agent-status">
              <div className="online-dot" />
              {isEn ? "Online — typically replies instantly" : "በመስመር ላይ — ወዲያውኑ ይመልሳል"}
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
                {msg.from === "agent" ? "🎧" : "👤"}
              </div>
              <div>
                <div className="msg-bubble">{msg.text}</div>
                <div className="msg-time">{msg.time}</div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="chat-msg agent">
              <div className="msg-avatar">🎧</div>
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

        {/* Input */}
        <div className="chat-input-row">
          <input
            ref={inputRef}
            className="chat-input"
            type="text"
            placeholder={isEn ? "Type a message..." : "መልእክት ይጻፉ..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Chat message input"
          />
          <button
            className="chat-send-btn"
            onClick={sendMessage}
            disabled={!input.trim()}
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
