import React, { useState, useEffect } from 'react';
import TrackerList from './TrackerList';
import TrackerFilters from './TrackerFilters';

const API_URL = process.env.API_URL;

export default function TrackerApp() {
  const [trackers, setTrackers] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Fetch trackers from backend on mount or when filter changes
  useEffect(() => {
    fetchTrackers(typeFilter);
  }, [typeFilter]);

  const fetchTrackers = async (filter = '') => {
    try {
      setLoading(true);
      const url = filter ? `${API_URL}?type=${filter}` : API_URL;
      const res = await fetch(url);
      const data = await res.json();
      setTrackers(data);
    } catch (err) {
      console.error('Failed to fetch trackers:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Delete a tracker
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

  // 3. Add an entry to a specific tracker
  const handleAddEntry = async (trackerId, entryData) => {
    try {
      const res = await fetch(`${API_URL}/${trackerId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      });
      const updatedTracker = await res.json();
      setTrackers((prev) =>
        prev.map((t) => (t.id === trackerId ? updatedTracker : t))
      );
    } catch (err) {
      console.error('Failed to add entry:', err);
    }
  };

  // 4. Delete an entry from a tracker
  const handleDeleteEntry = async (trackerId, entryId) => {
    try {
      const res = await fetch(`${API_URL}/${trackerId}/entries/${entryId}`, {
        method: 'DELETE',
      });
      const updatedTracker = await res.json();
      setTrackers((prev) =>
        prev.map((t) => (t.id === trackerId ? updatedTracker : t))
      );
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  // 5. Update tracker fields/entries directly
  const handleUpdate = async (trackerId, updatedEntries) => {
    try {
      const res = await fetch(`${API_URL}/${trackerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: updatedEntries }),
      });
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