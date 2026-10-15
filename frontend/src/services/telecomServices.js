// ═══════════════════════════════════════════════════════════════════════
// ETHIO TELECOM SERVICES MOCK ENGINE & BUSINESS LOGIC
// ═══════════════════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  ACCOUNT: "ethio_telecom_account_data",
  RECHARGE_HISTORY: "ethio_telecom_recharge_history",
  ACTIVE_PACKAGES: "ethio_telecom_active_packages",
  REVERSAL_CASES: "ethio_telecom_reversal_cases"
};

// Initial state
const defaultAccount = {
  phoneNumber: "+251 91 123 4541",
  planType: "Prepaid 4G/5G Active",
  airtimeBalance: 248.50,
  telebirrBalance: 1840.00,
  dataBalanceGB: 14.2,
  voiceMinutes: 125,
  smsRemaining: 80,
  faydaId: "FYD-ET-9821-4820",
  simStatus: "Active",
  simSerial: "89251 01002 93847 18293 4",
  imsi: "63601 02938 47192",
  puk1: "83920144",
  puk2: "19283746",
  pin1: "0000",
  registeredName: "Abebe Kebede Tadesse"
};

// Sample test vouchers that user can try
export const TEST_VOUCHERS = [
  { pin: "839210948271", amount: 50, label: "50 ETB Voucher" },
  { pin: "192838471928", amount: 100, label: "100 ETB Voucher" },
  { pin: "582910294829", amount: 250, label: "250 ETB Voucher" }
];

// Available Internet Packages catalog
export const PACKAGES_CATALOG = [
  {
    id: "pkg-daily-1gb",
    category: "daily",
    name: { en: "Daily 1GB Standard", am: "የቀን 1 ጊባ መደበኛ" },
    dataMB: 1024,
    validity: { en: "24 Hours", am: "24 ሰዓት" },
    priceETB: 25,
    speed: "4G/5G High Speed",
    popular: false
  },
  {
    id: "pkg-daily-2.5gb",
    category: "daily",
    name: { en: "Daily 2.5GB Max", am: "የቀን 2.5 ጊባ ከፍተኛ" },
    dataMB: 2560,
    validity: { en: "24 Hours", am: "24 ሰዓት" },
    priceETB: 50,
    speed: "4G/5G Ultra",
    popular: true
  },
  {
    id: "pkg-weekly-5gb",
    category: "weekly",
    name: { en: "Weekly 5GB Freedom", am: "የሳምንት 5 ጊባ ነፃነት" },
    dataMB: 5120,
    validity: { en: "7 Days", am: "7 ቀናት" },
    priceETB: 110,
    speed: "4G/5G High Speed",
    popular: true
  },
  {
    id: "pkg-weekly-12gb",
    category: "weekly",
    name: { en: "Weekly 12GB Heavy", am: "የሳምንት 12 ጊባ" },
    dataMB: 12288,
    validity: { en: "7 Days", am: "7 ቀናት" },
    priceETB: 220,
    speed: "5G Gigaspeed",
    popular: false
  },
  {
    id: "pkg-monthly-15gb",
    category: "monthly",
    name: { en: "Monthly 15GB Classic", am: "የወር 15 ጊባ ክላሲክ" },
    dataMB: 15360,
    validity: { en: "30 Days", am: "30 ቀናት" },
    priceETB: 350,
    speed: "4G/5G Superfast",
    popular: false
  },
  {
    id: "pkg-monthly-35gb",
    category: "monthly",
    name: { en: "Monthly 35GB Pro", am: "የወር 35 ጊባ ፕሮ" },
    dataMB: 35840,
    validity: { en: "30 Days", am: "30 ቀናት" },
    priceETB: 650,
    speed: "5G Blazing Speed",
    popular: true
  },
  {
    id: "pkg-unlimited-1day",
    category: "unlimited",
    name: { en: "1-Day Unlimited Data", am: "የ1 ቀን ያልተገደበ ዳታ" },
    dataMB: 99999,
    validity: { en: "24 Hours", am: "24 ሰዓት" },
    priceETB: 95,
    speed: "No Throttle 5G",
    popular: false
  },
  {
    id: "pkg-unlimited-30day",
    category: "unlimited",
    name: { en: "30-Day Unlimited Premium", am: "የ30 ቀን ፕሪሚየም ያልተገደበ" },
    dataMB: 999999,
    validity: { en: "30 Days", am: "30 ቀናት" },
    priceETB: 1450,
    speed: "Unlimited 5G Priority",
    popular: true
  }
];

// Helper to get or set local storage
const getStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (_) {
    return fallback;
  }
};

const setStorage = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    window.dispatchEvent(new Event("telecom_state_updated"));
  } catch (_) {}
};

