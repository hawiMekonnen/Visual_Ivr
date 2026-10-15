import React, { useState, useEffect } from "react";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SessionProvider } from "./contexts/SessionContext";
import { AuthProvider } from "./contexts/AuthContext";
import IvrPage from "./components/IvrPage";
import ContactPage from "./components/ContactPage";
import AdminApp from "./pages/admin/AdminApp";
import TelecomServicesPage from "./pages/services/TelecomServicesPage";

function App() {
  // Simple state-based routing
  const [currentRoute, setCurrentRoute] = useState(() => {
    return window.location.pathname;
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentRoute(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // Route matches
  if (currentRoute === "/admin") {
    return <AdminApp />;
  }

  if (currentRoute === "/contact") {
    return (
      <LanguageProvider>
        <AuthProvider>
          <SessionProvider>
            <ContactPage />
          </SessionProvider>
        </AuthProvider>
      </LanguageProvider>
    );
  }

  if (currentRoute.startsWith("/services")) {
    let tab = "recharge";
    if (currentRoute.includes("package")) tab = "packages";
    else if (currentRoute.includes("reversal")) tab = "reversal";
    else if (currentRoute.includes("puk") || currentRoute.includes("sim")) tab = "puk";
    else if (currentRoute.includes("agent")) tab = "agent";

    return (
      <LanguageProvider>
        <AuthProvider>
          <SessionProvider>
            <TelecomServicesPage initialTab={tab} />
          </SessionProvider>
        </AuthProvider>
      </LanguageProvider>
    );
  }

  // Public menu screen route (default)
  return (
    <LanguageProvider>
      <AuthProvider>
        <SessionProvider>
          <IvrPage />
        </SessionProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
