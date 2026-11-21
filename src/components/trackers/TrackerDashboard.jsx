import React, { useMemo } from "react";
import { Target, CheckCircle2, LayoutGrid, ListTodo } from "lucide-react";

const dateKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
};

export default function DashboardPage({ trackers = [], darkMode = false }) {
  const today = dateKey(new Date());
  const stats = useMemo(() => {
    const valid = (Array.isArray(trackers) ? trackers : []).filter((t) => t && !t.__locked);
    const completed = valid.filter((tracker) => (Array.isArray(tracker.entries) ? tracker.entries : []).some((entry) => {
      const date = typeof entry === "string" ? entry : entry?.date || entry?.createdAt || entry?.timestamp;
      const value = typeof entry === "object" ? (entry.completed ?? entry.value ?? entry.status) : true;
      return dateKey(date) === today && value !== false && value !== "false" && value !== 0 && value !== "no";
    })).length;
    const goals = valid.filter((tracker) => tracker.target !== null && tracker.target !== undefined && tracker.target !== "").length;
    const logs = valid.reduce((sum, tracker) => sum + (Array.isArray(tracker.entries) ? tracker.entries.length : 0), 0);
    return { total: (Array.isArray(trackers) ? trackers : []).length, completed, goals, logs };
  }, [trackers, today]);

  const cards = [
    { label: "Total trackers", value: stats.total, icon: LayoutGrid, tone: "blue", note: "Across your workspace" },
    { label: "Completed today", value: `${stats.completed}/${stats.total}`, icon: CheckCircle2, tone: "green", note: "Trackers with progress today" },
    { label: "Active goals", value: stats.goals, icon: Target, tone: "violet", note: "Trackers with a target set" },
    { label: "Entries recorded", value: stats.logs, icon: ListTodo, tone: "amber", note: "Your recorded activity" },
  ];

  return (
    <section className={`ut-analytics-dashboard-v3 ${darkMode ? "is-dark" : ""}`} aria-label="Progress overview">
      <div className="ut-stat-grid">
        {cards.map(({label,value,icon:Icon,tone,note}) => (
          <article className={`ut-stat-card tone-${tone}`} key={label}>
            <div className="ut-stat-top"><span className="ut-stat-icon"><Icon size={18}/></span><span className="ut-stat-caption">{note}</span></div>
            <strong className="ut-stat-value">{value}</strong>
            <span className="ut-stat-label">{label}</span>
          </article>
        ))}
      </div>
      {trackers.some((tracker) => tracker?.__locked) && (
        <div className="ut-data-warning" role="status">
          <strong>Some tracker data is locked on this browser.</strong>
          <span>Its encrypted content is being protected. No encrypted text is shown as tracker information.</span>
        </div>
      )}
    </section>
  );
}
