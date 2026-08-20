import { useState } from "react";
import { Check, X, Circle } from "lucide-react";
import * as Icons from "lucide-react";

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate?.({
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      icon,
      color,
      target: target ? parseFloat(target) : undefined,
      unit: unit.trim() || undefined,
      entries: [],
    });

    onClose?.();
  };

  const needsTarget = TARGET_TYPES.has(type);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>New Tracker</h2>
            <p style={styles.subtitle}>Configure and start tracking</p>
          </div>
          <button type="button" onClick={onClose} style={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Tracker Name */}
          <div>
            <label style={styles.label}>Tracker Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Run…"
              style={styles.input}
              autoFocus
            />
          </div>

          {/* Type Selection */}
          <div>
            <label style={styles.label}>Type</label>
            <div style={styles.gridContainer}>
              {TRACKER_TYPES.map(({ value, label, emoji }) => {
                const isActive = type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    style={{
                      ...styles.typeBtn,
                      border: isActive ? `2px solid ${color}` : "1px solid #e2e8f0",
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

          {/* Icon Picker */}
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

          {/* Color Swatches */}
          <div>
            <label style={styles.label}>Color</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
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

          {/* Dynamic Target Inputs */}
          {needsTarget && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Target"
                style={{ ...styles.input, flex: "1 1 120px" }}
              />
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Unit"
                style={{ ...styles.input, flex: "1 1 120px" }}
              />
            </div>
          )}

          {/* Form Controls */}
          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                ...styles.submitBtn,
                background: color,
                opacity: !name.trim() ? 0.5 : 1,
              }}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Extracted style objects to keep markup readable
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    padding: "1rem",
  },
  modal: {
    background: "white",
    borderRadius: "16px",
    maxWidth: "480px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  header: {
    padding: "1.5rem",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: "1.125rem", fontWeight: "600", margin: 0, color: "#1e293b" },
  subtitle: { fontSize: "0.875rem", color: "#64748b", margin: "0.25rem 0 0 0" },
  closeBtn: {
    padding: "0.5rem",
    borderRadius: "8px",
    border: "none",
    background: "#f8fafc",
    cursor: "pointer",
    display: "flex",
  },
  form: { padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" },
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