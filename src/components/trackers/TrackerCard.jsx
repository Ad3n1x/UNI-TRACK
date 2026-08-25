import React, { useState, useEffect, useRef, useMemo } from "react";
import { Minus, Plus, RotateCcw, ExternalLink, Activity } from "lucide-react";
import * as Icons from "lucide-react";
import { Link } from "react-router-dom";
import Cookies from "universal-cookie";
import { toast } from "react-toastify";
import CryptoJS from "crypto-js";

const RAW_BASE_URL =
  (typeof process !== "undefined" && process.env?.API_URL) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "https://lv3node.onrender.com";

const BASE_URL = RAW_BASE_URL.replace(/\/$/, "");

// Client-side encryption secret (must match what you used in TrackerForm)
const CLIENT_SECRET = "your_client_side_encryption_secret";

const decryptField = (ciphertext) => {
  if (!ciphertext) return null;
  // If it's not an encrypted string (e.g. legacy plain text), return as is
  if (typeof ciphertext !== "string" || !ciphertext.startsWith("U2FsdGVkX1")) {
    return ciphertext;
  }
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, CLIENT_SECRET);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedString) return ciphertext;
    try {
      return JSON.parse(decryptedString);
    } catch {
      return !isNaN(decryptedString) && decryptedString !== "" ? Number(decryptedString) : decryptedString;
    }
  } catch (error) {
    console.error("Decryption error:", error);
    return ciphertext;
  }
};

