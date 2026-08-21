import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

const Hero = () => {
  const { locale } = useLanguage();
  const isEn = locale !== "am";

  return (
    <section className="hero-strip" aria-labelledby="hero-title">
      <h1 id="hero-title" className="hero-title">
        {isEn
          ? "Connect with Us Instantly — No Holding"
          : "ያለ ምንም መጠበቅ ወዲያውኑ ከእኛ ጋር ይገናኙ"}
      </h1>
      <p className="hero-subtitle">
        {isEn
          ? "Navigate our call center directory visually, hear voice prompts, get text answers, or request call-backs immediately."
          : "የጥሪ ማዕከላችንን ማውጫ በቪዥዋል ይመልከቱ፣ የድምፅ መልእክቶችን ያዳምጡ፣ የጽሑፍ ምላሾችን ያግኙ ወይም ወዲያውኑ መልሶ መደወል ይጠይቁ።"}
      </p>
    </section>
  );
};

export default Hero;
