import React, { useState, useEffect } from "react";
import { useSession } from "../contexts/SessionContext";
import { useLanguage } from "../contexts/LanguageContext";

/* ── Inline SVG icons (Lucide outline style) ── */
const HeadsetIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
  </svg>
);

const CallbackIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-4.68"/>
  </svg>
);

const InfoIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const CheckIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ActionScreen = () => {
  const { actionState, setActionState, goBack } = useSession();
  const { locale } = useLanguage();
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isEn = locale !== "am";

  // Auto-trigger tel: link for connect_agent after 1.5s
  useEffect(() => {
    if (
      actionState &&
      !actionState.loading &&
      actionState.type === "connect_agent" &&
      actionState.data?.href
    ) {
      const t = setTimeout(() => { window.location.href = actionState.data.href; }, 1800);
      return () => clearTimeout(t);
    }
  }, [actionState]);

  if (!actionState) return null;

  // ── Back button: clear actionState, stay on current node
  const handleBack = () => {
    setActionState(null);
  };

  const handleCallbackSubmit = (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setSubmitted(true);
  };

  // ── Loading
  if (actionState.loading) return (
    <div className="action-screen">
      <div className="spinner" style={{ marginBottom: 16 }} />
      <div className="action-title">
        {isEn ? "Processing…" : "ሂደቱ በመከናወን ላይ ነው…"}
      </div>
      <div className="action-msg">
        {isEn ? "Please wait a moment." : "እባክዎን ትንሽ ይጠብቁ።"}
      </div>
    </div>
  );

  // ── Connect to agent
  if (actionState.type === "connect_agent") return (
    <div className="action-screen">
      <div className="action-icon-circle green">
        <HeadsetIcon />
      </div>
      <div className="action-title">{isEn ? "Connecting to Agent" : "ከወኪል ጋር በመገናኘት ላይ"}</div>
      <div className="action-msg">
        {actionState.data?.message || (isEn ? "Launching phone call…" : "የስልክ ጥሪ በመጀመር ላይ…")}
      </div>
      {actionState.data?.href && (
        <a href={actionState.data.href} className="tel-link">
          <HeadsetIcon size={16} />
          {actionState.data.href}
        </a>
      )}
      <div className="action-btn-row" style={{ marginTop: 24 }}>
        <button className="btn btn-ghost" onClick={handleBack}>
          ← {isEn ? "Back to Menu" : "ወደ ምናሌ ይመለሱ"}
        </button>
      </div>
    </div>
  );

  // ── Callback request
  if (actionState.type === "callback") return (
    <div className="action-screen">
      <div className="action-icon-circle purple">
        <CallbackIcon />
      </div>
      <div className="action-title">{isEn ? "Request a Callback" : "መልሶ እንዲደወልልዎት ይጠይቁ"}</div>
      <div className="action-msg">{actionState.message}</div>

      {!submitted ? (
        <form
          onSubmit={handleCallbackSubmit}
          style={{ width: "100%", maxWidth: 320, textAlign: "left" }}
        >
          <div className="form-group">
            <label htmlFor="cb-phone">
              {isEn ? "Your phone number" : "የስልክ ቁጥርዎ"}
            </label>
            <input
              id="cb-phone"
              type="tel"
              className="form-control"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="action-btn-row">
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {isEn ? "Request Callback" : "መልሶ እንዲደወልልዎት ይጠይቁ"}
            </button>
          </div>
        </form>
      ) : (
        <div style={{
          background: "#F0F7F0",
          border: "1px solid #A8D5A2",
          borderRadius: "var(--radius-sm)",
          padding: "14px 20px",
          color: "#1A4A2E",
          fontWeight: 500,
          fontSize: ".875rem",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <CheckIcon />
          {isEn
            ? "Callback requested. We'll contact you shortly."
            : "መልሶ መደወል ተጠይቋል! በቅርቡ እናገኝዎታለን።"}
        </div>
      )}

      <div className="action-btn-row" style={{ marginTop: 20 }}>
        <button className="btn btn-ghost" onClick={handleBack}>
          ← {isEn ? "Back to Menu" : "ወደ ምናሌ ይመለሱ"}
        </button>
      </div>
    </div>
  );

  // ── Info display
  if (actionState.type === "info") return (
    <div className="action-screen">
      <div className="action-icon-circle blue">
        <InfoIcon />
      </div>
      <div className="action-title">{isEn ? "Information" : "መረጃ"}</div>
      <div className="action-info-box">{actionState.message}</div>
      {actionState.data?.action_target && (
        <div className="action-ref">
          <strong>{isEn ? "Reference: " : "ማጣቀሻ: "}</strong>
          {actionState.data.action_target}
        </div>
      )}
      <div className="action-btn-row">
        <button className="btn btn-ghost" onClick={handleBack}>
          ← {isEn ? "Back to Menu" : "ወደ ምናሌ ይመለሱ"}
        </button>
      </div>
    </div>
  );

  // Fallback
  return (
    <div className="action-screen">
      <div className="action-msg">{isEn ? "Action completed." : "ተግባሩ ተጠናቋል።"}</div>
      <button className="btn btn-ghost" onClick={handleBack}>
        ← {isEn ? "Back to Menu" : "ወደ ምናሌ ይመለሱ"}
      </button>
    </div>
  );
};

export default ActionScreen;
