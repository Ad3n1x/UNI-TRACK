import React, { useState } from "react";
import TrackerDashboard from "../components/trackers/TrackerDashboard";
import TrackerForm from "../components/trackers/TrackerForm";
import TrackerList from "../components/trackers/TrackerList";
import { addEntryToTracker, deleteEntryFromTracker } from "../core/trackerEngine";

export default function CustomPage() {
  const [trackers, setTrackers] = useState([]);

  const handleCreate = (tracker) =>
    setTrackers((prev) => [...prev, { ...tracker, type: "custom" }]);

  const handleAddEntry = (trackerId, payload) =>
    setTrackers((prev) =>
      prev.map((t) =>
        t.id === trackerId ? addEntryToTracker(t, payload) : t
      )
    );

  const handleDeleteTracker = (trackerId) =>
    setTrackers((prev) => prev.filter((t) => t.id !== trackerId));

  const handleDeleteEntry = (trackerId, entryId) =>
    setTrackers((prev) =>
      prev.map((t) =>
        t.id === trackerId ? deleteEntryFromTracker(t, entryId) : t
      )
    );

  return (
    <div className="container py-4">
      <h3 className="fw-bold mb-3">Custom Tracker</h3>
      <TrackerDashboard trackers={trackers} />
      <div className="row mt-3">
        <div className="col-md-4">
          <TrackerForm onCreate={handleCreate} />
        </div>
        <div className="col-md-8">
          <TrackerList
            trackers={trackers}
            onAddEntry={handleAddEntry}
            onDeleteTracker={handleDeleteTracker}
            onDeleteEntry={handleDeleteEntry}
          />
        </div>
      </div>
    </div>
  );
}
