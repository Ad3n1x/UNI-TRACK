import React, { useState, useEffect, useCallback } from "react";
import TrackerDashboard from "../components/trackers/TrackerDashboard";
import TrackerForm from "../components/trackers/TrackerForm";
import TrackerList from "../components/trackers/TrackerList";
import TrackerFilters from "../components/trackers/TrackerFilters";
import { 
  PlusCircle, LayoutDashboard, CheckCircle2, LogOut, 
  Sun, Moon, RefreshCw, Info, Bell, Crown, Sparkles, Check, Globe, ShieldAlert 
} from "lucide-react";
import Cookies from "universal-cookie";
import { initializeUserKeys, decryptData, encryptData } from "../utils/e2ee";

const RAW_BASE_URL =
  (typeof process !== "undefined" && process.env?.API_URL) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "https://lv3node.onrender.com";

const BASE_URL = RAW_BASE_URL.replace(/\/$/, "");

// Environment Variables (Fallback to test defaults only if env is missing)
const PAYSTACK_PUBLIC_KEY = 
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_PAYSTACK_PUBLIC_KEY) ||
  process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || 
  "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

const VAPID_PUBLIC_KEY = 
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_VAPID_PUBLIC_KEY) ||
  process.env.REACT_APP_VAPID_PUBLIC_KEY || 
  "BEaflZfmm8QfrFsL7r06HB-QrsdDAefJpRk2vw-zcHIKD-t8evj3TIS7k9k0w0am9BboNqiqbZ99Y-1WxYNcZcw";

const SAMPLE_TRACKER = {
  _id: "sample-001",
  name: "Sample: Daily Water Intake",
  type: "counter",
  color: "#3b82f6",
  icon: "Droplet",
  entries: [],
  isSample: true,
};

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

async function registerServiceWorkerAndSubscribe() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push notifications are not supported by this browser.");
  }

  if (Notification.permission === "denied") {
    throw new Error("Notification permission blocked in browser settings.");
  }

  try {
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
  } catch (err) {
    console.error("Failed to register push notifications:", err);
    throw err;
  }
}

