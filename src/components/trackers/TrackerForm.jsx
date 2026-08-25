import { useState, useRef } from "react";
import { Check, X, Circle, Loader2 } from "lucide-react";
import * as Icons from "lucide-react";
import Cookies from "universal-cookie";

const RAW_BASE_URL =
  (typeof process !== "undefined" && process.env?.API_URL) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "https://lv3node.onrender.com";

const BASE_URL = RAW_BASE_URL.replace(/\/$/, "");

const TRACKER_TYPES = [
  { 
    value: "habit", 
    label: "Habit", 
    description: "Daily yes/no check-in", 
    emoji: "✅",
    defaultTarget: "",
    defaultUnit: "",
    namePlaceholder: "e.g. Morning Jog, Read 10 Pages..."
  },
  { 
    value: "counter", 
    label: "Counter", 
    description: "Count repetitions or items", 
    emoji: "🔢",
    defaultTarget: "50",
    defaultUnit: "reps",
    namePlaceholder: "e.g. Push-ups, Glasses of Water..."
  },
  { 
    value: "timer", 
    label: "Timer", 
    description: "Track time spent on tasks", 
    emoji: "⏱️",
    defaultTarget: "",
    defaultUnit: "",
    namePlaceholder: "e.g. Coding, Guitar Practice..."
  },
  { 
    value: "goal", 
    label: "Goal", 
    description: "Progress toward a target", 
    emoji: "🎯",
    defaultTarget: "100",
    defaultUnit: "pages",
    namePlaceholder: "e.g. Read Book, Save Money..."
  },
  { 
    value: "expense", 
    label: "Expense", 
    description: "Monitor spending budget", 
    emoji: "💸",
    defaultTarget: "5000",
    defaultUnit: "₦",
    namePlaceholder: "e.g. Monthly Budget, Groceries..."
  },
  { 
    value: "mood", 
    label: "Mood", 
    description: "Log your daily emotional state", 
    emoji: "😊",
    defaultTarget: "",
    defaultUnit: "",
    namePlaceholder: "e.g. Daily Reflection..."
  },
];

const ICON_OPTIONS = [
  "Dumbbell", "Droplet", "Book", "Coffee", "Moon", "Sun", "Heart", "Star",
  "Target", "TrendingUp", "Zap", "Apple", "Pizza", "Bike", "Music", "Camera",
  "Laptop", "Phone", "PiggyBank", "ShoppingCart", "Wallet", "DollarSign",
  "Home", "Car", "Briefcase", "GraduationCap", "Pill", "Activity", "Smile",
  "Timer", "Flame", "Leaf", "Globe", "Trophy",
];

const COLOR_OPTIONS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
];

const TARGET_TYPES = new Set(["counter", "goal", "expense"]);

