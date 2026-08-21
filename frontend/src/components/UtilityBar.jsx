import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

const LockIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const UtilityBar = () => {
  const { locale } = useLanguage();
  const isEn = locale !== "am";
  const [copied, setCopied] = useState(false);

  // Stable session ID generated once per mount
  const [sessionId] = useState(
    () => "IVR-" + Math.random().toString(16).slice(2, 8).toUpperCase()
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="utility-bar" role="navigation" aria-label="Page context">
      <div className="utility-bar-left">
        <span className="utility-bar-crumb">
          {isEn ? "Support" : "ድጋፍ"}
        </span>
        <span className="utility-bar-sep"> › </span>
        <span className="utility-bar-crumb-current">
          {isEn ? "Visual Menu" : "ቪዥዋል ምናሌ"}
        </span>
      </div>

      <div className="utility-bar-right">
        <span className="session-secure" aria-label="Secure session indicator">
          <LockIcon />
          <span>{isEn ? "Secure session" : "ደህንነቱ የተጠበቀ"}</span>
        </span>
        <span className="session-badge-wrap">
          <span className="session-badge" aria-label={`Case ID: ${sessionId}`}>
            {sessionId}
          </span>
          <button
            className={`copy-btn ${copied ? "copied" : ""}`}
            onClick={handleCopy}
            title={isEn ? "Copy Case ID" : "መለያ ቁጥር ኮፒ አድርግ"}
            aria-label={isEn ? "Copy Case ID" : "መለያ ቁጥር ኮፒ አድርግ"}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </span>
      </div>
    </div>
  );
};

export default UtilityBar;
