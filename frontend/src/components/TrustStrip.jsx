import React, { useState, useEffect } from "react";
import client from "../api/client";
import { useLanguage } from "../contexts/LanguageContext";

const StarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" style={{ color: "#f59e0b" }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const TargetIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const TrustStrip = () => {
  const { locale } = useLanguage();
  const isEn = locale !== "am";
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await client.get("/api/trust-metrics");
        setMetrics(res.data);
      } catch (err) {
        console.error("Failed to load trust metrics:", err);
      }
    };
    fetchMetrics();
  }, []);

  if (!metrics) return null;

  return (
    <section className="trust-strip-container" aria-label="Trust and Compliance Metrics">
      <div className="trust-strip">
        {/* Rating Metric */}
        <div className="trust-metric">
          <div className="trust-metric-header">
            <StarIcon />
            <span className="trust-metric-value">{metrics.rating} / 5</span>
          </div>
          <span className="trust-metric-label">
            {isEn ? `Based on ${metrics.reviews.toLocaleString()} reviews` : `ከ ${metrics.reviews.toLocaleString()} ግምገማዎች የተገኘ`}
          </span>
        </div>

        {/* Resolution Metric */}
        <div className="trust-metric">
          <div className="trust-metric-header">
            <TargetIcon />
            <span className="trust-metric-value">{metrics.fcr_pct}%</span>
          </div>
          <span className="trust-metric-label">
            {isEn ? "First-contact resolution rate" : "የመጀመሪያ ደረጃ ምላሽ ስኬት መጠን"}
          </span>
        </div>

        {/* Compliance Badges */}
        <div className="trust-badges-wrap">
          {metrics.badges.map((badge) => (
            <div
              key={badge.id}
              className="trust-badge"
              title={badge.description}
              role="img"
              aria-label={badge.label}
            >
              <span className="trust-badge-dot" />
              <span className="trust-badge-text">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
