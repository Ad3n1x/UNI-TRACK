import React, { useState, useEffect, useRef, useMemo } from "react";
import { Minus, Plus, RotateCcw, ExternalLink, Activity, X } from "lucide-react";
import * as Icons from "lucide-react";
import Cookies from "universal-cookie";
import { toast } from "react-toastify";
import CryptoJS from "crypto-js";
import { initializeUserKeys, encryptData, decryptData } from "../../utils/e2ee";

const RAW_BASE_URL =
  (typeof process !== "undefined" && process.env?.API_URL) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "https://lv3node.onrender.com";

const BASE_URL = RAW_BASE_URL.replace(/\/$/, "");
const CLIENT_SECRET = "your_client_side_encryption_secret";

const decryptField = (ciphertext) => {
  if (!ciphertext) return null;
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
  fetchTrackers = () => {},
  cardRef = null,
  isNewlyAdded = false,
  darkMode = false,
}) {
  const [inputValue, setInputValue] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showEntriesModal, setShowEntriesModal] = useState(false);
  const intervalRef = useRef(null);

  const trackerId = tracker?._id || tracker?.id;

  const decryptedName = useMemo(() => decryptField(tracker?.name) || "Untitled", [tracker?.name]);
  const decryptedTarget = useMemo(() => Number(decryptField(tracker?.target)) || 0, [tracker?.target]);

  const decryptedType = useMemo(() => {
    const raw = decryptField(tracker?.type);
    return typeof raw === "string" ? raw.toLowerCase().trim() : "counter";
  }, [tracker?.type]);

  const decryptedColor = useMemo(() => decryptField(tracker?.color), [tracker?.color]);
  const decryptedIcon = useMemo(() => decryptField(tracker?.icon), [tracker?.icon]);

  const [localEntries, setLocalEntries] = useState([]);

  // Safely decrypt E2EE encrypted entries
  useEffect(() => {
    let isMounted = true;
    const loadEntries = async () => {
      if (!tracker?.entries) {
        if (isMounted) setLocalEntries([]);
        return;
      }
      try {
        const { privateKey } = await initializeUserKeys();
        const decrypted = await decryptData(privateKey, tracker.entries);
        if (isMounted) {
          if (Array.isArray(decrypted)) {
            setLocalEntries(decrypted);
          } else {
            const fallbackParsed = decryptField(tracker.entries);
            setLocalEntries(Array.isArray(fallbackParsed) ? fallbackParsed : []);
          }
        }
      } catch (err) {
        console.error("Error decrypting entries:", err);
        const fallbackParsed = decryptField(tracker.entries);
        if (isMounted) {
          setLocalEntries(Array.isArray(fallbackParsed) ? fallbackParsed : []);
        }
      }
    };
    loadEntries();
    return () => {
      isMounted = false;
    };
  }, [tracker?.entries]);

  const today = getLocalDateString();
  const todayEntry = localEntries.find((e) => getEntryDateString(e.date) === today);

  const IconComponent = Icons[decryptedIcon] || Icons.Circle;
  const typeColor = TYPE_COLORS[decryptedType] || decryptedColor || "#3b82f6";

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

    setLocalEntries(updatedEntriesList);

    const cookies = new Cookies();
    const token = cookies.get("token") || localStorage.getItem("token");

    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const { publicKey } = await initializeUserKeys();
      const encryptedPayloadEntries = await encryptData(publicKey, updatedEntriesList);

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

      if (!res.ok) {
        console.warn(`Server sync warning: HTTP ${res.status}. Keeping local state.`);
        toast.success(successMessage);
        fetchTrackers?.();
        return;
      }

      const updatedTrackerRes = await res.json();
      const finalTracker = updatedTrackerRes.data || updatedTrackerRes;

      if (finalTracker && finalTracker.entries) {
        const { privateKey } = await initializeUserKeys();
        const serverDecrypted = await decryptData(privateKey, finalTracker.entries);
        if (Array.isArray(serverDecrypted)) {
          setLocalEntries(serverDecrypted);
        }
      }

      onUpdateTracker?.(finalTracker);
      fetchTrackers?.();
      toast.success(successMessage);
    } catch (err) {
      console.error("Network sync error:", err);
      toast.success(successMessage);
      fetchTrackers?.();
    }
  };

  const handleHabitToggle = () => {
    const isCompleted = !todayEntry;
    const nextList = isCompleted
      ? [...localEntries.filter((e) => getEntryDateString(e.date) !== today), { date: today, value: true }]
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

  const formatEntryValue = (val) => {
    if (decryptedType === "timer") return formatTime(Number(val) || 0);
    if (decryptedType === "mood") {
      const match = MOOD_OPTIONS.find((m) => m.value === Number(val));
      return match ? `${match.emoji} ${match.label}` : val;
    }
    if (decryptedType === "habit") return val ? "Completed ✓" : "Not Done";
    return val;
  };

  const currentTotal = useMemo(
    () => localEntries.reduce((sum, e) => sum + (Number(e.value) || 0), 0),
    [localEntries]
  );

  const percentage = Math.min((currentTotal / (decryptedTarget || 1)) * 100, 100);

  return (
    <>
      <style>{`
        .tracker-card-item * {
          box-sizing: border-box;
        }
        @media (max-width: 480px) {
          .tracker-card-item {
            padding: 1rem !important;
            gap: 1rem !important;
            border-radius: 1rem !important;
          }
          .tracker-counter-value {
            font-size: 1.8rem !important;
          }
          .tracker-timer-value {
            font-size: 2rem !important;
          }
          .tracker-goal-inputs {
            flex-direction: column !important;
          }
          .tracker-goal-inputs button {
            width: 100% !important;
          }
        }
      `}</style>

      <div
        ref={cardRef}
        className="tracker-card-item"
        style={{
          backgroundColor: darkMode ? "#1e293b" : "#ffffff",
          border: darkMode ? "1px solid rgba(51, 65, 85, 0.8)" : "1px solid rgba(226, 232, 240, 0.8)",
          borderLeft: `6px solid ${decryptedColor || typeColor}`,
          borderRadius: "1.25rem",
          padding: "1.35rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          boxShadow: isNewlyAdded
            ? `0 0 0 3px ${decryptedColor || typeColor}55, 0 8px 16px -4px rgba(0, 0, 0, 0.08)`
            : darkMode
              ? "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
              : "0 4px 6px -1px rgba(0, 0, 0, 0.02)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
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
                backgroundColor: `${decryptedColor || typeColor}15`,
                color: decryptedColor || typeColor,
                flexShrink: 0,
              }}
            >
              <IconComponent size={22} />
            </div>
            <div style={{ minWidth: 0, overflow: "hidden", flex: 1 }}>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  margin: 0,
                  color: darkMode ? "#f8fafc" : "#0f172a",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  width: "100%",
                }}
              >
                {decryptedName}
              </h3>
              <p
                style={{
                  fontSize: "0.7rem",
                  marginTop: "0.2rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  margin: 0,
                  color: typeColor,
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {decryptedType}
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "2px", width: "100%", boxSizing: "border-box" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: darkMode ? "#f8fafc" : "#0f172a" }}>
                      Delete Tracker?
                    </span>
                    <p style={{ fontSize: "0.78rem", color: darkMode ? "#94a3b8" : "#64748b", margin: 0 }}>
                      Are you sure you want to delete <strong style={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>"{decryptedName}"</strong>?
                    </p>
                    <div style={{ display: "flex", gap: "8px", marginTop: "6px", width: "100%", minWidth: 0 }}>
                      <button
                        onClick={() => {
                          onDelete(trackerId);
                          closeToast();
                        }}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          backgroundColor: "#ef4444",
                          color: "#ffffff",
                          border: "none",
                          padding: "7px 12px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                        }}
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={closeToast}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          backgroundColor: darkMode ? "#334155" : "#f1f5f9",
                          color: darkMode ? "#f8fafc" : "#475569",
                          border: darkMode ? "1px solid #475569" : "1px solid #cbd5e1",
                          padding: "7px 12px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "0.78rem",
                          fontWeight: 600,
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

        {decryptedType === "habit" && (
          <button
            onClick={handleHabitToggle}
            style={{
              width: "100%",
              minWidth: 0,
              padding: "0.95rem",
              borderRadius: "0.85rem",
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
              backgroundColor: todayEntry ? `${decryptedColor || typeColor}20` : darkMode ? "#334155" : "#f8fafc",
              color: todayEntry ? decryptedColor || typeColor : darkMode ? "#cbd5e1" : "#64748b",
              transition: "all 0.2s ease",
            }}
          >
            {todayEntry ? "Completed Today ✓" : "Mark Done"}
          </button>
        )}

        {(decryptedType === "counter" || (!["habit", "timer", "mood", "goal", "expense"].includes(decryptedType))) && (
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
                backgroundColor: darkMode ? "#334155" : "#f8fafc",
                color: darkMode ? "#f8fafc" : "#334155",
                flexShrink: 0,
              }}
            >
              <Minus size={18} />
            </button>
            <span
              className="tracker-counter-value"
              style={{
                fontSize: "2.25rem",
                fontWeight: 800,
                fontFamily: "monospace",
                color: decryptedColor || typeColor,
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flex: 1,
              }}
            >
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
                backgroundColor: decryptedColor || typeColor,
                color: "#ffffff",
                flexShrink: 0,
              }}
            >
              <Plus size={18} />
            </button>
          </div>
        )}

        {decryptedType === "timer" && (
          <div style={{ textAlign: "center", width: "100%", minWidth: 0 }}>
            <div
              className="tracker-timer-value"
              style={{
                fontSize: "2.5rem",
                fontWeight: 800,
                fontFamily: "monospace",
                color: decryptedColor || typeColor,
                marginBottom: "0.2rem",
                wordBreak: "break-all",
              }}
            >
              {formatTime(timerSeconds)}
            </div>
            <p style={{ fontSize: "0.75rem", color: darkMode ? "#94a3b8" : "#64748b", marginBottom: "1rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", minWidth: 0 }}>
              Saved Today: {formatTime(Number(todayEntry?.value) || 0)}
            </p>
            <div style={{ display: "flex", gap: "0.6rem", width: "100%" }}>
              <button
                onClick={handleTimerToggle}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "0.85rem",
                  borderRadius: "0.85rem",
                  border: "none",
                  backgroundColor: decryptedColor || typeColor,
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: "pointer",
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
                  backgroundColor: darkMode ? "#334155" : "#f8fafc",
                  cursor: "pointer",
                  color: darkMode ? "#f8fafc" : "#334155",
                }}
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        )}

        {decryptedType === "mood" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "0.35rem", width: "100%" }}>
            {MOOD_OPTIONS.map((m) => {
              const isSelected = todayEntry?.value === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => handleMoodSelect(m.value)}
                  style={{
                    padding: "0.6rem 0.1rem",
                    borderRadius: "0.75rem",
                    border: isSelected
                      ? `2px solid ${decryptedColor || typeColor}`
                      : darkMode
                      ? "2px solid #334155"
                      : "2px solid #f1f5f9",
                    backgroundColor: isSelected ? `${decryptedColor || typeColor}15` : darkMode ? "#0f172a" : "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 0,
                    width: "100%",
                  }}
                >
                  <div style={{ fontSize: "1.25rem", marginBottom: "0.15rem", lineHeight: 1 }}>{m.emoji}</div>
                  <span
                    style={{
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      color: isSelected ? decryptedColor || typeColor : darkMode ? "#94a3b8" : "#64748b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {(decryptedType === "goal" || decryptedType === "expense") && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.95rem", width: "100%", minWidth: 0 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", gap: "0.5rem" }}>
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: darkMode ? "#f8fafc" : "#1e293b",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentTotal} <span style={{ color: "#94a3b8" }}>/ {decryptedTarget}</span>
                </span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: decryptedColor || typeColor, flexShrink: 0 }}>
                  {percentage.toFixed(0)}%
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  backgroundColor: darkMode ? "#334155" : "#f1f5f9",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${percentage}%`,
                    height: "100%",
                    backgroundColor: decryptedColor || typeColor,
                    borderRadius: "4px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
            <div className="tracker-goal-inputs" style={{ display: "flex", gap: "0.6rem", width: "100%" }}>
              <input
                type="number"
                placeholder="Add amount..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveAmount();
                }}
                style={{
                  flex: 1,
                  padding: "0.75rem 0.9rem",
                  borderRadius: "0.85rem",
                  border: darkMode ? "1px solid #334155" : "1px solid #cbd5e1",
                  backgroundColor: darkMode ? "#0f172a" : "#ffffff",
                  color: darkMode ? "#f8fafc" : "#0f172a",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={handleSaveAmount}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: "0.85rem",
                  border: "none",
                  backgroundColor: decryptedColor || typeColor,
                  color: "#ffffff",
                  cursor: inputValue ? "pointer" : "not-allowed",
                  fontWeight: 600,
                  opacity: inputValue ? 1 : 0.6,
                  flexShrink: 0,
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Footer Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "0.5rem",
            borderTop: darkMode ? "1px solid #334155" : "1px solid #f1f5f9",
            marginTop: "auto",
            width: "100%",
            minWidth: 0,
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              color: darkMode ? "#94a3b8" : "#64748b",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              minWidth: 0,
            }}
          >
            <Activity size={13} style={{ flexShrink: 0 }} /> {localEntries.length} entries recorded
          </span>

          {trackerId && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowEntriesModal(true);
              }}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: decryptedColor || typeColor,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: 0,
                flexShrink: 0,
              }}
            >
              View Entries <ExternalLink size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Entries Popup Modal */}
      {showEntriesModal && (
        <div
          onClick={() => setShowEntriesModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: darkMode ? "#1e293b" : "#ffffff",
              border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
              borderRadius: "1.25rem",
              width: "100%",
              maxWidth: "440px",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.25rem",
                borderBottom: darkMode ? "1px solid #334155" : "1px solid #f1f5f9",
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: darkMode ? "#f8fafc" : "#0f172a" }}>
                  {decryptedName} Entries
                </h4>
                <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.75rem", color: darkMode ? "#94a3b8" : "#64748b" }}>
                  Total Recorded: {localEntries.length}
                </p>
              </div>
              <button
                onClick={() => setShowEntriesModal(false)}
                style={{
                  background: darkMode ? "#334155" : "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "2rem",
                  height: "2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: darkMode ? "#f8fafc" : "#64748b",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body / Entry List */}
            <div
              style={{
                padding: "1.25rem",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                flex: 1,
              }}
            >
              {localEntries.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem 0", color: darkMode ? "#94a3b8" : "#64748b", fontSize: "0.85rem" }}>
                  No entries found for this tracker yet.
                </div>
              ) : (
                localEntries
                  .slice()
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((entry, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.85rem 1rem",
                        borderRadius: "0.75rem",
                        backgroundColor: darkMode ? "#0f172a" : "#f8fafc",
                        border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                      }}
                    >
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: darkMode ? "#cbd5e1" : "#334155" }}>
                        {getEntryDateString(entry.date) || entry.date}
                      </span>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: decryptedColor || typeColor,
                          fontFamily: "monospace",
                        }}
                      >
                        {formatEntryValue(entry.value)}
                      </span>
                    </div>
                  ))
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "1rem 1.25rem",
                borderTop: darkMode ? "1px solid #334155" : "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowEntriesModal(false)}
                style={{
                  padding: "0.6rem 1.25rem",
                  borderRadius: "0.75rem",
                  border: "none",
                  backgroundColor: decryptedColor || typeColor,
                  color: "#ffffff",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}