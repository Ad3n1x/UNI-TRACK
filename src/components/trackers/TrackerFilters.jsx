import React, { useState } from 'react';

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

export default function TrackerFilters({
  typeFilter = '',
  onTypeFilterChange,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Style objects
  const styles = {
    container: {
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    label: {
      fontSize: '0.75rem',
      color: '#64748b',
      fontWeight: '500',
    },
    wrapper: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
    },
    select: {
      WebkitAppearance: 'none',
      MozAppearance: 'none',
      appearance: 'none',
      paddingTop: '0.375rem',
      paddingBottom: '0.375rem',
      paddingLeft: '0.75rem',
      paddingRight: '2rem',
      borderRadius: '0.5rem',
      border: `1px solid ${
        isFocused ? '#10b981' : isHovered ? '#cbd5e1' : '#e2e8f0'
      }`,
      fontSize: '0.75rem',
      backgroundColor: '#ffffff',
      color: '#1e293b',
      outline: 'none',
      cursor: 'pointer',
      boxShadow: isFocused ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'none',
      transition: 'all 0.2s ease',
    },
    arrow: {
      position: 'absolute',
      right: '0.75rem',
      pointerEvents: 'none',
      fontSize: '10px',
      color: '#64748b',
    },
  };

  return (
    <div style={styles.container}>
      <label htmlFor="tracker-type-filter" style={styles.label}>
        Filter by type:
      </label>

      <div style={styles.wrapper}>
        <select
          id="tracker-type-filter"
          style={styles.select}
          value={typeFilter}
          onChange={(e) => onTypeFilterChange?.(e.target.value)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          {FILTER_OPTIONS.map(({ label, value }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <span style={styles.arrow} aria-hidden="true">
          ▼
        </span>
      </div>
    </div>
  );
}