import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

const speakText = (text, lang = "en") => {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === "am" ? "am-ET" : lang === "es" ? "es-ES" : "en-US";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
};

const OptionButton = ({ label, index, onClick, actionType }) => {
  const { locale } = useLanguage();
  const shortcutKey = index + 1;

  const getActionIcon = () => {
    switch (actionType) {
      case "connect_agent": return "📞";
      case "callback":      return "↩️";
      case "info":          return "ℹ️";
      default:              return "›";
    }
  };

  const handleSpeakClick = (e) => {
    // Stop the button click from also triggering navigation
    e.stopPropagation();
    speakText(label, locale);
  };

  return (
    <button
      className="option-button"
      onClick={onClick}
      aria-label={`Option ${shortcutKey}: ${label}. Press ${shortcutKey} on keyboard to select.`}
    >
      {/* Left side: badge + label */}
      <div className="option-meta">
        <span className="option-badge" aria-hidden="true">{shortcutKey}</span>
        <span>{label}</span>
      </div>

      {/* Right side: speak icon + action indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <button
          className="option-speak-btn"
          onClick={handleSpeakClick}
          aria-label={`Hear option: ${label}`}
          title="Hear this option"
          tabIndex={-1}
        >
          🔊
        </button>
        <span className="action-indicator" aria-hidden="true">
          {getActionIcon()}
        </span>
      </div>
    </button>
  );
};

export default OptionButton;
