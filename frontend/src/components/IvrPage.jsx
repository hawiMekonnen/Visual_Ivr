import React from "react";
import SkipToContent from "./SkipToContent";
import SiteHeader from "./SiteHeader";
import UtilityBar from "./UtilityBar";
import StatusBanner from "./StatusBanner";
import MenuScreen from "./MenuScreen";
import SidebarPanel from "./SidebarPanel";
import ContactChannelsGrid from "./ContactChannelsGrid";
import TrustStrip from "./TrustStrip";
import SiteFooterFull from "./SiteFooterFull";

const IvrPage = () => {
  return (
    <>
      {/* Accessibility skip-link */}
      <SkipToContent />

      <div className="site-wrapper">
        {/* Site Header (with Auth menu and notifications) */}
        <SiteHeader />

        {/* Utility bar: page path breadcrumbs + session details */}
        <UtilityBar />

        {/* Outage and maintenance status banner */}
        <StatusBanner />

        {/* Console Card: Unified workspace containing Visual IVR and support sidebar */}
        <main className="console-card" id="main-content">
          {/* Left Panel: Interactive Visual IVR Menu */}
          <div className="console-main-panel">
            <MenuScreen />
          </div>

          {/* Right Panel: Support resource details and ticket form link */}
          <SidebarPanel />
        </main>

        {/* Multi-channel outreach cards grid (stretches horizontally across full-width) */}
        <ContactChannelsGrid />

        {/* Compliance and Rating Strip (stretches horizontally across full-width) */}
        <TrustStrip />

        {/* Full Site Footer Sitemap */}
        <SiteFooterFull />
      </div>
    </>
  );
};

export default IvrPage;
