import React, { useEffect } from "react";
import { TrendingUp, Target, CheckCircle, LayoutGrid } from "lucide-react";

const API_BASE = "https://lv3node.onrender.com/api/trackers";

export default function TrackerDashboard({ trackers = [], onRefresh, darkMode = false }) {
  // Poll the backend every second for live updates
  useEffect(() => {
    if (!onRefresh) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(API_BASE);
        if (res.ok) {
          const latestData = await res.json();
          // Pass updated trackers back up to the parent component
          onRefresh(latestData);
        }
      } catch (err) {
        console.error("Background polling error:", err);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [onRefresh]);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

  const total = trackers.length;

  const completedToday = trackers.filter((t) => {
    if (!t.entries || !Array.isArray(t.entries)) return false;
    
    return t.entries.some((e) => {
      if (!e.date) return false;
      const entryTime = new Date(e.date).getTime();
      if (isNaN(entryTime)) return false;

      const isWithinToday = entryTime >= startOfToday && entryTime <= endOfToday;

      if (t.type === "habit") {
        return isWithinToday && e.value === true;
      }
      return isWithinToday;
    });
  }).length;

  const withGoals = trackers.filter((t) => t.target != null && t.target !== "").length;
  const activeStreak = calculateStreak(trackers);

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
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        width: "100%",
        marginBottom: "2rem",
      }}
    >
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
              <span
                style={{
                  fontSize: "0.75rem",
                  color: darkMode ? "#94a3b8" : "#94a3b8",
                  marginLeft: "4px",
                }}
              >
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
  );
}

function calculateStreak(trackers) {
  if (!trackers || trackers.length === 0) return 0;

  const habitTrackers = trackers.filter((t) => t.type === "habit");
  if (habitTrackers.length === 0) return 0;

  let streak = 0;
  let checkDate = new Date();

  const hasCompletionForDay = (targetDate) => {
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    return habitTrackers.some((t) =>
      t.entries?.some((e) => {
        if (!e.date) return false;
        const entryTime = new Date(e.date).getTime();
        if (isNaN(entryTime)) return false;
        return entryTime >= startOfDay && entryTime <= endOfDay && e.value === true;
      })
    );
  };

  if (!hasCompletionForDay(checkDate)) {
    checkDate.setDate(checkDate.getDate() - 1);

    if (!hasCompletionForDay(checkDate)) {
      return 0;
    }
  }

  while (streak < 365) {
    if (!hasCompletionForDay(checkDate)) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}