import React, { useState, useEffect } from "react";
import TrackerDashboard from "../components/trackers/TrackerDashboard";
import TrackerForm from "../components/trackers/TrackerForm";
import TrackerList from "../components/trackers/TrackerList";
import TrackerFilters from "../components/trackers/TrackerFilters";
import { PlusCircle, LayoutDashboard, CheckCircle2, LogOut, Sun, Moon, RefreshCw } from "lucide-react";
import Cookies from "universal-cookie";
import { initializeUserKeys, decryptData, encryptData } from "../utils/e2ee";

const RAW_BASE_URL =
  (typeof process !== "undefined" && process.env?.API_URL) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "https://lv3node.onrender.com";

const BASE_URL = RAW_BASE_URL.replace(/\/$/, "");

const getAuthHeaders = () => {
  const cookies = new Cookies();
  const token = cookies.get("token") || localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const SAMPLE_TRACKER = {
  _id: "sample-001",
  name: "Sample: Daily Water Intake",
  type: "counter",
  color: "#3b82f6",
  icon: "Droplet",
  entries: [],
  isSample: true,
};

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function registerServiceWorkerAndSubscribe() {
  if ("serviceWorker" in navigator && "PushManager" in window) {
    try {
      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;

      const publicVapidKey = "BEaflZfmm8QfrFsL7r06HB-QrsdDAefJpRk2vw-zcHIKD-t8evj3TIS7k9k0w0am9BboNqiqbZ99Y-1WxYNcZcw";
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });

      await fetch(`${BASE_URL}/api/v1/subscribe`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(subscription),
      });

      console.log("Push Registered Successfully!");
    } catch (err) {
      console.error("Failed to register push notifications:", err);
    }
  }
}

