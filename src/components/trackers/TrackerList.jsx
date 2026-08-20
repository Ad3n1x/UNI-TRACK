import React, { useState, useEffect } from 'react';
import TrackerList from './TrackerList';
import TrackerFilters from './TrackerFilters';

// 1. Safe environment variable setup with default fallback
const API_URL =
  process.env.REACT_APP_API_URL ||
  process.env.VITE_API_URL ||
  process.env.API_URL ||
  "http://localhost:5000/api/trackers";

export default function TrackerApp() {
  const [trackers, setTrackers] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch trackers on initial mount or filter change
  useEffect(() => {
    fetchTrackers(typeFilter);
  }, [typeFilter]);

  const fetchTrackers = async (filter = '') => {
    try {
      setLoading(true);
      const url = filter ? `${API_URL}?type=${filter}` : API_URL;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setTrackers(data);
    } catch (err) {
      console.error('Failed to fetch trackers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete a tracker
  const handleDeleteTracker = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTrackers((prev) => prev.filter((tracker) => tracker.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete tracker:', err);
    }
  };

  // Add or update an entry
  const handleAddEntry = async (trackerId, entryData) => {
    try {
      const res = await fetch(`${API_URL}/${trackerId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      });
      if (!res.ok) throw new Error('Failed to save entry');
      const updatedTracker = await res.json();
      setTrackers((prev) =>
        prev.map((t) => (t.id === trackerId ? updatedTracker : t))
      );
    } catch (err) {
      console.error('Failed to add entry:', err);
    }
  };

  // Delete an entry from a tracker (filters entries client-side and syncs via PUT)
  const handleDeleteEntry = async (trackerId, entryId) => {
    try {
      const trackerToUpdate = trackers.find((t) => t.id === trackerId);
      if (!trackerToUpdate) return;

      const updatedEntries = trackerToUpdate.entries.filter(
        (e) => e.id !== entryId && e._id !== entryId
      );

      await handleUpdate(trackerId, updatedEntries);
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  // Update tracker fields/entries directly
  const handleUpdate = async (trackerId, updatedEntries) => {
    try {
      const res = await fetch(`${API_URL}/${trackerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: updatedEntries }),
      });
      if (!res.ok) throw new Error('Failed to update tracker');
      const updatedTracker = await res.json();
      setTrackers((prev) =>
        prev.map((t) => (t.id === trackerId ? updatedTracker : t))
      );
    } catch (err) {
      console.error('Failed to update tracker:', err);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading trackers...</div>;
  }

  return (
    <div className="container py-4">
      {/* Type Filter */}
      <TrackerFilters
        typeFilter={typeFilter}
        onTypeFilterChange={(val) => setTypeFilter(val || '')}
      />

      {/* Tracker List Component */}
      <TrackerList
        trackers={trackers}
        onDeleteTracker={handleDeleteTracker}
        onAddEntry={handleAddEntry}
        onDeleteEntry={handleDeleteEntry}
        onUpdate={handleUpdate}
      />
    </div>
  );
}