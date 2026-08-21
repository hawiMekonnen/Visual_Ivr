import React, { useState, useEffect } from "react";
import client from "../api/client";
import { useLanguage } from "../contexts/LanguageContext";

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const MapPinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const HelpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const ContactChannelsGrid = () => {
  const { locale } = useLanguage();
  const isEn = locale !== "am";
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await client.get("/api/contact-channels");
        setChannels(res.data);
      } catch (err) {
        console.error("Failed to load contact channels, using mock fallback:", err);
        // Clean fallback matching API spec
        setChannels([
          {
            id: "email",
            type: "email",
            label: { en: "Email Support", am: "በኢሜል ያግኙን" },
            detail: { en: "Receive a detailed response in under 12 hours from our dedicated agents.", am: "ከድጋፍ ሰጪዎቻችን በ12 ሰዓት ውስጥ ዝርዝር ምላሽ በኢሜል ያግኙ።" },
            href: "mailto:support@visualivr.com",
            icon_key: "email"
          },
          {
            id: "messaging",
            type: "chat",
            label: { en: "Secure Messaging", am: "ደህንነቱ የተጠበቀ መልዕክት" },
            detail: { en: "Connect instantly via WhatsApp or SMS channels on your cellular network.", am: "በዋትስአፕ (WhatsApp) ወይም በኤስኤምኤስ (SMS) ፈጣን ግንኙነት ያድርጉ።" },
            href: "https://wa.me/1234567890",
            icon_key: "chat"
          },
          {
            id: "branch",
            type: "location",
            label: { en: "Locate a Branch", am: "ቅርንጫፍ ይፈልጉ" },
            detail: { en: "Find physical offices or self-service payment kiosk locations near you.", am: "በአቅራቢያዎ የሚገኙ የክፍያ ማሽኖችን ወይም ቅርንጫፍ ቢሮዎችን ያግኙ።" },
            href: "#location",
            icon_key: "location"
          }
        ]);
      }
    };
    fetchChannels();
  }, []);

  const getIcon = (key) => {
    switch (key) {
      case "email": return <MailIcon />;
      case "chat": return <MessageIcon />;
      case "location": return <MapPinIcon />;
      default: return <HelpIcon />;
    }
  };

  return (
    <section className="contact-grid-section" aria-labelledby="contact-grid-title">
      <h2 id="contact-grid-title" className="section-title">
        {isEn ? "Other ways to reach us" : "ሌሎች እኛን የሚያገኙባቸው መንገዶች"}
      </h2>
      <div className="contact-grid">
        {channels.map((ch) => {
          const chLabel = ch.label[locale] || ch.label["en"] || "";
          const chDetail = ch.detail[locale] || ch.detail["en"] || "";
          return (
            <div key={ch.id} className="contact-card">
              <div className="contact-card-header">
                <span className="contact-card-icon">{getIcon(ch.icon_key)}</span>
                <h3 className="contact-card-label">{chLabel}</h3>
              </div>
              <p className="contact-card-detail">{chDetail}</p>
              <a href={ch.href} className="btn btn-ghost contact-card-action">
                {isEn ? "Connect" : "ተገናኝ"} →
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ContactChannelsGrid;
