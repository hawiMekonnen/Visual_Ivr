import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Load from sessionStorage on mount
  useEffect(() => {
    const savedUser = sessionStorage.getItem("ivr_auth_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      loadMockNotifications(parsedUser.name);
    }
  }, []);

  const loadMockNotifications = (name) => {
    setNotifications([
      {
        id: 1,
        title: "Ticket Update",
        message: `Hello ${name.split(" ")[0]}, support ticket #120 has been marked as resolved.`,
        time: "10m ago",
        read: false
      },
      {
        id: 2,
        title: "System Alert",
        message: "Maintenance scheduled for this Sunday from 2 AM - 4 AM EST.",
        time: "1h ago",
        read: false
      }
    ]);
  };

  const signIn = (name, email) => {
    const newUser = {
      name,
      email,
      initials: name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U",
      ticketCount: 1
    };
    setUser(newUser);
    sessionStorage.setItem("ivr_auth_user", JSON.stringify(newUser));
    loadMockNotifications(name);
  };

  const signOut = () => {
    setUser(null);
    setNotifications([]);
    sessionStorage.removeItem("ivr_auth_user");
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        notifications,
        signIn,
        signOut,
        markAllNotificationsRead
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
