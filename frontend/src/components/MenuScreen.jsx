import React, { useEffect, useState } from "react";
import { useSession } from "../contexts/SessionContext";
import { useLanguage } from "../contexts/LanguageContext";
import ActionScreen from "./ActionScreen";
import ChatWidget from "./ChatWidget";
import SpeakWithAgentModal from "./SpeakWithAgentModal";

/* ── Inline SVG icons (Lucide outline style) ── */
const HeadsetIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
  </svg>
);

const VolumeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);


const ChatIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const PhoneCallIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 12 19.79 19.79 0 0 1 1 3.18 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    <polyline points="16 2 20 2 20 6"/>
    <line x1="15" y1="7" x2="20" y2="2"/>
  </svg>
);

/* ── Speak a single text string ── */
const speak = (text, lang = "en") => {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "am" ? "am-ET" : lang === "es" ? "es-ES" : "en-US";
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
};

const getTag = (actionType) => {
  switch (actionType) {
    case "connect_agent": return { label: "Call",     cls: "tag-call" };
    case "callback":      return { label: "Callback", cls: "tag-agent" };
    case "info":          return { label: "Info",     cls: "tag-info" };
    default:              return null;
  }
};

const MenuScreen = () => {
  const { currentNode, selectNode, loading, error, actionState, history, goBack, restartSession } = useSession();
  const { locale, setLocale } = useLanguage();
  const [chatOpen, setChatOpen] = useState(false);
  const [speakOpen, setSpeakOpen] = useState(false);

  // Keyboard shortcuts: digits 1-9 select options, Backspace goes back
  useEffect(() => {
    const handler = (e) => {
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") return;
      if (!currentNode || actionState || chatOpen) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9 && currentNode.children?.[n - 1]) {
        selectNode(currentNode.children[n - 1]);
      }
      if (e.key === "Backspace" && history.length > 0) goBack();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentNode, actionState, history, chatOpen]);

  const isEn = locale !== "am";
  const label   = currentNode ? (currentNode.labels?.[locale]      || currentNode.labels?.en      || "") : "";
  const prompt  = currentNode ? (currentNode.prompt_texts?.[locale] || currentNode.prompt_texts?.en || "") : "";
  const children = currentNode?.children || [];
  const canGoBack = history.length > 0 || !!actionState;

  const SkeletonRows = () => (
    <div className="option-list skeleton-list">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="option-item skeleton-item">
          <div className="option-num skeleton-circle skeleton-shimmer" />
          <div className="option-label skeleton-line skeleton-shimmer" />
          <div className="option-right">
            <div className="speak-btn skeleton-btn skeleton-shimmer" />
            <div className="option-arrow skeleton-arrow-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );

  // ── Error state
  if (error) return (
    <div className="app-shell">
      <div className="ivr-header">
        <div className="header-logo"><HeadsetIcon /></div>
        <span className="header-title">Visual IVR</span>
      </div>
      <div className="full-center" style={{ padding: "32px 16px" }}>
        <div className="error-icon" style={{ fontSize: "2rem" }}>⚠️</div>
        <div className="error-title" style={{ fontWeight: 500 }}>
          {isEn ? "Service Temporarily Unavailable" : "አገልግሎቱ ለጊዜው አልተገኘም"}
        </div>
        <div className="error-msg" style={{ fontSize: "0.8rem" }}>{error}</div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 16 }}
          onClick={restartSession}
        >
          {isEn ? "Retry Connection" : "እንደገና ይሞክሩ"}
        </button>
      </div>
    </div>
  );

  // ── Initial Loading state
  if (!currentNode) return (
    <div className="app-shell">
      <div className="ivr-header">
        <div className="header-logo"><HeadsetIcon /></div>
        <span className="header-title">Visual IVR</span>
      </div>
      <div className="ivr-content" style={{ padding: "16px" }}>
        <div className="prompt-card skeleton-card skeleton-shimmer" style={{ height: "64px", marginBottom: "14px" }} />
        <SkeletonRows />
      </div>
    </div>
  );

  return (
    <>
      <div className="app-shell">
        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="ivr-header">
          <button
            className="header-back-btn"
            onClick={() => {
              if (actionState) {
                selectNode.__clearAction?.();
              }
              goBack();
            }}
            disabled={!canGoBack}
            aria-label="Go back"
          >
            ←
          </button>

          <div className="header-logo">
            <HeadsetIcon />
          </div>

          <div className="header-title">
            {label || "Visual IVR"}
            <span className="header-subtitle">
              {isEn ? "Visual Call System" : "የቪዥዋል ጥሪ ስርዓት"}
            </span>
          </div>

          <div className="header-actions">
            <button
              className="header-icon-btn"
              onClick={restartSession}
              aria-label="Restart"
              title={isEn ? "Restart" : "እንደገና ጀምር"}
            >
              <RefreshIcon />
            </button>
          </div>
        </div>

        {/* ── BREADCRUMB ──────────────────────────────────────────── */}
        {history.length > 0 && !actionState && (
          <div className="breadcrumb-bar" aria-label="Navigation path">
            <span className="bc-item" onClick={restartSession} title={isEn ? "Home" : "ዋና ምናሌ"}>
              <HomeIcon />
            </span>
            {history.map((node) => (
              <React.Fragment key={node.id}>
                <span className="bc-sep">›</span>
                <span className="bc-item" onClick={goBack}>
                  {node.labels?.[locale] || node.labels?.en}
                </span>
              </React.Fragment>
            ))}
            <span className="bc-sep">›</span>
            <span className="bc-current">{label}</span>
          </div>
        )}

        {/* ── CONTENT ─────────────────────────────────────────────── */}
        <div className="ivr-content">
          {actionState ? (
            <ActionScreen />
          ) : (
            <>
              {/* Prompt card */}
              <div className="prompt-card" aria-live="polite" role="status">
                <button
                  className="speak-btn prompt-speak-btn"
                  onClick={() => speak(prompt, locale)}
                  aria-label={isEn ? "Hear prompt" : "መመሪያውን አዳምጥ"}
                  title={isEn ? "Hear prompt" : "መመሪያውን አዳምጥ"}
                  style={{ flexShrink: 0, marginTop: "2px" }}
                >
                  <VolumeIcon />
                </button>
                <p className="prompt-text">{prompt}</p>
              </div>

              {/* Option list */}
              {loading ? (
                <SkeletonRows />
              ) : children.length > 0 ? (
                <div className="option-list" role="list">
                  {children.map((child, idx) => {
                    const childLabel = child.labels?.[locale] || child.labels?.en || "";
                    const tag = getTag(child.action_type);
                    return (
                      <div
                        key={child.id}
                        className="option-item"
                        role="button"
                        tabIndex={0}
                        onClick={() => { if (!loading) selectNode(child); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (!loading) selectNode(child);
                          }
                        }}
                        aria-label={`Option ${idx + 1}: ${childLabel}`}
                        style={{ cursor: loading ? "default" : "pointer" }}
                      >
                        <div className="option-num">{idx + 1}</div>
                        <span className="option-label">{childLabel}</span>
                        <div className="option-right">
                          {tag && (
                            <span className={`option-tag ${tag.cls}`}>{tag.label}</span>
                          )}
                          <button
                            className="speak-btn"
                            onClick={(e) => { e.stopPropagation(); speak(childLabel, locale); }}
                            aria-label={`Hear: ${childLabel}`}
                            tabIndex={-1}
                            title={isEn ? "Hear this option" : "ይህን አማራጭ ያዳምጡ"}
                          >
                            <VolumeIcon />
                          </button>
                          <span className="option-arrow"><ChevronRight /></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "28px", textAlign: "center", color: "var(--text-muted)", fontSize: ".875rem" }}>
                  {isEn ? "No further options available." : "ምንም ተጨማሪ አማራጮች የሉም።"}
                </div>
              )}

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Primary CTA — Chat */}
              <button
                className="chat-strip"
                onClick={() => setChatOpen(true)}
                aria-label="Open chat with an agent"
              >
                <ChatIcon />
                {isEn ? "Chat with a Support Agent" : "ከአገልግሎት ወኪል ጋር ይወያዩ"}
              </button>

              {/* Secondary CTA — Speak with an Agent */}
              <button
                className="speak-strip"
                onClick={() => setSpeakOpen(true)}
                aria-label={isEn ? "Speak with an agent" : "ከወኪል ጋር ይነጋገሩ"}
              >
                <PhoneCallIcon />
                {isEn ? "Speak with an Agent" : "ከወኪል ጋር ይነጋገሩ"}
              </button>
            </>
          )}
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <div className="ivr-footer">
          <span>
            {isEn ? "Keys [1–9] navigate · Backspace go back" : "ቁልፎች [1-9] ለማሰስ · Backspace ለመመለስ"}
          </span>
          <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
            Visual IVR
          </span>
        </div>
      </div>

      {/* ── CHAT OVERLAY ─────────────────────────────────────────── */}
      {chatOpen && <ChatWidget onClose={() => setChatOpen(false)} />}

      {/* ── SPEAK WITH AGENT MODAL ───────────────────────────────── */}
      {speakOpen && <SpeakWithAgentModal onClose={() => setSpeakOpen(false)} />}
    </>
  );
};

export default MenuScreen;
