import React, { useState, useEffect, useCallback } from "react";
import Cookies from "universal-cookie";
import { 
  PlusCircle, 
  LayoutDashboard, 
  CheckCircle2, 
  LogOut, 
  Sun, 
  Moon, 
  RefreshCw, 
  Info, 
  Bell, 
  Crown, 
  Check, 
  CreditCard, 
  Download, 
  Lock,
  Sparkles,
  Headphones,
  Mail,
  MessageCircle,
  Calendar,
  ShieldCheck,
  Clock
} from "lucide-react";

import TrackerDashboard from "../components/trackers/TrackerDashboard";
import TrackerForm from "../components/trackers/TrackerForm";
import TrackerList from "../components/trackers/TrackerList";
import TrackerFilters from "../components/trackers/TrackerFilters";
import WorkspacePanels from "../components/WorkspacePanels";
import { getPendingTrackerWriteCount, syncEncryptedTrackerWrite, flushPendingTrackerWrites } from "../utils/offlineSync";
import { initializeUserKeys, unlockUserKeysWithRecoveryCode, setKeyVaultUser, lockUserKeys, decryptData, encryptData } from "../utils/e2ee";

// ==========================================
// CONFIGURATION & CONSTANTS
// ==========================================
const REGULAR_TRACKER_LIMIT = 3;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const getEnvVar = (key) => {
  if (typeof import.meta !== "undefined" && import.meta.env?.[`VITE_${key}`]) return import.meta.env[`VITE_${key}`];
  if (typeof process !== "undefined" && process.env?.[`REACT_APP_${key}`]) return process.env[`REACT_APP_${key}`];
  if (typeof process !== "undefined" && process.env[key]) return process.env[key];
  return null;
};

const RAW_BASE_URL = getEnvVar("API_URL") || "https://lv3node.onrender.com";
const BASE_URL = RAW_BASE_URL.replace(/\/$/, "");

const VAPID_PUBLIC_KEY = getEnvVar("VAPID_PUBLIC_KEY") || "BEaflZfmm8QfrFsL7r06HB-QrsdDAefJpRk2vw-zcHIKD-t8evj3TIS7k9k0w0am9BboNqiqbZ99Y-1WxYNcZcw";

const SAMPLE_TRACKER = {
  _id: "sample-001",
  name: "Sample: Daily Water Intake",
  type: "counter",
  color: "#3b82f6",
  icon: "Droplet",
  entries: [],
  isSample: true,
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================
const getAuthHeaders = () => {
  const cookies = new Cookies();
  const token = cookies.get("token") || localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const csvCell = (value) => {
  let text = String(value ?? "");
  // Prevent spreadsheet formula execution when exported data is opened in Excel/Sheets.
  if (/^[\\s\\u0000-\\u001f]*[=+@\\-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const convertTrackersToCSV = (trackersList) => {
  const headers = ["Tracker ID", "Tracker Name", "Type", "Target", "Entry ID", "Timestamp", "Value", "Note"];
  const rows = [];

  trackersList.forEach((tracker) => {
    const entries = Array.isArray(tracker.entries) ? tracker.entries : [];
    const base = [
      tracker._id || tracker.id || "",
      tracker.name || tracker.trackerName || "",
      tracker.type || "",
      tracker.target ?? "",
    ];

    const trackerEntries = entries.length ? entries : [null];
    trackerEntries.forEach((entry) => {
      rows.push([
        ...base,
        entry?._id || entry?.id || "",
        entry?.timestamp || entry?.date || "",
        entry?.value ?? "",
        entry?.note || "",
      ].map(csvCell).join(","));
    });
  });

  return [headers.map(csvCell).join(","), ...rows].join("\r\n");
};

const downloadFile = (content, filename, contentType) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

// Check for active browser push subscription
async function checkExistingSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

// Enable Push Notifications
async function registerServiceWorkerAndSubscribe() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push notifications are not supported by this browser.");
  }
  if (Notification.permission === "denied") {
    throw new Error("Notification permission blocked in browser settings.");
  }

  await navigator.serviceWorker.register("/sw.js");
  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const response = await fetch(`${BASE_URL}/api/v1/subscribe`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(subscription),
  });

  if (!response.ok) {
    await subscription.unsubscribe().catch(() => {});
    throw new Error("Could not save notification preferences. Please try again.");
  }

  return true;
}

// Disable Push Notifications
async function unsubscribeFromPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    try {
      await fetch(`${BASE_URL}/api/v1/unsubscribe`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ endpoint }),
      });
    } catch (e) {
      console.warn("Backend unsubscribe sync failed:", e);
    }
  }
}

const toggleBootstrapModal = (modalId, action = "show") => {
  const modalElement = document.getElementById(modalId);
  if (modalElement && window.bootstrap) {
    const instance = window.bootstrap.Modal.getInstance(modalElement) || new window.bootstrap.Modal(modalElement);
    if (action === "show") instance.show();
    else instance.hide();
  }
};

