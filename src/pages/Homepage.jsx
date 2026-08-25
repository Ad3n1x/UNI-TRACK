import React, { useState, useEffect } from "react";
import TrackerDashboard from "../components/trackers/TrackerDashboard";
import TrackerForm from "../components/trackers/TrackerForm";
import TrackerList from "../components/trackers/TrackerList";
import TrackerFilters from "../components/trackers/TrackerFilters";
import { PlusCircle, LayoutDashboard, CheckCircle2, LogOut, Sun, Moon } from "lucide-react";
import Cookies from "universal-cookie";

const RAW_BASE_URL =
  (typeof process !== "undefined" && process.env?.API_URL) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "https://lv3node.onrender.com";

const BASE_URL = RAW_BASE_URL.replace(/\/$/, "");

// Helper to construct request headers with JWT token
const getAuthHeaders = () => {
  const cookies = new Cookies();
  const token = cookies.get("token");
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

export default function HomePage() {
  const cookies = new Cookies();
  const token = cookies.get("token");

  // 🔒 Route Guard: Redirect unauthenticated users immediately
  if (!token) {
    window.location.href = "/";
    return null;
  }

  const [trackers, setTrackers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState(null);
  const [newlyAddedId, setNewlyAddedId] = useState(null);
  const [notification, setNotification] = useState(null);

  // 🌙 Dark Mode State with LocalStorage persistence
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

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
    cookies.remove("token", { path: "/" });
    window.location.href = "/";
  };

  const fetchTrackers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/trackers`, {
        headers: getAuthHeaders(),
      });

      const resData = response.ok ? response : await fetch(`${BASE_URL}/api/trackers`, { headers: getAuthHeaders() });
      const data = await resData.json();

      const fetchedArray = Array.isArray(data) ? data : Array.isArray(data.trackers) ? data.trackers : [];
      setTrackers([...fetchedArray].reverse());
    } catch (error) {
      console.error("Error fetching trackers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackers();
  }, []);

  const handleCreate = (newTracker) => {
    const newId = newTracker._id || newTracker.id;
    setTrackers((prev) => [newTracker, ...prev]);
    setNewlyAddedId(newId);

    setNotification(`Successfully created "${newTracker.name || "New Tracker"}"!`);

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
    setTrackers((prev) => prev.filter((t) => ((t._id?.toString() || t.id?.toString()) !== trackerId.toString())));

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
      let response = await fetch(`${BASE_URL}/api/v1/trackers/${trackerId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ entries: updatedEntries }),
      });

      if (response.status === 404) {
        response = await fetch(`${BASE_URL}/api/trackers/${trackerId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ entries: updatedEntries }),
        });
      }

      if (response.ok) {
        const resJson = await response.json();
        const trackerData = resJson.data || resJson;
        if (trackerData && Array.isArray(trackerData.entries)) {
          setTrackers((prev) =>
            prev.map((t) => {
              const tId = (t._id?.toString() || t.id?.toString() || t._id || t.id);
              return tId === trackerId.toString() ? trackerData : t;
            })
          );
        }
      } else {
        throw new Error("Failed to sync entries with server.");
      }
    } catch (error) {
      console.error("Error syncing entry modification:", error);
      fetchTrackers();
    }
  };

  const handleAddEntry = async (trackerId, entry) => {
    let targetTracker = trackers.find((t) => {
      const tId = (t._id?.toString() || t.id?.toString() || t._id || t.id);
      return tId === trackerId.toString();
    });
    if (!targetTracker) return;

    const newEntryWithId = { ...entry, _id: Date.now().toString() };
    const updatedEntries = [...(targetTracker.entries || []), newEntryWithId];

    setTrackers((prev) =>
      prev.map((t) => {
        const tId = (t._id?.toString() || t.id?.toString() || t._id || t.id);
        if (tId === trackerId.toString()) {
          return { ...t, entries: updatedEntries };
        }
        return t;
      })
    );

    await syncTrackerEntriesWithBackend(trackerId, updatedEntries);
  };

  const handleUpdate = async (trackerId, newEntries) => {
    setTrackers((prev) =>
      prev.map((t) => {
        const tId = (t._id?.toString() || t.id?.toString() || t._id || t.id);
        if (tId === trackerId.toString()) {
          return { ...t, entries: newEntries };
        }
        return t;
      })
    );

    await syncTrackerEntriesWithBackend(trackerId, newEntries);
  };

  const handleDeleteEntry = async (trackerId, entryId) => {
    let targetTracker = trackers.find((t) => {
      const tId = (t._id?.toString() || t.id?.toString() || t._id || t.id);
      return tId === trackerId.toString();
    });
    if (!targetTracker) return;

    const updatedEntries = (targetTracker.entries || []).filter(
      (e) => (e._id?.toString() || e.id?.toString() || e._id || e.id) !== entryId.toString()
    );

    setTrackers((prev) =>
      prev.map((t) => {
        const tId = (t._id?.toString() || t.id?.toString() || t._id || t.id);
        if (tId === trackerId.toString()) {
          return { ...t, entries: updatedEntries };
        }
        return t;
      })
    );

    await syncTrackerEntriesWithBackend(trackerId, updatedEntries);
  };

  if (loading) {
    return <div className="text-center py-5 mt-5">Loading trackers...</div>;
  }

  const hasTrackers = trackers.length > 0;
  const filteredTrackers = typeFilter
    ? trackers.filter((t) => t.type === typeFilter)
    : trackers;
  const displayTrackers = hasTrackers ? filteredTrackers : [SAMPLE_TRACKER];

  return (
    <div
      className={`min-vh-100 position-relative ${darkMode ? "bg-dark text-light" : "bg-light text-dark"}`}
      data-bs-theme={darkMode ? "dark" : "light"}
    >
      {/* Notification Toast */}
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

      {/* Navigation Header: Brand & Theme Toggle */}
      <nav className={`navbar border-bottom shadow-sm py-3 ${darkMode ? "bg-dark border-secondary" : "bg-white"}`}>
        <div className="container d-flex align-items-center justify-content-between">
          <h1 className="navbar-brand fw-bold d-flex align-items-center gap-2 m-0" style={{ fontSize: "1.25rem" }}>
            <LayoutDashboard className="text-primary" /> UNI-TRACK
          </h1>

          {/* Quick Access Theme Toggle */}
          <button
            type="button"
            className={`btn ${darkMode ? "btn-outline-light" : "btn-outline-secondary"} d-flex align-items-center justify-content-center p-2`}
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle Theme"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="container py-4 py-md-5">
        <div className="row">
          <div className="col-12">
            {/* Dashboard Stats */}
            <TrackerDashboard trackers={trackers} darkMode={darkMode} />

            {/* Trackers Toolbar & List Section */}
            <div className={`p-3 p-md-4 rounded-4 shadow-sm border mt-4 ${darkMode ? "bg-dark border-secondary" : "bg-white"}`}>
              
              {/* Action Toolbar: Filters + New Tracker and Logout buttons */}
              <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between gap-3 mb-3">
                <div className="flex-grow-1 overflow-auto">
                  <TrackerFilters typeFilter={typeFilter} onTypeFilterChange={setTypeFilter} darkMode={darkMode} />
                </div>
                
                <div className="d-flex align-items-center flex-wrap gap-2 flex-shrink-0">
                  {/* New Tracker Button */}
                  <button
                    type="button"
                    className="btn btn-primary d-flex align-items-center justify-content-center gap-2 flex-grow-1 flex-lg-grow-0 px-3 py-2"
                    data-bs-toggle="modal"
                    data-bs-target="#trackerModal"
                  >
                    <PlusCircle size={18} /> New Tracker
                  </button>

                  {/* Logout Button */}
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
                  💡 This is a sample tracker. Create your own to get started!
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