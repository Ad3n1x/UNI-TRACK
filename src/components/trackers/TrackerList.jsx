import React from "react";
import { TrackerCard } from './TrackerCard';

export default function TrackerList({
  trackers = [],
  onDeleteTracker,
  onAddEntry,
  onDeleteEntry,
  onUpdate
}) {
  return (
    <div className="tracker-list-container">
      {/* Count Header */}
      <div className="d-flex align-items-center mb-4">
        <span className="text-uppercase text-muted small fw-bold tracking-widest">
          {trackers.length} {trackers.length === 1 ? 'tracker' : 'trackers'}
        </span>
      </div>

      {trackers.length === 0 ? (
        <div className="text-center py-5 border border-dashed rounded-4 bg-light">
          <div className="display-6 mb-3 text-secondary">
            📭
          </div>
          <p className="text-muted mb-0">
            No trackers found. Create your first one!
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {trackers.map(tracker => (
            <div key={tracker.id} className="col-12 col-md-6 col-lg-4">
              <TrackerCard
                tracker={tracker}
                onDelete={() => onDeleteTracker?.(tracker.id)}
                onAddEntry={(entry) => onAddEntry?.(tracker.id, entry)}
                onDeleteEntry={(entryId) => onDeleteEntry?.(tracker.id, entryId)}
                onUpdate={(updatedData) => onUpdate?.(tracker.id, updatedData.entries)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}