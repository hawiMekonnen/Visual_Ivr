import React, { useState, useEffect } from "react";
import client from "../api/client";
import { useLanguage } from "../contexts/LanguageContext";

const SearchIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const SidebarPanel = () => {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const isAm = locale === "am";

  const [waitTime, setWaitTime] = useState(null);
  const [articles, setArticles] = useState([]);
  const [hours, setHours] = useState(null);
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [articleSearch, setArticleSearch] = useState("");

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const waitRes = await client.get("/api/sidebar/wait-time");
        setWaitTime(waitRes.data);

        const articlesRes = await client.get("/api/sidebar/popular-articles");
        setArticles(articlesRes.data);

        const hoursRes = await client.get("/api/sidebar/hours");
        setHours(hoursRes.data);
      } catch (err) {
        console.error("Failed to load sidebar content:", err);
      }
    };
    fetchSidebarData();
  }, []);

  const navigateToContact = () => {
    window.history.pushState({}, "", "/contact");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // Client-side article filtering
  const filteredArticles = articles.filter((art) => {
    if (!articleSearch.trim()) return true;
    const title = (art.title[locale] || art.title.en || "").toLowerCase();
    return title.includes(articleSearch.toLowerCase());
  });

  const isHighWait = waitTime && waitTime.wait_time_minutes > 5;

  return (
    <aside className="console-sidebar" aria-label="Support sidebar info">
      {/* Integrated Console Sidebar Header */}
      <div className="console-sidebar-header">
        <span className="console-sidebar-title">
          {isEn ? "Support Overview" : "የድጋፍ አጠቃላይ እይታ"}
        </span>
      </div>

      <div className="console-sidebar-content">
        {/* 1. Support Status */}
        <div className="sidebar-section">
          <h3 className="widget-title">
            {isEn ? "Support Status" : isAm ? "የድጋፍ ሰጪ ሁኔታ" : "Estado del Soporte"}
          </h3>
          {waitTime ? (
            <div>
              <div className="status-indicator">
                <span className={`status-dot ${isHighWait ? "high" : ""}`} aria-hidden="true" />
                <span className="status-text">
                  {isEn
                    ? (isHighWait ? "Elevated call volume" : "Normal call volume")
                    : isAm
                    ? (isHighWait ? "ከፍ ያለ ጥሪ መጠን" : "የጥሪ መጠን መደበኛ ነው")
                    : (isHighWait ? "Volumen elevado" : "Volumen normal")}
                </span>
              </div>
              <p className="status-sub">
                {isEn ? `~${waitTime.wait_time_minutes} min wait` : isAm ? `~${waitTime.wait_time_minutes} ደቂቃ` : `~${waitTime.wait_time_minutes} min`}
                {" · "}
                <span>{isEn ? waitTime.status : isAm ? "ክፍት" : waitTime.status}</span>
              </p>
            </div>
          ) : (
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              {isEn ? "Checking status…" : "ሁኔታ በማጣራት ላይ…"}
            </p>
          )}
        </div>

        {/* 2. Help Articles */}
        <div className="sidebar-section" id="help">
          <h3 className="widget-title">
            {isEn ? "Help Articles" : isAm ? "የእርዳታ ጽሁፎች" : "Artículos de Ayuda"}
          </h3>

          {/* Search bar */}
          <div className="sidebar-search-wrap">
            <span className="sidebar-search-icon"><SearchIcon /></span>
            <input
              type="search"
              className="sidebar-search"
              placeholder={isEn ? "Search articles…" : isAm ? "ጽሁፎችን ይፈልጉ…" : "Buscar artículos…"}
              value={articleSearch}
              onChange={(e) => setArticleSearch(e.target.value)}
              aria-label={isEn ? "Search help articles" : "ጽሁፎችን ፈልግ"}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredArticles.length > 0 ? (
              filteredArticles.map((art) => (
                <div key={art.id} className="article-item">
                  <div
                    className="article-item-title"
                    onClick={() =>
                      setSelectedArticleId(selectedArticleId === art.id ? null : art.id)
                    }
                    role="button"
                    tabIndex={0}
                    aria-expanded={selectedArticleId === art.id}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedArticleId(selectedArticleId === art.id ? null : art.id);
                      }
                    }}
                  >
                    {art.title[locale] || art.title.en}
                  </div>
                  <div className="article-item-excerpt">
                    {art.excerpt[locale] || art.excerpt.en}
                  </div>
                  {selectedArticleId === art.id && (
                    <div className="article-modal" role="region" aria-live="polite">
                      <strong>
                        {isEn ? "Details:" : isAm ? "ዝርዝሮች:" : "Detalles:"}
                      </strong>
                      <p style={{ marginTop: "4px" }}>
                        {art.content[locale] || art.content.en}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "8px 0" }}>
                {isEn ? "No articles found." : isAm ? "ምንም ጽሁፍ አልተገኘም።" : "Sin resultados."}
              </p>
            )}
          </div>
        </div>

        {/* 3. Business Hours */}
        <div className="sidebar-section">
          <h3 className="widget-title">
            {isEn ? "Contact Hours" : isAm ? "የስራ ሰዓታት" : "Horas de Contacto"}
          </h3>
          {hours ? (
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              <p>{hours.hours[locale] || hours.hours.en}</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.73rem", marginTop: "4px" }}>
                {isEn ? "Time zone: " : isAm ? "ዞን: " : "Zona: "}{hours.timezone}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              {isEn ? "Loading…" : "በመጫን ላይ…"}
            </p>
          )}
        </div>

        {/* 4. Direct Assistance */}
        <div className="sidebar-section" id="contact" style={{ textAlign: "center" }}>
          <h3 className="widget-title">
            {isEn ? "Need Direct Assistance?" : isAm ? "ቀጥታ እርዳታ ይፈልጋሉ?" : "¿Necesita Ayuda Directa?"}
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "14px", lineHeight: "1.5" }}>
            {isEn
              ? "Submit a support ticket and one of our agents will contact you directly."
              : isAm
              ? "የድጋፍ ጥያቄ ቅጽ ያስገቡ እና ከደንበኛ ወኪሎቻችን አንዱ ቀጥታ ያነጋግርዎታል።"
              : "Envíe un ticket de soporte y uno de nuestros agentes le contactará directamente."}
          </p>
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={navigateToContact}
          >
            {isEn ? "Open Contact Form" : isAm ? "የእውቂያ ቅጽ ክፈት" : "Abrir Formulario"}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SidebarPanel;