export default function HomePage() {
  const cookies = new Cookies();
  const token = cookies.get("token") || localStorage.getItem("token");

  // Get active logged in user email
  const currentUserEmail = (
    localStorage.getItem("userEmail") || 
    cookies.get("userEmail") || 
    ""
  ).toLowerCase().trim();

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
  const [upgrading, setUpgrading] = useState(false);
  
  const [userLocation, setUserLocation] = useState({
    currency: "USD",
    amount: 499, 
    symbol: "$",
    displayAmount: "4.99"
  });

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Auth Guard Redirect
  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
    }
  }, [token]);

  // Fetch User Subscription Status from Backend
  const fetchUserSubscriptionStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/user/status`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setIsPremium(Boolean(data.isPremium));
      }
    } catch (err) {
      console.warn("Could not verify premium status from server:", err);
    }
  }, []);

  const fetchRegionAndCurrency = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();

      switch (data.country_code) {
        case "NG":
          setUserLocation({ currency: "NGN", amount: 500000, symbol: "₦", displayAmount: "5,000" });
          break;
        case "GH":
          setUserLocation({ currency: "GHS", amount: 7500, symbol: "GH₵", displayAmount: "75" });
          break;
        case "ZA":
          setUserLocation({ currency: "ZAR", amount: 9500, symbol: "R", displayAmount: "95" });
          break;
        case "KE":
          setUserLocation({ currency: "KES", amount: 65000, symbol: "KSh", displayAmount: "650" });
          break;
        default:
          setUserLocation({ currency: "USD", amount: 499, symbol: "$", displayAmount: "4.99" });
          break;
      }
    } catch (err) {
      console.warn("Could not determine region currency, defaulting to USD:", err);
    }
  };

  const fetchTrackers = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const { privateKey } = await initializeUserKeys();

      let response = await fetch(`${BASE_URL}/api/v1/trackers`, {
        headers: getAuthHeaders(),
      });

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
        setNotification("Trackers updated!");
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

  const closeModal = (modalId) => {
    const modalElement = document.getElementById(modalId);
    if (modalElement && window.bootstrap) {
      const modalInstance = window.bootstrap.Modal.getInstance(modalElement);
      modalInstance?.hide();
    }
  };

  const handlePaystackPayment = () => {
    if (!currentUserEmail) {
      alert("No logged-in user email detected. Please log in again.");
      return;
    }

    if (!window.PaystackPop) {
      alert("Paystack SDK failed to load. Please check your internet connection.");
      return;
    }

    setUpgrading(true);

    const paystack = new window.PaystackPop();
    paystack.newTransaction({
      key: PAYSTACK_PUBLIC_KEY,
      email: currentUserEmail,
      amount: userLocation.amount,
      currency: userLocation.currency,
      onSuccess: async (transaction) => {
        try {
          // Verify transaction on backend
          await fetch(`${BASE_URL}/api/v1/payments/verify`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ reference: transaction.reference }),
          });

          setIsPremium(true);
          setNotification(`Payment successful! PRO access activated for ${currentUserEmail}`);
          closeModal("premiumModal");
        } catch (err) {
          console.error("Payment verification failed:", err);
          alert("Payment completed but verification failed. Contact support.");
        } finally {
          setUpgrading(false);
          setTimeout(() => setNotification(null), 4000);
        }
      },
      onCancel: () => setUpgrading(false),
      onError: (error) => {
        setUpgrading(false);
        alert(error?.message || "Payment transaction failed.");
      }
    });
  };

  const handleSubscribeNotifications = async () => {
    setSubscribing(true);
    try {
      await registerServiceWorkerAndSubscribe();
      setSubscribed(true);
      setNotification("Successfully subscribed to notifications!");
    } catch (err) {
      setNotification(err.message || "Failed to subscribe to notifications.");
    } finally {
      setSubscribing(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleLogout = () => {
    cookies.remove("token", { path: "/" });
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

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

      if (!response.ok) throw new Error("Failed to sync entries with server.");
    } catch (error) {
      console.error("Error syncing entry modification:", error);
      fetchTrackers(); 
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

    const previousTrackers = [...trackers];
    setTrackers((prev) => prev.filter((t) => (t._id || t.id)?.toString() !== trackerId.toString()));

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

      if (!response.ok) throw new Error("Server failed to delete tracker.");
    } catch (error) {
      console.error("Error deleting tracker:", error);
      alert("Failed to delete tracker. Please check your connection.");
      setTrackers(previousTrackers);
    }
  };

  const handleCreate = (newTracker) => {
    fetchTrackers();
    const newId = newTracker._id || newTracker.id;
    setNewlyAddedId(newId);
    setNotification("Successfully created tracker!");

    if (newId) {
      setTimeout(() => setNewlyAddedId((current) => (current === newId ? null : current)), 2500);
    }
    setTimeout(() => setNotification(null), 3000);
  };

  if (!token) return null;

  if (loading) {
    return (
      <div className={`min-vh-100 d-flex flex-column align-items-center justify-content-center ${darkMode ? "bg-dark text-light" : "bg-light text-dark"}`} data-bs-theme={darkMode ? "dark" : "light"}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <LayoutDashboard className="text-primary" size={32} />
          <h2 className="fw-bold m-0" style={{ fontSize: "1.5rem" }}>UNI-TRACK</h2>
        </div>
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted small m-0">Loading your trackers...</p>
      </div>
    );
  }

  const hasTrackers = trackers.length > 0;
  const filteredTrackers = typeFilter ? trackers.filter((t) => t.type === typeFilter) : trackers;
  const displayTrackers = hasTrackers ? filteredTrackers : [sampleTrackerState];

  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? "Good Morning ☀️" : currentHour < 18 ? "Good Afternoon 🌤️" : "Good Evening 🌙";

  return (
    <div className={`min-vh-100 position-relative ${darkMode ? "bg-dark text-light" : "bg-light text-dark"}`} data-bs-theme={darkMode ? "dark" : "light"}>
      {notification && (
        <div className="position-fixed top-0 start-50 translate-middle-x p-3" style={{ zIndex: 1080, marginTop: "1rem" }}>
          <div className="alert alert-success shadow-sm d-flex align-items-center gap-2 mb-0 py-2 px-3 rounded-pill">
            <CheckCircle2 size={18} />
            <span className="small fw-semibold">{notification}</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <nav className={`navbar border-bottom shadow-sm py-3 ${darkMode ? "bg-dark border-secondary" : "bg-white"}`}>
        <div className="container d-flex align-items-center justify-content-between">
          <h1 className="navbar-brand fw-bold d-flex align-items-center gap-2 m-0" style={{ fontSize: "1.25rem" }}>
            <LayoutDashboard className="text-primary" /> UNI-TRACK
            {isPremium ? (
              <span className="badge bg-warning text-dark d-flex align-items-center gap-1 ms-1 fs-7">
                <Crown size={12} /> PRO
              </span>
            ) : (
              <span className="badge bg-secondary text-light d-flex align-items-center gap-1 ms-1 fs-7">
                REGULAR
              </span>
            )}
          </h1>

          <div className="d-flex align-items-center gap-2">
            {!isPremium ? (
              <button
                type="button"
                className="btn btn-warning text-dark fw-bold d-flex align-items-center gap-1 px-3 py-2 shadow-sm"
                data-bs-toggle="modal"
                data-bs-target="#premiumModal"
              >
                <Crown size={16} />
                <span className="d-none d-sm-inline">Upgrade to PRO</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline-warning d-flex align-items-center gap-1 px-3 py-2 fw-semibold"
                data-bs-toggle="modal"
                data-bs-target="#premiumModal"
              >
                <Crown size={16} />
                <span className="d-none d-sm-inline">PRO Plan</span>
              </button>
            )}

            <button
              type="button"
              className={`btn ${subscribed ? "btn-outline-success" : "btn-outline-primary"} d-flex align-items-center gap-2 px-3 py-2`}
              onClick={handleSubscribeNotifications}
              disabled={subscribing}
              title="Subscribe to Push Notifications"
            >
              <Bell size={18} className={subscribing ? "spin-icon" : ""} />
              <span className="d-none d-sm-inline">
                {subscribing ? "Subscribing..." : subscribed ? "Subscribed" : "Notifications"}
              </span>
            </button>

            <button
              type="button"
              className={`btn ${darkMode ? "btn-outline-light" : "btn-outline-secondary"} d-flex align-items-center justify-content-center p-2`}
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle Theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="container py-4 py-md-5">
        <div className="row">
          <div className="col-12">
            {/* Greeting */}
            <div className={`p-4 p-md-5 rounded-4 shadow-sm border mb-4 mb-md-5 position-relative overflow-hidden ${darkMode ? "bg-dark border-secondary" : "bg-white"}`}>
              <div className="position-absolute top-0 end-0 p-4 opacity-10 d-none d-md-block text-primary">
                <LayoutDashboard size={140} />
              </div>
              <div className="position-relative" style={{ zIndex: 1 }}>
                <span className="badge bg-primary bg-opacity-10 text-primary mb-3 px-3 py-2 rounded-pill fw-semibold">
                  {timeGreeting}
                </span>
                <h2 className="fw-bold mb-2 display-6" style={{ fontSize: "1.75rem" }}>
                  Welcome back to Uni-Track!
                </h2>
                <p className="text-muted mb-0 lead fs-6">
                  Account Status: <strong>{isPremium ? "PRO Subscriber" : "Regular Plan"}</strong> ({currentUserEmail || "Guest"})
                </p>
              </div>
            </div>

            {/* Dashboard Stats */}
            <div className={`p-3 p-md-4 rounded-4 shadow-sm border ${darkMode ? "bg-dark border-secondary" : "bg-white"}`}>
              <TrackerDashboard trackers={displayTrackers} darkMode={darkMode} />
            </div>

            {/* Trackers Toolbar & List */}
            <div className={`p-3 p-md-4 rounded-4 shadow-sm border mt-4 ${darkMode ? "bg-dark border-secondary" : "bg-white"}`}>
              <div className={`alert ${darkMode ? "bg-dark text-info border-info" : "bg-info bg-opacity-10 text-info border-info-subtle"} d-flex align-items-center gap-2 mb-3 py-2 px-3 rounded-3 small border`}>
                <Info size={18} className="flex-shrink-0" />
                <span>Use the <strong>Refresh</strong> button to update the dashboard metrics!</span>
              </div>

              <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between gap-3 mb-3">
                <div className="flex-grow-1 overflow-auto">
                  <TrackerFilters typeFilter={typeFilter} onTypeFilterChange={setTypeFilter} darkMode={darkMode} />
                </div>
                
                <div className="d-flex align-items-center flex-wrap gap-2 flex-shrink-0">
                  <button
                    type="button"
                    className="btn btn-primary d-flex align-items-center justify-content-center gap-2 px-3 py-2"
                    data-bs-toggle="modal"
                    data-bs-target="#trackerModal"
                  >
                    <PlusCircle size={18} /> New Tracker
                  </button>

                  <button
                    type="button"
                    className={`btn ${darkMode ? "btn-outline-light" : "btn-outline-secondary"} d-flex align-items-center gap-2 px-3 py-2`}
                    onClick={() => fetchTrackers(true)}
                    disabled={refreshing}
                    title="Refresh Trackers"
                  >
                    <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-danger d-flex align-items-center justify-content-center gap-2 px-3 py-2"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              </div>

              <hr />

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
                <div className="mt-3 p-3 bg-info bg-opacity-10 rounded text-info small text-center">
                  💡 This is a sample tracker. Create your own tracker to get started!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <div className="modal fade" id="trackerModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className={`modal-content ${darkMode ? "bg-dark text-light border-secondary" : ""}`}>
            <div className="modal-header">
              <h5 className="modal-title">Configure Tracker</h5>
              <button type="button" className={`btn-close ${darkMode ? "btn-close-white" : ""}`} data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body">
              <TrackerForm
                onCreate={(createdTracker) => handleCreate(createdTracker)}
                onClose={() => closeModal("trackerModal")}
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="premiumModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className={`modal-content ${darkMode ? "bg-dark text-light border-secondary" : ""}`}>
            <div className="modal-header border-0 pb-0">
              <button type="button" className={`btn-close ${darkMode ? "btn-close-white" : ""}`} data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body text-center pt-0 px-4 pb-4">
              <div className="d-inline-flex p-3 bg-warning bg-opacity-10 text-warning rounded-circle mb-3">
                <Crown size={40} />
              </div>
              <h4 className="fw-bold mb-1">
                {isPremium ? "UNI-TRACK PRO Active" : "Upgrade to UNI-TRACK PRO"}
              </h4>

              <div className="d-flex align-items-center justify-content-center gap-1 text-muted small mb-3">
                <Globe size={14} />
                <span>Regional Currency: <strong>{userLocation.currency}</strong></span>
              </div>

              {!isPremium && (
                <div className="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-3 text-start">
                  <ShieldAlert size={18} className="flex-shrink-0" />
                  <span>
                    Current email: <strong>{currentUserEmail || "Unregistered"}</strong> is on Regular plan. Upgrade below to unlock PRO features.
                  </span>
                </div>
              )}

              <div className="text-start bg-body-tertiary p-3 rounded-3 mb-4 border">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Check size={18} className="text-success flex-shrink-0" />
                  <span className="small">Unlimited E2E Encrypted Trackers</span>
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Check size={18} className="text-success flex-shrink-0" />
                  <span className="small">Advanced Dashboard Analytics & Charts</span>
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Check size={18} className="text-success flex-shrink-0" />
                  <span className="small">Priority Instant Push Reminders</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Check size={18} className="text-success flex-shrink-0" />
                  <span className="small">Custom Categorization & Data Exports</span>
                </div>
              </div>

              {!isPremium ? (
                <button
                  type="button"
                  className="btn btn-warning w-100 py-2 fw-bold text-dark d-flex align-items-center justify-content-center gap-2"
                  onClick={handlePaystackPayment}
                  disabled={upgrading}
                >
                  <Sparkles size={18} />
                  {upgrading
                    ? "Connecting Paystack..."
                    : `Pay ${userLocation.symbol}${userLocation.displayAmount} with Paystack`}
                </button>
              ) : (
                <div className="alert alert-success m-0 py-2 small fw-semibold d-flex align-items-center justify-content-center gap-2">
                  <CheckCircle2 size={18} /> Your PRO subscription is active for {currentUserEmail}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}