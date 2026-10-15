import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

const TwitterIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const SiteFooterFull = () => {
  const { locale } = useLanguage();
  const isEn = locale !== "am";
  const year = new Date().getFullYear();

  const handleNavClick = (e, path) => {
    e.preventDefault();
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <footer className="footer-full" role="contentinfo">
      {/* 4-Column Sitemap Grid */}
      <div className="footer-full-grid">
        {/* Column 1: Company */}
        <div className="footer-full-col">
          <h4 className="footer-col-title">{isEn ? "Company" : "ድርጅት"}</h4>
          <ul className="footer-col-links">
            <li><a href="#about">{isEn ? "About Us" : "ስለ እኛ"}</a></li>
            <li><a href="#careers">{isEn ? "Careers" : "ስራዎች"}</a></li>
            <li><a href="#press">{isEn ? "Press & Media" : "ጋዜጣዊ መግለጫ"}</a></li>
          </ul>
        </div>

        {/* Column 2: Resources */}
        <div className="footer-full-col">
          <h4 className="footer-col-title">{isEn ? "Resources" : "መርጃዎች"}</h4>
          <ul className="footer-col-links">
            <li><a href="#help">{isEn ? "Help Center" : "የእርዳታ ማዕከል"}</a></li>
            <li><a href="#status">{isEn ? "System Status" : "የስርዓት ሁኔታ"}</a></li>
            <li><a href="#api">{isEn ? "Developer API" : "የአይፒአይ ሰነዶች"}</a></li>
          </ul>
        </div>

        {/* Column 3: Legal */}
        <div className="footer-full-col">
          <h4 className="footer-col-title">{isEn ? "Legal" : "ህጋዊ"}</h4>
          <ul className="footer-col-links">
            <li><a href="#privacy">{isEn ? "Privacy Policy" : "የግለኝነት ፖሊሲ"}</a></li>
            <li><a href="#terms">{isEn ? "Terms of Service" : "የአገልግሎት ውሎች"}</a></li>
            <li><a href="#accessibility">{isEn ? "Accessibility Statement" : "የተደራሽነት ማረጋገጫ"}</a></li>
          </ul>
        </div>

        {/* Column 4: Support */}
        <div className="footer-full-col">
          <h4 className="footer-col-title">{isEn ? "Support Channels" : "ድጋፍ ሰጪ መስመሮች"}</h4>
          <ul className="footer-col-links">
            <li><a href="#call-linked">{isEn ? "Phone Support" : "የስልክ መስመር"}</a></li>
            <li><a href="/contact" onClick={(e) => handleNavClick(e, "/contact")}>{isEn ? "Email Support Form" : "የኢሜል ቅጽ"}</a></li>
            <li><a href="#chat">{isEn ? "Live Portal Chat" : "ቀጥታ ውይይት"}</a></li>
          </ul>
        </div>
      </div>

      {/* Keyboard hints footer row */}
      <div className="footer-hints-row">
        <span>
          {isEn
            ? "Accessibility shortcuts: Press [1–9] to navigate · [Backspace] to go back"
            : "የተደራሽነት አቋራጮች: ከ [1-9] ቁልፎችን ይጫኑ · ለመመለስ [Backspace] ይጫኑ"}
        </span>
      </div>

      {/* Bottom Bar: Copyright + Social Icons */}
      <div className="footer-full-bottom">
        <div className="footer-bottom-left" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/skyservice-horizontal-white.png" alt="Skyservice" style={{ height: "24px", width: "auto" }} />
          <span className="footer-powered-sep">|</span>
          <span>&copy; {year} Ethio Telecom • Skyservice Customer & Agent Experience</span>
        </div>
        <div className="footer-social-icons">
          <a href="#twitter" aria-label="Twitter Account" className="footer-social-link"><TwitterIcon /></a>
          <a href="#github" aria-label="GitHub Repository" className="footer-social-link"><GitHubIcon /></a>
          <a href="#linkedin" aria-label="LinkedIn Profile" className="footer-social-link"><LinkedInIcon /></a>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooterFull;
