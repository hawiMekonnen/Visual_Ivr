import React, { useState, useEffect } from "react";
import client from "../api/client";
import { useLanguage } from "../contexts/LanguageContext";

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const StatusBanner = () => {
  const { locale } = useLanguage();
  const [banner, setBanner] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await client.get("/api/status/banner");
        const data = res.data;
        if (data && data.active) {
          const dismissedKey = `ivr_dismissed_banner_${data.expires_at || "general"}`;
          const isDismissed = sessionStorage.getItem(dismissedKey);
          if (!isDismissed) {
            setBanner(data);
            setVisible(true);
          }
        }
      } catch (err) {
        console.error("Failed to load status banner:", err);
      }
    };
    fetchBanner();
  }, []);

  if (!visible || !banner) return null;

  const handleDismiss = () => {
    const dismissedKey = `ivr_dismissed_banner_${banner.expires_at || "general"}`;
    sessionStorage.setItem(dismissedKey, "true");
    setVisible(false);
  };

  const bannerText = banner.message[locale] || banner.message["en"] || "";
  const icon = banner.type === "incident" ? <AlertIcon /> : <InfoIcon />;

  return (
    <div className={`status-banner ${banner.type}`} role="alert" aria-live="assertive">
      <div className="status-banner-content">
        <span className="status-banner-icon">{icon}</span>
        <span className="status-banner-text">{bannerText}</span>
      </div>
      <button
        onClick={handleDismiss}
        className="status-banner-close"
        aria-label="Dismiss banner"
      >
        <CloseIcon />
      </button>
    </div>
  );
};

export default StatusBanner;
