import React from 'react';

// Extracted options or passed via props/constants file for maintainability
const FILTER_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Habit', value: 'habit' },
  { label: 'Expense', value: 'expense' },
  { label: 'Goal', value: 'goal' },
  { label: 'Timer', value: 'timer' },
  { label: 'Counter', value: 'counter' },
  { label: 'Task', value: 'task' },
  { label: 'Study', value: 'study' },
  { label: 'Bill', value: 'bill' },
  { label: 'Mood', value: 'mood' },
] as const;

interface TrackerFiltersProps {
  typeFilter?: string;
  onTypeFilterChange: (value: string) => void;
}

export default function TrackerFilters({
  typeFilter = '',
  onTypeFilterChange,
}: TrackerFiltersProps) {
  return (
    <div className="filter-container">
      <label htmlFor="tracker-type-filter" className="filter-label">
        Filter by type:
      </label>
      
      <div className="select-wrapper">
        <select
          id="tracker-type-filter"
          className="filter-select"
          value={typeFilter}
          onChange={(e) => onTypeFilterChange?.(e.target.value)}
        >
          {FILTER_OPTIONS.map(({ label, value }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow for consistent cross-browser styling */}
        <span className="select-arrow" aria-hidden="true">
          ▼
        </span>
      </div>

      <style jsx>{`
        .filter-container {
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-label {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        .select-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .filter-select {
          appearance: none;
          -webkit-appearance: none;
          padding: 0.375rem 2rem 0.375rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          font-size: 0.875rem;
          background-color: #ffffff;
          color: #1e293b;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .filter-select:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }

        .filter-select:hover {
          border-color: #cbd5e1;
        }

        .select-arrow {
          position: absolute;
          right: 0.75rem;
          pointer-events: none;
          font-size: 0.65rem;
          color: #64748b;
        }
      `}</style>
    </div>
  );
}