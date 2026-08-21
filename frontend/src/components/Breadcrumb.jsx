import React from "react";
import { useSession } from "../contexts/SessionContext";
import { useLanguage } from "../contexts/LanguageContext";

const Breadcrumb = () => {
  const { history, currentNode, selectNode, goBack } = useSession();
  const { locale } = useLanguage();

  if (history.length === 0) return null;

  const handleItemClick = (index) => {
    // Jump back to the specified index in history
    const targetNode = history[index];
    selectNode(targetNode);
  };

  return (
    <nav className="breadcrumb-trail" aria-label="Breadcrumb Trail">
      <span 
        className="breadcrumb-item" 
        onClick={() => handleItemClick(0)}
      >
        Home
      </span>
      {history.slice(1).map((node, index) => {
        const label = node.labels[locale] || node.labels["en"];
        return (
          <React.Fragment key={node.id}>
            <span className="breadcrumb-separator" aria-hidden="true">/</span>
            <span 
              className="breadcrumb-item" 
              onClick={() => handleItemClick(index + 1)}
            >
              {label}
            </span>
          </React.Fragment>
        );
      })}
      <span className="breadcrumb-separator" aria-hidden="true">/</span>
      <span className="breadcrumb-item" style={{ color: "#e2e8f0", fontWeight: "600", cursor: "default" }}>
        {currentNode ? (currentNode.labels[locale] || currentNode.labels["en"]) : ""}
      </span>
    </nav>
  );
};

export default Breadcrumb;