const safeDecrypt = async (privateKey, value) => {
  if (typeof value !== "string" || !value) return value;

  const isEncrypted = 
    value.startsWith("U2FsdGVkX1") || 
    value.startsWith("enc:") || 
    value.includes(":");

  if (!isEncrypted) return value;

  try {
    const decrypted = await decryptData(privateKey, value);
    return decrypted !== undefined && decrypted !== null ? decrypted : value;
  } catch (err) {
    console.warn("Decryption fallback triggered:", err);
    return value;
  }
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function HomePage() {
  const cookies = new Cookies();
  const token = cookies.get("token") || localStorage.getItem("token");

  const currentUserEmail = (
    localStorage.getItem("userEmail") || 
    cookies.get("userEmail") || 
    ""
  ).toLowerCase().trim();

  // --- STATE ---
  const [trackers, setTrackers] = useState([]);
  const [sampleTrackerState, setSampleTrackerState] = useState(SAMPLE_TRACKER);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState(null);
  const [newlyAddedId, setNewlyAddedId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [keyVaultLocked, setKeyVaultLocked] = useState(false);
  const [keyVaultPassword, setKeyVaultPassword] = useState("");
  const [keyVaultRecoveryCode, setKeyVaultRecoveryCode] = useState("");
  const [keyVaultError, setKeyVaultError] = useState("");
  const [recoveryCodeToSave, setRecoveryCodeToSave] = useState(() => sessionStorage.getItem("unitrack.recoveryCodePending") || "");
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [pendingWrites, setPendingWrites] = useState(() => getPendingTrackerWriteCount());

  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState(null);
  const [currentTime, setCurrentTime] = useState(null);

  const [userLocation, setUserLocation] = useState({
    currency: "NGN",
    amount: 5000, 
    symbol: "₦",
    displayAmount: "5,000"
  });

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  // --- EFFECTS ---
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentTime(Date.now()), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!token) window.location.href = "/login";
  }, [token]);

  const fetchUserSubscriptionStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/user/status`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        let active = Boolean(data.isPremium);
        let expiryTime = null;

        const explicitExpiry = data.expiresAt || data.subscriptionExpiresAt || data.expiryDate;

        if (explicitExpiry) {
          expiryTime = new Date(explicitExpiry).getTime();
        } else if (active) {
          const localPaymentTime = localStorage.getItem("pro_payment_date");
          const startDate = localPaymentTime 
            ? new Date(localPaymentTime) 
            : (data.subscribedAt || data.updatedAt ? new Date(data.subscribedAt || data.updatedAt) : new Date());
          expiryTime = startDate.getTime() + THIRTY_DAYS_MS;
        }

        if (expiryTime && Date.now() >= expiryTime) {
          active = false;
          setSubscriptionExpiry(null);
          localStorage.removeItem("pro_payment_date");
          setNotification("Your 30-day PRO subscription has expired. Reverted to Regular plan.");
          setTimeout(() => setNotification(null), 5000);
        } else if (expiryTime) {
          setSubscriptionExpiry(new Date(expiryTime).toISOString());
        }

        setIsPremium(active);
      }
    } catch (err) {
      console.warn("Could not verify premium status:", err);
    }
  }, []);

  const fetchRegionAndCurrency = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();

      const locationMap = {
        NG: { currency: "NGN", amount: 5000, symbol: "₦", displayAmount: "5,000" },
        GH: { currency: "GHS", amount: 75, symbol: "GH₵", displayAmount: "75" },
        ZA: { currency: "ZAR", amount: 95, symbol: "R", displayAmount: "95" },
        KE: { currency: "KES", amount: 650, symbol: "KSh", displayAmount: "650" }
      };

      setUserLocation(locationMap[data.country_code] || { currency: "USD", amount: 4.99, symbol: "$", displayAmount: "4.99" });
    } catch (err) {
      console.warn("Defaulting to NGN pricing:", err);
    }
  };

  const fetchTrackers = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    
    try {
      setKeyVaultUser(currentUserEmail);
      const { privateKey } = await initializeUserKeys();

      let response = await fetch(`${BASE_URL}/api/v1/trackers`, { headers: getAuthHeaders() });
      if (!response.ok) {
        response = await fetch(`${BASE_URL}/api/trackers`, { headers: getAuthHeaders() });
      }

      const data = await response.json();
      const fetchedArray = Array.isArray(data) ? data : Array.isArray(data.trackers) ? data.trackers : [];

      const decryptedTrackers = await Promise.all(
        fetchedArray.map(async (tracker) => {
          try {
            return {
              ...tracker,
              name: await decryptData(privateKey, tracker.name),
              target: tracker.target !== undefined ? await decryptData(privateKey, tracker.target) : tracker.target,
              entries: tracker.entries !== undefined ? await decryptData(privateKey, tracker.entries) : tracker.entries,
            };
          } catch (decryptErr) {
            console.error("Failed to decrypt tracker:", decryptErr);
            return tracker;
          }
        })
      );

      setTrackers(decryptedTrackers.reverse());
      
      if (isManualRefresh) {
        setNotification("Trackers updated successfully!");
        setTimeout(() => setNotification(null), 2500);
      }
    } catch (error) {
      console.error("Error fetching trackers:", error);
      if (String(error.code || "").startsWith("KEY_VAULT")) setKeyVaultLocked(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    // Defer network-driven state updates until after the effect commits.
    const task = setTimeout(() => {
      fetchTrackers();
      fetchUserSubscriptionStatus();
      fetchRegionAndCurrency();

      // Check current subscription status without auto-subscribing.
      checkExistingSubscription().then((hasSub) => setSubscribed(hasSub));
    }, 0);

    return () => clearTimeout(task);
  }, [token, fetchTrackers, fetchUserSubscriptionStatus]);

  useEffect(() => {
    const updateQueueCount = () => setPendingWrites(getPendingTrackerWriteCount());
    const handleOffline = () => setIsOnline(false);
    const handleOnline = async () => {
      setIsOnline(true);
      try {
        const result = await flushPendingTrackerWrites({ baseUrl: BASE_URL, headers: getAuthHeaders() });
        updateQueueCount();
        if (result.synced > 0) {
          setNotification(`${result.synced} pending update${result.synced === 1 ? "" : "s"} synced.`);
          fetchTrackers();
        }
      } catch (error) {
        console.warn("Pending tracker sync will retry later:", error);
      }
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("unitrack:queue-change", updateQueueCount);
    updateQueueCount();
    if (navigator.onLine) handleOnline();
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("unitrack:queue-change", updateQueueCount);
    };
  }, [fetchTrackers]);

  const handleUnlockKeyVault = async (event) => {
    event.preventDefault();
    setKeyVaultError("");
    try {
      let vault;
      if (keyVaultRecoveryCode.trim()) {
        vault = await unlockUserKeysWithRecoveryCode(keyVaultRecoveryCode.trim(), keyVaultPassword);
      } else {
        vault = await initializeUserKeys(keyVaultPassword);
      }
      if (vault.recoveryCode) {
        sessionStorage.setItem("unitrack.recoveryCodePending", vault.recoveryCode);
        setRecoveryCodeToSave(vault.recoveryCode);
      }
      setKeyVaultLocked(false);
      setKeyVaultPassword("");
      setKeyVaultRecoveryCode("");
      await fetchTrackers();
    } catch (error) {
      setKeyVaultError(error.message || "Could not unlock your private data.");
    }
  };

  const acknowledgeRecoveryCode = () => {
    sessionStorage.removeItem("unitrack.recoveryCodePending");
    setRecoveryCodeToSave("");
  };

  // --- ACTIONS ---
  const handleAlatPayPayment = async () => {
    // The former inline checkout exposed the ALATPay server credential in the browser.
    // Keep upgrades disabled until ALATPay confirms a browser-safe public checkout flow.
    setNotification("PRO checkout is temporarily unavailable while secure payment setup is completed. Your account will only be upgraded after server-side payment verification.");
    setTimeout(() => setNotification(null), 6000);
  };

  // --- NOTIFICATION TOGGLE HANDLER ---
  const handleToggleNotifications = async () => {
    if (!isPremium) {
      toggleBootstrapModal("premiumModal", "show");
      setNotification("Push alerts are a PRO feature. Upgrade to activate!");
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setSubscribing(true);
    try {
      if (subscribed) {
        // Toggle OFF
        await unsubscribeFromPush();
        setSubscribed(false);
        setNotification("Push notification alerts disabled.");
      } else {
        // Toggle ON
        await registerServiceWorkerAndSubscribe();
        setSubscribed(true);
        setNotification("Push notification alerts enabled!");
      }
    } catch (err) {
      setNotification(err.message || "Failed to update notification settings.");
    } finally {
      setSubscribing(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleExportData = async (format = "json") => {
    // Personal data portability is available to every account tier.

    const timestamp = Date.now();

    try {
      const { privateKey } = await initializeUserKeys();

      const decryptedExportTrackers = await Promise.all(
        trackers.map(async (t) => {
          const decryptedName = await safeDecrypt(privateKey, t.name || t.trackerName);
          const decryptedTarget = await safeDecrypt(privateKey, t.target);

          let rawEntries = t.entries;
          if (typeof rawEntries === "string") {
            const decryptedEntriesStr = await safeDecrypt(privateKey, rawEntries);
            try {
              rawEntries = JSON.parse(decryptedEntriesStr);
            } catch {
              rawEntries = decryptedEntriesStr;
            }
          }

          const entriesList = Array.isArray(rawEntries) ? rawEntries : [];
          const decryptedEntries = await Promise.all(
            entriesList.map(async (entry) => {
              if (typeof entry === "string") {
                const decStr = await safeDecrypt(privateKey, entry);
                try { return JSON.parse(decStr); } catch { return decStr; }
              }

              const value = await safeDecrypt(privateKey, entry?.value);
              const note = await safeDecrypt(privateKey, entry?.note);

              return {
                ...entry,
                ...(value !== undefined ? { value } : {}),
                ...(note !== undefined ? { note } : {}),
              };
            })
          );

          return {
            ...t,
            name: decryptedName,
            trackerName: decryptedName,
            target: decryptedTarget,
            entries: decryptedEntries,
          };
        })
      );

      if (format === "json") {
        const jsonContent = JSON.stringify(decryptedExportTrackers, null, 2);
        downloadFile(jsonContent, `unitrack_decrypted_export_${timestamp}.json`, "application/json");
        setNotification("Decrypted data exported as JSON!");
      } else if (format === "csv") {
        const csvContent = convertTrackersToCSV(decryptedExportTrackers);
        downloadFile(csvContent, `unitrack_decrypted_export_${timestamp}.csv`, "text/csv;charset=utf-8;");
        setNotification("Decrypted data exported as CSV!");
      }
    } catch (err) {
      console.error("Export decryption failed:", err);
      setNotification("Failed to decrypt data for export.");
    }

    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogout = async () => {
    try { await fetch(`${BASE_URL}/api/v1/auth/logout`, { method: "POST", headers: getAuthHeaders() }); } catch { /* Local sign-out must still complete. */ }
    lockUserKeys();
    cookies.remove("token", { path: "/" });
    localStorage.removeItem("token");
    localStorage.removeItem("pro_payment_date");
    window.location.href = "/login";
  };

  // --- DATA MODIFICATION HANDLERS ---
  const syncTrackerEntriesWithBackend = async (trackerId, updatedEntries) => {
    try {
      const { publicKey } = await initializeUserKeys();
      const encryptedEntries = await encryptData(publicKey, updatedEntries);
      const result = await syncEncryptedTrackerWrite({
        baseUrl: BASE_URL,
        trackerId,
        encryptedEntries,
        headers: getAuthHeaders(),
      });
      if (result.queued) {
        setNotification("Saved securely on this device. It will sync when you're back online.");
        return;
      }
    } catch (error) {
      console.error("Error syncing entry modification:", error);
      await fetchTrackers(); 
    }
  };

  const handleAddEntry = async (trackerId, entry) => {
    if (trackerId.toString() === SAMPLE_TRACKER._id) {
      const newEntryWithId = { timestamp: new Date().toISOString(), ...entry, _id: Date.now().toString() };
      setSampleTrackerState((prev) => ({ ...prev, entries: [...(prev.entries || []), newEntryWithId] }));
      return;
    }

    let updatedEntries = [];
    setTrackers((prevTrackers) =>
      prevTrackers.map((t) => {
        const tId = t._id?.toString() || t.id?.toString();
        if (tId === trackerId.toString()) {
          const newEntryWithId = { timestamp: new Date().toISOString(), ...entry, _id: Date.now().toString() };
          updatedEntries = [...(t.entries || []), newEntryWithId];
          return { ...t, entries: updatedEntries };
        }
        return t;
      })
    );

    if (updatedEntries.length > 0) {
      await syncTrackerEntriesWithBackend(trackerId, updatedEntries);
    }
  };

  const handleUpdate = async (trackerId, newEntries) => {
    if (trackerId.toString() === SAMPLE_TRACKER._id) {
      setSampleTrackerState((prev) => ({ ...prev, entries: newEntries }));
      return;
    }

    setTrackers((prev) =>
      prev.map((t) => {
        const tId = t._id?.toString() || t.id?.toString();
        return tId === trackerId.toString() ? { ...t, entries: newEntries } : t;
      })
    );

    await syncTrackerEntriesWithBackend(trackerId, newEntries);
  };

  const handleDeleteEntry = async (trackerId, entryId) => {
    if (trackerId.toString() === SAMPLE_TRACKER._id) {
      setSampleTrackerState((prev) => ({
        ...prev,
        entries: (prev.entries || []).filter((e) => (e._id || e.id)?.toString() !== entryId.toString()),
      }));
      return;
    }

    let updatedEntries = [];
    setTrackers((prevTrackers) =>
      prevTrackers.map((t) => {
        const tId = t._id?.toString() || t.id?.toString();
        if (tId === trackerId.toString()) {
          updatedEntries = (t.entries || []).filter((e) => (e._id || e.id)?.toString() !== entryId.toString());
          return { ...t, entries: updatedEntries };
        }
        return t;
      })
    );

    await syncTrackerEntriesWithBackend(trackerId, updatedEntries);
  };

  const handleArchiveTracker = async (trackerId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/trackers/${trackerId}/archive`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Could not archive tracker.");
      await fetchTrackers();
      setNotification("Tracker archived. You can restore it anytime from Archive & trash.");
    } catch (error) {
      setNotification(error.message || "Could not archive tracker.");
    }
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDeleteTracker = async (trackerId) => {
    if (trackerId === SAMPLE_TRACKER._id) return;

    try {
      let response = await fetch(`${BASE_URL}/api/v1/trackers/${trackerId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.status === 404) {
        response = await fetch(`${BASE_URL}/api/trackers/${trackerId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
      }

      if (!response.ok) throw new Error("Failed to delete tracker.");

      await fetchTrackers();
      setNotification("Tracker moved to recently deleted. You can restore it from Archive & trash.");
      setTimeout(() => setNotification(null), 2500);
    } catch (error) {
      console.error("Error deleting tracker:", error);
      alert("Failed to delete tracker.");
    }
  };

  const handleCreate = async (newTracker) => {
    if (!isPremium && trackers.length >= REGULAR_TRACKER_LIMIT) {
      toggleBootstrapModal("trackerModal", "hide");
      toggleBootstrapModal("premiumModal", "show");
      setNotification(`Limit reached (${REGULAR_TRACKER_LIMIT} trackers). Upgrade to PRO for unlimited access!`);
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    await fetchTrackers();

    const newId = newTracker?._id || newTracker?.id;
    if (newId) {
      setNewlyAddedId(newId);
    }
    setNotification("Tracker created successfully!");

    if (newId) {
      setTimeout(() => setNewlyAddedId((current) => (current === newId ? null : current)), 2500);
    }
    setTimeout(() => setNotification(null), 3000);
  };

  if (!token) return null;

  if (loading) {
    return (
      <div 
        className={`min-vh-100 d-flex flex-column align-items-center justify-content-center ${darkMode ? "bg-dark text-light" : "bg-light text-dark"}`} 
        data-bs-theme={darkMode ? "dark" : "light"}
      >
        <div className="d-flex align-items-center gap-2 mb-3">
          <LayoutDashboard className="text-primary" size={36} />
          <h2 className="fw-bold m-0 fs-3 tracking-wide">UNI-TRACK</h2>
        </div>
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: "2.5rem", height: "2.5rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted small m-0 fw-medium">Securing and decrypting workspace...</p>
      </div>
    );
  }

  if (keyVaultLocked) {
    return (
      <main className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3 py-5">
        <section className="card border-0 shadow-sm rounded-4 p-4 p-md-5 w-100" style={{ maxWidth: 520 }}>
          <div className="d-inline-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary p-3 mb-3" style={{ width: 52, height: 52 }}><Lock size={23} /></div>
          <h1 className="h3 fw-bold mb-2">Unlock your private workspace</h1>
          <p className="text-secondary small">Your tracker private key is protected on this device. Enter your account password to unlock it. If you recently reset your password, use your recovery code and the new password.</p>
          {keyVaultError && <div className="alert alert-danger small" role="alert">{keyVaultError}</div>}
          <form onSubmit={handleUnlockKeyVault} className="d-grid gap-3">
            <div>
              <label htmlFor="vault-password" className="form-label small fw-semibold">Account password</label>
              <input id="vault-password" type="password" autoComplete="current-password" className="form-control" value={keyVaultPassword} onChange={(e) => setKeyVaultPassword(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="vault-recovery" className="form-label small fw-semibold">Recovery code (optional)</label>
              <textarea id="vault-recovery" className="form-control" rows={2} value={keyVaultRecoveryCode} onChange={(e) => setKeyVaultRecoveryCode(e.target.value)} placeholder="Paste your saved recovery code if your password changed" />
            </div>
            <button className="btn btn-primary py-2" type="submit" disabled={!keyVaultPassword}>Unlock private data</button>
          </form>
          <p className="text-muted small mt-3 mb-0">Your password and recovery code are used locally to unlock the private key. They are not sent to the tracker API by this unlock form.</p>
          <button type="button" className="btn btn-link btn-sm mt-3" onClick={handleLogout}>Sign out</button>
        </section>
      </main>
    );
  }

  const hasTrackers = trackers.length > 0;
  const filteredTrackers = typeFilter ? trackers.filter((t) => t.type === typeFilter) : trackers;
  const displayTrackers = hasTrackers ? filteredTrackers : [sampleTrackerState];

  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? "Good Morning ☀️" : currentHour < 18 ? "Good Afternoon 🌤️" : "Good Evening 🌙";
  const usedTrackersCount = trackers.length;
  const trackerUsagePercent = Math.min(100, Math.round((usedTrackersCount / REGULAR_TRACKER_LIMIT) * 100));

  const formattedExpiryDate = subscriptionExpiry 
    ? new Date(subscriptionExpiry).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const daysRemaining = subscriptionExpiry && currentTime !== null
    ? Math.max(0, Math.ceil((new Date(subscriptionExpiry).getTime() - currentTime) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div 
      className={`min-vh-100 position-relative ${darkMode ? "bg-dark text-light" : "bg-light text-dark"}`} 
      data-bs-theme={darkMode ? "dark" : "light"}
      style={{ transition: "background-color 0.25s ease" }}
    >
      <style>{`
        .btn-custom-nav {
          font-weight: 600;
          letter-spacing: 0.01em;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.85rem;
          font-size: 0.85rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease-in-out;
        }

        .btn-custom-nav:hover {
          transform: translateY(-1px);
        }

        .btn-pro-upgrade {
          background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
          color: #000000 !important;
          border: 1px solid #fde047;
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
          font-weight: 700;
        }

        .btn-pro-upgrade:hover {
          background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
          color: #000000 !important;
          box-shadow: 0 0 18px rgba(245, 158, 11, 0.7);
          transform: translateY(-1px);
        }

        .btn-pro-active {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24 !important;
          border: 1px solid #f59e0b;
        }

        .btn-alat {
          background-color: #820263;
          color: #ffffff !important;
          transition: all 0.2s ease;
        }

        .btn-alat:hover {
          background-color: #67014f;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(130, 2, 99, 0.3);
        }

        .glass-card {
          border-radius: 1rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .animated-toast {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .support-fab {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 1020;
          box-shadow: 0 4px 14px rgba(0,0,0,0.25);
          border-radius: 50rem;
        }

        @keyframes slideDown {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>

      {/* Floating Notification */}
      {notification && (
        <div className="position-fixed top-0 start-50 translate-middle-x p-3 animated-toast" style={{ zIndex: 1080 }}>
          <div className="alert alert-primary border-0 shadow-lg d-flex align-items-center gap-2 mb-0 py-2.5 px-4 rounded-pill text-white bg-primary">
            <CheckCircle2 size={18} />
            <span className="small fw-semibold">{notification}</span>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className={`navbar border-bottom sticky-top backdrop-blur py-2.5 ${darkMode ? "bg-dark bg-opacity-75 border-secondary" : "bg-white bg-opacity-75"}`}>
        <div className="container d-flex align-items-center justify-content-between flex-wrap gap-2">
          
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-primary bg-opacity-10 rounded-3 text-primary d-flex align-items-center justify-content-center">
              <LayoutDashboard size={20} />
            </div>
            <h1 className="navbar-brand fw-bold m-0 fs-5 tracking-tight d-flex align-items-center gap-2">
              UNI-TRACK
              <span className={`badge ${isPremium ? "bg-warning text-dark" : "bg-secondary text-light"} d-inline-flex align-items-center gap-1 fs-7 fw-semibold`}>
                {isPremium && <Crown size={12} />}
                {isPremium ? "PRO" : "REGULAR"}
              </span>
            </h1>
          </div>

          <div className="d-flex align-items-center flex-wrap gap-2">
            <button
              type="button"
              className={`btn ${darkMode ? "btn-outline-light" : "btn-outline-secondary"} btn-custom-nav`}
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle theme"
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
              <span className="d-none d-sm-inline">{darkMode ? "Light" : "Dark"}</span>
            </button>

            {/* TOGGLE NOTIFICATION BUTTON */}
            <button
              type="button"
              className={`btn ${subscribed ? "btn-outline-success" : "btn-outline-primary"} btn-custom-nav`}
              onClick={handleToggleNotifications}
              disabled={subscribing}
              title={subscribed ? "Click to disable alerts" : "Click to enable alerts"}
            >
              {!isPremium ? (
                <Lock size={15} className="text-muted" />
              ) : (
                <Bell size={15} className={subscribed ? "text-success" : ""} />
              )}
              <span>
                {subscribing 
                  ? (subscribed ? "Disabling..." : "Enabling...") 
                  : (subscribed ? "Alerts Active" : "Enable Alerts")}
              </span>
            </button>

            <button
              type="button"
              className={`btn ${isPremium ? "btn-pro-active" : "btn-pro-upgrade"} btn-custom-nav`}
              onClick={() => toggleBootstrapModal("premiumModal", "show")}
            >
              <Crown size={15} />
              <span>{isPremium ? "PRO Active" : "Upgrade PRO"}</span>
            </button>

            <a href="/settings" className={`btn ${darkMode ? "btn-outline-light" : "btn-outline-secondary"} btn-custom-nav text-decoration-none`} aria-label="Privacy and security settings">
              <ShieldCheck size={15} />
              <span className="d-none d-sm-inline">Security</span>
            </a>

            <button
              type="button"
              className="btn btn-outline-danger btn-custom-nav"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>

        </div>
      </nav>

      {/* Main Workspace */}
      {recoveryCodeToSave && (
        <div className="container pt-3">
          <div className="alert alert-warning border-warning-subtle rounded-4" role="alert">
            <h2 className="h6 fw-bold">Save your private-data recovery code</h2>
            <p className="small mb-2">This code can recover your encrypted trackers if you change or reset your password. It is shown once here. Store it somewhere safe and separate from this device.</p>
            <code className="d-block bg-white text-dark rounded-3 p-3 text-break user-select-all">{recoveryCodeToSave}</code>
            <button type="button" className="btn btn-sm btn-dark mt-3" onClick={acknowledgeRecoveryCode}>I've saved my recovery code</button>
          </div>
        </div>
      )}
      <main className="container py-4">
        {!isOnline && (
          <div className="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3" role="status">
            <span><strong>You're offline.</strong> Your current workspace remains open; new progress is queued locally until connection returns.</span>
            {pendingWrites > 0 && <span className="badge text-bg-dark">{pendingWrites} pending sync</span>}
          </div>
        )}
        {isOnline && pendingWrites > 0 && (
          <div className="alert alert-info d-flex align-items-center justify-content-between gap-2 mb-3" role="status">
            <span>{pendingWrites} encrypted update{pendingWrites === 1 ? "" : "s"} waiting to sync.</span>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={async () => { const result = await flushPendingTrackerWrites({ baseUrl: BASE_URL, headers: getAuthHeaders() }); setPendingWrites(result.pending); if (result.synced) fetchTrackers(); }}>Sync now</button>
          </div>
        )}

        
        {/* Welcome Banner */}
        <div className={`p-4 p-md-5 glass-card shadow-sm border mb-4 position-relative overflow-hidden ${darkMode ? "bg-dark border-secondary" : "bg-white"}`}>
          <div className="position-absolute top-0 end-0 p-4 opacity-10 d-none d-md-block text-primary">
            <Sparkles size={160} />
          </div>

          <div className="position-relative" style={{ zIndex: 1 }}>
            <span className="badge bg-primary bg-opacity-10 text-primary mb-2 px-3 py-1.5 rounded-pill fw-semibold small">
              {timeGreeting}
            </span>
            <h2 className="fw-bold mb-2 fs-3">Welcome back to Uni-Track!</h2>
            <p className="text-muted mb-0">
              Connected account: <strong>{currentUserEmail || "Active Guest"}</strong>
            </p>
          </div>
        </div>

        {/* Analytics Visualizer */}
        <div className={`p-3 p-md-4 glass-card shadow-sm border ${darkMode ? "bg-dark border-secondary" : "bg-white"}`}>
          <TrackerDashboard trackers={displayTrackers} darkMode={darkMode} />
        </div>

        {/* Controls & Trackers */}
        <div className={`p-3 p-md-4 glass-card shadow-sm border mt-4 ${darkMode ? "bg-dark border-secondary" : "bg-white"}`}>
          
          <div className={`alert ${darkMode ? "bg-dark text-info border-info" : "bg-info bg-opacity-10 text-info border-info-subtle"} d-flex align-items-center gap-2 mb-4 py-2 px-3 rounded-3 small border`}>
            <Info size={18} className="flex-shrink-0" />
            <span>Changes sync with your account. Tap <strong>Refresh</strong> to reload your tracker data.</span>
          </div>

          {/* Tracker Limit Indicator */}
          {!isPremium && (
            <div className={`p-3 rounded-3 border mb-4 ${darkMode ? "bg-secondary bg-opacity-10 border-secondary" : "bg-light border-border"}`}>
              <div className="d-flex justify-content-between align-items-center mb-1.5 small fw-semibold">
                <span className={darkMode ? "text-light-50" : "text-dark"}>Tracker Limit Capacity</span>
                <span className={`badge ${trackerUsagePercent >= 100 ? "bg-danger" : "bg-primary"}`}>
                  {usedTrackersCount} / {REGULAR_TRACKER_LIMIT} Trackers
                </span>
              </div>
              
              <div className={`progress ${darkMode ? "bg-dark" : "bg-secondary bg-opacity-25"}`} style={{ height: "8px" }}>
                <div 
                  className={`progress-bar ${trackerUsagePercent >= 100 ? "bg-danger" : "bg-primary"}`} 
                  role="progressbar" 
                  style={{ width: `${trackerUsagePercent}%` }} 
                />
              </div>
              
              <div className="d-flex justify-content-between align-items-center mt-2">
                <span className={`small ${darkMode ? "text-white-50" : "text-muted"}`} style={{ fontSize: "0.75rem" }}>
                  {trackerUsagePercent >= 100 ? "Free tier limit reached." : `${REGULAR_TRACKER_LIMIT - usedTrackersCount} remaining on free plan.`}
                </span>
                <button 
                  type="button" 
                  className="btn btn-link p-0 text-decoration-none small text-warning fw-semibold"
                  style={{ fontSize: "0.75rem" }}
                  onClick={() => toggleBootstrapModal("premiumModal", "show")}
                >
                  Unlock Unlimited →
                </button>
              </div>
            </div>
          )}

          <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between gap-3 mb-3">
            <div className="flex-grow-1 overflow-auto">
              <TrackerFilters typeFilter={typeFilter} onTypeFilterChange={setTypeFilter} darkMode={darkMode} />
            </div>
            
            <div className="d-flex align-items-center flex-wrap gap-2 flex-shrink-0">
              <button
                type="button"
                className="btn btn-primary btn-custom-nav shadow-sm"
                onClick={() => {
                  if (!isPremium && trackers.length >= REGULAR_TRACKER_LIMIT) {
                    toggleBootstrapModal("premiumModal", "show");
                    setNotification(`Regular plan is capped at ${REGULAR_TRACKER_LIMIT} trackers.`);
                    setTimeout(() => setNotification(null), 4000);
                  } else {
                    toggleBootstrapModal("trackerModal", "show");
                  }
                }}
              >
                <PlusCircle size={16} />
                <span>New Tracker</span>
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-custom-nav dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {isPremium ? <Download size={16} /> : <Lock size={16} className="text-muted" />}
                  <span>Export Data</span>
                </button>
                
                <ul className={`dropdown-menu shadow-sm ${darkMode ? "dropdown-menu-dark" : ""}`}>
                  <li>
                    <button 
                      type="button" 
                      className="dropdown-item d-flex align-items-center gap-2 small fw-semibold"
                      onClick={() => handleExportData("json")}
                    >
                      <Download size={14} className="text-primary" />
                      <span>Download JSON</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      className="dropdown-item d-flex align-items-center gap-2 small fw-semibold"
                      onClick={() => handleExportData("csv")}
                    >
                      <Download size={14} className="text-success" />
                      <span>Download CSV</span>
                    </button>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                className={`btn ${darkMode ? "btn-outline-light" : "btn-outline-secondary"} btn-custom-nav`}
                onClick={() => fetchTrackers(true)}
                disabled={refreshing}
              >
                <RefreshCw size={16} className={refreshing ? "spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <hr className="my-4 opacity-25" />

          {/* Tracker List */}
          <TrackerList
            trackers={displayTrackers}
            onDeleteTracker={handleDeleteTracker}
            onArchiveTracker={handleArchiveTracker}
            onAddEntry={handleAddEntry}
            onUpdate={handleUpdate}
            onDeleteEntry={handleDeleteEntry}
            newlyAddedId={newlyAddedId}
            darkMode={darkMode}
          />

          {!hasTrackers && (
            <div className="mt-4 p-3 bg-info bg-opacity-10 rounded-3 text-info small text-center border border-info border-opacity-25">
              💡 Viewing sample tracker. Create your first custom tracker above to get started!
            </div>
          )}

        </div>

        <WorkspacePanels baseUrl={BASE_URL} darkMode={darkMode} onRefresh={fetchTrackers} />
      </main>

      {/* Floating Support Button */}
      <button
        type="button"
        className="btn btn-primary p-3 support-fab d-flex align-items-center gap-2"
        onClick={() => toggleBootstrapModal("supportModal", "show")}
        title="Customer Support"
      >
        <Headphones size={22} />
      </button>

      {/* MODAL: CREATE TRACKER */}
      <div className="modal fade" id="trackerModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className={`modal-content border-0 shadow-lg ${darkMode ? "bg-dark text-light border-secondary" : ""}`}>
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold">Create New Tracker</h5>
              <button type="button" className={`btn-close ${darkMode ? "btn-close-white" : ""}`} data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body">
              <TrackerForm
                onCreate={handleCreate}
                onClose={() => toggleBootstrapModal("trackerModal", "hide")}
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CUSTOMER SUPPORT */}
      <div className="modal fade" id="supportModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className={`modal-content border-0 shadow-lg ${darkMode ? "bg-dark text-light border-secondary" : ""}`}>
            
            <div className="modal-header border-0 pb-0">
              <div className="d-flex align-items-center gap-2">
                <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3">
                  <Headphones size={20} />
                </div>
                <h5 className="modal-title fw-bold">Customer Support</h5>
              </div>
              <button type="button" className={`btn-close ${darkMode ? "btn-close-white" : ""}`} data-bs-dismiss="modal" aria-label="Close" />
            </div>

            <div className="modal-body pt-3 pb-4">
              <p className="text-muted small mb-4">
                Need assistance or have feedback? Reach out directly via WhatsApp or Email below:
              </p>

              <div className="d-grid gap-3">
                <a 
                  href="https://wa.me/2347039237610?text=Hello%2C%20I%20need%20support%20with%20Uni-Track." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-success fw-semibold d-flex align-items-center justify-content-center gap-2 py-2.5"
                >
                  <MessageCircle size={18} />
                  <span>Chat on WhatsApp (+234 703 923 7610)</span>
                </a>

                <a 
                  href="mailto:unitrack271@gmail.com?subject=Uni-Track%20Support%20Inquiry" 
                  className={`btn ${darkMode ? "btn-outline-light" : "btn-outline-secondary"} fw-semibold d-flex align-items-center justify-content-center gap-2 py-2.5`}
                >
                  <Mail size={18} />
                  <span>Email unitrack271@gmail.com</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MODAL: PRO STATUS / UPGRADE */}
      <div className="modal fade" id="premiumModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className={`modal-content border-0 shadow-lg ${darkMode ? "bg-dark text-light border-secondary" : ""}`}>
            
            <div className="modal-header border-0 pb-0">
              <button type="button" className={`btn-close ${darkMode ? "btn-close-white" : ""}`} data-bs-dismiss="modal" aria-label="Close" />
            </div>

            <div className="modal-body text-center pt-0 px-4 pb-4">
              {isPremium ? (
                <>
                  <div className="d-inline-flex p-3 bg-warning bg-opacity-10 text-warning rounded-circle mb-3">
                    <Crown size={38} />
                  </div>

                  <h4 className="fw-bold mb-1">PRO Membership Active</h4>
                  <p className="text-muted small mb-4">
                    You have active 30-day access to all <strong>Uni-Track PRO</strong> capabilities.
                  </p>

                  <div className={`p-3 rounded-3 text-start mb-4 ${darkMode ? "bg-secondary bg-opacity-10 border border-secondary" : "bg-light border"}`}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="small text-muted fw-semibold d-flex align-items-center gap-1.5">
                        <ShieldCheck size={16} className="text-success" /> Account Plan
                      </span>
                      <span className="badge bg-success text-white px-2.5 py-1 fs-7">Active PRO</span>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="small text-muted fw-semibold d-flex align-items-center gap-1.5">
                        <Calendar size={16} className="text-primary" /> Expires On
                      </span>
                      <span className="small fw-bold text-primary">
                        {formattedExpiryDate || "30 Days from Activation"}
                      </span>
                    </div>

                    {daysRemaining !== null && (
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="small text-muted fw-semibold d-flex align-items-center gap-1.5">
                          <Clock size={16} className="text-warning" /> Time Remaining
                        </span>
                        <span className="badge bg-warning text-dark fw-bold px-2 py-0.5 fs-7">
                          {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={`p-3 rounded-3 text-start mb-4 ${darkMode ? "bg-dark border border-secondary" : "bg-white border"}`}>
                    <div className="d-flex align-items-center gap-2 mb-2 small fw-semibold">
                      <Check size={16} className="text-success" />
                      <span>Unlimited Custom Trackers</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 mb-2 small fw-semibold">
                      <Check size={16} className="text-success" />
                      <span>Push Notification Reminders</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 mb-2 small fw-semibold">
                      <Check size={16} className="text-success" />
                      <span>Full Analytics Export (JSON / CSV)</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 small fw-semibold">
                      <Check size={16} className="text-success" />
                      <span>Priority Support & enhanced account tools</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`btn ${darkMode ? "btn-outline-light" : "btn-secondary"} w-100 py-2.5 fw-bold rounded-3`}
                    data-bs-dismiss="modal"
                  >
                    Got it!
                  </button>
                </>
              ) : (
                <>
                  <div className="d-inline-flex p-3 bg-warning bg-opacity-10 text-warning rounded-circle mb-3">
                    <Crown size={36} />
                  </div>

                  <h4 className="fw-bold mb-2">Upgrade to Uni-Track PRO</h4>
                  <p className="text-muted small mb-4">
                    Unlock full platform capabilities, eliminate limits, and get real-time tracking power for 30 days.
                  </p>

                  <div className={`p-3 rounded-3 text-start mb-4 ${darkMode ? "bg-secondary bg-opacity-10 border border-secondary" : "bg-light"}`}>
                    <div className="d-flex align-items-center gap-2 mb-2 small fw-semibold">
                      <Check size={16} className="text-success" />
                      <span>Unlimited Custom Trackers</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 mb-2 small fw-semibold">
                      <Check size={16} className="text-success" />
                      <span>Push Notification Reminders</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 mb-2 small fw-semibold">
                      <Check size={16} className="text-success" />
                      <span>Full Analytics Export (JSON / CSV)</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 small fw-semibold">
                      <Check size={16} className="text-success" />
                      <span>Priority Support & enhanced account tools</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="display-6 fw-bold">{userLocation.symbol}{userLocation.displayAmount}</span>
                    <span className="text-muted small"> /30 days · temporarily unavailable</span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-alat w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 rounded-3"
                    onClick={handleAlatPayPayment}
                    disabled={true}
                    aria-label="Secure payment checkout temporarily unavailable"
                  >
                    <CreditCard size={18} />
                    <span>Payments temporarily unavailable</span>
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}