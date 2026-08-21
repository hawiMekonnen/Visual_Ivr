import React, { useState, useEffect } from "react";
import client from "../api/client";
import { useLanguage } from "../contexts/LanguageContext";

const FaqAccordion = () => {
  const { locale } = useLanguage();
  const isEn = locale !== "am";
  const [faqs, setFaqs] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await client.get("/api/faq");
        setFaqs(res.data);
      } catch (err) {
        console.error("Failed to load FAQs:", err);
      }
    };
    fetchFaqs();
  }, []);

  const categories = ["All", "General", "Billing", "Technical", "Account"];

  const filteredFaqs = faqs.filter((faq) => {
    if (activeCategory === "All") return true;
    return faq.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="faq-section" aria-labelledby="faq-title">
      <h2 id="faq-title" className="section-title">
        {isEn ? "Frequently Asked Questions" : "ተደጋግመው የሚጠየቁ ጥያቄዎች"}
      </h2>

      {/* Category selector tabs */}
      <div className="faq-tabs" role="tablist" aria-label="FAQ Categories">
        {categories.map((cat) => (
          <button
            key={cat}
            role="tab"
            aria-selected={activeCategory === cat}
            className={`faq-tab ${activeCategory === cat ? "active" : ""}`}
            onClick={() => {
              setActiveCategory(cat);
              setExpandedId(null); // collapse on filter switch
            }}
          >
            {isEn ? cat : cat === "All" ? "ሁሉም" : cat === "General" ? "ጠቅላላ" : cat === "Billing" ? "ክፍያ" : cat === "Technical" ? "ቴክኒካል" : "መለያ"}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="faq-accordion-list">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            const question = faq.question[locale] || faq.question["en"] || "";
            const answer = faq.answer[locale] || faq.answer["en"] || "";
            return (
              <div key={faq.id} className="faq-accordion-item">
                <button
                  className="faq-accordion-header"
                  onClick={() => toggleExpand(faq.id)}
                  aria-expanded={isExpanded}
                >
                  <span className="faq-question-text">{question}</span>
                  <span className="faq-accordion-icon" aria-hidden="true">
                    {isExpanded ? "−" : "+"}
                  </span>
                </button>
                <div
                  className={`faq-accordion-collapse ${isExpanded ? "expanded" : ""}`}
                  aria-hidden={!isExpanded}
                >
                  <div className="faq-accordion-body">
                    <p>{answer}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>
            {isEn ? "No FAQs available in this category." : "በዚህ ምድብ ውስጥ ምንም ጥያቄዎች የሉም።"}
          </p>
        )}
      </div>
    </section>
  );
};

export default FaqAccordion;
