import React, { useState } from "react";
import client from "../api/client";
import { useLanguage } from "../contexts/LanguageContext";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

const ContactPage = () => {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const isAm = locale === "am";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const getLabel = (key) => {
    const labels = {
      title: {
        en: "Submit a Support Ticket",
        am: "የድጋፍ ጥያቄ ቅጽ ያስገቡ",
        es: "Enviar un Ticket de Soporte"
      },
      subtitle: {
        en: "Please fill out the form below. Our support team will get back to you within 24 hours.",
        am: "እባክዎ የሚከተለውን ቅጽ ይሙሉ። የድጋፍ ቡድናችን በ24 ሰዓታት ውስጥ ያነጋግርዎታል።",
        es: "Por favor complete el formulario. Nuestro equipo le responderá en 24 horas."
      },
      name: {
        en: "Full Name",
        am: "ሙሉ ስም",
        es: "Nombre Completo"
      },
      email: {
        en: "Email Address",
        am: "ኢሜል አድራሻ",
        es: "Correo Electrónico"
      },
      phone: {
        en: "Phone Number",
        am: "ስልክ ቁጥር",
        es: "Número de Teléfono"
      },
      message: {
        en: "Your Message",
        am: "መልዕክትዎ",
        es: "Su Mensaje"
      },
      submit: {
        en: "Submit Request",
        am: "ጥያቄ ያስገቡ",
        es: "Enviar Solicitud"
      },
      submitting: {
        en: "Sending...",
        am: "በመላክ ላይ...",
        es: "Enviando..."
      },
      success: {
        en: "Thank you! Your ticket has been submitted successfully.",
        am: "እናመሰግናለን! የድጋፍ ጥያቄዎ በተሳካ ሁኔታ ተልኳል።",
        es: "¡Gracias! Su ticket ha sido enviado con éxito."
      },
      back: {
        en: "Back to Home",
        am: "ወደ ዋና ገጽ ይመለሱ",
        es: "Volver al Inicio"
      }
    };
    return labels[key][locale] || labels[key]["en"];
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post("/api/support/tickets", { name, email, phone, message });
      setSubmitSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err) {
      console.error("Support ticket submission failed:", err);
      alert(isEn ? "Failed to send request." : "ጥያቄውን መላክ አልተቻለም።");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="site-wrapper">
      <SiteHeader />

      <main style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "40px 0" }}>
        <div className="app-card" style={{ maxWidth: "500px", minHeight: "auto", width: "100%" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--primary)", marginBottom: "6px" }}>
            {getLabel("title")}
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "24px", lineHeight: "1.4" }}>
            {getLabel("subtitle")}
          </p>

          {submitSuccess ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✓</div>
              <h3 style={{ color: "var(--success)", marginBottom: "12px" }}>{getLabel("success")}</h3>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "24px" }}>
                <button className="btn btn-ghost" onClick={() => setSubmitSuccess(false)}>
                  {isEn ? "Send another ticket" : "ሌላ ጥያቄ ለመላክ"}
                </button>
                <button className="btn btn-primary" onClick={() => {
                  window.history.pushState({}, "", "/");
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }}>
                  {getLabel("back")}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleTicketSubmit}>
              <div className="form-group">
                <label htmlFor="form-name">{getLabel("name")}</label>
                <input
                  id="form-name"
                  className="form-control"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="form-email">{getLabel("email")}</label>
                <input
                  id="form-email"
                  className="form-control"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="form-phone">{getLabel("phone")}</label>
                <input
                  id="form-phone"
                  className="form-control"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="form-message">{getLabel("message")}</label>
                <textarea
                  id="form-message"
                  className="form-control"
                  rows="4"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ resize: "none" }}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={submitting}
                >
                  {submitting ? getLabel("submitting") : getLabel("submit")}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    window.history.pushState({}, "", "/");
                    window.dispatchEvent(new PopStateEvent("popstate"));
                  }}
                >
                  {getLabel("back")}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default ContactPage;
