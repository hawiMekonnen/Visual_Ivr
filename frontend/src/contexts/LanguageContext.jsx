import React, { createContext, useState, useContext, useEffect } from "react";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem("ivr_locale") || "en";
  });

  useEffect(() => {
    localStorage.setItem("ivr_locale", locale);
  }, [locale]);

  const toggleLanguage = () => {
    setLocale((prev) => (prev === "en" ? "am" : "en"));
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
