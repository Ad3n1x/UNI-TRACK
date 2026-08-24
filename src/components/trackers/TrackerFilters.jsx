import React, { useState, useRef, useEffect } from 'react';

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
  darkMode = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = FILTER_OPTIONS.find((opt) => opt.value === typeFilter) || FILTER_OPTIONS[0];

  const styles = {
    container: {
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      position: 'relative',
    },
    label: {
      fontSize: '0.75rem',
      color: darkMode ? '#94a3b8' : '#64748b',
      fontWeight: '500',
    },
    trigger: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      paddingTop: '0.375rem',
      paddingBottom: '0.375rem',
      paddingLeft: '0.75rem',
      paddingRight: '0.75rem',
      borderRadius: '0.5rem',
      border: `1px solid ${
        isOpen
          ? '#10b981'
          : isHovered
          ? darkMode
            ? '#475569'
            : '#cbd5e1'
          : darkMode
          ? '#334155'
          : '#e2e8f0'
      }`,
      fontSize: '0.75rem',
      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
      color: darkMode ? '#f8fafc' : '#1e293b',
      cursor: 'pointer',
      boxShadow: isOpen ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'none',
      transition: 'all 0.2s ease',
      minWidth: '110px',
      userSelect: 'none',
    },
    menu: {
      position: 'absolute',
      top: 'calc(100% + 4px)',
      left: '75px', // Aligned near the select box area
      zIndex: 100,
      minWidth: '140px',
      maxHeight: '220px',
      overflowY: 'auto',
      borderRadius: '0.5rem',
      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
      border: `1px solid ${darkMode ? '#334155' : '#cbd5e1'}`,
      boxShadow: darkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      padding: '0.25rem',
    },
    option: (isSelected) => ({
      padding: '0.5rem 0.75rem',
      fontSize: '0.75rem',
      borderRadius: '0.375rem',
      cursor: 'pointer',
      backgroundColor: isSelected 
        ? '#10b981' 
        : 'transparent',
      color: isSelected 
        ? '#ffffff' 
        : darkMode ? '#f8fafc' : '#1e293b',
      fontWeight: isSelected ? '600' : '4n',
      transition: 'background-color 0.1s ease',
    }),
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      <label style={styles.label}>
        Filter by type:
      </label>

      {/* Custom Dropdown Trigger */}
      <div
        role="button"
        tabIndex={0}
        style={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span>{selectedOption.label}</span>
        <span style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          ▼
        </span>
      </div>

      {/* Custom Popup Menu Options */}
      {isOpen && (
        <div style={styles.menu}>
          {FILTER_OPTIONS.map(({ label, value }) => {
            const isSelected = typeFilter === value;
            return (
              <div
                key={value}
                style={styles.option(isSelected)}
                onClick={() => {
                  onTypeFilterChange?.(value);
                  setIsOpen(false);
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}