import React from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useSession } from "../contexts/SessionContext";
import NotificationBell from "./NotificationBell";
import AccountMenu from "./AccountMenu";

/* ── Inline SVG icons ── */
const HeadsetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
  </svg>
);

const SiteHeader = ({ showBreadcrumb = true, activePage = "menu" }) => {
  const { locale, setLocale } = useLanguage();
  const { switchLanguageMenu } = useSession();

  const getLabel = (key) => {
    const labels = {
      brand:   { en: "Skyservice",           am: "ስካይሰርቪስ" },
      badge:   { en: "Visual IVR",           am: "ቪዥዋል IVR" },
      home:    { en: "Home",                 am: "ዋና ገጽ" },
      help:    { en: "Help Center",          am: "የእርዳታ ማዕከል" },
      contact: { en: "Contact Support",      am: "ድጋፍ ሰጪዎችን ያግኙ" },
      admin:   { en: "Admin",                am: "አስተዳዳሪ" },
      support: { en: "Support",              am: "ድጋፍ" },
      menu:    { en: "Visual Menu",          am: "ቪዥዋል ምናሌ" },
    };
    return labels[key]?.[locale] || labels[key]?.["en"] || "";
  };

  const handleNavClick = (e, path) => {
    e.preventDefault();
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const currentPath = window.location.pathname;

  return (
    <header className="site-header" role="banner">
      {/* ── Ethio Telecom Browser Topframe (Image 1 & 2 inspired) ── */}
      <div className="site-header-topframe">
        <div className="window-dots">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <div className="topframe-address">
          <span>www.ethiotelecom.et</span>
        </div>
        <div className="topframe-status">
          <span className="live-dot" />
          <span>SkyConnect Live</span>
        </div>
      </div>

      <div className="site-header-row">
        <a href="/" className="site-brand" onClick={(e) => handleNavClick(e, "/")}>
          <img
            src="/skyservice-horizontal.png"
            alt="Skyservice"
            className="site-brand-logo-img"
          />
          <span className="site-brand-badge">{getLabel("badge")}</span>
        </a>

        <nav className="site-nav" aria-label="Main Navigation">
          <a
            href="/"
            className={`site-nav-link ${currentPath === "/" ? "active" : ""}`}
            onClick={(e) => handleNavClick(e, "/")}
          >
            {getLabel("home")}
          </a>
          <a href="#help" className="site-nav-link">
            {getLabel("help")}
          </a>
          <a
            href="/contact"
            className={`site-nav-link ${currentPath === "/contact" ? "active" : ""}`}
            onClick={(e) => handleNavClick(e, "/contact")}
          >
            {getLabel("contact")}
          </a>
          <a
            href="/admin"
            className={`site-nav-link ${currentPath === "/admin" ? "active" : ""}`}
            onClick={(e) => handleNavClick(e, "/admin")}
          >
            {getLabel("admin")}
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
      </div>

      {showBreadcrumb && (
        <div className="site-header-subbar" role="navigation" aria-label="Page context">
          <span className="utility-bar-crumb">
            {getLabel("support")}
          </span>
          <span className="utility-bar-sep"> › </span>
          <span className="utility-bar-crumb-current">
            {getLabel(activePage)}
          </span>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
