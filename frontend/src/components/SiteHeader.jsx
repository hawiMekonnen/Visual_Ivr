import React from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useSession } from "../contexts/SessionContext";
import NotificationBell from "./NotificationBell";
import AccountMenu from "./AccountMenu";

/* ── Inline SVG icons (Lucide outline style) ── */
const HeadsetIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
  </svg>
);

const SiteHeader = () => {
  const { locale, setLocale } = useLanguage();
  const { switchLanguageMenu } = useSession();

  const getLabel = (key) => {
    const labels = {
      brand:   { en: "Visual IVR",          am: "ቪዥዋል IVR" },
      home:    { en: "Home",                 am: "ዋና ገጽ" },
      help:    { en: "Help Center",          am: "የእርዳታ ማዕከል" },
      contact: { en: "Contact Support",      am: "ድጋፍ ሰጪዎችን ያግኙ" },
    };
    return labels[key][locale] || labels[key]["en"];
  };

  const handleNavClick = (e, path) => {
    e.preventDefault();
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <header className="site-header" role="banner">
      <a href="/" className="site-brand" onClick={(e) => handleNavClick(e, "/")}>
        <span className="site-brand-icon"><HeadsetIcon /></span>
        <span>{getLabel("brand")}</span>
      </a>

      <nav className="site-nav" aria-label="Main Navigation">
        <a href="/" className="site-nav-link" onClick={(e) => handleNavClick(e, "/")}>
          {getLabel("home")}
        </a>
        <a href="#help" className="site-nav-link">
          {getLabel("help")}
        </a>
        <a href="/contact" className="site-nav-link" onClick={(e) => handleNavClick(e, "/contact")}>
          {getLabel("contact")}
        </a>
      </nav>

      <div className="site-header-actions">
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            className={`header-lang-btn ${locale === "en" ? "active" : ""}`}
            onClick={() => { setLocale("en"); switchLanguageMenu("en"); }}
            aria-label="Switch language to English"
          >
            EN
          </button>
          <button
            className={`header-lang-btn ${locale === "am" ? "active" : ""}`}
            onClick={() => { setLocale("am"); switchLanguageMenu("am"); }}
            aria-label="ቋንቋን ወደ አማርኛ ይቀይሩ"
          >
            AM
          </button>
        </div>

        {/* Notifications and account options */}
        <NotificationBell />
        <AccountMenu />
      </div>
    </header>
  );
};

export default SiteHeader;