const encryptField = (data) => {
  if (data === null || data === undefined || data === "") return data;
  const stringValue = typeof data === "object" ? JSON.stringify(data) : String(data);
  return CryptoJS.AES.encrypt(stringValue, CLIENT_SECRET).toString();
};

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
  darkMode = false,
}) {
  const [inputValue, setInputValue] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const intervalRef = useRef(null);

  // Decrypt tracker properties safely
  const decryptedName = useMemo(() => decryptField(tracker?.name) || "Untitled", [tracker?.name]);
  const decryptedTarget = useMemo(() => Number(decryptField(tracker?.target)) || 0, [tracker?.target]);

  // Decrypt entries safely ensuring it always falls back to an array
  const decryptedEntries = useMemo(() => {
    const rawEntries = decryptField(tracker?.entries);
    return Array.isArray(rawEntries) ? rawEntries : [];
  }, [tracker?.entries]);

  const [localEntries, setLocalEntries] = useState(decryptedEntries);

  useEffect(() => {
    setLocalEntries(decryptedEntries);
  }, [decryptedEntries]);

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

  const syncEntryToDb = async (updatedEntriesList, successMessage = "Progress updated!") => {
    if (!trackerId) {
      toast.error("Cannot sync entry: Tracker ID is missing");
      return;
    }

    const cookies = new Cookies();
    const token = cookies.get("token");

    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // Encrypt the updated entries array before sending to backend
    const encryptedPayloadEntries = encryptField(updatedEntriesList);

    // Instant local update
    setLocalEntries(updatedEntriesList);
    const optimisticTracker = { ...tracker, entries: encryptedPayloadEntries };
    onUpdateTracker?.(optimisticTracker);

    try {
      let res = await fetch(`${BASE_URL}/api/v1/trackers/${trackerId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ entries: encryptedPayloadEntries }),
      });

      if (res.status === 404) {
        res = await fetch(`${BASE_URL}/api/trackers/${trackerId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ entries: encryptedPayloadEntries }),
        });
      }

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const updatedTrackerRes = await res.json();
      const finalTracker = updatedTrackerRes.data || updatedTrackerRes;
      
      const newDecryptedEntries = Array.isArray(decryptField(finalTracker.entries)) 
        ? decryptField(finalTracker.entries) 
        : updatedEntriesList;

      setLocalEntries(newDecryptedEntries);
      onUpdateTracker?.(finalTracker);
      
      toast.success(successMessage);
    } catch (err) {
      console.error("Database interaction error:", err);
      toast.error("Failed to sync progress with server.");
      setLocalEntries(decryptedEntries);
      onUpdateTracker?.(tracker);
    }
  };

  const handleHabitToggle = () => {
    const isCompleted = !todayEntry;
    const nextList = isCompleted
      ? [...localEntries.filter(e => getEntryDateString(e.date) !== today), { date: today, value: true }]
      : localEntries.filter((e) => getEntryDateString(e.date) !== today);

    syncEntryToDb(nextList, isCompleted ? "Habit marked as done! 🎉" : "Habit unmarked for today.");
  };

  const handleCounterChange = (delta) => {
    const currentVal = Number(todayEntry?.value) || 0;
    const nextVal = Math.max(0, currentVal + delta);

    const nextList = todayEntry
      ? localEntries.map((e) => (getEntryDateString(e.date) === today ? { ...e, value: nextVal } : e))
      : [...localEntries, { date: today, value: nextVal }];

    syncEntryToDb(nextList, "Counter updated successfully!");
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

        syncEntryToDb(nextList, "Timer session saved! ⏱️");
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

    syncEntryToDb(nextList, "Mood logged successfully! ✨");
  };

  const handleSaveAmount = () => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) return;

    const currentVal = Number(todayEntry?.value) || 0;
    const nextVal = currentVal + val;

    const nextList = todayEntry
      ? localEntries.map((e) => (getEntryDateString(e.date) === today ? { ...e, value: nextVal } : e))
      : [...localEntries, { date: today, value: nextVal }];

    syncEntryToDb(nextList, "Amount added successfully! 🎯");
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
    (currentTotal / (decryptedTarget || 1)) * 100,
    100
  );

  return (
    <div
      ref={cardRef}
      className="tracker-card-item"
      style={{
        backgroundColor: darkMode ? "#1e293b" : "#ffffff",
        border: darkMode ? "1px solid rgba(51, 65, 85, 0.8)" : "1px solid rgba(226, 232, 240, 0.8)",
        borderLeft: `6px solid ${tracker?.color || typeColor}`,
        borderRadius: "1.25rem",
        padding: "1.35rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        boxShadow: isNewlyAdded
          ? `0 0 0 3px ${tracker?.color || typeColor}55, 0 8px 16px -4px rgba(0, 0, 0, 0.08)`
          : darkMode ? "0 4px 6px -1px rgba(0, 0, 0, 0.2)" : "0 4px 6px -1px rgba(0, 0, 0, 0.02)",
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
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: darkMode ? "#f8fafc" : "#0f172a", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
              {decryptedName}
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
            if (!trackerId) {
              toast.error("Cannot delete: Missing tracker ID");
              return;
            }

            toast(
              ({ closeToast }) => (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "2px" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: darkMode ? "#f8fafc" : "#0f172a" }}>
                    Delete Tracker?
                  </span>
                  <p style={{ fontSize: "0.78rem", color: darkMode ? "#94a3b8" : "#64748b", margin: 0 }}>
                    Are you sure you want to delete <strong style={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>"{decryptedName}"</strong>?
                  </p>
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                    <button
                      onClick={() => {
                        onDelete(trackerId);
                        closeToast();
                      }}
                      style={{
                        flex: 1, backgroundColor: "#ef4444", color: "#ffffff", border: "none",
                        padding: "7px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700,
                      }}
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={closeToast}
                      style={{
                        flex: 1, backgroundColor: darkMode ? "#334155" : "#f1f5f9", color: darkMode ? "#f8fafc" : "#475569",
                        border: darkMode ? "1px solid #475569" : "1px solid #cbd5e1", padding: "7px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ),
              {
                position: "top-center",
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                closeButton: false,
                style: {
                  backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                  color: darkMode ? "#f8fafc" : "#0f172a",
                  border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                  borderRadius: "1rem",
                  padding: "1rem",
                },
              }
            );
          }}
          style={{
            backgroundColor: "transparent",
            border: darkMode ? "1px solid #7f1d1d" : "1px solid #fecdd3",
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
            backgroundColor: todayEntry ? `${tracker?.color || typeColor}20` : darkMode ? "#334155" : "#f8fafc",
            color: todayEntry ? tracker?.color || typeColor : darkMode ? "#cbd5e1" : "#64748b",
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
              width: "3rem", height: "3rem", borderRadius: "0.85rem", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: darkMode ? "#334155" : "#f8fafc", color: darkMode ? "#f8fafc" : "#334155", flexShrink: 0,
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
              width: "3rem", height: "3rem", borderRadius: "0.85rem", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: tracker?.color || typeColor, color: "#ffffff", flexShrink: 0,
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
          <p style={{ fontSize: "0.75rem", color: darkMode ? "#94a3b8" : "#64748b", marginBottom: "1rem", fontWeight: 500 }}>
            Saved Today: {formatTime(Number(todayEntry?.value) || 0)}
          </p>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              onClick={handleTimerToggle}
              style={{
                flex: 1, padding: "0.85rem", borderRadius: "0.85rem", border: "none",
                backgroundColor: tracker?.color || typeColor, color: "#ffffff", fontWeight: 700, cursor: "pointer",
              }}
            >
              {timerRunning ? "PAUSE & SAVE" : "START"}
            </button>
            <button
              onClick={() => { setTimerRunning(false); setTimerSeconds(0); }}
              style={{
                padding: "0.85rem", borderRadius: "0.85rem", border: "none",
                backgroundColor: darkMode ? "#334155" : "#f8fafc", cursor: "pointer", color: darkMode ? "#f8fafc" : "#334155",
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
                    flex: 1, padding: "0.7rem 0.2rem", borderRadius: "0.75rem",
                    border: isSelected ? `2px solid ${tracker?.color || typeColor}` : darkMode ? "2px solid #334155" : "2px solid #f1f5f9",
                    backgroundColor: isSelected ? `${tracker?.color || typeColor}15` : darkMode ? "#0f172a" : "#ffffff",
                    cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: "1.35rem", marginBottom: "0.2rem" }}>{m.emoji}</div>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: isSelected ? tracker?.color || typeColor : darkMode ? "#94a3b8" : "#64748b" }}>
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
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: darkMode ? "#f8fafc" : "#1e293b" }}>
                {currentTotal} <span style={{ color: "#94a3b8" }}>/ {decryptedTarget}</span>
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: tracker?.color || typeColor }}>
                {percentage.toFixed(0)}%
              </span>
            </div>
            <div style={{ width: "100%", height: "0.6rem", backgroundColor: darkMode ? "#334155" : "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%", width: `${percentage}%`, backgroundColor: tracker?.color || typeColor,
                  borderRadius: "9999px", transition: "width 0.4s ease",
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
                flex: 1, padding: "0.75rem 0.9rem", borderRadius: "0.85rem",
                border: darkMode ? "2px solid #334155" : "2px solid #f1f5f9", outline: "none",
                color: darkMode ? "#f8fafc" : "#1e293b", backgroundColor: darkMode ? "#0f172a" : "#f8fafc",
              }}
            />
            <button
              onClick={handleSaveAmount}
              disabled={!inputValue}
              style={{
                padding: "0.75rem 1.25rem", borderRadius: "0.85rem", border: "none",
                backgroundColor: tracker?.color || typeColor, color: "#ffffff",
                cursor: inputValue ? "pointer" : "not-allowed", fontWeight: 600, opacity: inputValue ? 1 : 0.6,
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: darkMode ? "1px solid #334155" : "1px solid #f1f5f9", marginTop: "auto" }}>
        <span style={{ fontSize: "0.75rem", color: darkMode ? "#94a3b8" : "#64748b", display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 500 }}>
          <Activity size={13} /> {localEntries.length} entries recorded
        </span>

        {trackerId && (
          <Link
            to={`/trackers/${trackerId}`}
            style={{
              fontSize: "0.75rem", fontWeight: 600, color: tracker?.color || typeColor,
              textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem",
            }}
          >
            View Entries <ExternalLink size={13} />
          </Link>
        )}
      </div>
    </div>
  );
}