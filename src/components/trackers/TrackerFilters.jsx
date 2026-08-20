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
];

export default function TrackerFilters({ typeFilter, onTypeFilterChange }) {
  return (
    <div className="filter-container">
      <span className="filter-label">Filter by type:</span>
      <select
        className="filter-select"
        value={typeFilter ?? ''}
        onChange={(e) => onTypeFilterChange(e.target.value)}
      >
        {FILTER_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

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

        .filter-select {
          padding: 0.375rem 0.75rem;
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
      `}</style>
    </div>
  );
}