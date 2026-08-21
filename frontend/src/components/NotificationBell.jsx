import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);

const CheckDoubleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="7 8 12 13 22 3"/>
    <polyline points="2 12 7 17 12 12"/>
  </svg>
);

const NotificationBell = () => {
  const { notifications, markAllNotificationsRead, user } = useAuth();
  const { locale } = useLanguage();
  const isEn = locale !== "am";

  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close popover on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="notif-bell-container" ref={popoverRef}>
      <button
        className="notif-bell-btn"
        onClick={() => setPopoverOpen(!popoverOpen)}
        aria-label="System Alerts"
        aria-expanded={popoverOpen}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount}</span>
        )}
      </button>

      {popoverOpen && (
        <div className="notif-popover" role="dialog" aria-label="Notifications panel">
          <div className="notif-header">
            <span className="notif-title">{isEn ? "Notifications" : "ማንቂያዎች"}</span>
            {unreadCount > 0 && (
              <button
                className="notif-clear-btn"
                onClick={markAllNotificationsRead}
              >
                <CheckDoubleIcon />
                <span>{isEn ? "Mark all read" : "ሁሉንም አንብብ"}</span>
              </button>
            )}
          </div>

          <div className="dropdown-divider" />

          <div className="notif-list">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div key={notif.id} className={`notif-item ${notif.read ? "read" : "unread"}`}>
                  <div className="notif-item-header">
                    <span className="notif-item-title">{notif.title}</span>
                    <span className="notif-item-time">{notif.time}</span>
                  </div>
                  <p className="notif-item-msg">{notif.message}</p>
                </div>
              ))
            ) : (
              <p className="notif-empty-text">
                {isEn ? "No notifications yet." : "ምንም ማንቂያዎች የሉም።"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
