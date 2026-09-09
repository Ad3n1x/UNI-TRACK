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
import { initializeUserKeys, decryptData, encryptData } from "../utils/e2ee";

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

const ALAT_BUSINESS_ID = getEnvVar("ALAT_BUSINESS_ID") || "178c0abe-bbe3-4476-8551-08df0a792d7c";
const ALAT_API_KEY = getEnvVar("ALAT_API_KEY") || "8865add026cb44d4adf352f3fbfe260c";
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

const convertTrackersToCSV = (trackersList) => {
  const headers = ["Tracker ID", "Tracker Name", "Type", "Entry ID", "Timestamp", "Value", "Note"];
  const rows = [];

  trackersList.forEach((t) => {
    const trackerId = t._id || t.id || "";
    const trackerName = (t.name || "").replace(/"/g, '""');
    const trackerType = t.type || "";
    const entries = Array.isArray(t.entries) ? t.entries : [];

    if (entries.length === 0) {
      rows.push([
        `"${trackerId}"`,
        `"${trackerName}"`,
        `"${trackerType}"`,
        '""', '""', '""', '""'
      ].join(","));
    } else {
      entries.forEach((e) => {
        const entryId = e._id || e.id || "";
        const timestamp = e.timestamp || "";
        const value = e.value !== undefined ? String(e.value).replace(/"/g, '""') : "";
        const note = (e.note || "").replace(/"/g, '""');

        rows.push([
          `"${trackerId}"`,
          `"${trackerName}"`,
          `"${trackerType}"`,
          `"${entryId}"`,
          `"${timestamp}"`,
          `"${value}"`,
          `"${note}"`
        ].join(","));
      });
    }
  });

  return [headers.join(","), ...rows].join("\n");
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

  await fetch(`${BASE_URL}/api/v1/subscribe`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(subscription),
  });

  return true;
}

const toggleBootstrapModal = (modalId, action = "show") => {
  const modalElement = document.getElementById(modalId);
  if (modalElement && window.bootstrap) {
    const instance = window.bootstrap.Modal.getInstance(modalElement) || new window.bootstrap.Modal(modalElement);
    if (action === "show") instance.show();
    else instance.hide();
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

  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState(null);
  const [upgrading, setUpgrading] = useState(false);

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
    if (!token) window.location.href = "/login";
  }, [token]);

  // Fetch subscription status & enforce 30-day auto-downgrade logic
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchTrackers();
      fetchUserSubscriptionStatus();
      fetchRegionAndCurrency();

      registerServiceWorkerAndSubscribe()
        .then(() => setSubscribed(true))
        .catch(() => setSubscribed(false));
    }
  }, [token, fetchTrackers, fetchUserSubscriptionStatus]);

  // --- ACTIONS ---
  const handleAlatPayPayment = async () => {
    if (!currentUserEmail) {
      alert("No logged-in user email detected. Please log in again.");
      return;
    }

    const AlatPopup = window.Popup || window.AlatPay || window.Alatpay;
    if (!AlatPopup) {
      alert("Unable to reach ALAT Pay gateway. Please refresh and try again.");
      return;
    }

    setUpgrading(true);

    try {
      const numericAmount = Number(userLocation.amount);
      const clientReference = `UT_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      let activeRef = clientReference;

      try {
        const res = await fetch(`${BASE_URL}/api/v1/alatpay/initialize`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ amount: numericAmount, reference: clientReference }),
        });
        if (res.ok) {
          const initResponse = await res.json();
          activeRef = initResponse?.data?.reference || clientReference;
        }
      } catch (e) {
        console.warn("Backend initialization fallback:", e.message);
      }

      const paymentOptions = {
        apiKey: ALAT_API_KEY,
        businessId: ALAT_BUSINESS_ID,
        email: currentUserEmail,
        amount: numericAmount,
        currency: userLocation.currency,
        reference: activeRef,
        onSuccess: async (response) => {
          try {
            const confirmedRef = response?.reference || activeRef;
            const verifyRes = await fetch(`${BASE_URL}/api/v1/alatpay/verify/${confirmedRef}`, {
              method: "GET",
              headers: getAuthHeaders(),
            });

            const now = new Date();
            const calculated30DayExpiry = new Date(now.getTime() + THIRTY_DAYS_MS).toISOString();

            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();
              setSubscriptionExpiry(verifyData.expiresAt || verifyData.subscriptionExpiresAt || calculated30DayExpiry);
            } else {
              setSubscriptionExpiry(calculated30DayExpiry);
            }

            localStorage.setItem("pro_payment_date", now.toISOString());
            setIsPremium(true);
            setNotification("Upgrade successful! Welcome to PRO (30-Day Access).");
            toggleBootstrapModal("premiumModal", "hide");
          } catch (err) {
            console.error("ALAT Pay verification error:", err);
            alert("Payment completed, but server verification failed.");
          } finally {
            setUpgrading(false);
            setTimeout(() => setNotification(null), 4000);
          }
        },
        onClose: () => setUpgrading(false),
      };

      if (typeof AlatPopup.setup === "function") {
        AlatPopup.setup(paymentOptions)?.show?.();
      } else {
        new AlatPopup(paymentOptions)?.show?.();
      }
    } catch (err) {
      console.error("ALAT Pay Error:", err);
      alert(err.message || "Failed to initialize ALAT Pay.");
      setUpgrading(false);
    }
  };

  const handleSubscribeNotifications = async () => {
    if (!isPremium) {
      toggleBootstrapModal("premiumModal", "show");
      setNotification("Push alerts are a PRO feature. Upgrade to activate!");
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setSubscribing(true);
    try {
      await registerServiceWorkerAndSubscribe();
      setSubscribed(true);
      setNotification("Push notification alerts enabled!");
    } catch (err) {
      setNotification(err.message || "Failed to enable notifications.");
    } finally {
      setSubscribing(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleExportData = (format = "json") => {
    if (!isPremium) {
      toggleBootstrapModal("premiumModal", "show");
      setNotification("Data export is available exclusively for PRO users.");
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    const timestamp = Date.now();

    if (format === "json") {
      const jsonContent = JSON.stringify(trackers, null, 2);
      downloadFile(jsonContent, `unitrack_export_${timestamp}.json`, "application/json");
      setNotification("Trackers exported as JSON!");
    } else if (format === "csv") {
      const csvContent = convertTrackersToCSV(trackers);
      downloadFile(csvContent, `unitrack_export_${timestamp}.csv`, "text/csv;charset=utf-8;");
      setNotification("Trackers exported as CSV!");
    }

    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogout = () => {
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

      let response = await fetch(`${BASE_URL}/api/v1/trackers/${trackerId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ entries: encryptedEntries }),
      });

      if (response.status === 404) {
        response = await fetch(`${BASE_URL}/api/trackers/${trackerId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ entries: encryptedEntries }),
        });
      }

      if (!response.ok) throw new Error("Failed to sync entries.");
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
      setNotification("Tracker deleted successfully!");
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

  // --- LOADING SCREEN ---
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

  // --- DERIVED UI VARS ---
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

  const daysRemaining = subscriptionExpiry
    ? Math.max(0, Math.ceil((new Date(subscriptionExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
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

            <button
              type="button"
              className={`btn ${subscribed ? "btn-outline-success" : "btn-outline-primary"} btn-custom-nav`}
              onClick={handleSubscribeNotifications}
              disabled={subscribing}
            >
              {!isPremium ? <Lock size={15} className="text-muted" /> : <Bell size={15} />}
              <span>{subscribing ? "Enabling..." : subscribed ? "Alerts Active" : "Enable Alerts"}</span>
            </button>

            <button
              type="button"
              className={`btn ${isPremium ? "btn-pro-active" : "btn-pro-upgrade"} btn-custom-nav`}
              onClick={() => toggleBootstrapModal("premiumModal", "show")}
            >
              <Crown size={15} />
              <span>{isPremium ? "PRO Active" : "Upgrade PRO"}</span>
            </button>

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
      <main className="container py-4">
        
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
            <span>Changes sync automatically end-to-end. Tap <strong>Refresh</strong> to sync analytics manually.</span>
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

              {/* Download Format Selection Dropdown */}
              <div className="dropdown">
                <button
                  type="button"
                  className={`btn ${isPremium ? "btn-outline-success" : "btn-outline-secondary"} btn-custom-nav dropdown-toggle`}
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
                      <span>Priority Support & E2EE Cloud Backups</span>
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
                      <span>Priority Support & E2EE Cloud Backups</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="display-6 fw-bold">{userLocation.symbol}{userLocation.displayAmount}</span>
                    <span className="text-muted small"> /30 days</span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-alat w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 rounded-3"
                    onClick={handleAlatPayPayment}
                    disabled={upgrading}
                  >
                    <CreditCard size={18} />
                    <span>{upgrading ? "Processing Payment..." : `Pay with ALAT Pay (${userLocation.currency})`}</span>
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