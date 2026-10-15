import React, { useState } from "react";
import SkipToContent from "./SkipToContent";
import SiteHeader from "./SiteHeader";
import StatusBanner from "./StatusBanner";
import MenuScreen from "./MenuScreen";
import SidebarPanel from "./SidebarPanel";
import AccountStatusStrip from "./AccountStatusStrip";
import ContactChannelsGrid from "./ContactChannelsGrid";
import TrustStrip from "./TrustStrip";
import SiteFooterFull from "./SiteFooterFull";
import SpeakWithAgentModal from "./SpeakWithAgentModal";
import ChatWidget from "./ChatWidget";
import { useSession } from "../contexts/SessionContext";

const IvrPage = () => {
  const { navigateToNodeId, menuTree } = useSession();
  const [sidebarTab, setSidebarTab] = useState("support");
  const [speakModalOpen, setSpeakModalOpen] = useState(false);
  const [chatWidgetOpen, setChatWidgetOpen] = useState(false);

  const handleTriggerAction = (action) => {
    if (action === "recharge") {
      window.history.pushState({}, "", "/services/recharge");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else if (action === "packages") {
      window.history.pushState({}, "", "/services/packages");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else if (action === "telebirr_reversal") {
      window.history.pushState({}, "", "/services/reversal");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else if (action === "puk") {
      window.history.pushState({}, "", "/services/puk");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else if (action === "agent") {
      setSpeakModalOpen(true);
    } else if (action === "chat") {
      setChatWidgetOpen(true);
    }
  };

  return (
    <>
      <SkipToContent />

      {/* Full-width container fitting the entire viewport */}
      <div className="fullpage-unified-container">
        {/* All components united inside ONE master card fitting the whole screen */}
        <div className="unified-master-card" id="main-content">
          {/* 1. Header (Browser bar + Brand navigation + Breadcrumbs) */}
          <SiteHeader />

          {/* 2. System Status banner */}
          <StatusBanner />

          {/* 3. Telecom Account & Service Status Quick Bar */}
          <AccountStatusStrip onTriggerAssistant={handleTriggerAction} />

          {/* 4. Main Workspace: Visual IVR Menu + Assistant/Support Hub */}
          <div className="console-workspace-row">
            <div className="console-main-panel">
              <MenuScreen />
            </div>
            <div className="console-side-panel">
              <SidebarPanel activeTab={sidebarTab} onTabChange={setSidebarTab} />
            </div>
          </div>

          {/* 5. Contact Channels Bar */}
          <ContactChannelsGrid />

          {/* 6. Trust & Security Compliance Strip */}
          <TrustStrip />

          {/* 7. Master Card Footer */}
          <SiteFooterFull />
        </div>
      </div>

      {/* Quick Action Modals */}
      {speakModalOpen && <SpeakWithAgentModal onClose={() => setSpeakModalOpen(false)} />}
      {chatWidgetOpen && <ChatWidget onClose={() => setChatWidgetOpen(false)} />}
    </>
  );
};

export default IvrPage;