export default function TrackerForm({ onCreate, onClose, darkMode = false }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("habit");
  const [icon, setIcon] = useState("Star");
  const [color, setColor] = useState("#3b82f6");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const isSubmittingRef = useRef(false);

  const handleTypeChange = (selectedTypeConfig) => {
    setType(selectedTypeConfig.value);
    if (TARGET_TYPES.has(selectedTypeConfig.value)) {
      setTarget(selectedTypeConfig.defaultTarget);
      setUnit(selectedTypeConfig.defaultUnit);
    } else {
      setTarget("");
      setUnit("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || isSubmittingRef.current || loading) return;

    const cookies = new Cookies();
    const token = cookies.get("token");

    if (!token) {
      setErrorMsg("Session expired or missing authentication token. Please log in again.");
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      name: name.trim(),
      type,
      icon,
      color,
      ...(TARGET_TYPES.has(type) && {
        target: target ? parseFloat(target) : undefined,
        unit: unit.trim() || undefined,
      }),
      entries: [],
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      let response = await fetch(`${BASE_URL}/api/v1/trackers`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (response.status === 404) {
        response = await fetch(`${BASE_URL}/api/trackers`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      }

      if (response.status === 401) {
        throw new Error("Session expired or unauthorized. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const createdTracker = await response.json();

      if (onCreate) onCreate(createdTracker);
      if (onClose) onClose();
    } catch (err) {
      console.error("Failed to create tracker:", err);
      setErrorMsg(err.message || "Failed to connect to backend server.");
    } finally {
      setLoading(false);
      // FIXED: Always release the submission lock whether successful or failed
      isSubmittingRef.current = false;
    }
  };

  const needsTarget = TARGET_TYPES.has(type);
  const activeTypeConfig = TRACKER_TYPES.find((t) => t.value === type) || TRACKER_TYPES[0];

  const styles = {
    errorBox: {
      padding: "0.75rem",
      borderRadius: "8px",
      backgroundColor: darkMode ? "#451a03" : "#fef2f2",
      color: darkMode ? "#f87171" : "#b91c1c",
      fontSize: "0.875rem",
      border: darkMode ? "1px solid #7f1d1d" : "1px solid #fecaca",
    },
    form: { display: "flex", flexDirection: "column", gap: "1.25rem" },
    label: {
      display: "block",
      fontSize: "0.75rem",
      fontWeight: "600",
      color: darkMode ? "#94a3b8" : "#64748b",
      marginBottom: "0.5rem",
      textTransform: "uppercase",
    },
    input: {
      width: "100%",
      padding: "0.75rem",
      borderRadius: "8px",
      border: darkMode ? "1px solid #334155" : "1px solid #cbd5e1",
      backgroundColor: darkMode ? "#1e293b" : "#ffffff",
      color: darkMode ? "#f8fafc" : "#1e293b",
      outline: "none",
      boxSizing: "border-box",
    },
    gridContainer: { display: "flex", flexWrap: "wrap", gap: "0.5rem" },
    typeBtn: {
      padding: "0.75rem",
      borderRadius: "8px",
      cursor: "pointer",
      textAlign: "left",
      flex: "1 1 calc(50% - 0.5rem)",
      minWidth: "135px",
      boxSizing: "border-box",
      transition: "all 0.2s ease",
    },
    typeLabel: { 
      fontSize: "0.875rem", 
      fontWeight: "600", 
      color: darkMode ? "#f8fafc" : "#334155" 
    },
    typeDesc: {
      fontSize: "0.7rem",
      color: darkMode ? "#94a3b8" : "#64748b",
      marginTop: "0.15rem",
    },
    iconContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: "0.5rem",
      background: darkMode ? "#1e293b" : "#f8fafc",
      border: darkMode ? "1px solid #334155" : "none",
      padding: "0.75rem",
      borderRadius: "8px",
      width: "100%",
      boxSizing: "border-box",
    },
    iconBtn: {
      padding: "0.5rem",
      borderRadius: "6px",
      border: "none",
      cursor: "pointer",
      flex: "0 0 auto",
    },
    colorBtn: {
      width: "28px",
      height: "28px",
      borderRadius: "6px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    actions: { display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1rem" },
    cancelBtn: {
      flex: "1 1 100px",
      padding: "0.75rem",
      borderRadius: "8px",
      border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
      background: darkMode ? "#1e293b" : "white",
      color: darkMode ? "#f8fafc" : "#0f172a",
      cursor: "pointer",
      fontWeight: "600",
    },
    submitBtn: {
      flex: "1 1 100px",
      padding: "0.75rem",
      borderRadius: "8px",
      border: "none",
      color: "white",
      cursor: "pointer",
      fontWeight: "600",
    },
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {errorMsg && (
        <div style={styles.errorBox}>
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      <div>
        <label style={styles.label}>Tracker Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={activeTypeConfig.namePlaceholder}
          style={styles.input}
          disabled={loading}
          autoFocus
        />
      </div>

      <div>
        <label style={styles.label}>Type</label>
        <div style={styles.gridContainer}>
          {TRACKER_TYPES.map((typeConfig) => {
            const isActive = type === typeConfig.value;
            return (
              <button
                key={typeConfig.value}
                type="button"
                disabled={loading}
                onClick={() => handleTypeChange(typeConfig)}
                style={{
                  ...styles.typeBtn,
                  border: isActive
                    ? `2px solid ${color}`
                    : darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                  background: isActive 
                    ? `${color}15` 
                    : darkMode ? "#0f172a" : "white",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>{typeConfig.emoji}</span>
                  <span style={styles.typeLabel}>{typeConfig.label}</span>
                </div>
                <div style={styles.typeDesc}>{typeConfig.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label style={styles.label}>Icon</label>
        <div style={styles.iconContainer}>
          {ICON_OPTIONS.map((iconName) => {
            const IconComp = Icons[iconName] || Circle;
            const isActive = icon === iconName;
            return (
              <button
                key={iconName}
                type="button"
                disabled={loading}
                onClick={() => setIcon(iconName)}
                style={{
                  ...styles.iconBtn,
                  background: isActive ? color : "transparent",
                  color: isActive ? "white" : "#94a3b8",
                }}
              >
                <IconComp size={16} />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label style={styles.label}>Color</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={loading}
              onClick={() => setColor(c)}
              style={{
                ...styles.colorBtn,
                background: c,
                border: color === c ? "2px solid #ffffff" : "none",
              }}
            >
              {color === c && <Check size={14} color="white" />}
            </button>
          ))}
        </div>
      </div>

      {needsTarget && (
        <div>
          <label style={styles.label}>Target & Unit Configuration</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <input
              type="number"
              value={target}
              disabled={loading}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Target value"
              style={{ ...styles.input, flex: "1 1 120px" }}
            />
            <input
              type="text"
              value={unit}
              disabled={loading}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Unit (e.g. reps)"
              style={{ ...styles.input, flex: "1 1 120px" }}
            />
          </div>
        </div>
      )}

      <div style={styles.actions}>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          style={styles.cancelBtn}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim() || loading}
          style={{
            ...styles.submitBtn,
            background: color,
            opacity: !name.trim() || loading ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Creating..." : "Create Tracker"}
        </button>
      </div>
    </form>
  );
}