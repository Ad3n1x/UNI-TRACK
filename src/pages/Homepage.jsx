import React, { useState } from "react";
import TrackerDashboard from "../components/trackers/TrackerDashboard";
import TrackerForm from "../components/trackers/TrackerForm";
import TrackerList from "../components/trackers/TrackerList";
import TrackerFilters from "../components/trackers/TrackerFilters";
import { PlusCircle, Inbox, LayoutDashboard } from "lucide-react";

// --- Sample Tracker Data ---
const SAMPLE_TRACKER = {
  id: 'sample-001',
  name: 'Sample: Daily Water Intake',
  type: 'counter',
  color: '#3b82f6',
  icon: 'Droplets',
  entries: [],
  isSample: true
};

export default function HomePage() {
  const [trackers, setTrackers] = useState([]);
  const [typeFilter, setTypeFilter] = useState(null);

  // --- Helper Logic ---
  const addEntryToTracker = (tracker, payload) => {
    const newEntry = { ...payload, id: crypto.randomUUID() };
    return { ...tracker, entries: [...tracker.entries, newEntry] };
  };

  const updateTrackerEntries = (tracker, updatedEntries) => {
    return { ...tracker, entries: updatedEntries };
  };

  const deleteEntryFromTracker = (tracker, entryId) => {
    return { ...tracker, entries: tracker.entries.filter(e => e.id !== entryId) };
  };

  // --- Handlers ---
  const handleCreate = (tracker) => {
    setTrackers((prev) => [...prev, tracker]);
  };

  const handleAddEntry = (trackerId, payload) => {
    setTrackers((prev) =>
      prev.map((t) => (t.id === trackerId ? addEntryToTracker(t, payload) : t))
    );
  };

  const handleUpdate = (trackerId, updatedEntries) => {
    setTrackers((prev) =>
      prev.map((t) => (t.id === trackerId ? updateTrackerEntries(t, updatedEntries) : t))
    );
  };

  const handleDeleteTracker = (trackerId) => {
    setTrackers((prev) => prev.filter((t) => t.id !== trackerId));
  };

  const handleDeleteEntry = (trackerId, entryId) => {
    setTrackers((prev) =>
      prev.map((t) => (t.id === trackerId ? deleteEntryFromTracker(t, entryId) : t))
    );
  };

  // --- View Logic ---
  const hasTrackers = trackers.length > 0;
  const filteredTrackers = typeFilter ? trackers.filter((t) => t.type === typeFilter) : trackers;
  const displayTrackers = hasTrackers ? filteredTrackers : [SAMPLE_TRACKER];

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm">
        <div className="container">
          <h1 className="navbar-brand fw-bold d-flex align-items-center gap-2" href="#">
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
            {/* We always show the list now, because displayTrackers handles the empty state */}
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
                onCreate={(data) => {
                  handleCreate(data);
                  document.querySelector('#trackerModal .btn-close').click();
                }}
                onClose={() => {
                  document.querySelector('#trackerModal .btn-close').click();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}