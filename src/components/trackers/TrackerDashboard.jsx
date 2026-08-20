import { TrendingUp, Target, CheckCircle, LayoutGrid } from "lucide-react";

// Helper to get local YYYY-MM-DD reliably without UTC timezone shifting
const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ADDED 'default' keyword here to fix the import error
export default function TrackerDashboard({ trackers = [] }) {
  const today = getLocalDateString(new Date());

  const total = trackers.length;

  // Safely check entries using optional chaining (?.)
  const completedToday = trackers.filter((t) => {
    if (t.type === "habit") {
      return t.entries?.some((e) => e.date === today && e.value === true);
    }
    return t.entries?.some((e) => e.date === today);
  }).length;

  const withGoals = trackers.filter((t) => t.target).length;
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
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            flex: "1 1 calc(25% - 16px)",
            minWidth: "200px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: `0 4px 6px -1px rgba(0,0,0,0.05), 0 0 0 1px ${card.color}22`,
          }}
        >
          {/* Icon Container */}
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

          {/* Content */}
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
                  color: "#94a3b8",
                  marginLeft: "4px",
                }}
              >
                {card.suffix}
              </span>
            )}

            <div
              style={{
                fontSize: "0.65rem",
                color: "#64748b",
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
  const currentDate = new Date();

  // Helper to check if any habit was completed on a specific date object
  const hasCompletionForDate = (dateObj) => {
    const dateStr = getLocalDateString(dateObj);
    return habitTrackers.some((t) =>
      t.entries?.some((e) => e.date === dateStr && e.value === true),
    );
  };

  // If the user hasn't done today's habit yet, we shouldn't break their streak.
  // We check if yesterday was completed instead.
  if (!hasCompletionForDate(currentDate)) {
    currentDate.setDate(currentDate.getDate() - 1);

    // If yesterday ALSO has no completion, the streak is truly 0.
    if (!hasCompletionForDate(currentDate)) {
      return 0;
    }
  }

  // Count backwards continuously
  while (streak < 365) {
    if (!hasCompletionForDate(currentDate)) break;
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}
