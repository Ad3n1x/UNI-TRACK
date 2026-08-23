import React, { useState, useEffect } from "react";
import TrackerDashboard from "../components/trackers/TrackerDashboard";
import TrackerForm from "../components/trackers/TrackerForm";
import TrackerList from "../components/trackers/TrackerList";
import TrackerFilters from "../components/trackers/TrackerFilters";
import { PlusCircle, LayoutDashboard, CheckCircle2 } from "lucide-react";

const API_BASE_URL = "https://lv3node.onrender.com/api"; 

// --- Sample Tracker Data (used as fallback when empty) ---
const SAMPLE_TRACKER = {
  _id: 'sample-001',
  name: 'Sample: Daily Water Intake',
  type: 'counter',
  color: '#3b82f6',
  icon: 'Droplets',
  entries: [],
  isSample: true
};

export default function HomePage() {
  const [trackers, setTrackers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState(null);
  const [newlyAddedId, setNewlyAddedId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Helper to safely close the Bootstrap modal without double-triggering events
  const closeModal = () => {
    const modalElement = document.getElementById('trackerModal');
    if (modalElement && window.bootstrap) {
      const modalInstance = window.bootstrap.Modal.getInstance(modalElement) || new window.bootstrap.Modal(modalElement);
      modalInstance.hide();
    } else {
      document.querySelector('#trackerModal .btn-close')?.click();
    }
  };

  // 1. Fetch Trackers (and reverse array if your DB saves them oldest-first)
  const fetchTrackers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/trackers`);
      const data = await response.json();
      const fetchedArray = Array.isArray(data) ? data : [];
      
      // Reverse so newest/last created are permanently at the top
      setTrackers(fetchedArray.reverse());
    } catch (error) {
      console.error("Error fetching trackers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackers();
  }, []);

  // 2. Handle Tracker Creation (UI State Update Only - TrackerForm already saved it to DB)
  const handleCreate = (newTracker) => {
    const newId = newTracker._id || newTracker.id;

    // Permanently prepend to the very top of the list array
    setTrackers((prev) => [newTracker, ...prev]); 
    setNewlyAddedId(newId);

    // Show success notification
    setNotification(`Successfully created "${newTracker.name || 'New Tracker'}"!`);

    // Clear highlight/scroll target after a moment
    if (newId) {
      window.setTimeout(() => {
        setNewlyAddedId((current) => (current === newId ? null : current));
      }, 2500);
    }

    // Clear notification after 3 seconds
    window.setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // 3. Delete a Tracker (Optimistic UI Update with 404 Fallback)
  const handleDeleteTracker = async (trackerId) => {
    if (trackerId === SAMPLE_TRACKER._id) return; 

    const previousTrackers = [...trackers];
    setTrackers((prev) => prev.filter((t) => (t._id || t.id) !== trackerId)); 

    try {
      let response = await fetch(`${API_BASE_URL}/trackers/${trackerId}`, {
        method: "DELETE",
      });
      
      if (!response.ok && response.status === 404) {
        response = await fetch(`${API_BASE_URL}/trackers?id=${trackerId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!response.ok) {
        throw new Error("Server failed to delete via both routes.");
      }
    } catch (error) {
      console.error("Error deleting tracker:", error);
      alert("Failed to delete tracker. Please check your connection.");
      setTrackers(previousTrackers); 
    }
  };

  // 4. Add an Entry (Safe fallback with optimistic update)
  const handleAddEntry = async (trackerId, entry) => {
    // Optimistic local update immediately
    setTrackers((prev) =>
      prev.map((t) => {
        if ((t._id || t.id) === trackerId) {
          return {
            ...t,
            entries: [...(t.entries || []), { ...entry, _id: Date.now().toString() }]
          };
        }
        return t;
      })
    );

    try {
      const response = await fetch(`${API_BASE_URL}/trackers/${trackerId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry), 
      });
      if (response.ok) {
        const updatedTracker = await response.json();
        // If backend returned the full tracker with entries, sync with it
        if (updatedTracker && Array.isArray(updatedTracker.entries)) {
          setTrackers((prev) =>
            prev.map((t) => ((t._id || t.id) === trackerId ? updatedTracker : t))
          );
        }
      }
    } catch (error) {
      console.error("Error adding entry:", error);
      fetchTrackers(); // Re-fetch from server on failure to stay in sync
    }
  };

  // 5. Update Tracker (Safe fallback with optimistic update)
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
      const response = await fetch(`${API_BASE_URL}/trackers/${trackerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
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

  // 6. Delete an Entry (Safe fallback with optimistic update)
  const handleDeleteEntry = async (trackerId, entryId) => {
    setTrackers((prev) =>
      prev.map((t) => {
        if ((t._id || t.id) === trackerId) {
          return {
            ...t,
            entries: (t.entries || []).filter((e) => (e._id || e.id) !== entryId)
          };
        }
        return t;
      })
    );

    try {
      const response = await fetch(`${API_BASE_URL}/trackers/${trackerId}/entries/${entryId}`, {
        method: "DELETE",
      });
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

  // --- View Logic ---
  if (loading) {
    return <div className="text-center py-5 mt-5">Loading trackers...</div>;
  }

  const hasTrackers = trackers.length > 0;
  const filteredTrackers = typeFilter ? trackers.filter((t) => t.type === typeFilter) : trackers;
  const displayTrackers = hasTrackers ? filteredTrackers : [SAMPLE_TRACKER];

  return (
    <div className="min-vh-100 bg-light position-relative">
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

      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm">
        <div className="container">
          <h1 className="navbar-brand fw-bold d-flex align-items-center gap-2 m-0" href="#">
            <LayoutDashboard className="text-primary" /> UNI-TRACK
          </h1>
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2"
            data-bs-toggle="modal"
            data-bs-target="#trackerModal"
          >
            <PlusCircle size={18} /> New Tracker
          </button>
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

      {/* Tracker Creation Modal */}
      <div className="modal fade" id="trackerModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Configure Tracker</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <TrackerForm
                onCreate={(createdTracker) => {
                  handleCreate(createdTracker);
                }}
                onClose={() => {
                  closeModal();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}