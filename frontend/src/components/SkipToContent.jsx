import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

const SkipToContent = () => {
  const { locale } = useLanguage();
  const isEn = locale !== "am";

  return (
    <a href="#main-content" className="skip-link">
      {isEn ? "Skip to main content" : "ወደ ዋናው ይዘት ይለፉ"}
    </a>
  );
};

export default SkipToContent;
