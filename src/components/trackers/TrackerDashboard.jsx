import React, { useMemo } from "react";
import { TrendingUp, Target, CheckCircle, LayoutGrid } from "lucide-react";
import CryptoJS from "crypto-js";

const CLIENT_SECRET = "your_client_side_encryption_secret";

const decryptField = (ciphertext) => {
  if (!ciphertext) return null;
  // If already an array or object (already decrypted by HomePage), return as-is immediately
  if (typeof ciphertext === "object") return ciphertext;
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
    console.error("Decryption error in dashboard:", error);
    return ciphertext;
  }
};

export default function TrackerDashboard({ trackers = [], darkMode = false }) {
  const { total, completedToday, withGoals, activeStreak } = useMemo(() => {
    const safeTrackers = Array.isArray(trackers) ? trackers : [];

    // Decrypt and normalize trackers safely
    const decryptedTrackers = safeTrackers.map((t) => {
      const rawEntries = decryptField(t?.entries);
      return {
        ...t,
        type: decryptField(t?.type),
        target: decryptField(t?.target),
        entries: Array.isArray(rawEntries) ? rawEntries : [],
      };
    });

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

    const todayStr = getFormattedDate(new Date());
    const totalCount = decryptedTrackers.length;

    const isCompletedOnDate = (tracker, targetDateStr) => {
      if (Array.isArray(tracker.entries) && tracker.entries.length > 0) {
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

    const completedCount = decryptedTrackers.filter((t) => isCompletedOnDate(t, todayStr)).length;
    const goalsCount = decryptedTrackers.filter((t) => t.target != null && t.target !== "").length;

    let streak = 0;
    const habitTrackers = decryptedTrackers.filter((t) => t.type === "habit" || t.entries?.length > 0 || t.completedDates);

    if (habitTrackers.length > 0) {
      let checkDate = new Date();

      const hasCompletionForDay = (targetDateObj) => {
        const targetStr = getFormattedDate(targetDateObj);
        return habitTrackers.some((t) => isCompletedOnDate(t, targetStr));
      };

      if (!hasCompletionForDay(checkDate)) {
        checkDate.setDate(checkDate.getDate() - 1);
        if (!hasCompletionForDay(checkDate)) {
          streak = 0;
        } else {
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
      total: totalCount,
      completedToday: completedCount,
      withGoals: goalsCount,
      activeStreak: streak,
    };
  }, [trackers]);

  const cards = [
    {
      label: "Total Trackers",
      value: total,
      icon: <LayoutGrid size={18} />,
      color: "#7c3aed",
      glow: "rgba(124,58,237,0.12)",
    },
    {
      label: "Done Today",
      value: `${completedToday}/${total}`,
      icon: <CheckCircle size={18} />,
      color: "#10b981",
      glow: "rgba(16,185,129,0.12)",
    },
    {
      label: "Active Goals",
      value: withGoals,
      icon: <Target size={18} />,
      color: "#3b82f6",
      glow: "rgba(59,130,246,0.12)",
    },
    {
      label: "Day Streak",
      value: activeStreak,
      icon: <TrendingUp size={18} />,
      color: "#f59e0b",
      glow: "rgba(245,158,11,0.12)",
      suffix: "days",
    },
  ];

  return (
    <div style={{ width: "100%", marginBottom: "2rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", width: "100%" }}>
        {cards.map((card) => (
          <div
            key={card.label}
            style={{
              flex: "1 1 calc(25% - 16px)",
              minWidth: "200px",
              backgroundColor: darkMode ? "#1e293b" : "#ffffff",
              border: darkMode ? "1px solid rgba(51, 65, 85, 0.8)" : "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxShadow: darkMode
                ? "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
                : `0 4px 6px -1px rgba(0,0,0,0.05), 0 0 0 1px ${card.color}22`,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
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
              </div>

              {card.suffix && (
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginLeft: "4px" }}>
                  {card.suffix}
                </span>
              )}

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
        ))}
      </div>
    </div>
  );
}