export default function HomePage() {
  const cookies = new Cookies();
  const token = cookies.get("token") || localStorage.getItem("token");

  if (!token) {
    window.location.href = "/";
    return null;
  }

  const [trackers, setTrackers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState(null);
  const [newlyAddedId, setNewlyAddedId] = useState(null);
  const [notification, setNotification] = useState(null);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    registerServiceWorkerAndSubscribe();
  }, []);

  const closeModal = () => {
    const modalElement = document.getElementById("trackerModal");
    if (modalElement && window.bootstrap) {
      const modalInstance =
        window.bootstrap.Modal.getInstance(modalElement) ||
        new window.bootstrap.Modal(modalElement);
      modalInstance.hide();
    } else {
      document.querySelector("#trackerModal .btn-close")?.click();
    }
  };

  const handleLogout = () => {
    cookies.remove("token", { path: "/login" });
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const fetchTrackers = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const { privateKey } = await initializeUserKeys();

      const response = await fetch(`${BASE_URL}/api/v1/trackers`, {
        headers: getAuthHeaders(),
      });

      const resData = response.ok ? response : await fetch(`${BASE_URL}/api/trackers`, { headers: getAuthHeaders() });
      const data = await resData.json();

      const fetchedArray = Array.isArray(data) ? data : Array.isArray(data.trackers) ? data.trackers : [];

      const decryptedTrackers = await Promise.all(
        fetchedArray.map(async (tracker) => {
          try {
            const decryptedEntries = tracker.entries !== undefined ? await decryptData(privateKey, tracker.entries) : [];
            return {
              ...tracker,
              name: await decryptData(privateKey, tracker.name),
              target: tracker.target !== undefined ? await decryptData(privateKey, tracker.target) : tracker.target,
              entries: Array.isArray(decryptedEntries) ? decryptedEntries : [],
            };
          } catch (decryptErr) {
            console.error("Failed to decrypt individual tracker:", decryptErr);
            return { ...tracker, entries: [] };
          }
        })
      );

      setTrackers([...decryptedTrackers].reverse());
      if (isManualRefresh) {
        setNotification("Trackers updated!");
        window.setTimeout(() => setNotification(null), 2500);
      }
    } catch (error) {
      console.error("Error fetching trackers:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrackers();
  }, []);

  const handleCreate = (newTracker) => {
    fetchTrackers();
    const newId = newTracker._id || newTracker.id;
    setNewlyAddedId(newId);
    setNotification("Successfully created tracker!");

    if (newId) {
      window.setTimeout(() => {
        setNewlyAddedId((current) => (current === newId ? null : current));
      }, 2500);
    }

    window.setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleDeleteTracker = async (trackerId) => {
    if (trackerId === SAMPLE_TRACKER._id) return;

    const previousTrackers = [...trackers];
    setTrackers((prev) => prev.filter((t) => (t._id?.toString() || t.id?.toString()) !== trackerId.toString()));

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

      if (!response.ok) {
        throw new Error("Failed to sync entries with server.");
      }
    } catch (error) {
      console.error("Error syncing entry modification:", error);
      fetchTrackers();
    }
  };

  const handleAddEntry = async (trackerId, entry) => {
    let targetTracker = trackers.find((t) => {
      const tId = t._id?.toString() || t.id?.toString() || t._id || t.id;
      return tId === trackerId.toString();
    });
    if (!targetTracker) return;

    const todayDateStr = new Date().toISOString().split("T")[0];
    const newEntryWithId = {
      date: todayDateStr,
      timestamp: new Date().toISOString(),
      completed: true,
      value: true,
      ...entry,
      _id: Date.now().toString(),
    };

    const updatedEntries = [...(targetTracker.entries || []), newEntryWithId];

    setTrackers((prev) =>
      prev.map((t) => {
        const tId = t._id?.toString() || t.id?.toString() || t._id || t.id;
        if (tId === trackerId.toString()) {
          return { ...t, entries: updatedEntries };
        }
        return t;
      })
    );

    await syncTrackerEntriesWithBackend(trackerId, updatedEntries);
  };

  const handleUpdate = async (trackerId, newEntries) => {
    const todayDateStr = new Date().toISOString().split("T")[0];
    const normalizedEntries = Array.isArray(newEntries)
      ? newEntries.map((e) => {
          if (typeof e === "string") return e;
          return {
            date: e.date || todayDateStr,
            timestamp: e.timestamp || e.createdAt || new Date().toISOString(),
            completed: e.completed ?? e.value ?? true,
            value: e.value ?? e.completed ?? true,
            ...e,
          };
        })
      : newEntries;

    setTrackers((prev) =>
      prev.map((t) => {
        const tId = t._id?.toString() || t.id?.toString() || t._id || t.id;
        if (tId === trackerId.toString()) {
          return { ...t, entries: normalizedEntries };
        }
        return t;
      })
    );

    await syncTrackerEntriesWithBackend(trackerId, normalizedEntries);
  };

  const handleDeleteEntry = async (trackerId, entryId) => {
    let targetTracker = trackers.find((t) => {
      const tId = t._id?.toString() || t.id?.toString() || t._id || t.id;
      return tId === trackerId.toString();
    });
    if (!targetTracker) return;

    const updatedEntries = (targetTracker.entries || []).filter(
      (e) => (e._id?.toString() || e.id?.toString() || e._id || e.id) !== entryId.toString()
    );

    setTrackers((prev) =>
      prev.map((t) => {
        const tId = t._id?.toString() || t.id?.toString() || t._id || t.id;
        if (tId === trackerId.toString()) {
          return { ...t, entries: updatedEntries };
        }
        return t;
      })
    );

    await syncTrackerEntriesWithBackend(trackerId, updatedEntries);
  };

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
  const filteredTrackers = typeFilter
    ? trackers.filter((t) => t.type === typeFilter)
    : trackers;
  const displayTrackers = hasTrackers ? filteredTrackers : [SAMPLE_TRACKER];

  const currentHour = new Date().getHours();
  const timeGreeting =
    currentHour < 12 ? "Good Morning ☀️" : currentHour < 18 ? "Good Afternoon 🌤️" : "Good Evening 🌙";

  return (
    <div
      className={`min-vh-100 position-relative ${darkMode ? "bg-dark text-light" : "bg-light text-dark"}`}
      data-bs-theme={darkMode ? "dark" : "light"}
    >
      {notification && (
        <div
          className="position-fixed top-0 start-50 translate-middle-x p-3"
          style={{ zIndex: 1080, marginTop: "1rem" }}
        >
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
          </h1>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className={`btn ${darkMode ? "btn-outline-light" : "btn-outline-secondary"} d-flex align-items-center gap-1 p-2 text-sm`}
              onClick={() => fetchTrackers(true)}
              disabled={refreshing}
              title="Refresh Trackers"
            >
              <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
              <span className="d-none d-sm-inline small">Refresh</span>
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
            
            {/* Friendly Greeting */}
            <div className={`p-4 p-md-5 rounded-4 shadow-sm border mb-4 mb-md-5 position-relative overflow-hidden ${darkMode ? "bg-dark border-secondary" : "bg-white"}`}>
              <div className="position-absolute top-0 end-0 p-4 opacity-10 d-none d-md-block text-primary">
                <LayoutDashboard size={140} />
              </div>
              <div className="position-relative" style={{ zIndex: 1 }}>
                <span className="badge bg-primary bg-opacity-10 text-primary mb-3 px-3 py-2 rounded-pill fw-semibold">
                  {timeGreeting}
                </span>
                <h2 className="fw-bold mb-2 display-6" style={{ fontSize: "1.75rem" }}>Welcome back to Uni-Track!</h2>
                <p className="text-muted mb-0 lead fs-6">
                  Let's make today productive.
                </p>
              </div>
            </div>

            {/* Dashboard Stats */}
            <TrackerDashboard trackers={trackers} darkMode={darkMode} />

            {/* Trackers Toolbar & List Section */}
            <div className={`p-3 p-md-4 rounded-4 shadow-sm border mt-4 ${darkMode ? "bg-dark border-secondary" : "bg-white"}`}>
              
              <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between gap-3 mb-3">
                <div className="flex-grow-1 overflow-auto">
                  <TrackerFilters typeFilter={typeFilter} onTypeFilterChange={setTypeFilter} darkMode={darkMode} />
                </div>
                
                <div className="d-flex align-items-center flex-wrap gap-2 flex-shrink-0">
                  <button
                    type="button"
                    className="btn btn-primary d-flex align-items-center justify-content-center gap-2 flex-grow-1 flex-lg-grow-0 px-3 py-2"
                    data-bs-toggle="modal"
                    data-bs-target="#trackerModal"
                  >
                    <PlusCircle size={18} /> New Tracker
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

      {/* Create Tracker Modal */}
      <div className="modal fade" id="trackerModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className={`modal-content ${darkMode ? "bg-dark text-light border-secondary" : ""}`}>
            <div className="modal-header">
              <h5 className="modal-title">Configure Tracker</h5>
              <button
                type="button"
                className={`btn-close ${darkMode ? "btn-close-white" : ""}`}
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <TrackerForm
                onCreate={(createdTracker) => handleCreate(createdTracker)}
                onClose={() => closeModal()}
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}