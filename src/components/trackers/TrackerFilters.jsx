import React from "react";

export default function TrackerFilters({ typeFilter, onTypeFilterChange }) {
  return (
    <div className="mb-3 d-flex gap-2 align-items-center">
      <span className="text-muted small">Filter by type:</span>
      <select
        className="form-select form-select-sm w-auto"
        value={typeFilter || ""}
        onChange={(e) => onTypeFilterChange(e.target.value || null)}
      >
        <option value="">All</option>
        <option value="habit">Habit</option>
        <option value="expense">Expense</option>
        <option value="goal">Goal</option>
        <option value="timer">Timer</option>
        <option value="counter">Counter</option>
        <option value="task">Task</option>
        <option value="study">Study</option>
        <option value="bill">Bill</option>
      </select>
    </div>
  );
}
