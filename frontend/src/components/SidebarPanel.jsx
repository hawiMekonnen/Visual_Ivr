import React, { useState, useEffect } from "react";
import client from "../api/client";
import { useLanguage } from "../contexts/LanguageContext";

const SearchIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const SidebarPanel = ({ activeTab: propActiveTab, onTabChange }) => {
  const { locale } = useLanguage();
  const isEn = locale !== "am";

  // Tab: "support" (matches screenshot) or "assistant" (Telebirr reversal wizard)
  const [internalTab, setInternalTab] = useState("support");
  const activeTab = propActiveTab !== undefined ? propActiveTab : internalTab;

  const handleTabChange = (newTab) => {
    setInternalTab(newTab);
    if (onTabChange) onTabChange(newTab);
  };

  // Image 1 Reversal Assistant State
  const [selectedTx, setSelectedTx] = useState("tx1");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [reversalSubmitted, setReversalSubmitted] = useState(false);

  // Knowledgebase State with robust initial defaults
  const [waitTime, setWaitTime] = useState({
    wait_time_minutes: 3,
    status: "Normal Call Volume",
    open: true
  });
  const [articles, setArticles] = useState([
    {
      id: "art-1",
      title: { en: "How to Reset Your Account Password", am: "የመለያዎን የይለፍ ቃል እንዴት ዳግም እንደሚያስጀምሩ" },
      excerpt: { en: "Follow these simple steps to recover or update your secure password.", am: "የይለፍ ቃልዎን ደህንነቱ በተጠበቀ ሁኔታ ለመቀየር እነዚህን ቀላል ደረጃዎች ይከተሉ።" },
      content: { en: "To reset your password, visit the login screen and click 'Forgot Password'. You will receive an SMS verification code.", am: "የይለፍ ቃልዎን ለመቀየር ወደ መግቢያው ገጽ በመሄድ 'የይለፍ ቃል ረሳሁ' የሚለውን ይጫኑ።" }
    },
    {
      id: "art-2",
      title: { en: "Online Payment & Auto-Pay Setup", am: "የኦንላይን ክፍያ እና ራስ-ሰር ክፍያ ማስተካከያ" },
      excerpt: { en: "Learn how to link your credit card or bank account for seamless billing.", am: "ክፍያዎችን በቀላሉ ለመፈጸም የቴሌብር ወይም የባንክ ሂሳብዎን እንዴት እንደሚያገናኙ ይወቁ።" },
      content: { en: "You can set up Auto-Pay using Telebirr or partner banks under Account Settings > Payment Methods.", am: "በመለያዎ ማስተካከያ ስር የቴሌብር ወይም የባንክ ሂሳብዎን በማገናኘት ክፍያ በቀላሉ መፈጸም ይችላሉ።" }
    },
    {
      id: "art-3",
      title: { en: "Troubleshooting Device Connectivity Issues", am: "የመሳሪያ እና የኔትወርክ ግንኙነት ችግሮችን መፍታት" },
      excerpt: { en: "Basic troubleshooting tips for internet router or hardware connection issues.", am: "የኢንተርኔት ራውተር ወይም የሲም ካርድ ግንኙነት ችግሮችን ለመፍታት ጠቃሚ መመሪያዎች።" },
      content: { en: "1. Restart your device. 2. Verify Mobile Data is enabled. 3. Ensure APN settings are set to 'etc.com'.", am: "1. ስልክዎን አጥፍተው ያብሩት። 2. ሞባይል ዳታ መብራቱን ያረጋግጡ። 3. የኤፒኤን (APN) ስም 'etc.com' መሆኑን ያረጋግጡ።" }
    }
  ]);
  const [hours, setHours] = useState({
    hours: {
      en: "Monday - Friday: 9:00 AM - 6:00 PM EST",
      am: "ሰኞ - አርብ: ከጠዋቱ 3:00 - ከሰዓት 12:00"
    },
    timezone: "EAT (UTC+3) / EST"
  });
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [articleSearch, setArticleSearch] = useState("");

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const waitRes = await client.get("/api/sidebar/wait-time");
        if (waitRes.data) setWaitTime(waitRes.data);

        const articlesRes = await client.get("/api/sidebar/popular-articles");
        if (articlesRes.data && articlesRes.data.length > 0) setArticles(articlesRes.data);

        const hoursRes = await client.get("/api/sidebar/hours");
        if (hoursRes.data) setHours(hoursRes.data);
      } catch (err) {
        console.warn("Using offline fallback sidebar content:", err);
      }
    };
    fetchSidebarData();
  }, []);

  const navigateToContact = () => {
    window.history.pushState({}, "", "/contact");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const filteredArticles = articles.filter((art) => {
    if (!articleSearch.trim()) return true;
    const title = (art.title[locale] || art.title.en || "").toLowerCase();
    return title.includes(articleSearch.toLowerCase());
  });

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleConfirmReversal = (e) => {
    e.preventDefault();
    setReversalSubmitted(true);
  };

  const handleResetReversal = () => {
    setReversalSubmitted(false);
    setOtpValues(["", "", "", "", "", ""]);
  };

  const isHighWait = waitTime && waitTime.wait_time_minutes > 5;

  return (
    <aside className="console-sidebar" aria-label="Support and Assistant Panel">
      {/* ── Console Sidebar Header & Mode Switcher ── */}
      <div className="console-sidebar-header">
        <div className="console-sidebar-header-left">
          <span className="console-sidebar-title">
            {activeTab === "support"
              ? (isEn ? "Support Overview" : "የድጋፍ አጠቃላይ እይታ")
              : (isEn ? "Ethio Telecom Assistant" : "የኢትዮ ቴሌኮም ረዳት")}
          </span>
        </div>
        <div className="sidebar-tab-toggle">
          <button
            className={`sidebar-tab-btn ${activeTab === "support" ? "active" : ""}`}
            onClick={() => handleTabChange("support")}
            title={isEn ? "Support Overview & Articles" : "እርዳታና ሁኔታ"}
          >
            {isEn ? "Support" : "እርዳታ"}
          </button>
          <button
            className={`sidebar-tab-btn ${activeTab === "assistant" ? "active" : ""}`}
            onClick={() => handleTabChange("assistant")}
            title={isEn ? "Telebirr Reversal Assistant" : "የቴሌኮም ረዳት"}
          >
            {isEn ? "Assistant" : "ረዳት"}
          </button>
        </div>
      </div>

      <div className="console-sidebar-content">
        {/* ═══════════════════════════════════════════════════════
            MODE 1: ETHIO TELECOM ASSISTANT (Exact Image 1 UI)
        ═══════════════════════════════════════════════════════ */}
        {activeTab === "assistant" && (
          <div className="image1-assistant-view">
            {/* Assistant Header Banner */}
            <div className="asst-header-banner">
              <span className="asst-header-icon">✦</span>
              <span className="asst-header-title">
                {isEn ? "Ethio Telecom Assistant" : "የኢትዮ ቴሌኮም ረዳት"}
              </span>
            </div>

            {/* Bubble 1: Prompt Question */}
            <div className="asst-bubble">
              <p>{isEn ? "Which transfer is wrong?" : "የትኛው የገንዘብ ዝውውር ነው የተሳሳተው?"}</p>
            </div>

            {/* Transaction Selection Cards (from Image 1) */}
            <div className="asst-tx-list">
              <div
                className={`asst-tx-card ${selectedTx === "tx1" ? "selected" : ""}`}
                onClick={() => { setSelectedTx("tx1"); setReversalSubmitted(false); }}
                role="button"
                tabIndex={0}
              >
                <div className="tx-card-content">
                  <strong>ETB 500</strong> <span className="tx-sep">|</span> <span>09••••41</span> <span className="tx-sep">|</span> <span>09:12</span>
                </div>
                {selectedTx === "tx1" && <span className="tx-check">✓</span>}
              </div>

              <div
                className={`asst-tx-card ${selectedTx === "tx2" ? "selected" : ""}`}
                onClick={() => { setSelectedTx("tx2"); setReversalSubmitted(false); }}
                role="button"
                tabIndex={0}
              >
                <div className="tx-card-content">
                  <strong>ETB 120</strong> <span className="tx-sep">|</span> <span>09••••77</span> <span className="tx-sep">|</span> <span>Yesterday</span>
                </div>
                {selectedTx === "tx2" && <span className="tx-check">✓</span>}
              </div>

              <div
                className={`asst-tx-card ${selectedTx === "tx3" ? "selected" : ""}`}
                onClick={() => { setSelectedTx("tx3"); setReversalSubmitted(false); }}
                role="button"
                tabIndex={0}
              >
                <div className="tx-card-content">
                  <strong>ETB 300</strong> <span className="tx-sep">|</span> <span>09••••52</span> <span className="tx-sep">|</span> <span>Mon</span>
                </div>
                {selectedTx === "tx3" && <span className="tx-check">✓</span>}
              </div>
            </div>

            {/* Bubble 2: OTP Prompt */}
            <div className="asst-bubble" style={{ marginTop: "14px" }}>
              <p>
                {isEn
                  ? "Enter the OTP sent to your Fayda-registered number."
                  : "በፋይዳ (Fayda) በተመዘገበው ስልክዎ ላይ የተላከውን የይለፍ ቃል (OTP) ያስገቡ።"}
              </p>
            </div>

            {/* 6 OTP Input Boxes (from Image 1) */}
            <form onSubmit={handleConfirmReversal} className="asst-otp-form">
              <div className="asst-otp-boxes">
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    maxLength={1}
                    className="asst-otp-input"
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    disabled={reversalSubmitted}
                    placeholder="•"
                    autoComplete="off"
                  />
                ))}
              </div>

              {!reversalSubmitted ? (
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "12px", justifyContent: "center" }}
                >
                  {isEn ? "Submit Reversal Request" : "የማስተካከያ ጥያቄ አስገባ"}
                </button>
              ) : null}
            </form>

            {/* Confirmation Banner (from Image 1) */}
            {reversalSubmitted && (
              <div className="asst-confirmation-card">
                <div className="asst-conf-icon">✅</div>
                <div className="asst-conf-text">
                  <strong>
                    {isEn
                      ? "Reversal request created. Reference TB-2041. We will confirm by SMS."
                      : "የማስተካከያ ጥያቄ ተፈጥሯል። መለያ ቁጥር TB-2041። በኤስኤምኤስ (SMS) እናሳውቅዎታለን።"}
                  </strong>
                  <p style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                    {isEn ? "Expected processing time: < 15 minutes" : "የሚፈጀው ጊዜ: ከ 15 ደቂቃ በታች"}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleResetReversal}
                  style={{ fontSize: "0.74rem", marginTop: "8px", alignSelf: "flex-end" }}
                >
                  {isEn ? "New Request" : "አዲስ ጥያቄ"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            MODE 2: HELP ARTICLES & CALL VOLUME STATUS
        ═══════════════════════════════════════════════════════ */}
        {activeTab === "support" && (
          <div className="support-overview-view">
            {/* 1. Support Status */}
            <div className="sidebar-section">
              <h3 className="widget-title">
                {isEn ? "Support Status" : "የድጋፍ ሰጪ ሁኔታ"}
              </h3>
              {waitTime ? (
                <div>
                  <div className="status-indicator">
                    <span className={`status-dot ${isHighWait ? "high" : ""}`} aria-hidden="true" />
                    <span className="status-text">
                      {isEn
                        ? (isHighWait ? "Elevated call volume" : "Normal call volume")
                        : (isHighWait ? "ከፍ ያለ ጥሪ መጠን" : "የጥሪ መጠን መደበኛ ነው")}
                    </span>
                  </div>
                  <p className="status-sub">
                    {isEn ? `~${waitTime.wait_time_minutes} min wait` : `~${waitTime.wait_time_minutes} ደቂቃ`}
                    {" · "}
                    <span>{isEn ? waitTime.status : "ክፍት"}</span>
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  {isEn ? "Checking status…" : "ሁኔታ በማጣራት ላይ…"}
                </p>
              )}
            </div>

            {/* 2. Help Articles */}
            <div className="sidebar-section" id="help">
              <h3 className="widget-title">
                {isEn ? "Help Articles" : "የእርዳታ ጽሁፎች"}
              </h3>

              {/* Search bar */}
              <div className="sidebar-search-wrap">
                <span className="sidebar-search-icon"><SearchIcon /></span>
                <input
                  type="search"
                  className="sidebar-search"
                  placeholder={isEn ? "Search articles…" : "ጽሁፎችን ይፈልጉ…"}
                  value={articleSearch}
                  onChange={(e) => setArticleSearch(e.target.value)}
                  aria-label={isEn ? "Search help articles" : "ጽሁፎችን ፈልግ"}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {filteredArticles.length > 0 ? (
                  filteredArticles.map((art) => (
                    <div key={art.id} className="article-item">
                      <div
                        className="article-item-title"
                        onClick={() =>
                          setSelectedArticleId(selectedArticleId === art.id ? null : art.id)
                        }
                        role="button"
                        tabIndex={0}
                        aria-expanded={selectedArticleId === art.id}
                      >
                        {art.title[locale] || art.title.en}
                      </div>
                      <div className="article-item-excerpt">
                        {art.excerpt[locale] || art.excerpt.en}
                      </div>
                      {selectedArticleId === art.id && (
                        <div className="article-modal" role="region" aria-live="polite">
                          <strong>{isEn ? "Details:" : "ዝርዝሮች:"}</strong>
                          <p style={{ marginTop: "4px" }}>
                            {art.content[locale] || art.content.en}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "8px 0" }}>
                    {isEn ? "No articles found." : "ምንም ጽሁፍ አልተገኘም።"}
                  </p>
                )}
              </div>
            </div>

            {/* 3. Business Hours */}
            <div className="sidebar-section">
              <h3 className="widget-title">
                {isEn ? "Contact Hours" : "የስራ ሰዓታት"}
              </h3>
              {hours ? (
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  <p>{hours.hours[locale] || hours.hours.en}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.73rem", marginTop: "4px" }}>
                    {isEn ? "Time zone: " : "ዞን: "}{hours.timezone}
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  {isEn ? "Loading…" : "በመጫን ላይ…"}
                </p>
              )}
            </div>

            {/* 4. Direct Assistance */}
            <div className="sidebar-section" id="contact" style={{ textAlign: "center" }}>
              <h3 className="widget-title">
                {isEn ? "Need Direct Assistance?" : "ቀጥታ እርዳታ ይፈልጋሉ?"}
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "14px", lineHeight: "1.5" }}>
                {isEn
                  ? "Submit a support ticket and one of our agents will contact you directly."
                  : "የድጋፍ ጥያቄ ቅጽ ያስገቡ እና ከደንበኛ ወኪሎቻችን አንዱ ቀጥታ ያነጋግርዎታል።"}
              </p>
              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={navigateToContact}
              >
                {isEn ? "Open Contact Form" : "የእውቂያ ቅጽ ክፈት"}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SidebarPanel;
