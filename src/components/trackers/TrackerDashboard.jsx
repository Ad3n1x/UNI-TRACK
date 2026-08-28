import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  Target,
  CheckCircle,
  LayoutGrid,
  Search,
  ArrowLeft,
  Calendar,
  ListTodo
} from "lucide-react";
import CryptoJS from "crypto-js";

// Must match the secret used across your application
const CLIENT_SECRET = "your_client_side_encryption_secret";

/**
 * Utility function to decrypt AES encrypted strings or standard objects/primitives.
 */
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
      return !isNaN(decryptedString) && decryptedString !== ""
        ? Number(decryptedString)
        : decryptedString;
    }
  } catch (error) {
    console.error("Decryption error:", error);
    return ciphertext;
  }
};

/**
 * Universal date string formatter (YYYY-MM-DD)
 */
const getFormattedDate = (val) => {
  if (!val) return "";
  if (typeof val === "string" && val.length >= 10) return val.substring(0, 10);
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};

export default function DashboardPage({ trackers = [], darkMode = false, onBack }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const todayStr = getFormattedDate(new Date());

  // Process all tracker data
  const { total, completedToday, withGoals, activeStreak, decryptedTrackers } = useMemo(() => {
    const safeTrackers = Array.isArray(trackers) ? trackers : [];

    // Decrypt all relevant properties for each tracker
    const decrypted = safeTrackers.map((t) => {
      const name = decryptField(t?.name || t?.trackerName);
      const type = decryptField(t?.type);
      const target = decryptField(t?.target);
      const entries = Array.isArray(decryptField(t?.entries)) ? decryptField(t?.entries) : [];
      const description = decryptField(t?.description);

      return {
        ...t,
        name: typeof name === "string" ? name : t?.name || t?.trackerName || "Untitled Tracker",
        type: typeof type === "string" ? type : "general",
        target: target,
        entries: entries,
        description: typeof description === "string" ? description : "",
      };
    });

    // Check completion status on a given date string
    const isCompletedOnDate = (tracker, targetDateStr) => {
      if (Array.isArray(tracker.entries)) {
        const found = tracker.entries.some((entry) => {
          if (!entry) return false;
          if (typeof entry === "string") {
            return getFormattedDate(entry) === targetDateStr;
          }
          const entryDate = entry.date || entry.createdAt || entry.timestamp;
          if (!entryDate) return false;

          const matchesDate = getFormattedDate(entryDate) === targetDateStr;
          if (!matchesDate) return false;

          const val = entry.completed ?? entry.value ?? entry.status;
          if (val === false || val === "false" || val === 0 || val === "no") return false;
          return true;
        });
        if (found) return true;
      }

      const altLists = tracker.completedDates || tracker.history || tracker.dates;
      if (Array.isArray(altLists)) {
        return altLists.some((d) => getFormattedDate(d) === targetDateStr);
      }

      return false;
    };

    const completedCount = decrypted.filter((t) => isCompletedOnDate(t, todayStr)).length;
    const goalsCount = decrypted.filter((t) => t.target != null && t.target !== "").length;

    // Active streak calculation
    let streak = 0;
    const habitTrackers = decrypted.filter((t) => t.type === "habit" || t.entries.length > 0 || t.completedDates);

    if (habitTrackers.length > 0) {
      let checkDate = new Date();

      const hasCompletionForDay = (targetDateObj) => {
        const targetStr = getFormattedDate(targetDateObj);
        return habitTrackers.some((t) => isCompletedOnDate(t, targetStr));
      };

      if (!hasCompletionForDay(checkDate)) {
        checkDate.setDate(checkDate.getDate() - 1);
        if (hasCompletionForDay(checkDate)) {
          let currentCheck = new Date(checkDate);
          while (streak < 365) {
            if (!hasCompletionForDay(currentCheck)) break;
            streak++;
            currentCheck.setDate(currentCheck.getDate() - 1);
          }
        }
      } else {
        let currentCheck = new Date(checkDate);
        while (streak < 365) {
          if (!hasCompletionForDay(currentCheck)) break;
          streak++;
          currentCheck.setDate(currentCheck.getDate() - 1);
        }
      }
    }

    return {
      total: decrypted.length,
      completedToday: completedCount,
      withGoals: goalsCount,
      activeStreak: streak,
      decryptedTrackers: decrypted,
    };
  }, [trackers, todayStr]);

  // Filter trackers by active tab and search query
  const filteredTrackers = useMemo(() => {
    return decryptedTrackers.filter((tracker) => {
      let matchesTab = true;

      if (activeFilter === "completed") {
        matchesTab = tracker.entries.some((e) => {
          const entryDate = typeof e === "string" ? e : e?.date || e?.createdAt || e?.timestamp;
          return entryDate && getFormattedDate(entryDate) === todayStr;
        });
      } else if (activeFilter === "goals") {
        matchesTab = tracker.target != null && tracker.target !== "";
      } else if (activeFilter === "streak") {
        matchesTab = tracker.type === "habit" || tracker.entries.length > 0;
      }

      const query = searchTerm.toLowerCase();
      const matchesSearch =
        tracker.name.toLowerCase().includes(query) ||
        tracker.type.toLowerCase().includes(query) ||
        tracker.description.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [decryptedTrackers, activeFilter, searchTerm, todayStr]);

  const cards = [
    {
      id: "all",
      label: "Total Trackers",
      value: total,
      icon: <LayoutGrid size={20} />,
      color: "#7c3aed",
      glow: "rgba(124,58,237,0.12)",
    },
    {
      id: "completed",
      label: "Done Today",
      value: `${completedToday}/${total}`,
      icon: <CheckCircle size={20} />,
      color: "#10b981",
      glow: "rgba(16,185,129,0.12)",
    },
    {
      id: "goals",
      label: "Active Goals",
      value: withGoals,
      icon: <Target size={20} />,
      color: "#3b82f6",
      glow: "rgba(59,130,246,0.12)",
    },
    {
      id: "streak",
      label: "Day Streak",
      value: activeStreak,
      icon: <TrendingUp size={20} />,
      color: "#f59e0b",
      glow: "rgba(245,158,11,0.12)",
      suffix: "days",
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        padding: "32px 24px",
        backgroundColor: darkMode ? "transparent" : "#f8fafc",
        color: darkMode ? "#f8fafc" : "#1e293b",
        boxSizing: "border-box",
      }}
    >
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "10px",
                backgroundColor: darkMode ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
                border: darkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #e2e8f0",
                color: darkMode ? "#f8fafc" : "#1e293b",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.875rem",
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: "800", tracking: "-0.025em" }}>
              Analytics Dashboard
            </h1>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: darkMode ? "#94a3b8" : "#64748b" }}>
              Real-time insights for all active trackers
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {cards.map((card) => {
          const isSelected = activeFilter === card.id;
          return (
            <div
              key={card.id}
              onClick={() => setActiveFilter(card.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActiveFilter(card.id)}
              style={{
                backgroundColor: darkMode ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                border: isSelected
                  ? `2px solid ${card.color}`
                  : darkMode
                  ? "1px solid rgba(255, 255, 255, 0.08)"
                  : "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                boxShadow: darkMode
                  ? "0 4px 12px rgba(0, 0, 0, 0.15)"
                  : `0 4px 6px -1px rgba(0,0,0,0.05), 0 0 0 1px ${card.color}22`,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: card.glow,
                  color: card.color,
                }}
              >
                {card.icon}
              </div>

              <div>
                <div
                  style={{
                    fontSize: "1.875rem",
                    fontWeight: "800",
                    lineHeight: "1",
                    fontFamily: "'DM Mono', monospace",
                    color: card.color,
                  }}
                >
                  {card.value}
                  {card.suffix && (
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginLeft: "6px" }}>
                      {card.suffix}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: "0.65rem",
                    color: darkMode ? "#94a3b8" : "#64748b",
                    marginTop: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    fontWeight: "700",
                  }}
                >
                  {card.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          justify: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["all", "completed", "goals", "streak"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: activeFilter === tab ? "none" : darkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #cbd5e1",
                backgroundColor: activeFilter === tab ? "#7c3aed" : darkMode ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
                color: activeFilter === tab ? "#ffffff" : darkMode ? "#94a3b8" : "#64748b",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.85rem",
                textTransform: "capitalize",
                transition: "all 0.15s ease",
              }}
            >
              {tab === "all" ? "All Trackers" : tab.replace("-", " ")}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search trackers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              borderRadius: "10px",
              border: darkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #cbd5e1",
              backgroundColor: darkMode ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
              color: darkMode ? "#f8fafc" : "#1e293b",
              outline: "none",
              fontSize: "0.875rem",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Trackers Data Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {filteredTrackers.map((tracker) => {
          const isDoneToday = tracker.entries.some(
            (e) => getFormattedDate(typeof e === "string" ? e : e?.date || e?.createdAt) === todayStr
          );

          return (
            <div
              key={tracker._id || tracker.id || Math.random()}
              style={{
                backgroundColor: darkMode ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                border: darkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.15)" : "0 4px 6px -1px rgba(0,0,0,0.05)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>{tracker.name}</h3>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      backgroundColor: isDoneToday ? "rgba(16,185,129,0.15)" : "rgba(124,58,237,0.15)",
                      color: isDoneToday ? "#10b981" : "#7c3aed",
                      fontWeight: "700",
                      textTransform: "uppercase",
                    }}
                  >
                    {isDoneToday ? "Done Today" : tracker.type}
                  </span>
                </div>

                {tracker.description && (
                  <p style={{ fontSize: "0.85rem", color: darkMode ? "#94a3b8" : "#64748b", margin: "0 0 16px 0" }}>
                    {tracker.description}
                  </p>
                )}
              </div>

              <div
                style={{
                  paddingTop: "12px",
                  borderTop: darkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #f1f5f9",
                  display: "flex",
                  justify: "space-between",
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Target size={14} /> Goal: {tracker.target != null ? tracker.target : "N/A"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <ListTodo size={14} /> Logs: {tracker.entries.length}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTrackers.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
          <p style={{ fontSize: "1rem" }}>No trackers match your current view/filter.</p>
        </div>
      )}
    </div>
  );
}