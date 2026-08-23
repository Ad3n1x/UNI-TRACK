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

const getEntryDateString = (dateInput) => {
  if (!dateInput) return "";
  if (typeof dateInput === "string") return dateInput.split("T")[0];
  try {
    return getLocalDateString(new Date(dateInput));
  } catch {
    return "";
  }
};

export default function TrackerCard({
  tracker,
  onDelete = () => {},
  onUpdateTracker = () => {},
  cardRef = null,
  isNewlyAdded = false,
}) {
  const [inputValue, setInputValue] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const intervalRef = useRef(null);

  const [localEntries, setLocalEntries] = useState(tracker?.entries || []);

  useEffect(() => {
    if (tracker?.entries) {
      setLocalEntries(tracker.entries);
    }
  }, [tracker?.entries]);

  const trackerId = tracker?._id || tracker?.id;
  const today = useMemo(() => getLocalDateString(), []);

  const todayEntry = localEntries.find((e) => {
    return getEntryDateString(e.date) === today;
  });

  const IconComponent = Icons[tracker?.icon] || Icons.Circle;
  const typeColor = TYPE_COLORS[tracker?.type] || tracker?.color || "#3b82f6";

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  const syncEntryToDb = async (updatedEntriesList) => {
    if (!trackerId) {
      console.error("Cannot sync entry: Tracker ID is missing", tracker);
      return;
    }

    // Silent optimistic UI update
    setLocalEntries(updatedEntriesList);
    const optimisticTracker = { ...tracker, entries: updatedEntriesList };
    onUpdateTracker?.(optimisticTracker);

    try {
      let res = await fetch(`${API_BASE}/${trackerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: updatedEntriesList }),
      });

      if (!res.ok && res.status === 404) {
        res = await fetch(`${API_BASE}?id=${trackerId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: updatedEntriesList }),
        });
      }

      if (!res.ok) throw new Error("Failed to register entry on DB");

      const updatedTracker = await res.json();
      onUpdateTracker?.(updatedTracker);
    } catch (err) {
      console.error("Database interaction error:", err);
      setLocalEntries(tracker?.entries || []);
      onUpdateTracker?.(tracker);
    }
  };

  const handleHabitToggle = () => {
    const nextList = todayEntry
      ? localEntries.filter((e) => getEntryDateString(e.date) !== today)
      : [...localEntries, { date: today, value: true }];

    syncEntryToDb(nextList);
  };

  const handleCounterChange = (delta) => {
    const currentVal = Number(todayEntry?.value) || 0;
    const nextVal = Math.max(0, currentVal + delta);

    const nextList = todayEntry
      ? localEntries.map((e) => (getEntryDateString(e.date) === today ? { ...e, value: nextVal } : e))
      : [...localEntries, { date: today, value: nextVal }];

    syncEntryToDb(nextList);
  };

  const handleTimerToggle = () => {
    if (timerRunning) {
      setTimerRunning(false);
      if (timerSeconds > 0) {
        const currentVal = Number(todayEntry?.value) || 0;
        const totalSeconds = currentVal + timerSeconds;

        const nextList = todayEntry
          ? localEntries.map((e) => (getEntryDateString(e.date) === today ? { ...e, value: totalSeconds } : e))
          : [...localEntries, { date: today, value: totalSeconds }];

        syncEntryToDb(nextList);
        setTimerSeconds(0);
      }
    } else {
      setTimerRunning(true);
    }
  };

  const handleMoodSelect = (val) => {
    const nextList = todayEntry
      ? localEntries.map((e) => (getEntryDateString(e.date) === today ? { ...e, value: val } : e))
      : [...localEntries, { date: today, value: val }];

    syncEntryToDb(nextList);
  };

  const handleSaveAmount = () => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) return;

    const currentVal = Number(todayEntry?.value) || 0;
    const nextVal = currentVal + val;

    const nextList = todayEntry
      ? localEntries.map((e) => (getEntryDateString(e.date) === today ? { ...e, value: nextVal } : e))
      : [...localEntries, { date: today, value: nextVal }];

    syncEntryToDb(nextList);
    setInputValue("");
  };

  const formatTime = (s) =>
    [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
      .map((v) => v.toString().padStart(2, "0"))
      .join(":");

  const currentTotal = useMemo(
    () => localEntries.reduce((sum, e) => sum + (Number(e.value) || 0), 0),
    [localEntries]
  );

  const percentage = Math.min(
    (currentTotal / (tracker?.target || 1)) * 100,
    100
  );

  return (
    <div
      ref={cardRef}
      className="tracker-card-item"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        borderLeft: `6px solid ${tracker?.color || typeColor}`,
        borderRadius: "1.25rem",
        padding: "1.35rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        boxShadow: isNewlyAdded
          ? `0 0 0 3px ${tracker?.color || typeColor}55, 0 8px 16px -4px rgba(0, 0, 0, 0.08)`
          : "0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        width: "100%",
        boxSizing: "border-box",
        scrollMarginTop: "1.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${tracker?.color || typeColor}15`,
              color: tracker?.color || typeColor,
              flexShrink: 0,
            }}
          >
            <IconComponent size={22} />
          </div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#0f172a", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
              {tracker?.name}
            </h3>
            <p style={{ fontSize: "0.7rem", marginTop: "0.2rem", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, margin: 0, color: typeColor }}>
              {tracker?.type}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const targetId = tracker?._id || tracker?.id;

            if (!targetId) {
              alert("Cannot delete: Missing tracker ID");
              return;
            }

            if (window.confirm(`Are you sure you want to delete "${tracker?.name || "this tracker"}"?`)) {
              onDelete(targetId);
            }
          }}
          style={{
            backgroundColor: "transparent",
            border: "1px solid #fecdd3",
            color: "#ef4444",
            padding: "0.35rem 0.7rem",
            borderRadius: "0.6rem",
            cursor: "pointer",
            fontSize: "0.72rem",
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          Delete
        </button>
      </div>

      {tracker?.type === "habit" && (
        <button
          onClick={handleHabitToggle}
          style={{
            width: "100%",
            padding: "0.95rem",
            borderRadius: "0.85rem",
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
            backgroundColor: todayEntry ? `${tracker?.color || typeColor}20` : "#f8fafc",
            color: todayEntry ? tracker?.color || typeColor : "#64748b",
            transition: "all 0.2s ease",
          }}
        >
          {todayEntry ? "Completed Today ✓" : "Mark Done"}
        </button>
      )}

      {tracker?.type === "counter" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <button
            onClick={() => handleCounterChange(-1)}
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "0.85rem",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f8fafc",
              color: "#334155",
              flexShrink: 0,
            }}
          >
            <Minus size={18} />
          </button>
          <span style={{ fontSize: "2.25rem", fontWeight: 800, fontFamily: "monospace", color: tracker?.color || typeColor }}>
            {Number(todayEntry?.value) || 0}
          </span>
          <button
            onClick={() => handleCounterChange(1)}
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "0.85rem",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: tracker?.color || typeColor,
              color: "#ffffff",
              flexShrink: 0,
              boxShadow: `0 4px 12px ${tracker?.color || typeColor}40`,
            }}
          >
            <Plus size={18} />
          </button>
        </div>
      )}

      {tracker?.type === "timer" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, fontFamily: "monospace", color: tracker?.color || typeColor, marginBottom: "0.2rem" }}>
            {formatTime(timerSeconds)}
          </div>
          <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "1rem", fontWeight: 500 }}>
            Saved Today: {formatTime(Number(todayEntry?.value) || 0)}
          </p>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              onClick={handleTimerToggle}
              style={{
                flex: 1,
                padding: "0.85rem",
                borderRadius: "0.85rem",
                border: "none",
                backgroundColor: tracker?.color || typeColor,
                color: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              {timerRunning ? "PAUSE & SAVE" : "START"}
            </button>
            <button
              onClick={() => {
                setTimerRunning(false);
                setTimerSeconds(0);
              }}
              style={{
                padding: "0.85rem",
                borderRadius: "0.85rem",
                border: "none",
                backgroundColor: "#f8fafc",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#334155",
              }}
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      )}

      {tracker?.type === "mood" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div className="mood-buttons-grid" style={{ display: "flex", justifyContent: "space-between", gap: "0.4rem" }}>
            {MOOD_OPTIONS.map((m) => {
              const isSelected = todayEntry?.value === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => handleMoodSelect(m.value)}
                  style={{
                    flex: 1,
                    padding: "0.7rem 0.2rem",
                    borderRadius: "0.75rem",
                    border: isSelected ? `2px solid ${tracker?.color || typeColor}` : "2px solid #f1f5f9",
                    backgroundColor: isSelected ? `${tracker?.color || typeColor}15` : "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: "1.35rem", marginBottom: "0.2rem" }}>{m.emoji}</div>
                  <span className="mood-label" style={{ fontSize: "0.65rem", fontWeight: 700, color: isSelected ? tracker?.color || typeColor : "#64748b" }}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(tracker?.type === "goal" || tracker?.type === "expense") && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.95rem" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>
                {currentTotal} <span style={{ color: "#94a3b8" }}>/ {tracker?.target || 0}</span>
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: tracker?.color || typeColor }}>
                {percentage.toFixed(0)}%
              </span>
            </div>
            <div style={{ width: "100%", height: "0.6rem", backgroundColor: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${percentage}%`,
                  backgroundColor: tracker?.color || typeColor,
                  borderRadius: "9999px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Amount"
              style={{
                flex: 1,
                padding: "0.75rem 0.9rem",
                borderRadius: "0.85rem",
                border: "2px solid #f1f5f9",
                outline: "none",
                color: "#1e293b",
                fontSize: "0.9rem",
                backgroundColor: "#f8fafc",
              }}
            />
            <button
              onClick={handleSaveAmount}
              disabled={!inputValue}
              style={{
                padding: "0.75rem 1.25rem",
                borderRadius: "0.85rem",
                border: "none",
                backgroundColor: tracker?.color || typeColor,
                color: "#ffffff",
                cursor: inputValue ? "pointer" : "not-allowed",
                fontWeight: 600,
                fontSize: "0.9rem",
                opacity: inputValue ? 1 : 0.6,
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