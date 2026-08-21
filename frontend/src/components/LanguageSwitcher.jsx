import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

const LanguageSwitcher = () => {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="controls" aria-label="Language Selector">
      <button
        className={`control-btn ${locale === "en" ? "active" : ""}`}
        onClick={() => setLocale("en")}
        style={{
          borderBottom: locale === "en" ? "2px solid #818cf8" : "none",
          fontWeight: locale === "en" ? "700" : "400",
        }}
        aria-label="Switch language to English"
      >
        🇺🇸 EN
      </button>
      <button
        className={`control-btn ${locale === "am" ? "active" : ""}`}
        onClick={() => setLocale("am")}
        style={{
          borderBottom: locale === "am" ? "2px solid #818cf8" : "none",
          fontWeight: locale === "am" ? "700" : "400",
        }}
        aria-label="ቋንቋን ወደ አማርኛ ይቀይሩ"
      >
        🇪🇹 AM
      </button>
    </div>
  );
};

export default LanguageSwitcher;
