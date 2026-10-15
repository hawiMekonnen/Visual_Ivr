import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

const UtilityBar = () => {
  const { locale } = useLanguage();
  const isEn = locale !== "am";

  return (
    <div className="utility-bar" role="navigation" aria-label="Page context">
      <div className="utility-bar-left">
        <span className="utility-bar-crumb">
          {isEn ? "Support" : "ድጋፍ"}
        </span>
        <span className="utility-bar-sep"> › </span>
        <span className="utility-bar-crumb-current">
          {isEn ? "Visual Menu" : "ቪዥዋል ምናሌ"}
        </span>
      </div>
    </div>
  );
};

export default UtilityBar;
