import React from "react";
import TrackerCard from './TrackerCard';

export default function TrackerList({
  trackers = [],
  onDeleteTracker,
  onAddEntry,
  onDeleteEntry,
  onUpdate,
  darkMode = false, // 🌙 Added darkMode prop
}) {
  return (
    <div className="tracker-list-container">
      {/* Count Header */}
      <div className="d-flex align-items-center mb-4">
        <span 
          className="text-uppercase small fw-bold tracking-widest"
          style={{ color: darkMode ? '#94a3b8' : '#64748b' }}
        >
          {trackers.length} {trackers.length === 1 ? 'tracker' : 'trackers'}
        </span>
      </div>

      {trackers.length === 0 ? (
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
          {trackers.map(tracker => (
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