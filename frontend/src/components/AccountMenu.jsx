import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const SignOutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const AccountMenu = () => {
  const { user, signIn, signOut } = useAuth();
  const { locale } = useLanguage();
  const isEn = locale !== "am";

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSignInSubmit = (e) => {
    e.preventDefault();
    if (!nameInput.trim() || !emailInput.trim()) return;
    signIn(nameInput.trim(), emailInput.trim());
    setModalOpen(false);
    setNameInput("");
    setEmailInput("");
  };

  if (!user) {
    return (
      <>
        <button
          className="btn btn-ghost header-signin-btn"
          onClick={() => setModalOpen(true)}
          style={{ fontSize: "0.78rem", padding: "4px 10px", height: "30px" }}
        >
          {isEn ? "Sign In" : "ግባ"}
        </button>

        {modalOpen && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-content">
              <h3 className="modal-title">{isEn ? "Sign In to Portal" : "ወደ ፖርታሉ ይግቡ"}</h3>
              <p className="modal-subtitle">
                {isEn ? "Mock organization portal authentication." : "የተመሳሰለ የድርጅት ፖርታል ማረጋገጫ።"}
              </p>
              <form onSubmit={handleSignInSubmit}>
                <div className="form-group">
                  <label htmlFor="modal-name">{isEn ? "Full Name" : "ሙሉ ስም"}</label>
                  <input
                    id="modal-name"
                    type="text"
                    className="form-control"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Jane Doe"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="modal-email">{isEn ? "Email Address" : "ኢሜል አድራሻ"}</label>
                  <input
                    id="modal-email"
                    type="email"
                    className="form-control"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="jane.doe@organization.com"
                    required
                  />
                </div>
                <div className="modal-btn-row">
                  <button type="submit" className="btn btn-primary">
                    {isEn ? "Sign In" : "ግባ"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setModalOpen(false)}
                  >
                    {isEn ? "Cancel" : "ሰርዝ"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="account-menu-container" ref={dropdownRef}>
      <button
        className="account-avatar-btn"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-label="User account menu"
        aria-expanded={dropdownOpen}
      >
        {user.initials}
      </button>

      {dropdownOpen && (
        <div className="account-dropdown-menu" role="menu">
          <div className="dropdown-user-header">
            <span className="dropdown-user-name">{user.name}</span>
            <span className="dropdown-user-email">{user.email}</span>
          </div>

          <div className="dropdown-divider" />

          <button
            role="menuitem"
            className="dropdown-menu-item"
            onClick={() => {
              setDropdownOpen(false);
              alert(isEn ? `You have ${user.ticketCount} open support ticket.` : `እርስዎ ${user.ticketCount} ክፍት የድጋፍ ጥያቄ አለዎት።`);
            }}
          >
            <UserIcon />
            <span>{isEn ? "View past tickets" : "የቀድሞ ቲኬቶችን ይመልከቱ"}</span>
          </button>

          <button
            role="menuitem"
            className="dropdown-menu-item"
            onClick={() => {
              setDropdownOpen(false);
              alert(isEn ? "Settings page mock trigger." : "የቅንብሮች ማሳያ።");
            }}
          >
            <SettingsIcon />
            <span>{isEn ? "Account settings" : "የመለያ ቅንብሮች"}</span>
          </button>

          <div className="dropdown-divider" />

          <button
            role="menuitem"
            className="dropdown-menu-item signout"
            onClick={() => {
              setDropdownOpen(false);
              signOut();
            }}
          >
            <SignOutIcon />
            <span>{isEn ? "Sign out" : "ውጣ"}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
