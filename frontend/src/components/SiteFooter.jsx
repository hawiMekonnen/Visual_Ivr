import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

const SiteFooter = () => {
  const { locale } = useLanguage();
  const isEn = locale !== "am";
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo">
      {/* Top row: keyboard hints + company name */}
      <div className="footer-top-row">
        <span>
          {isEn
            ? "Keyboard shortcuts: [1–9] navigate · [Backspace] go back"
            : "ቁልፍ አቋራጮች: [1-9] ለማሰስ · [Backspace] ለመመለስ"}
        </span>
        <span className="footer-company">Visual IVR Systems Ltd.</span>
      </div>

      {/* Legal row: privacy / terms + copyright */}
      <div className="footer-legal-row">
        <nav className="footer-legal-links" aria-label="Legal links">
          <a href="#privacy" className="footer-legal-link">
            {isEn ? "Privacy Policy" : "የግለኝነት መመሪያ"}
          </a>
          <a href="#terms" className="footer-legal-link">
            {isEn ? "Terms of Service" : "የአገልግሎት ውሎች"}
          </a>
          <a href="#accessibility" className="footer-legal-link">
            {isEn ? "Accessibility" : "ተደራሽነት"}
          </a>
        </nav>
        <span aria-label="Copyright">
          &copy; {year} Visual IVR Systems Ltd.
        </span>
      </div>
    </footer>
  );
};

export default SiteFooter;
