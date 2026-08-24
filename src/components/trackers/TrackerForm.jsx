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
  { value: "habit", label: "Habit", description: "Daily yes/no", emoji: "✅" },
  { value: "counter", label: "Counter", description: "Count anything", emoji: "🔢" },
  { value: "timer", label: "Timer", description: "Track time spent", emoji: "⏱️" },
  { value: "goal", label: "Goal", description: "Progress to target", emoji: "🎯" },
  { value: "expense", label: "Expense", description: "Monitor spending", emoji: "💸" },
  { value: "mood", label: "Mood", description: "Log how you feel", emoji: "😊" },
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

const TARGET_TYPES = new Set(["counter", "goal", "expense", "timer"]);

export default function TrackerForm({ onCreate, onClose }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("habit");
  const [icon, setIcon] = useState("Star");
  const [color, setColor] = useState("#3b82f6");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Synchronous ref lock to prevent double submissions instantly
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || isSubmittingRef.current || loading) return;

    // Retrieve authentication token
    const cookies = new Cookies();
    const token = cookies.get("token");

    if (!token) {
      setErrorMsg("Session expired or missing authentication token. Please log in again.");
      return;
    }

    // Lock immediately
    isSubmittingRef.current = true;
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      name: name.trim(),
      type,
      icon,
      color,
      target: target ? parseFloat(target) : undefined,
      unit: unit.trim() || undefined,
      entries: [],
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      // Primary route attempt (/api/v1/trackers with fallback to /api/trackers)
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
      // Unlock only if it failed so user can retry
      isSubmittingRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const needsTarget = TARGET_TYPES.has(type);

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
          placeholder="e.g. Morning Run…"
          style={styles.input}
          disabled={loading}
          autoFocus
        />
      </div>

      <div>
        <label style={styles.label}>Type</label>
        <div style={styles.gridContainer}>
          {TRACKER_TYPES.map(({ value, label, emoji }) => {
            const isActive = type === value;
            return (
              <button
                key={value}
                type="button"
                disabled={loading}
                onClick={() => setType(value)}
                style={{
                  ...styles.typeBtn,
                  border: isActive
                    ? `2px solid ${color}`
                    : "1px solid #e2e8f0",
                  background: isActive ? `${color}10` : "white",
                }}
              >
                <div style={{ fontSize: "1.25rem" }}>{emoji}</div>
                <div style={styles.typeLabel}>{label}</div>
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
                border: color === c ? "2px solid #334155" : "none",
              }}
            >
              {color === c && <Check size={14} color="white" />}
            </button>
          ))}
        </div>
      </div>

      {needsTarget && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <input
            type="number"
            value={target}
            disabled={loading}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Target"
            style={{ ...styles.input, flex: "1 1 120px" }}
          />
          <input
            type="text"
            value={unit}
            disabled={loading}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Unit"
            style={{ ...styles.input, flex: "1 1 120px" }}
          />
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
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}

const styles = {
  errorBox: {
    padding: "0.75rem",
    borderRadius: "8px",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    fontSize: "0.875rem",
    border: "1px solid #fecaca",
  },
  form: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  label: {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#64748b",
    marginBottom: "0.5rem",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
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
    minWidth: "120px",
    boxSizing: "border-box",
  },
  typeLabel: { fontSize: "0.875rem", fontWeight: "600", color: "#334155" },
  iconContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    background: "#f8fafc",
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
    border: "1px solid #e2e8f0",
    background: "white",
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