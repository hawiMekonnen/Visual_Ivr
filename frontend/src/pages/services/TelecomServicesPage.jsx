import React, { useState, useEffect } from "react";
import SiteHeader from "../../components/SiteHeader";
import SiteFooterFull from "../../components/SiteFooterFull";
import SpeakWithAgentModal from "../../components/SpeakWithAgentModal";
import ChatWidget from "../../components/ChatWidget";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  getAccountDetails,
  getRechargeHistory,
  rechargeWithVoucher,
  rechargeWithTelebirr,
  PACKAGES_CATALOG,
  getActivePackages,
  purchaseInternetPackage,
  getEligibleReversalTransactions,
  getReversalCases,
  submitReversalRequest,
  toggleSimCardLock,
  generateEsimQrPayload,
  TEST_VOUCHERS
} from "../../services/telecomServices";

const TelecomServicesPage = ({ initialTab = "recharge" }) => {
  const { locale } = useLanguage();
  const isEn = locale !== "am";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [account, setAccount] = useState(getAccountDetails());
  const [speakModalOpen, setSpeakModalOpen] = useState(false);
  const [chatWidgetOpen, setChatWidgetOpen] = useState(false);

  // Sync account details on state change
  useEffect(() => {
    const handleUpdate = () => setAccount(getAccountDetails());
    window.addEventListener("telecom_state_updated", handleUpdate);
    return () => window.removeEventListener("telecom_state_updated", handleUpdate);
  }, []);

  const navigateToHome = (e) => {
    if (e) e.preventDefault();
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // ─────────────────────────────────────────────────────────────
  // 1. RECHARGE STATE
  // ─────────────────────────────────────────────────────────────
  const [rechargeMethod, setRechargeMethod] = useState("voucher"); // "voucher" or "telebirr"
  const [voucherInput, setVoucherInput] = useState("");
  const [telebirrAmount, setTelebirrAmount] = useState(50);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [rechargeResult, setRechargeResult] = useState(null);
  const [rechargeError, setRechargeError] = useState("");
  const [historyList, setHistoryList] = useState(getRechargeHistory());

  const handleVoucherRecharge = async (e) => {
    if (e) e.preventDefault();
    setRechargeLoading(true);
    setRechargeError("");
    setRechargeResult(null);
    try {
      const res = await rechargeWithVoucher(voucherInput);
      setRechargeResult(res);
      setVoucherInput("");
      setHistoryList(getRechargeHistory());
    } catch (err) {
      setRechargeError(err.message || "Failed to process voucher");
    } finally {
      setRechargeLoading(false);
    }
  };

  const handleTelebirrRecharge = async (e) => {
    if (e) e.preventDefault();
    setRechargeLoading(true);
    setRechargeError("");
    setRechargeResult(null);
    try {
      const res = await rechargeWithTelebirr(telebirrAmount);
      setRechargeResult(res);
      setHistoryList(getRechargeHistory());
    } catch (err) {
      setRechargeError(err.message || "Failed to process Telebirr recharge");
    } finally {
      setRechargeLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. PACKAGES STATE
  // ─────────────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [packagePayMethod, setPackagePayMethod] = useState("telebirr"); // "telebirr" or "airtime"
  const [packageLoading, setPackageLoading] = useState(false);
  const [packageResult, setPackageResult] = useState(null);
  const [packageError, setPackageError] = useState("");
  const [activePacks, setActivePacks] = useState(getActivePackages());

  const filteredPackages = PACKAGES_CATALOG.filter((pkg) => {
    if (selectedCategory === "all") return true;
    return pkg.category === selectedCategory;
  });

  const handleBuyPackage = async (pkg) => {
    setPackageLoading(true);
    setPackageError("");
    setPackageResult(null);
    try {
      const res = await purchaseInternetPackage(pkg.id, packagePayMethod);
      setPackageResult(res);
      setActivePacks(getActivePackages());
    } catch (err) {
      setPackageError(err.message || "Purchase failed");
    } finally {
      setPackageLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 3. TELEBIRR REVERSAL STATE
  // ─────────────────────────────────────────────────────────────
  const transactions = getEligibleReversalTransactions();
  const [selectedTxId, setSelectedTxId] = useState("tx1");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [reversalLoading, setReversalLoading] = useState(false);
  const [reversalResult, setReversalResult] = useState(null);
  const [reversalError, setReversalError] = useState("");
  const [reversalCasesList, setReversalCasesList] = useState(getReversalCases());

  const handleOtpBoxChange = (idx, val) => {
    if (val.length > 1) val = val.slice(-1);
    const updated = [...otpCode];
    updated[idx] = val;
    setOtpCode(updated);
    if (val && idx < 5) {
      const next = document.getElementById(`reversal-otp-${idx + 1}`);
      if (next) next.focus();
    }
  };

  const handleOtpBoxKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otpCode[idx] && idx > 0) {
      const prev = document.getElementById(`reversal-otp-${idx - 1}`);
      if (prev) prev.focus();
    }
  };

  const handleSubmitReversal = async (e) => {
    if (e) e.preventDefault();
    setReversalLoading(true);
    setReversalError("");
    setReversalResult(null);
    try {
      const res = await submitReversalRequest(selectedTxId, otpCode.join(""));
      setReversalResult(res);
      setReversalCasesList(getReversalCases());
    } catch (err) {
      setReversalError(err.message || "Reversal request failed");
    } finally {
      setReversalLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 4. SIM & PUK INQUIRY STATE
  // ─────────────────────────────────────────────────────────────
  const [simCopiedField, setSimCopiedField] = useState("");
  const [simLocking, setSimLocking] = useState(false);
  const [simLockSuccess, setSimLockSuccess] = useState("");
  const esimInfo = generateEsimQrPayload();

  const handleCopyText = (field, text) => {
    navigator.clipboard.writeText(text);
    setSimCopiedField(field);
    setTimeout(() => setSimCopiedField(""), 2000);
  };

  const handleToggleLock = async () => {
    setSimLocking(true);
    try {
      const isLocked = account.simStatus.includes("Locked");
      const res = await toggleSimCardLock(!isLocked);
      setSimLockSuccess(res.message);
      setTimeout(() => setSimLockSuccess(""), 4000);
    } finally {
      setSimLocking(false);
    }
  };

  return (
    <div className="fullpage-unified-container">
      <div className="unified-master-card" id="main-content">
        {/* Master Header */}
        <SiteHeader />

        {/* ── Subbar Breadcrumb Navigation & Back Link ── */}
        <div className="services-nav-subbar">
          <div className="services-nav-left">
            <button className="services-back-btn" onClick={navigateToHome} title="Return to Visual Menu">
              ← {isEn ? "Back to Visual Menu" : "ወደ ዋናው ሜኑ ተመለስ"}
            </button>
            <span className="services-nav-sep">|</span>
            <span className="services-nav-crumb">
              {isEn ? "Customer Self-Service Portal" : "የደንበኞች አገልግሎት ፖርታል"}
            </span>
          </div>

          <div className="services-balance-badges">
            <span className="services-bal-pill">
              Airtime: <strong>ETB {account.airtimeBalance.toFixed(2)}</strong>
            </span>
            <span className="services-bal-pill">
              Telebirr: <strong>ETB {account.telebirrBalance.toFixed(2)}</strong>
            </span>
            <span className="services-bal-pill">
              Data: <strong>{account.dataBalanceGB} GB</strong>
            </span>
          </div>
        </div>

        {/* ── Tabs Bar (NO EMOJIS, CLEAN LABELS) ── */}
        <div className="services-tabs-row" role="tablist">
          <button
            className={`services-tab-btn ${activeTab === "recharge" ? "active" : ""}`}
            onClick={() => setActiveTab("recharge")}
            role="tab"
            aria-selected={activeTab === "recharge"}
          >
            {isEn ? "Recharge Airtime" : "ካርድ መሙላት"}
          </button>
          <button
            className={`services-tab-btn ${activeTab === "packages" ? "active" : ""}`}
            onClick={() => setActiveTab("packages")}
            role="tab"
            aria-selected={activeTab === "packages"}
          >
            {isEn ? "Internet Packages" : "የኢንተርኔት ፓኬጅ"}
          </button>
          <button
            className={`services-tab-btn ${activeTab === "reversal" ? "active" : ""}`}
            onClick={() => setActiveTab("reversal")}
            role="tab"
            aria-selected={activeTab === "reversal"}
          >
            {isEn ? "Telebirr Reversal" : "የቴሌብር ማስተካከያ"}
          </button>
          <button
            className={`services-tab-btn ${activeTab === "puk" ? "active" : ""}`}
            onClick={() => setActiveTab("puk")}
            role="tab"
            aria-selected={activeTab === "puk"}
          >
            {isEn ? "SIM / PUK Inquiry" : "ሲም / ፒዩኬ መረጃ"}
          </button>
          <button
            className={`services-tab-btn ${activeTab === "agent" ? "active" : ""}`}
            onClick={() => setActiveTab("agent")}
            role="tab"
            aria-selected={activeTab === "agent"}
          >
            {isEn ? "Speak with Agent" : "ከወኪል ጋር መነጋገር"}
          </button>
        </div>

        {/* ── Tab Content Workspace ── */}
        <div className="services-content-body">
          {/* ═══════════════════════════════════════════════════════
              TAB 1: RECHARGE AIRTIME
          ═══════════════════════════════════════════════════════ */}
          {activeTab === "recharge" && (
            <div className="service-tab-pane">
              <div className="service-pane-header">
                <h2 className="service-pane-title">
                  {isEn ? "Recharge Airtime" : "የሞባይል ካርድ ይሙሉ"}
                </h2>
                <p className="service-pane-desc">
                  {isEn
                    ? "Instant mobile balance recharge using scratch card vouchers or Telebirr mobile wallet."
                    : "በስክራች ካርድ ቫውቸር ወይም በቴሌብር የሞባይል ቦርሳ በቀጥታ ሂሳብዎን ይሙሉ::"}
                </p>
              </div>

              {/* Method Switcher */}
              <div className="recharge-method-switcher">
                <button
                  type="button"
                  className={`recharge-switch-btn ${rechargeMethod === "voucher" ? "active" : ""}`}
                  onClick={() => { setRechargeMethod("voucher"); setRechargeResult(null); setRechargeError(""); }}
                >
                  {isEn ? "Scratch Card Voucher" : "የስክራች ካርድ ቫውቸር"}
                </button>
                <button
                  type="button"
                  className={`recharge-switch-btn ${rechargeMethod === "telebirr" ? "active" : ""}`}
                  onClick={() => { setRechargeMethod("telebirr"); setRechargeResult(null); setRechargeError(""); }}
                >
                  {isEn ? "Top Up from Telebirr" : "ከቴሌብር ቦርሳ መሙላት"}
                </button>
              </div>

              {/* Success Notification */}
              {rechargeResult && (
                <div className="service-alert success">
                  <div className="alert-badge">✓</div>
                  <div className="alert-content">
                    <strong>{rechargeResult.message}</strong>
                    <div className="alert-meta">
                      <span>Transaction ID: {rechargeResult.txnId}</span>
                      <span>·</span>
                      <span>New Airtime: ETB {rechargeResult.newBalance || rechargeResult.newAirtime}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Notification */}
              {rechargeError && (
                <div className="service-alert error">
                  <div className="alert-badge">!</div>
                  <div className="alert-content">
                    <strong>{rechargeError}</strong>
                  </div>
                </div>
              )}

              <div className="service-two-col-grid">
                {/* Method Form */}
                <div className="service-card">
                  {rechargeMethod === "voucher" ? (
                    <form onSubmit={handleVoucherRecharge} className="service-form">
                      <div className="form-group">
                        <label className="form-label">
                          {isEn ? "Enter 12 to 16-Digit Voucher PIN" : "የ12-16 አሃዝ የቫውቸር ቁጥር ያስገቡ"}
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 839210948271"
                          value={voucherInput}
                          onChange={(e) => setVoucherInput(e.target.value.replace(/\D/g, ""))}
                          maxLength={16}
                          required
                        />
                      </div>

                      {/* Quick Test Vouchers */}
                      <div className="quick-chip-group">
                        <span className="quick-chip-label">{isEn ? "Quick Test Vouchers:" : "የሙከራ ቫውቸሮች:"}</span>
                        {TEST_VOUCHERS.map((v) => (
                          <button
                            key={v.pin}
                            type="button"
                            className="quick-chip-btn"
                            onClick={() => setVoucherInput(v.pin)}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ marginTop: "18px", width: "100%", justifyContent: "center" }}
                        disabled={rechargeLoading || voucherInput.length < 10}
                      >
                        {rechargeLoading ? (isEn ? "Applying Voucher…" : "በማረጋገጥ ላይ…") : (isEn ? "Recharge Now" : "አሁን ሙላ")}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleTelebirrRecharge} className="service-form">
                      <div className="form-group">
                        <label className="form-label">
                          {isEn ? "Select Recharge Amount (ETB)" : "የመሙያ መጠን ይምረጡ (ብር)"}
                        </label>
                        <div className="amount-pills-row">
                          {[25, 50, 100, 200, 500].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              className={`amount-pill ${telebirrAmount === amt ? "active" : ""}`}
                              onClick={() => setTelebirrAmount(amt)}
                            >
                              ETB {amt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">{isEn ? "Custom Amount" : "የተለየ መጠን"}</label>
                        <input
                          type="number"
                          className="form-input"
                          value={telebirrAmount}
                          onChange={(e) => setTelebirrAmount(Number(e.target.value))}
                          min={5}
                          max={10000}
                        />
                      </div>

                      <div className="form-summary-box">
                        <div className="summary-row">
                          <span>{isEn ? "Source Account:" : "የመክፈያ መለያ:"}</span>
                          <strong>Telebirr ({account.phoneNumber})</strong>
                        </div>
                        <div className="summary-row">
                          <span>{isEn ? "Available Balance:" : "ያለዎት ቀሪ ሂሳብ:"}</span>
                          <span>ETB {account.telebirrBalance.toFixed(2)}</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ marginTop: "18px", width: "100%", justifyContent: "center" }}
                        disabled={rechargeLoading || telebirrAmount <= 0}
                      >
                        {rechargeLoading ? (isEn ? "Processing…" : "በማከናወን ላይ…") : (isEn ? `Pay ETB ${telebirrAmount} with Telebirr` : `በቴሌብር ${telebirrAmount} ብር ክፈል`)}
                      </button>
                    </form>
                  )}
                </div>

                {/* History Column */}
                <div className="service-card">
                  <h3 className="service-subcard-title">{isEn ? "Recent Recharge History" : "የቅርብ ጊዜ የካርድ መሙላት ታሪክ"}</h3>
                  <div className="history-table-wrap">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>{isEn ? "Reference" : "መለያ"}</th>
                          <th>{isEn ? "Amount" : "መጠን"}</th>
                          <th>{isEn ? "Method" : "መንገድ"}</th>
                          <th>{isEn ? "Status" : "ሁኔታ"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyList.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.id}</strong>
                              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{item.date}</div>
                            </td>
                            <td>ETB {item.amount}.00</td>
                            <td>{item.method}</td>
                            <td>
                              <span className="badge-status-completed">{item.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 2: INTERNET PACKAGES
          ═══════════════════════════════════════════════════════ */}
          {activeTab === "packages" && (
            <div className="service-tab-pane">
              <div className="service-pane-header">
                <h2 className="service-pane-title">
                  {isEn ? "Internet Packages" : "የኢንተርኔት ፓኬጆች"}
                </h2>
                <p className="service-pane-desc">
                  {isEn
                    ? "Purchase high-speed 4G/5G mobile internet packages directly with Telebirr or Airtime balance."
                    : "ከፍተኛ ፍጥነት ያላቸው የ 4G/5G የኢንተርኔት ፓኬጆችን በቴሌብር ወይም በሞባይል ካርድዎ ይግዙ::"}
                </p>
              </div>

              {/* Purchase Alert */}
              {packageResult && (
                <div className="service-alert success">
                  <div className="alert-badge">✓</div>
                  <div className="alert-content">
                    <strong>{packageResult.message}</strong>
                    <div className="alert-meta">
                      <span>Txn: {packageResult.txnId}</span>
                      <span>·</span>
                      <span>Paid via: {packageResult.paymentMethod.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              )}

              {packageError && (
                <div className="service-alert error">
                  <div className="alert-badge">!</div>
                  <div className="alert-content">
                    <strong>{packageError}</strong>
                  </div>
                </div>
              )}

              {/* Active Bundles Bar */}
              <div className="active-bundle-strip">
                <div className="bundle-info-left">
                  <span className="bundle-label">{isEn ? "Active Subscription:" : "ንቁ ፓኬጅ:"}</span>
                  <strong>{activePacks[0]?.name || "4G Active"}</strong>
                  <span className="bundle-expiry">({activePacks[0]?.expiresAt || "Active"})</span>
                </div>
                <div className="bundle-bar-wrap">
                  <div className="bundle-bar-fill" style={{ width: "75%" }} />
                </div>
                <div className="bundle-mb-text">
                  <strong>{account.dataBalanceGB} GB</strong> {isEn ? "Remaining" : "ቀሪ"}
                </div>
              </div>

              {/* Controls: Filter & Payment Method */}
              <div className="packages-controls-bar">
                <div className="category-filter-pills">
                  {["all", "daily", "weekly", "monthly", "unlimited"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`cat-pill ${selectedCategory === cat ? "active" : ""}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="pay-method-toggle">
                  <span className="pay-toggle-label">{isEn ? "Pay with:" : "የመክፈያ ዘዴ:"}</span>
                  <button
                    type="button"
                    className={`pay-opt-btn ${packagePayMethod === "telebirr" ? "active" : ""}`}
                    onClick={() => setPackagePayMethod("telebirr")}
                  >
                    Telebirr
                  </button>
                  <button
                    type="button"
                    className={`pay-opt-btn ${packagePayMethod === "airtime" ? "active" : ""}`}
                    onClick={() => setPackagePayMethod("airtime")}
                  >
                    Airtime
                  </button>
                </div>
              </div>

              {/* Package Cards Grid */}
              <div className="packages-grid">
                {filteredPackages.map((pkg) => {
                  const isAffordable =
                    packagePayMethod === "telebirr"
                      ? account.telebirrBalance >= pkg.priceETB
                      : account.airtimeBalance >= pkg.priceETB;

                  return (
                    <div key={pkg.id} className={`package-card ${pkg.popular ? "featured" : ""}`}>
                      {pkg.popular && <span className="package-ribbon">{isEn ? "POPULAR" : "ተወዳጅ"}</span>}
                      <h4 className="package-title">{pkg.name[locale] || pkg.name.en}</h4>
                      <div className="package-data-size">
                        {pkg.dataMB > 90000 ? "UNLIMITED" : `${(pkg.dataMB / 1024).toFixed(pkg.dataMB % 1024 === 0 ? 0 : 1)} GB`}
                      </div>
                      <div className="package-meta">
                        <span>⏱ {pkg.validity[locale] || pkg.validity.en}</span>
                        <span>⚡ {pkg.speed}</span>
                      </div>
                      <div className="package-price-row">
                        <div className="package-price">ETB {pkg.priceETB}.00</div>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: "7px 16px", fontSize: "0.8rem" }}
                          disabled={packageLoading || !isAffordable}
                          onClick={() => handleBuyPackage(pkg)}
                        >
                          {packageLoading ? "…" : (isEn ? "Buy Now" : "አሁን ይግዙ")}
                        </button>
                      </div>
                      {!isAffordable && (
                        <div className="insufficient-note">
                          {isEn ? `Low ${packagePayMethod} balance` : `ዝቅተኛ የ${packagePayMethod} ሂሳብ`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 3: TELEBIRR REVERSAL
          ═══════════════════════════════════════════════════════ */}
          {activeTab === "reversal" && (
            <div className="service-tab-pane">
              <div className="service-pane-header">
                <h2 className="service-pane-title">
                  {isEn ? "Telebirr Wrong Transfer Reversal" : "የቴሌብር የተሳሳተ ዝውውር ማስተካከያ"}
                </h2>
                <p className="service-pane-desc">
                  {isEn
                    ? "If you sent money to the wrong phone number via Telebirr, initiate an immediate dispute hold and reversal."
                    : "በቴሌብር የተሳሳተ የገንዘብ ዝውውር ከፈጸሙ ወዲያውኑ ማስተካከያ እንዲደረግ ጥያቄዎን ያስገቡ::"}
                </p>
              </div>

              {reversalResult && (
                <div className="service-alert success">
                  <div className="alert-badge">✓</div>
                  <div className="alert-content">
                    <strong>{reversalResult.message}</strong>
                    <div className="alert-meta">
                      <span>Case Reference: {reversalResult.refNumber}</span>
                      <span>·</span>
                      <span>ETA: &lt; 15 mins</span>
                    </div>
                  </div>
                </div>
              )}

              {reversalError && (
                <div className="service-alert error">
                  <div className="alert-badge">!</div>
                  <div className="alert-content">
                    <strong>{reversalError}</strong>
                  </div>
                </div>
              )}

              <div className="service-two-col-grid">
                {/* Reversal Wizard */}
                <div className="service-card">
                  <h3 className="service-subcard-title">
                    {isEn ? "Step 1: Select Incorrect Transfer" : "ደረጃ 1: የተሳሳተውን ዝውውር ይምረጡ"}
                  </h3>
                  <div className="reversal-tx-list">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className={`reversal-tx-item ${selectedTxId === tx.id ? "selected" : ""}`}
                        onClick={() => setSelectedTxId(tx.id)}
                      >
                        <div className="tx-details">
                          <strong>ETB {tx.amountETB}.00</strong>
                          <span className="tx-recipient">→ {tx.recipient} ({tx.recipientName})</span>
                          <span className="tx-time">{tx.timestamp}</span>
                        </div>
                        <div className="tx-radio">
                          {selectedTxId === tx.id ? "●" : "○"}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSubmitReversal} style={{ marginTop: "20px" }}>
                    <h3 className="service-subcard-title">
                      {isEn ? "Step 2: Enter Fayda / SMS OTP Verification" : "ደረጃ 2: የኤስኤምኤስ (OTP) ኮድ ያስገቡ"}
                    </h3>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
                      {isEn
                        ? "Enter the 6-digit one-time code sent to your registered Fayda mobile number."
                        : "በፋይዳ የተመዘገበው ስልክዎ ላይ የተላከውን የ6 አሃዝ ኮድ ያስገቡ::"}
                    </p>

                    <div className="otp-inputs-row">
                      {otpCode.map((val, idx) => (
                        <input
                          key={idx}
                          id={`reversal-otp-${idx}`}
                          type="text"
                          maxLength={1}
                          className="otp-box"
                          value={val}
                          onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpBoxKeyDown(idx, e)}
                          placeholder="•"
                        />
                      ))}
                    </div>

                    <div style={{ marginTop: "10px" }}>
                      <button
                        type="button"
                        className="quick-chip-btn"
                        onClick={() => setOtpCode(["4", "8", "2", "9", "1", "0"])}
                      >
                        {isEn ? "Fill Test OTP (482910)" : "የሙከራ ኮድ ሙላ (482910)"}
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ marginTop: "20px", width: "100%", justifyContent: "center" }}
                      disabled={reversalLoading || otpCode.some((c) => !c)}
                    >
                      {reversalLoading ? (isEn ? "Submitting Dispute…" : "በማስገባት ላይ…") : (isEn ? "Submit Reversal Request" : "የማስተካከያ ጥያቄ አስገባ")}
                    </button>
                  </form>
                </div>

                {/* Status Column */}
                <div className="service-card">
                  <h3 className="service-subcard-title">{isEn ? "Active Reversal Cases" : "ንቁ የማስተካከያ ጥያቄዎች"}</h3>
                  {reversalCasesList.length > 0 ? (
                    <div className="reversal-cases-list">
                      {reversalCasesList.map((c) => (
                        <div key={c.refNumber} className="case-card">
                          <div className="case-header">
                            <span className="case-ref">{c.refNumber}</span>
                            <span className="case-badge">{c.status}</span>
                          </div>
                          <div className="case-body">
                            <div>Amount: <strong>ETB {c.amount}.00</strong></div>
                            <div>Recipient: <strong>{c.recipient}</strong></div>
                            <div>Expected: <strong>{c.eta}</strong></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-cases-box">
                      <p>{isEn ? "No active reversal requests filed yet." : "እስካሁን የቀረበ የማስተካከያ ጥያቄ የለም::"}</p>
                      <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                        {isEn ? "Submit step 1 and step 2 to file an instant case." : "ቅጹን ሞልተው ሲልኩ እዚህ ጋር ክትትል ማድረግ ይችላሉ::"}
                      </span>
                    </div>
                  )}

                  <div className="guidelines-box" style={{ marginTop: "24px" }}>
                    <h4>{isEn ? "Ethio Telecom Reversal Policy:" : "የቴሌብር ማስተካከያ መመሪያ:"}</h4>
                    <ul>
                      <li>{isEn ? "Disputes must be raised within 4 hours of transfer." : "ዝውውሩ ከተፈጸመ በ4 ሰዓታት ውስጥ ጥያቄው መቅረብ አለበት::"}</li>
                      <li>{isEn ? "Funds in the recipient wallet are automatically held." : "በተቀባዩ አካውንት ያለው ገንዘብ በጊዜያዊነት እንዳይወጣ ይያዛል::"}</li>
                      <li>{isEn ? "Official confirmation SMS will follow upon resolution." : "ጉዳዩ ሲጠናቀቅ በኤስኤምኤስ ማረጋገጫ ይደርስዎታል::"}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 4: SIM & PUK INQUIRY
          ═══════════════════════════════════════════════════════ */}
          {activeTab === "puk" && (
            <div className="service-tab-pane">
              <div className="service-pane-header">
                <h2 className="service-pane-title">
                  {isEn ? "SIM & PUK Security Inquiry" : "የሲም ካርድ እና የፒዩኬ (PUK) መረጃ"}
                </h2>
                <p className="service-pane-desc">
                  {isEn
                    ? "Retrieve your primary PUK codes to unblock a locked SIM card, review network credentials, or freeze a lost phone line."
                    : "የተዘጋውን ሲም ካርድ ለመክፈት የሚያስፈልጉዎትን የ PUK ኮዶች እዚህ ያግኙ ወይም የጠፋ ስልክ መስመር ያግዱ::"}
                </p>
              </div>

              {simLockSuccess && (
                <div className="service-alert success">
                  <div className="alert-badge">✓</div>
                  <div className="alert-content">
                    <strong>{simLockSuccess}</strong>
                  </div>
                </div>
              )}

              <div className="service-two-col-grid">
                {/* PUK Credentials Card */}
                <div className="service-card">
                  <h3 className="service-subcard-title">{isEn ? "Your Official PUK Codes" : "የሲም ካርድዎ PUK ኮዶች"}</h3>

                  <div className="puk-highlight-grid">
                    <div className="puk-big-box">
                      <div className="puk-label">{isEn ? "PUK 1 (PRIMARY)" : "ዋና ፒዩኬ (PUK 1)"}</div>
                      <div className="puk-code-number">{account.puk1}</div>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ fontSize: "0.74rem", padding: "4px 10px" }}
                        onClick={() => handleCopyText("puk1", account.puk1)}
                      >
                        {simCopiedField === "puk1" ? "✓ Copied" : (isEn ? "Copy PUK 1" : "ኮፒ አድርግ")}
                      </button>
                    </div>

                    <div className="puk-big-box">
                      <div className="puk-label">{isEn ? "PUK 2 (BACKUP)" : "ተጠባባቂ ፒዩኬ (PUK 2)"}</div>
                      <div className="puk-code-number">{account.puk2}</div>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ fontSize: "0.74rem", padding: "4px 10px" }}
                        onClick={() => handleCopyText("puk2", account.puk2)}
                      >
                        {simCopiedField === "puk2" ? "✓ Copied" : (isEn ? "Copy PUK 2" : "ኮፒ አድርግ")}
                      </button>
                    </div>
                  </div>

                  <div className="credentials-list">
                    <div className="cred-row">
                      <span className="cred-key">{isEn ? "Mobile Number:" : "ስልክ ቁጥር:"}</span>
                      <strong className="cred-val">{account.phoneNumber}</strong>
                    </div>
                    <div className="cred-row">
                      <span className="cred-key">{isEn ? "Default PIN 1:" : "መደበኛ ፒን (PIN 1):"}</span>
                      <strong className="cred-val">{account.pin1}</strong>
                    </div>
                    <div className="cred-row">
                      <span className="cred-key">SIM Card (ICCID):</span>
                      <span className="cred-val font-mono">{account.simSerial}</span>
                    </div>
                    <div className="cred-row">
                      <span className="cred-key">IMSI Network ID:</span>
                      <span className="cred-val font-mono">{account.imsi}</span>
                    </div>
                    <div className="cred-row">
                      <span className="cred-key">{isEn ? "Registered Name:" : "የተመዘገበው ስም:"}</span>
                      <span className="cred-val">{account.registeredName}</span>
                    </div>
                    <div className="cred-row">
                      <span className="cred-key">{isEn ? "Fayda Digital ID:" : "የፋይዳ ዲጂታል መታወቂያ:"}</span>
                      <span className="cred-val font-mono">{account.faydaId}</span>
                    </div>
                    <div className="cred-row">
                      <span className="cred-key">{isEn ? "Line Status:" : "የመስመሩ ሁኔታ:"}</span>
                      <span className="badge-status-completed">{account.simStatus}</span>
                    </div>
                  </div>

                  {/* Lock/Unlock Toggle */}
                  <div className="emergency-lock-section">
                    <div>
                      <strong>{isEn ? "Emergency Line Lock" : "የአደጋ ጊዜ መስመር ማገድ"}</strong>
                      <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {isEn
                          ? "Temporarily lock this SIM card if your phone is lost or stolen."
                          : "ስልክዎ ቢጠፋ ወይም ቢሰረቅ መስመርዎን ለጊዜው ያግዱ::"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`btn ${account.simStatus.includes("Locked") ? "btn-primary" : "btn-danger"}`}
                      onClick={handleToggleLock}
                      disabled={simLocking}
                    >
                      {simLocking
                        ? "…"
                        : account.simStatus.includes("Locked")
                        ? (isEn ? "Unlock SIM" : "እገዳ አንሳ")
                        : (isEn ? "Lock Lost SIM" : "መስመር አግድ")}
                    </button>
                  </div>
                </div>

                {/* eSIM & Unblock Instructions Column */}
                <div className="service-card">
                  <h3 className="service-subcard-title">{isEn ? "How to Unblock Your Phone" : "የተዘጋውን ስልክ እንዴት መክፈት እንደሚቻል"}</h3>
                  <div className="steps-list">
                    <div className="step-item">
                      <div className="step-num">1</div>
                      <div className="step-text">
                        <strong>{isEn ? "Locate the PUK prompt" : "የ PUK መጠየቂያውን ይክፈቱ"}</strong>
                        <p>{isEn ? "When SIM is blocked after 3 incorrect PIN entries, the phone displays 'Enter PUK'." : "3 ጊዜ የተሳሳተ ፒን ሲያስገቡ ስልክዎ PUK ያስገቡ ይላል::"}</p>
                      </div>
                    </div>
                    <div className="step-item">
                      <div className="step-num">2</div>
                      <div className="step-text">
                        <strong>{isEn ? "Type PUK 1 Code" : "የ PUK 1 ኮዱን ያስገቡ"}</strong>
                        <p>{isEn ? `Carefully type your 8-digit PUK 1: ${account.puk1}` : `ባለ 8 አሃዙን PUK 1 (${account.puk1}) በጥንቃቄ ያስገቡ::`}</p>
                      </div>
                    </div>
                    <div className="step-item">
                      <div className="step-num">3</div>
                      <div className="step-text">
                        <strong>{isEn ? "Set a New PIN" : "አዲስ የይለፍ ቃል (PIN) ይምረጡ"}</strong>
                        <p>{isEn ? "Enter a new 4-digit PIN of your choice (e.g. 1234) and confirm." : "አዲስ የ4 አሃዝ ፒን (ለምሳሌ 1234) አስገብተው ያረጋግጡ::"}</p>
                      </div>
                    </div>
                  </div>

                  {/* eSIM Migration Banner */}
                  <div className="esim-card-box">
                    <h4>{isEn ? "Switch to eSIM Profile" : "ወደ ኢ-ሲም (eSIM) ይቀይሩ"}</h4>
                    <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
                      {isEn
                        ? "Scan the profile QR code from your phone's Cellular Settings to activate embedded SIM."
                        : "በስልክዎ ሴሉላር ማስተካከያ ውስጥ በመግባት ይህንን የQR ኮድ ስካን በማድረግ ኢ-ሲም ያንቁ::"}
                    </p>
                    <div className="esim-qr-mock">
                      <div className="qr-box-graphic">
                        <div className="qr-mock-matrix" />
                        <span className="qr-caption">ETHIO TELECOM eSIM</span>
                      </div>
                      <div className="esim-details">
                        <div className="esim-field">SM-DP+: <code>{esimInfo.smdpAddress}</code></div>
                        <div className="esim-field">Matching Code: <code>{esimInfo.matchingId}</code></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 5: SPEAK WITH AGENT
          ═══════════════════════════════════════════════════════ */}
          {activeTab === "agent" && (
            <div className="service-tab-pane">
              <div className="service-pane-header">
                <h2 className="service-pane-title">
                  {isEn ? "Speak with Customer Service Agent" : "ከደንበኞች አገልግሎት ወኪል ጋር ይገናኙ"}
                </h2>
                <p className="service-pane-desc">
                  {isEn
                    ? "Connect directly via WebRTC high-definition voice call, live text chat, or dial toll-free 994."
                    : "በቀጥታ የድምጽ ጥሪ፣ በጽሁፍ ውይይት ወይም በነጻ የስልክ መስመር 994 ደውለው ያነጋግሩ::"}
                </p>
              </div>

              <div className="agent-hub-showcase">
                <div className="agent-callout-card">
                  <div className="agent-status-indicator">
                    <span className="live-dot" />
                    <strong>{isEn ? "Live Call Queues Active" : "የጥሪ መስመሮች ክፍት ናቸው"}</strong>
                  </div>
                  <div className="agent-queue-stats">
                    <div className="queue-stat-box">
                      <div className="stat-num">12</div>
                      <div className="stat-label">{isEn ? "Callers in Voice Queue" : "በድምጽ ወረፋ ያሉ"}</div>
                    </div>
                    <div className="queue-stat-box">
                      <div className="stat-num">~3 min</div>
                      <div className="stat-label">{isEn ? "Average Wait Time" : "አማካይ የጥበቃ ጊዜ"}</div>
                    </div>
                    <div className="queue-stat-box">
                      <div className="stat-num">48</div>
                      <div className="stat-label">{isEn ? "Agents Available" : "ክፍት የሆኑ ወኪሎች"}</div>
                    </div>
                  </div>

                  <div className="agent-action-buttons">
                    <button
                      type="button"
                      className="btn btn-primary btn-large"
                      onClick={() => setSpeakModalOpen(true)}
                    >
                      {isEn ? "Start Voice Call with Agent" : "ከወኪል ጋር የድምጽ ጥሪ ጀምር"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-large"
                      onClick={() => setChatWidgetOpen(true)}
                    >
                      {isEn ? "Open Live Text Chat" : "በጽሁፍ ውይይት ጀምር"}
                    </button>
                    <a
                      href="tel:994"
                      className="btn btn-ghost btn-large"
                    >
                      {isEn ? "Dial 994 Toll-Free" : "በ994 በነፃ ይደውሉ"}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Master Footer */}
        <SiteFooterFull />
      </div>

      {/* Modals */}
      {speakModalOpen && <SpeakWithAgentModal onClose={() => setSpeakModalOpen(false)} />}
      {chatWidgetOpen && <ChatWidget onClose={() => setChatWidgetOpen(false)} />}
    </div>
  );
};

export default TelecomServicesPage;
