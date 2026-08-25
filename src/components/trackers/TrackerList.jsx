import React, { useState } from "react";
import TrackerCard from './TrackerCard';

export default function TrackerList({
  trackers = [],
  onDeleteTracker,
  onAddEntry,
  onDeleteEntry,
  onUpdate,
  onClearAll,
  darkMode = false,
}) {
  const [sortBy, setSortBy] = useState("createdAt"); // 'createdAt', 'name', 'type'
  const [sortOrder, setSortOrder] = useState("desc");    // 'asc' or 'desc'

  // Sort trackers dynamically based on user selection
  const sortedTrackers = [...trackers].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    // Fallback if createdAt isn't present
    if (sortBy === "createdAt") {
      valA = a.createdAt ? new Date(a.createdAt).getTime() : (a._id ? parseInt(a._id.substring(0, 8), 16) * 1000 : 0);
      valB = b.createdAt ? new Date(b.createdAt).getTime() : (b._id ? parseInt(b._id.substring(0, 8), 16) * 1000 : 0);
    }

    if (typeof valA === "string") {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete all trackers? This action cannot be undone.")) {
      if (onClearAll) {
        onClearAll();
      } else if (onDeleteTracker) {
        // Fallback: Delete each tracker one by one if onClearAll isn't explicitly passed
        trackers.forEach(t => onDeleteTracker(t.id || t._id));
      }
    }
  };

  return (
    <div className="tracker-list-container">
      {/* Header with Count, Sort Controls, and Clear All Button */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <span 
          className="text-uppercase small fw-bold tracking-widest"
          style={{ color: darkMode ? '#94a3b8' : '#64748b' }}
        >
          {trackers.length} {trackers.length === 1 ? 'tracker' : 'trackers'}
        </span>

        {trackers.length > 0 && (
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Sort By Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "0.4rem 0.75rem",
                borderRadius: "8px",
                border: darkMode ? "1px solid #334155" : "1px solid #cbd5e1",
                backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                color: darkMode ? "#f8fafc" : "#1e293b",
                fontSize: "0.85rem",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="createdAt">Date Created</option>
              <option value="name">Name</option>
              <option value="type">Type</option>
            </select>

            {/* Ascending / Descending Toggle Button */}
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              style={{
                padding: "0.4rem 0.75rem",
                borderRadius: "8px",
                border: darkMode ? "1px solid #334155" : "1px solid #cbd5e1",
                backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                color: darkMode ? "#f8fafc" : "#1e293b",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
              title="Toggle Sort Direction"
            >
              {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
            </button>

            {/* Clear All Trackers Button - Always shown when trackers exist */}
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                padding: "0.4rem 0.75rem",
                borderRadius: "8px",
                border: darkMode ? "1px solid #7f1d1d" : "1px solid #fecaca",
                backgroundColor: darkMode ? "#451a03" : "#fef2f2",
                color: darkMode ? "#f87171" : "#b91c1c",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: "600",
              }}
              title="Delete all trackers"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {sortedTrackers.length === 0 ? (
        <div 
          className="text-center py-5 rounded-4"
          style={{
            backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
            border: darkMode ? '1px dashed #334155' : '1px dashed #cbd5e1',
          }}
        >
          <div className="display-6 mb-3 text-secondary">
            📭
          </div>
          <p className="mb-0" style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
            No trackers found. Create your first one!
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {sortedTrackers.map(tracker => (
            <div key={tracker.id || tracker._id} className="col-12 col-md-6 col-lg-4">
              <TrackerCard
                tracker={tracker}
                onDelete={() => onDeleteTracker?.(tracker.id || tracker._id)}
                onAddEntry={(entry) => onAddEntry?.(tracker.id || tracker._id, entry)}
                onDeleteEntry={(entryId) => onDeleteEntry?.(tracker.id || tracker._id, entryId)}
                onUpdate={(updatedData) => onUpdate?.(tracker.id || tracker._id, updatedData.entries)}
                darkMode={darkMode}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}