// ─── 1. ACCOUNT SERVICE ───
export const getAccountDetails = () => {
  return getStorage(STORAGE_KEYS.ACCOUNT, defaultAccount);
};

export const updateAccountDetails = (updater) => {
  const current = getAccountDetails();
  const next = typeof updater === "function" ? updater(current) : { ...current, ...updater };
  setStorage(STORAGE_KEYS.ACCOUNT, next);
  return next;
};

// ─── 2. RECHARGE SERVICE ───
export const getRechargeHistory = () => {
  return getStorage(STORAGE_KEYS.RECHARGE_HISTORY, [
    {
      id: "RCG-78190",
      amount: 100,
      method: "Voucher Card",
      date: "Yesterday, 04:15 PM",
      balanceAfter: 248.50,
      status: "Completed"
    },
    {
      id: "RCG-65201",
      amount: 200,
      method: "Telebirr Pay",
      date: "04 Oct 2026, 11:20 AM",
      balanceAfter: 148.50,
      status: "Completed"
    }
  ]);
};

export const rechargeWithVoucher = async (voucherPin) => {
  await new Promise((r) => setTimeout(r, 600)); // Simulate carrier latency
  const cleanPin = String(voucherPin).replace(/\D/g, "");

  if (cleanPin.length < 10) {
    throw new Error("Invalid voucher code. Must be at least 12 digits.");
  }

  // Detect predefined test voucher amount or calculate mock amount
  const matchedTest = TEST_VOUCHERS.find((v) => v.pin === cleanPin);
  const creditedAmount = matchedTest ? matchedTest.amount : 100;

  const current = getAccountDetails();
  const newAirtime = Number((current.airtimeBalance + creditedAmount).toFixed(2));
  updateAccountDetails({ airtimeBalance: newAirtime });

  const history = getRechargeHistory();
  const txnId = `RCG-${Math.floor(100000 + Math.random() * 900000)}`;
  const record = {
    id: txnId,
    amount: creditedAmount,
    method: "Scratch Voucher",
    date: "Just now",
    balanceAfter: newAirtime,
    status: "Completed"
  };
  setStorage(STORAGE_KEYS.RECHARGE_HISTORY, [record, ...history]);

  return {
    success: true,
    txnId,
    amount: creditedAmount,
    newBalance: newAirtime,
    message: `Voucher applied successfully! ETB ${creditedAmount}.00 has been credited.`
  };
};

export const rechargeWithTelebirr = async (amount) => {
  await new Promise((r) => setTimeout(r, 600));
  const parsed = Number(amount);
  if (!parsed || parsed <= 0) throw new Error("Please specify a valid recharge amount.");

  const current = getAccountDetails();
  if (current.telebirrBalance < parsed) {
    throw new Error(`Insufficient Telebirr balance (Current: ETB ${current.telebirrBalance.toFixed(2)}).`);
  }

  const newTelebirr = Number((current.telebirrBalance - parsed).toFixed(2));
  const newAirtime = Number((current.airtimeBalance + parsed).toFixed(2));
  updateAccountDetails({
    telebirrBalance: newTelebirr,
    airtimeBalance: newAirtime
  });

  const history = getRechargeHistory();
  const txnId = `TB-RCG-${Math.floor(100000 + Math.random() * 900000)}`;
  const record = {
    id: txnId,
    amount: parsed,
    method: "Telebirr Wallet",
    date: "Just now",
    balanceAfter: newAirtime,
    status: "Completed"
  };
  setStorage(STORAGE_KEYS.RECHARGE_HISTORY, [record, ...history]);

  return {
    success: true,
    txnId,
    amount: parsed,
    newAirtime,
    newTelebirr,
    message: `Recharge successful! ETB ${parsed}.00 moved from Telebirr to Airtime balance.`
  };
};

// ─── 3. INTERNET PACKAGE SERVICE ───
export const getActivePackages = () => {
  return getStorage(STORAGE_KEYS.ACTIVE_PACKAGES, [
    {
      id: "pkg-active-1",
      name: "Weekly 5GB Freedom",
      remainingMB: 3840,
      totalMB: 5120,
      expiresAt: "Expires in 3 days",
      autoRenew: false
    }
  ]);
};

