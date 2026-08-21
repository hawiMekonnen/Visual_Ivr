import React, { useState, useEffect } from "react";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SessionProvider } from "./contexts/SessionContext";
import { AuthProvider } from "./contexts/AuthContext";
import IvrPage from "./components/IvrPage";
import ContactPage from "./components/ContactPage";
import AdminApp from "./pages/admin/AdminApp";

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
