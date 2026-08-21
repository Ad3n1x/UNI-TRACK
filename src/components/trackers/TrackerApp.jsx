import React, { useState, useEffect } from 'react';
import TrackerList from './TrackerList';
import TrackerFilters from './TrackerFilters';

const BASE_API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  process.env.REACT_APP_API_URL ||
  process.env.API_URL ||
  "http://localhost:5000/api/trackers";

const API_URL = BASE_API_URL.replace(/\/$/, "");

export default function TrackerApp() {
  const [trackers, setTrackers] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchTrackers(typeFilter);
  }, [typeFilter]);

  const fetchTrackers = async (filter = '') => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const url = filter ? `${API_URL}?type=${encodeURIComponent(filter)}` : API_URL;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
      
      const data = await res.json();
      setTrackers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch trackers:', err);
      setErrorMsg(err.message || 'Failed to connect to backend server');
      setTrackers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTracker = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTrackers((prev) => prev.filter((t) => (t.id || t._id) !== id));
      }
    } catch (err) {
      console.error('Failed to delete tracker:', err);
    }
  };

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
        prev.map((t) => ((t.id || t._id) === trackerId ? updatedTracker : t))
      );
    } catch (err) {
      console.error('Failed to add entry:', err);
    }
  };

  const handleDeleteEntry = async (trackerId, entryId) => {
    try {
      const trackerToUpdate = trackers.find((t) => (t.id || t._id) === trackerId);
      if (!trackerToUpdate) return;

      const updatedEntries = trackerToUpdate.entries.filter(
        (e) => (e.id || e._id) !== entryId
      );

      await handleUpdate(trackerId, updatedEntries);
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

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
        prev.map((t) => ((t.id || t._id) === trackerId ? updatedTracker : t))
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
      {errorMsg && (
        <div className="p-3 mb-4 text-red-700 bg-red-100 rounded">
          <strong>Error:</strong> {errorMsg}. Check backend at <code>{API_URL}</code>.
        </div>
      )}

      <TrackerFilters
        typeFilter={typeFilter}
        onTypeFilterChange={(val) => setTypeFilter(val || '')}
      />

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