import { useState, useEffect, useRef, useMemo } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import * as Icons from "lucide-react";

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

export function TrackerCard({ tracker, onDelete, onUpdate, onAddEntry }) {
  const [inputValue, setInputValue] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const intervalRef = useRef(null);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const todayEntry = tracker.entries?.find((e) => e.date === today);
  const IconComponent = Icons[tracker.icon] || Icons.Circle;
  const typeColor = TYPE_COLORS[tracker.type] || tracker.color;

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
        entries: tracker.entries.filter((e) => e.id !== todayEntry.id),
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
        entries: tracker.entries.map((e) =>
          e.id === todayEntry.id ? { ...e, value: next } : e
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
          entries: tracker.entries.map((e) =>
            e.id === todayEntry.id ? { ...e, value: Number(e.value) + val } : e
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
    () =>
      tracker.entries?.reduce((sum, e) => sum + (Number(e.value) || 0), 0) || 0,
    [tracker.entries]
  );

  const percentage = Math.min(
    (currentTotal / (tracker.target || 1)) * 100,
    100
  );

  return (
    <div
      className="tracker-card"
      style={{ borderLeft: `6px solid ${tracker.color}` }}
    >
      {/* Header */}
      <div className="card-header">
        <div className="header-info">
          <div
            className="icon-wrapper"
            style={{
              backgroundColor: `${tracker.color}15`,
              color: tracker.color,
            }}
          >
            <IconComponent size={24} />
          </div>
          <div>
            <h3 className="title-text">{tracker.name}</h3>
            <p className="subtitle-text" style={{ color: typeColor }}>
              {tracker.type}
            </p>
          </div>
        </div>
        <button onClick={() => onDelete(tracker.id)} className="btn-delete">
          Delete
        </button>
      </div>

      {/* Habit Section */}
      {tracker.type === "habit" && (
        <button
          onClick={handleHabitToggle}
          className="btn-habit"
          style={{
            backgroundColor: todayEntry ? `${tracker.color}15` : "#f1f5f9",
            color: todayEntry ? tracker.color : "#64748b",
          }}
        >
          {todayEntry ? "Completed Today" : "Mark Done"}
        </button>
      )}

      {/* Counter Section */}
      {tracker.type === "counter" && (
        <div className="counter-wrapper">
          <button
            onClick={() => handleCounterChange(-1)}
            className="btn-counter-action btn-counter-minus"
          >
            <Minus size={20} />
          </button>
          <span className="counter-value" style={{ color: tracker.color }}>
            {Number(todayEntry?.value) || 0}
          </span>
          <button
            onClick={() => handleCounterChange(1)}
            className="btn-counter-action btn-hover-opacity"
            style={{ backgroundColor: tracker.color, color: "#ffffff" }}
          >
            <Plus size={20} />
          </button>
        </div>
      )}

      {/* Timer Section */}
      {tracker.type === "timer" && (
        <div className="timer-wrapper">
          <div className="timer-display" style={{ color: tracker.color }}>
            {formatTime(timerSeconds)}
          </div>
          <div className="timer-actions">
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="btn-timer-toggle btn-hover-opacity"
              style={{ backgroundColor: tracker.color }}
            >
              {timerRunning ? "PAUSE" : "START"}
            </button>
            <button
              onClick={() => {
                setTimerRunning(false);
                setTimerSeconds(0);
              }}
              className="btn-timer-reset"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Mood Section */}
      {tracker.type === "mood" && (
        <div className="mood-container">
          {!todayEntry && (
            <div className="mood-grid">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => onAddEntry({ date: today, value: m.value })}
                  className="btn-mood-option"
                >
                  <div className="mood-emoji">{m.emoji}</div>
                  <span className="mood-label">{m.label}</span>
                </button>
              ))}
            </div>
          )}

          {todayEntry && (
            <div
              className="mood-summary"
              style={{ backgroundColor: `${tracker.color}10` }}
            >
              <p className="mood-summary-text" style={{ color: tracker.color }}>
                Today's Mood:{" "}
                {MOOD_OPTIONS.find((m) => m.value === todayEntry.value)?.label}
              </p>
              <div className="mood-summary-emoji">
                {MOOD_OPTIONS.find((m) => m.value === todayEntry.value)?.emoji}
              </div>
            </div>
          )}

          <div>
            <h4 className="history-title">Recent History</h4>
            <div className="history-scroll">
              {tracker.entries
                ?.slice(-7)
                .reverse()
                .map((entry) => (
                  <div key={entry.id || entry.date} className="history-item">
                    <span className="history-emoji">
                      {MOOD_OPTIONS.find((m) => m.value === entry.value)
                        ?.emoji || "❓"}
                    </span>
                    <span className="history-date">
                      {entry.date.slice(5)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Goal & Expense Section */}
      {(tracker.type === "goal" || tracker.type === "expense") && (
        <div className="goal-container">
          <div>
            <div className="goal-header">
              <span className="goal-total">
                {currentTotal}{" "}
                <span className="goal-target">/ {tracker.target}</span>
              </span>
              <span className="goal-percent" style={{ color: tracker.color }}>
                {percentage.toFixed(0)}%
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-bar"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: tracker.color,
                }}
              />
            </div>
          </div>
          <div className="input-actions">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter amount"
              className="amount-input"
            />
            <button
              onClick={handleSaveAmount}
              className="btn-add-amount btn-hover-opacity"
              style={{ backgroundColor: tracker.color }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Embedded CSS */}
      <style jsx>{`
        .tracker-card {
          background-color: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 1rem;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
          box-sizing: border-box;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .tracker-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          min-width: 200px;
        }

        .icon-wrapper {
          width: 3rem;
          height: 3rem;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .title-text {
          font-size: 1.125rem;
          font-weight: 800;
          margin: 0;
          color: #0f172a;
        }

        .subtitle-text {
          font-size: 0.75rem;
          margin-top: 0.25rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 0;
        }

        .btn-delete {
          background-color: transparent;
          border: 1px solid #fecdd3;
          color: #ef4444;
          padding: 0.375rem 0.75rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
          flex-shrink: 0;
          transition: background-color 0.2s ease;
        }

        .btn-delete:hover {
          background-color: #fef2f2;
        }

        .btn-habit {
          width: 100%;
          padding: 1rem;
          border-radius: 0.75rem;
          border: none;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .counter-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .btn-counter-action {
          width: 3rem;
          height: 3rem;
          border-radius: 0.75rem;
          border: none;
          cursor: pointer;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-counter-minus {
          background-color: #f1f5f9;
          color: #334155;
        }

        .btn-counter-minus:hover {
          background-color: #e2e8f0;
        }

        .counter-value {
          font-size: 2.25rem;
          font-weight: 800;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .timer-wrapper {
          text-align: center;
        }

        .timer-display {
          font-size: 3rem;
          font-weight: 800;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          margin-bottom: 1rem;
          word-break: break-all;
        }

        .timer-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .btn-timer-toggle {
          flex: 1;
          min-width: 120px;
          padding: 1rem;
          border-radius: 0.75rem;
          border: none;
          color: #ffffff;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-timer-reset {
          padding: 1rem;
          border-radius: 0.75rem;
          border: none;
          background-color: #f1f5f9;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #334155;
        }

        .btn-timer-reset:hover {
          background-color: #e2e8f0;
        }

        .mood-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .mood-grid {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .btn-mood-option {
          flex: 1;
          min-width: 60px;
          padding: 0.75rem;
          border-radius: 0.75rem;
          border: 2px solid #f1f5f9;
          background-color: #ffffff;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: border-color 0.2s ease;
        }

        .btn-mood-option:hover {
          border-color: #cbd5e1;
        }

        .mood-emoji {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
        }

        .mood-label {
          font-size: 0.65rem;
          font-weight: 600;
          color: #64748b;
        }

        .mood-summary {
          padding: 1rem;
          border-radius: 1rem;
          text-align: center;
        }

        .mood-summary-text {
          font-size: 0.875rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .mood-summary-emoji {
          font-size: 3rem;
        }

        .history-title {
          font-size: 0.7rem;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .history-scroll {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .history-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 40px;
          flex-shrink: 0;
        }

        .history-emoji {
          font-size: 1.25rem;
        }

        .history-date {
          font-size: 0.6rem;
          color: #64748b;
        }

        .goal-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .goal-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }

        .goal-total {
          font-size: 0.875rem;
          font-weight: 700;
        }

        .goal-target {
          color: #94a3b8;
        }

        .goal-percent {
          font-size: 0.75rem;
          font-weight: 700;
        }

        .progress-track {
          width: 100%;
          height: 0.625rem;
          background-color: #f1f5f9;
          border-radius: 9999px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          transition: width 0.5s ease;
        }

        .input-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .amount-input {
          flex: 1;
          min-width: 120px;
          padding: 0.75rem;
          border-radius: 0.75rem;
          border: 2px solid #f1f5f9;
          outline: none;
          color: #1e293b;
        }

        .btn-add-amount {
          flex: 1;
          min-width: 80px;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          border: none;
          color: #ffffff;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-hover-opacity:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}

// Container component
export function TrackerList() {
  const [trackers, setTrackers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/trackers")
      .then((res) => res.json())
      .then((data) => setTrackers(data));
  }, []);

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/api/trackers/${id}`, {
      method: "DELETE",
    });
    setTrackers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdate = async (id, updatedFields) => {
    const res = await fetch(`http://localhost:5000/api/trackers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFields),
    });
    const updatedTracker = await res.json();
    setTrackers((prev) => prev.map((t) => (t.id === id ? updatedTracker : t)));
  };

  const handleAddEntry = async (id, newEntry) => {
    const res = await fetch(
      `http://localhost:5000/api/trackers/${id}/entries`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      }
    );
    const updatedTracker = await res.json();
    setTrackers((prev) => prev.map((t) => (t.id === id ? updatedTracker : t)));
  };

  return (
    <div className="tracker-grid">
      {trackers.map((tracker) => (
        <TrackerCard
          key={tracker.id}
          tracker={tracker}
          onDelete={() => handleDelete(tracker.id)}
          onUpdate={(fields) => handleUpdate(tracker.id, fields)}
          onAddEntry={(entry) => handleAddEntry(tracker.id, entry)}
        />
      ))}

      <style jsx>{`
        .tracker-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .tracker-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .tracker-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
}