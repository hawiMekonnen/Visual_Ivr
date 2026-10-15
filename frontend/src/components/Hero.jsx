import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

const Hero = () => {
  const { locale } = useLanguage();
  const isEn = locale !== "am";

  return (
    <section className="hero-strip" aria-labelledby="hero-title">
      <div className="hero-pill-badge">
        <img src="/skyservice-icon.png" alt="" className="hero-badge-icon" />
        <span>{isEn ? "Skyservice • Ethio Telecom Visual IVR" : "ስካይሰርቪስ • የኢትዮ ቴሌኮም ቪዥዋል IVR"}</span>
        <span className="hero-badge-status">{isEn ? "● Live Gateway" : "● ቀጥታ መስመር"}</span>
      </div>

      <h1 id="hero-title" className="hero-title">
        {isEn
          ? "Connect with Ethio Telecom Instantly — No Holding"
          : "ያለ ምንም መጠበቅ ወዲያውኑ ከኢትዮ ቴሌኮም ጋር ይገናኙ"}
      </h1>
      <p className="hero-subtitle">
        {isEn
          ? "Browse our customer self-service directory visually, listen to voice prompts in Amharic & English, transfer with AI, or connect with a live agent."
          : "የደንበኞች አገልግሎት ማውጫችንን በቪዥዋል ይመልከቱ፣ በአማርኛና እንግሊዝኛ ድምፅ ያዳምጡ፣ በ AI ረዳት ይገልገሉ ወይም በቀጥታ ከወኪል ጋር ይገናኙ።"}
      </p>
    </section>
  );
};

export default Hero;
