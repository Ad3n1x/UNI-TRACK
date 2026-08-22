import React, { useState, useEffect } from "react";
import TrackerList from "./TrackerList";
import TrackerFilters from "./TrackerFilters";

const RAW_BASE_URL =
  (typeof process !== "undefined" && process.env?.API_URL) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "https://lv3node.onrender.com";

const BASE_URL = RAW_BASE_URL.replace(/\/$/, "");
const API_URL = `${BASE_URL}/api/trackers`;

export default function TrackerApp() {
  const [trackers, setTrackers] = useState([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchTrackers(typeFilter);
  }, [typeFilter]);

  const fetchTrackers = async (filter = "") => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const url = filter
        ? `${API_URL}?type=${encodeURIComponent(filter)}`
        : API_URL;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server responded with status ${res.status}`);

      const data = await res.json();
      setTrackers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch trackers:", err);
      setErrorMsg(err.message || "Failed to connect to backend server");
      setTrackers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTracker = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTrackers((prev) => prev.filter((t) => (t.id || t._id) !== id));
      }
    } catch (err) {
      console.error("Failed to delete tracker:", err);
    }
  };

  const handleAddEntry = async (trackerId, entryData) => {
    try {
      const res = await fetch(`${API_URL}/${trackerId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData),
      });
      if (!res.ok) throw new Error("Failed to save entry");
      const updatedTracker = await res.json();
      setTrackers((prev) =>
        prev.map((t) => ((t.id || t._id) === trackerId ? updatedTracker : t))
      );
    } catch (err) {
      console.error("Failed to add entry:", err);
    }
  };

  const handleUpdate = async (trackerId, updatedEntries) => {
    try {
      const res = await fetch(`${API_URL}/${trackerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: updatedEntries }),
      });
      if (!res.ok) throw new Error("Failed to update tracker");
      const updatedTracker = await res.json();
      setTrackers((prev) =>
        prev.map((t) => ((t.id || t._id) === trackerId ? updatedTracker : t))
      );
    } catch (err) {
      console.error("Failed to update tracker:", err);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "2rem" }}>Loading trackers...</div>;
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem" }}>
      {errorMsg && (
        <div style={{ padding: "1rem", marginBottom: "1rem", color: "#b91c1c", backgroundColor: "#fef2f2", borderRadius: "0.5rem" }}>
          <strong>Error:</strong> {errorMsg}. Check backend at <code>{API_URL}</code>.
        </div>
      )}

      <TrackerFilters
        typeFilter={typeFilter}
        onTypeFilterChange={(val) => setTypeFilter(val || "")}
      />

      <TrackerList
        trackers={trackers}
        onDeleteTracker={handleDeleteTracker}
        onAddEntry={handleAddEntry}
        onUpdate={handleUpdate}
      />
    </div>
  );
}