import React from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useSession } from "../contexts/SessionContext";

const AccountStatusStrip = ({ onTriggerAssistant }) => {
  const { locale } = useLanguage();
  const { navigateToNodeId } = useSession();
  const isEn = locale !== "am";

  return (
    <div className="account-status-strip" aria-label="Telecom Account and Service Status">
      {/* ── Top Row: User Account Metrics ── */}
      <div className="account-metrics-bar">
        <div className="account-pill-user">
          <span className="account-avatar-badge">📱</span>
          <div className="account-user-text">
            <span className="account-phone">+251 91 ••• ••41</span>
            <span className="account-type">{isEn ? "Prepaid Active" : "ቅድመ ክፍያ ንቁ"}</span>
          </div>
        </div>

        <div className="account-stat-divider" />

        <div className="account-stat-item">
          <span className="account-stat-label">{isEn ? "Airtime Balance" : "የአየር ሰዓት ቀሪ ሂሳብ"}</span>
          <span className="account-stat-value green">ETB 248.50</span>
        </div>

        <div className="account-stat-divider" />

        <div className="account-stat-item">
          <span className="account-stat-label">{isEn ? "Telebirr Wallet" : "ቴሌብር ቦርሳ"}</span>
          <span className="account-stat-value">
            ETB 1,840.00 <span className="stat-status-dot active" title="Active" />
          </span>
        </div>

        <div className="account-stat-divider" />

        <div className="account-stat-item">
          <span className="account-stat-label">{isEn ? "Data Package" : "የኢንተርኔት ፓኬጅ"}</span>
          <span className="account-stat-value">14.2 GB 4G/5G</span>
        </div>

        <div className="account-stat-divider" />

        {/* Live Channel Queues (from Image 2) */}
        <div className="account-queues-preview">
          <span className="queue-preview-title">{isEn ? "Live Queues:" : "የጥሪ ወረፋዎች:"}</span>
          <div className="queue-chips">
            <span className="queue-chip">
              <span className="dot dot-green" /> {isEn ? "Voice" : "ድምጽ"} <strong className="queue-count">12</strong>
            </span>
            <span className="queue-chip">
              <span className="dot dot-blue" /> {isEn ? "WhatsApp" : "ዋትስአፕ"} <strong className="queue-count">4</strong>
            </span>
            <span className="queue-chip">
              <span className="dot dot-teal" /> {isEn ? "Web" : "ዌብ"} <strong className="queue-count">2</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Quick Service Shortcuts ── */}
      <div className="account-actions-bar">
        <span className="actions-bar-label">{isEn ? "Quick Services:" : "ፈጣን አገልግሎቶች:"}</span>
        <div className="actions-bar-buttons">
          <button
            className="action-pill-btn"
            onClick={() => onTriggerAssistant ? onTriggerAssistant("recharge") : null}
            title={isEn ? "Recharge Airtime" : "ካርድ ይሙሉ"}
          >
            {isEn ? "Recharge Airtime" : "ካርድ መሙላት"}
          </button>
          <button
            className="action-pill-btn"
            onClick={() => onTriggerAssistant ? onTriggerAssistant("packages") : null}
            title={isEn ? "Buy Internet Packages" : "የኢንተርኔት ፓኬጅ ይግዙ"}
          >
            {isEn ? "Internet Packages" : "የኢንተርኔት ፓኬጅ"}
          </button>
          <button
            className="action-pill-btn highlight"
            onClick={() => onTriggerAssistant ? onTriggerAssistant("telebirr_reversal") : null}
            title={isEn ? "Telebirr Wrong Transfer Reversal" : "የቴሌብር የተሳሳተ ዝውውር ማስተካከያ"}
          >
            {isEn ? "Telebirr Reversal" : "የቴሌብር ማስተካከያ"}
          </button>
          <button
            className="action-pill-btn"
            onClick={() => onTriggerAssistant ? onTriggerAssistant("agent") : null}
            title={isEn ? "Speak with Agent" : "ከወኪል ጋር ይነጋገሩ"}
          >
            {isEn ? "Speak with Agent" : "ከወኪል ጋር"}
          </button>
          <button
            className="action-pill-btn"
            onClick={() => onTriggerAssistant ? onTriggerAssistant("puk") : null}
            title={isEn ? "PUK & SIM Services" : "የሲም ካርድ መረጃ"}
          >
            {isEn ? "SIM / PUK Inquiry" : "ሲም / ፒዩኬ"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountStatusStrip;