export const purchaseInternetPackage = async (packageId, paymentMethod = "telebirr") => {
  await new Promise((r) => setTimeout(r, 700));
  const target = PACKAGES_CATALOG.find((p) => p.id === packageId);
  if (!target) throw new Error("Package not found.");

  const current = getAccountDetails();

  if (paymentMethod === "telebirr") {
    if (current.telebirrBalance < target.priceETB) {
      throw new Error(`Insufficient Telebirr wallet balance for ETB ${target.priceETB}.00.`);
    }
    const newTelebirr = Number((current.telebirrBalance - target.priceETB).toFixed(2));
    const addedGB = Number((target.dataMB / 1024).toFixed(1));
    const newData = Number((current.dataBalanceGB + addedGB).toFixed(1));
    updateAccountDetails({ telebirrBalance: newTelebirr, dataBalanceGB: newData });
  } else {
    // Airtime
    if (current.airtimeBalance < target.priceETB) {
      throw new Error(`Insufficient Airtime balance for ETB ${target.priceETB}.00.`);
    }
    const newAirtime = Number((current.airtimeBalance - target.priceETB).toFixed(2));
    const addedGB = Number((target.dataMB / 1024).toFixed(1));
    const newData = Number((current.dataBalanceGB + addedGB).toFixed(1));
    updateAccountDetails({ airtimeBalance: newAirtime, dataBalanceGB: newData });
  }

  const active = getActivePackages();
  const newActive = [
    {
      id: `act-${Date.now()}`,
      name: target.name.en,
      remainingMB: target.dataMB,
      totalMB: target.dataMB,
      expiresAt: target.validity.en,
      autoRenew: false
    },
    ...active
  ];
  setStorage(STORAGE_KEYS.ACTIVE_PACKAGES, newActive);

  return {
    success: true,
    package: target,
    paymentMethod,
    txnId: `PKG-${Math.floor(100000 + Math.random() * 900000)}`,
    message: `${target.name.en} activated successfully! Added ${Number((target.dataMB / 1024).toFixed(1))} GB to your balance.`
  };
};

// ─── 4. TELEBIRR REVERSAL SERVICE ───
export const getEligibleReversalTransactions = () => {
  return [
    {
      id: "tx1",
      amountETB: 500,
      recipient: "0911••••41",
      fullRecipient: "0911482941",
      recipientName: "Dawit Alemu",
      timestamp: "Today, 09:12 AM",
      feeETB: 0,
      status: "Eligible for Reversal"
    },
    {
      id: "tx2",
      amountETB: 120,
      recipient: "0922••••77",
      fullRecipient: "0922839177",
      recipientName: "Selamawit Girma",
      timestamp: "Yesterday, 06:40 PM",
      feeETB: 0,
      status: "Eligible for Reversal"
    },
    {
      id: "tx3",
      amountETB: 300,
      recipient: "0933••••52",
      fullRecipient: "0933920152",
      recipientName: "Binyam Worku",
      timestamp: "05 Oct 2026, 02:15 PM",
      feeETB: 0,
      status: "Eligible for Reversal"
    }
  ];
};

export const getReversalCases = () => {
  return getStorage(STORAGE_KEYS.REVERSAL_CASES, []);
};

export const submitReversalRequest = async (txId, otpCode) => {
  await new Promise((r) => setTimeout(r, 650));
  if (!otpCode || otpCode.length < 4) {
    throw new Error("Invalid OTP code. Please enter the 6-digit code sent by SMS.");
  }

  const tx = getEligibleReversalTransactions().find((t) => t.id === txId) || {
    id: txId,
    amountETB: 500,
    recipient: "0911••••41"
  };

  const refNumber = `TB-2041-${Math.floor(100 + Math.random() * 900)}`;
  const newCase = {
    refNumber,
    txId: tx.id,
    amount: tx.amountETB,
    recipient: tx.recipient,
    submittedAt: "Just now",
    status: "Under Review - Hold Placed",
    eta: "< 15 minutes",
    contactSms: "+251 91 123 4541"
  };

  const cases = getReversalCases();
  setStorage(STORAGE_KEYS.REVERSAL_CASES, [newCase, ...cases]);

  return {
    success: true,
    refNumber,
    case: newCase,
    message: `Reversal request created for ETB ${tx.amountETB}. Reference: ${refNumber}. Confirmation sent via SMS.`
  };
};

// ─── 5. SIM & PUK INQUIRY SERVICE ───
export const toggleSimCardLock = async (shouldLock) => {
  await new Promise((r) => setTimeout(r, 500));
  const newStatus = shouldLock ? "Suspended / Locked (Lost SIM Mode)" : "Active (4G/5G Ready)";
  updateAccountDetails({ simStatus: newStatus });
  return {
    success: true,
    status: newStatus,
    message: shouldLock
      ? "SIM card has been temporarily locked to protect against unauthorized usage."
      : "SIM card lock removed. Line is fully active."
  };
};

export const generateEsimQrPayload = () => {
  return {
    smdpAddress: "smdp.ethiotelecom.et",
    matchingId: "ET-ESIM-9821-4820-2026-X9",
    confirmationCode: "772190",
    qrDataString: "LPA:1$smdp.ethiotelecom.et$ET-ESIM-9821-4820-2026-X9$$1"
  };
};
