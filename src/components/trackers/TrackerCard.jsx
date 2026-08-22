import React, { useState, useEffect, useRef, useMemo } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import * as Icons from "lucide-react";

const API_BASE = "https://lv3node.onrender.com/api/trackers";

const TYPE_COLORS = {
  habit: "#10b981",
  counter: "#3b82f6",
  timer: "#f97316",
  goal: "#8b5cf6",
  expense: "#ef4444",
  mood: "#ec4899",
};

const MOOD_OPTIONS = [
  { emoji: "😢", label: "Rough", value: 1 },
  { emoji: "😕", label: "Low", value: 2 },
  { emoji: "😐", label: "Okay", value: 3 },
  { emoji: "🙂", label: "Good", value: 4 },
  { emoji: "😄", label: "Great", value: 5 },
];

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function TrackerCard({ tracker, onDelete, onUpdate, onAddEntry }) {
  const [inputValue, setInputValue] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const intervalRef = useRef(null);

  const today = useMemo(() => getLocalDateString(), []);
  const trackerEntries = tracker.entries || [];
  const todayEntry = trackerEntries.find((e) => e.date === today);

  const IconComponent = Icons[tracker.icon] || Icons.Circle;
  const typeColor = TYPE_COLORS[tracker.type] || tracker.color || "#3b82f6";

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(
        () => setTimerSeconds((s) => s + 1),
        1000
      );
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  const handleHabitToggle = () => {
    if (todayEntry) {
      onUpdate({
        entries: trackerEntries.filter(
          (e) => e.id !== todayEntry.id && e._id !== todayEntry._id
        ),
      });
    } else {
      onAddEntry({ date: today, value: true });
    }
  };

  const handleCounterChange = (delta) => {
    const current = Number(todayEntry?.value) || 0;
    const next = Math.max(0, current + delta);
    if (todayEntry) {
      onUpdate({
        entries: trackerEntries.map((e) =>
          e.id === todayEntry.id || e._id === todayEntry._id
            ? { ...e, value: next }
            : e
        ),
      });
    } else if (delta > 0) {
      onAddEntry({ date: today, value: next });
    }
  };

  const handleSaveAmount = () => {
    const val = parseFloat(inputValue);
    if (!isNaN(val)) {
      if (todayEntry) {
        onUpdate({
          entries: trackerEntries.map((e) =>
            e.id === todayEntry.id || e._id === todayEntry._id
              ? { ...e, value: Number(e.value) + val }
              : e
          ),
        });
      } else {
        onAddEntry({ date: today, value: val });
      }
      setInputValue("");
    }
  };

  const formatTime = (s) =>
    [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
      .map((v) => v.toString().padStart(2, "0"))
      .join(":");

  const currentTotal = useMemo(
    () => trackerEntries.reduce((sum, e) => sum + (Number(e.value) || 0), 0),
    [trackerEntries]
  );

  const percentage = Math.min(
    (currentTotal / (tracker.target || 1)) * 100,
    100
  );

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #f1f5f9",
        borderLeft: `6px solid ${tracker.color || typeColor}`,
        borderRadius: "1rem",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: "200px" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${tracker.color || typeColor}15`,
              color: tracker.color || typeColor,
              flexShrink: 0,
            }}
          >
            <IconComponent size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>{tracker.name}</h3>
            <p style={{ fontSize: "0.75rem", marginTop: "0.25rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, margin: 0, color: typeColor }}>
              {tracker.type}
            </p>
          </div>
        </div>
        <button
          onClick={() => onDelete(tracker.id || tracker._id)}
          style={{
            backgroundColor: "transparent",
            border: "1px solid #fecdd3",
            color: "#ef4444",
            padding: "0.375rem 0.75rem",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          Delete
        </button>
      </div>

      {/* Habit Section */}
      {tracker.type === "habit" && (
        <button
          onClick={handleHabitToggle}
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: "0.75rem",
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
            backgroundColor: todayEntry ? `${tracker.color || typeColor}15` : "#f1f5f9",
            color: todayEntry ? tracker.color || typeColor : "#64748b",
          }}
        >
          {todayEntry ? "Completed Today" : "Mark Done"}
        </button>
      )}

      {/* Counter Section */}
      {tracker.type === "counter" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <button
            onClick={() => handleCounterChange(-1)}
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "0.75rem",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f1f5f9",
              color: "#334155",
            }}
          >
            <Minus size={20} />
          </button>
          <span style={{ fontSize: "2.25rem", fontWeight: 800, fontFamily: "monospace", color: tracker.color || typeColor }}>
            {Number(todayEntry?.value) || 0}
          </span>
          <button
            onClick={() => handleCounterChange(1)}
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "0.75rem",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: tracker.color || typeColor,
              color: "#ffffff",
            }}
          >
            <Plus size={20} />
          </button>
        </div>
      )}

      {/* Timer Section */}
      {tracker.type === "timer" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", fontWeight: 800, fontFamily: "monospace", color: tracker.color || typeColor, marginBottom: "1rem", wordBreak: "break-all" }}>
            {formatTime(timerSeconds)}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              style={{
                flex: 1,
                minWidth: "120px",
                padding: "1rem",
                borderRadius: "0.75rem",
                border: "none",
                backgroundColor: tracker.color || typeColor,
                color: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {timerRunning ? "PAUSE" : "START"}
            </button>
            <button
              onClick={() => {
                setTimerRunning(false);
                setTimerSeconds(0);
              }}
              style={{
                padding: "1rem",
                borderRadius: "0.75rem",
                border: "none",
                backgroundColor: "#f1f5f9",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#334155",
              }}
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Mood Section */}
      {tracker.type === "mood" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {!todayEntry ? (
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => onAddEntry({ date: today, value: m.value })}
                  style={{
                    flex: 1,
                    minWidth: "60px",
                    padding: "0.75rem",
                    borderRadius: "0.75rem",
                    border: "2px solid #f1f5f9",
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{m.emoji}</div>
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "#64748b" }}>{m.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ padding: "1rem", borderRadius: "1rem", textAlign: "center", backgroundColor: `${tracker.color || typeColor}10` }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.5rem", color: tracker.color || typeColor }}>
                Today's Mood: {MOOD_OPTIONS.find((m) => m.value === todayEntry.value)?.label}
              </p>
              <div style={{ fontSize: "3rem" }}>
                {MOOD_OPTIONS.find((m) => m.value === todayEntry.value)?.emoji}
              </div>
            </div>
          )}

          <div>
            <h4 style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              Recent History
            </h4>
            <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
              {trackerEntries
                .slice(-7)
                .reverse()
                .map((entry) => (
                  <div key={entry.id || entry._id || entry.date} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "40px", flexShrink: 0 }}>
                    <span style={{ fontSize: "1.25rem" }}>
                      {MOOD_OPTIONS.find((m) => m.value === entry.value)?.emoji || "❓"}
                    </span>
                    <span style={{ fontSize: "0.6rem", color: "#64748b" }}>
                      {entry.date ? entry.date.slice(5) : ""}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Goal & Expense Section */}
      {(tracker.type === "goal" || tracker.type === "expense") && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                {currentTotal} <span style={{ color: "#94a3b8" }}>/ {tracker.target || 0}</span>
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: tracker.color || typeColor }}>
                {percentage.toFixed(0)}%
              </span>
            </div>
            <div style={{ width: "100%", height: "0.625rem", backgroundColor: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${percentage}%`,
                  backgroundColor: tracker.color || typeColor,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter amount"
              style={{
                flex: 1,
                minWidth: "120px",
                padding: "0.75rem",
                borderRadius: "0.75rem",
                border: "2px solid #f1f5f9",
                outline: "none",
                color: "#1e293b",
              }}
            />
            <button
              onClick={handleSaveAmount}
              style={{
                flex: 1,
                minWidth: "80px",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.75rem",
                border: "none",
                backgroundColor: tracker.color || typeColor,
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Container Component with Built-in Backend Integration
export function TrackerList() {
  const [trackers, setTrackers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch trackers on initial mount
  useEffect(() => {
    fetch(API_BASE)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch trackers");
        return res.json();
      })
      .then((data) => {
        setTrackers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("API Fetch Error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Handler: Add new entry to backend
  const handleAddEntry = async (trackerId, entry) => {
    try {
      const res = await fetch(`${API_BASE}/${trackerId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error("Failed to create entry");
      const updatedTracker = await res.json();
      setTrackers((prev) =>
        prev.map((t) => ((t._id || t.id) === trackerId ? updatedTracker : t))
      );
    } catch (err) {
      console.error("Error adding entry:", err);
    }
  };

  // Handler: Update entries array on backend
  const handleUpdate = async (trackerId, updatedEntries) => {
    try {
      const res = await fetch(`${API_BASE}/${trackerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: updatedEntries }),
      });
      if (!res.ok) throw new Error("Failed to update tracker");
      const updatedTracker = await res.json();
      setTrackers((prev) =>
        prev.map((t) => ((t._id || t.id) === trackerId ? updatedTracker : t))
      );
    } catch (err) {
      console.error("Error updating tracker:", err);
    }
  };

  // Handler: Delete tracker on backend
  const handleDeleteTracker = async (trackerId) => {
    try {
      const res = await fetch(`${API_BASE}/${trackerId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete tracker");
      setTrackers((prev) =>
        prev.filter((t) => (t._id || t.id) !== trackerId)
      );
    } catch (err) {
      console.error("Error deleting tracker:", err);
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading trackers...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
        Error loading trackers: {error}. Check backend connection.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1.5rem",
        width: "100%",
      }}
    >
      {trackers.map((tracker) => {
        const trackerId = tracker._id || tracker.id;
        return (
          <TrackerCard
            key={trackerId}
            tracker={tracker}
            onDelete={handleDeleteTracker}
            onUpdate={(fields) => handleUpdate(trackerId, fields.entries)}
            onAddEntry={(entry) => handleAddEntry(trackerId, entry)}
          />
        );
      })}
    </div>
  );
}