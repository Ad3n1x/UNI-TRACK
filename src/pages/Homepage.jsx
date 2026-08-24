import React, { useState, useEffect } from "react";
import TrackerDashboard from "../components/trackers/TrackerDashboard";
import TrackerForm from "../components/trackers/TrackerForm";
import TrackerList from "../components/trackers/TrackerList";
import TrackerFilters from "../components/trackers/TrackerFilters";
import { PlusCircle, LayoutDashboard, CheckCircle2, LogOut } from "lucide-react";
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
  const [trackers, setTrackers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState(null);
  const [newlyAddedId, setNewlyAddedId] = useState(null);
  const [notification, setNotification] = useState(null);

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
    const cookies = new Cookies();
    cookies.remove("token", { path: "/" });
    window.location.href = "/"; // Redirect or refresh to clear session state
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
    setTrackers((prev) => prev.filter((t) => (t._id || t.id) !== trackerId));

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

  const handleAddEntry = async (trackerId, entry) => {
    setTrackers((prev) =>
      prev.map((t) => {
        if ((t._id || t.id) === trackerId) {
          return {
            ...t,
            entries: [...(t.entries || []), { ...entry, _id: Date.now().toString() }],
          };
        }
        return t;
      })
    );

    try {
      let response = await fetch(`${BASE_URL}/api/v1/trackers/${trackerId}/entries`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(entry),
      });

      if (response.status === 404) {
        response = await fetch(`${BASE_URL}/api/trackers/${trackerId}/entries`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(entry),
        });
      }

      if (response.ok) {
        const updatedTracker = await response.json();
        if (updatedTracker && Array.isArray(updatedTracker.entries)) {
          setTrackers((prev) =>
            prev.map((t) => ((t._id || t.id) === trackerId ? updatedTracker : t))
          );
        }
      }
    } catch (error) {
      console.error("Error adding entry:", error);
      fetchTrackers();
    }
  };

  const handleUpdate = async (trackerId, entries) => {
    setTrackers((prev) =>
      prev.map((t) => {
        if ((t._id || t.id) === trackerId) {
          return { ...t, entries };
        }
        return t;
      })
    );

    try {
      let response = await fetch(`${BASE_URL}/api/v1/trackers/${trackerId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ entries }),
      });

      if (response.status === 404) {
        response = await fetch(`${BASE_URL}/api/trackers/${trackerId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ entries }),
        });
      }

      if (response.ok) {
        const updatedTracker = await response.json();
        if (updatedTracker && Array.isArray(updatedTracker.entries)) {
          setTrackers((prev) =>
            prev.map((t) => ((t._id || t.id) === trackerId ? updatedTracker : t))
          );
        }
      }
    } catch (error) {
      console.error("Error updating tracker:", error);
      fetchTrackers();
    }
  };

  const handleDeleteEntry = async (trackerId, entryId) => {
    setTrackers((prev) =>
      prev.map((t) => {
        if ((t._id || t.id) === trackerId) {
          return {
            ...t,
            entries: (t.entries || []).filter((e) => (e._id || e.id) !== entryId),
          };
        }
        return t;
      })
    );

    try {
      let response = await fetch(
        `${BASE_URL}/api/v1/trackers/${trackerId}/entries/${entryId}`,
        { method: "DELETE", headers: getAuthHeaders() }
      );

      if (response.status === 404) {
        response = await fetch(
          `${BASE_URL}/api/trackers/${trackerId}/entries/${entryId}`,
          { method: "DELETE", headers: getAuthHeaders() }
        );
      }

      if (response.ok) {
        const updatedTracker = await response.json();
        if (updatedTracker && Array.isArray(updatedTracker.entries)) {
          setTrackers((prev) =>
            prev.map((t) => ((t._id || t.id) === trackerId ? updatedTracker : t))
          );
        }
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      fetchTrackers();
    }
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
    <div className="min-vh-100 bg-light position-relative">
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

      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm">
        <div className="container">
          <h1 className="navbar-brand fw-bold d-flex align-items-center gap-2 m-0" href="#">
            <LayoutDashboard className="text-primary" /> UNI-TRACK
          </h1>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2"
              data-bs-toggle="modal"
              data-bs-target="#trackerModal"
            >
              <PlusCircle size={18} /> New Tracker
            </button>
            <button
              type="button"
              className="btn btn-outline-danger d-flex align-items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container py-5">
        <div className="row">
          <div className="col-12">
            <TrackerDashboard trackers={trackers} />

            <div className="bg-white p-4 rounded-4 shadow-sm border mt-4">
              <TrackerFilters typeFilter={typeFilter} onTypeFilterChange={setTypeFilter} />
              <hr />

              <TrackerList
                trackers={displayTrackers}
                onDeleteTracker={handleDeleteTracker}
                onAddEntry={handleAddEntry}
                onUpdate={handleUpdate}
                onDeleteEntry={handleDeleteEntry}
                newlyAddedId={newlyAddedId}
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

      <div className="modal fade" id="trackerModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Configure Tracker</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <TrackerForm
                onCreate={(createdTracker) => handleCreate(createdTracker)}
                onClose={() => closeModal()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}