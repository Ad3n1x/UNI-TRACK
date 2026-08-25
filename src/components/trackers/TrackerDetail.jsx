import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Activity } from "lucide-react";
import Cookies from "universal-cookie";

const RAW_BASE_URL =
  (typeof process !== "undefined" && process.env?.API_URL) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "https://lv3node.onrender.com";

const BASE_URL = RAW_BASE_URL.replace(/\/$/, "");

const MOOD_MAP = {
  1: { emoji: "😢", label: "Rough" },
  2: { emoji: "😕", label: "Low" },
  3: { emoji: "😐", label: "Okay" },
  4: { emoji: "🙂", label: "Good" },
  5: { emoji: "😄", label: "Great" },
};

const getAuthHeaders = () => {
  const cookies = new Cookies();
  const token = cookies.get("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const SAMPLE_TRACKER = {
  _id: "sample-001",
  name: "Sample: Daily Water Intake",
  type: "counter",
  color: "#3b82f6",
  unit: "liters",
  target: 3,
  entries: [
    { _id: "e1", date: "2026-08-24", value: 2.5 },
    { _id: "e2", date: "2026-08-23", value: 3.0 }
  ],
  isSample: true,
};

const formatEntryDate = (dateInput) => {
  if (!dateInput) return "";
  try {
    const dateStr = typeof dateInput === "string" ? dateInput.split("T")[0] : dateInput;
    const [year, month, day] = dateStr.split("-");
    if (!year || !month || !day) return dateStr;
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateInput;
  }
};

export default function TrackerDetail() {
  const { trackerId } = useParams();
  const [tracker, setTracker] = useState(null);
  const [loading, setLoading] = useState(true);

  const [darkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    const fetchTracker = async () => {
      if (trackerId === "sample-001") {
        setTracker(SAMPLE_TRACKER);
        setLoading(false);
        return;
      }

      try {
        const headers = getAuthHeaders();
        const endpoints = [
          `${BASE_URL}/api/v1/trackers/${trackerId}`,
          `${BASE_URL}/api/trackers/${trackerId}`,
          `${BASE_URL}/api/v1/tracker/${trackerId}`,
          `${BASE_URL}/api/tracker/${trackerId}`,
        ];

        let foundTracker = null;

        // 1. Try direct ID endpoints
        for (const url of endpoints) {
          try {
            const res = await fetch(url, { headers });
            if (res.ok) {
              const data = await res.json();
              foundTracker = data.data || data;
              break;
            }
          } catch {
            // Continue trying other endpoints
          }
        }

        // 2. Fallback: Fetch all trackers and find by ID if direct routes failed
        if (!foundTracker) {
          const listEndpoints = [
            `${BASE_URL}/api/v1/trackers`,
            `${BASE_URL}/api/trackers`,
          ];

          for (const listUrl of listEndpoints) {
            try {
              const res = await fetch(listUrl, { headers });
              if (res.ok) {
                const data = await res.json();
                const trackersList = Array.isArray(data) ? data : (data.data || data.trackers || []);
                const match = trackersList.find(
                  (t) => (t._id || t.id) === trackerId
                );
                if (match) {
                  foundTracker = match;
                  break;
                }
              }
            } catch {
              // Continue
            }
          }
        }

        if (foundTracker) {
          setTracker(foundTracker);
        } else {
          console.error(`Tracker with ID ${trackerId} could not be resolved.`);
        }
      } catch (error) {
        console.error("Error fetching tracker details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracker();
  }, [trackerId]);

  if (loading) {
    return (
      <div className={`min-vh-100 d-flex align-items-center justify-content-center ${darkMode ? "bg-dark text-light" : "bg-light text-dark"}`}>
        Loading entries...
      </div>
    );
  }

  if (!tracker) {
    return (
      <div className={`min-vh-100 d-flex flex-column align-items-center justify-content-center ${darkMode ? "bg-dark text-light" : "bg-light text-dark"}`}>
        <h4>Tracker not found.</h4>
        <p className="text-muted small mt-1">The tracker ID ({trackerId}) might be invalid or deleted.</p>
        <Link to="/homepage" className="btn btn-primary mt-3">Back to Dashboard</Link>
      </div>
    );
  }

  const entries = tracker.entries || [];

  return (
    <div className={`min-vh-100 py-5 ${darkMode ? "bg-dark text-light" : "bg-light text-dark"}`} data-bs-theme={darkMode ? "dark" : "light"}>
      <div className="container" style={{ maxWidth: "600px" }}>
        
        {/* Back Button */}
        <Link to="/homepage" className={`btn btn-sm ${darkMode ? "btn-outline-light" : "btn-outline-secondary"} mb-4 d-inline-flex align-items-center gap-2`}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        {/* Tracker Info Header */}
        <div className={`card shadow-sm border rounded-4 p-4 mb-4 ${darkMode ? "bg-dark border-secondary text-light" : "bg-white text-dark"}`}>
          <span className="badge bg-primary bg-opacity-10 text-primary mb-2 text-uppercase fw-bold align-self-start" style={{ fontSize: "0.65rem" }}>
            {tracker.type || "Tracker"}
          </span>
          <h2 className="fw-bold mb-1">{tracker.name || tracker.trackerName}</h2>
          <p className="text-muted small mb-0">
            Target: <span className="fw-semibold">{tracker.target || "None"}</span> {tracker.unit || ""}
          </p>
          {tracker.isSample && (
            <span className="badge bg-info bg-opacity-10 text-info mt-2 align-self-start small">
              Sample Preview Mode
            </span>
          )}
        </div>

        {/* ENTRY LIST CARD */}
        <div className={`card shadow-sm border rounded-4 p-4 ${darkMode ? "bg-dark border-secondary text-light" : "bg-white text-dark"}`}>
          <h5 className="fw-semibold mb-3 d-flex align-items-center gap-2">
            <Activity size={18} /> Entry History
          </h5>

          {entries.length === 0 ? (
            <p className="text-muted text-center py-4 mb-0 fst-italic">No entries recorded yet.</p>
          ) : (
            <ul className="list-group list-group-flush rounded-3 overflow-hidden border">
              {entries.map((entry, index) => {
                const entryId = entry._id || entry.id || index;
                const formattedDate = formatEntryDate(entry.date);

                let displayValue = entry.value;
                if (tracker.type === "habit") {
                  displayValue = entry.value ? "Completed ✓" : "Missed";
                } else if (tracker.type === "mood" && MOOD_MAP[entry.value]) {
                  displayValue = `${MOOD_MAP[entry.value].emoji} ${MOOD_MAP[entry.value].label}`;
                }

                return (
                  <li 
                    key={entryId} 
                    className={`list-group-item d-flex justify-content-between align-items-center py-3 px-3 ${
                      darkMode ? "bg-dark text-light border-secondary" : "bg-light text-dark"
                    }`}
                  >
                    <span className="text-secondary small fw-medium d-flex align-items-center gap-1">
                      <Calendar size={14} /> {formattedDate}
                    </span>
                    <span className="fw-bold fs-6">
                      {displayValue} {tracker.type !== "habit" && tracker.type !== "mood" ? tracker.unit || "" : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}