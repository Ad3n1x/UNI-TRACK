import { useState, useEffect, useRef } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import * as Icons from 'lucide-react';

const TYPE_COLORS = {
  habit: '#10b981', counter: '#3b82f6', timer: '#f97316',
  goal: '#8b5cf6', expense: '#ef4444', mood: '#ec4899',
};

const MOOD_OPTIONS = [
  { emoji: '😢', label: 'Rough', value: 1 },
  { emoji: '😕', label: 'Low', value: 2 },
  { emoji: '😐', label: 'Okay', value: 3 },
  { emoji: '🙂', label: 'Good', value: 4 },
  { emoji: '😄', label: 'Great', value: 5 },
];

export function TrackerCard({ tracker, onDelete, onUpdate, onAddEntry }) {
  const [inputValue, setInputValue] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const intervalRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = tracker.entries.find(e => e.date === today);
  const IconComponent = Icons[tracker.icon] || Icons.Circle;
  const typeColor = TYPE_COLORS[tracker.type] || tracker.color;

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  // Handlers
  const handleHabitToggle = () => todayEntry
    ? onUpdate({ entries: tracker.entries.filter(e => e.id !== todayEntry.id) })
    : onAddEntry({ date: today, value: true });

  const handleCounterChange = (delta) => {
    const current = Number(todayEntry?.value) || 0;
    const next = Math.max(0, current + delta);
    todayEntry
      ? onUpdate({ entries: tracker.entries.map(e => e.id === todayEntry.id ? { ...e, value: next } : e) })
      : delta > 0 && onAddEntry({ date: today, value: next });
  };

  const handleSaveAmount = () => {
    const val = parseFloat(inputValue);
    if (!isNaN(val)) {
      todayEntry
        ? onUpdate({ entries: tracker.entries.map(e => e.id === todayEntry.id ? { ...e, value: Number(e.value) + val } : e) })
        : onAddEntry({ date: today, value: val });
      setInputValue('');
    }
  };

  const formatTime = (s) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map(v => v.toString().padStart(2, '0')).join(':');

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid #f1f5f9', borderLeft: `6px solid ${tracker.color}`, borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '3rem', height: '3rem', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${tracker.color}15`, color: tracker.color }}>
            <IconComponent size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>{tracker.name}</h3>
            <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', color: typeColor, margin: 0 }}>{tracker.type}</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(tracker.id)} // Fixed: Passed tracker.id
          style={{ background: 'transparent', border: '1px solid #fee2e2', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
        >
          Delete
        </button>
      </div>

      {/* Conditional UI Sections */}
      {tracker.type === 'habit' && (
        <button onClick={handleHabitToggle} style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: 'none', background: todayEntry ? `${tracker.color}15` : '#f1f5f9', color: todayEntry ? tracker.color : '#64748b', fontWeight: '700', cursor: 'pointer' }}>
          {todayEntry ? 'Completed Today' : 'Mark Done'}
        </button>
      )}

      {tracker.type === 'counter' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => handleCounterChange(-1)} style={{ width: '3rem', height: '3rem', borderRadius: '12px', border: 'none', background: '#f1f5f9', cursor: 'pointer' }}><Minus size={20} /></button>
          <span style={{ fontSize: '2.5rem', fontWeight: '800', color: tracker.color, fontFamily: 'monospace' }}>{Number(todayEntry?.value) || 0}</span>
          <button onClick={() => handleCounterChange(1)} style={{ width: '3rem', height: '3rem', borderRadius: '12px', border: 'none', background: tracker.color, color: 'white', cursor: 'pointer' }}><Plus size={20} /></button>
        </div>
      )}

      {tracker.type === 'timer' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', fontWeight: '800', color: tracker.color, fontFamily: 'monospace', marginBottom: '1rem' }}>{formatTime(timerSeconds)}</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setTimerRunning(!timerRunning)} style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: 'none', background: tracker.color, color: 'white', fontWeight: '700', cursor: 'pointer' }}>{timerRunning ? 'PAUSE' : 'START'}</button>
            <button onClick={() => { setTimerRunning(false); setTimerSeconds(0); }} style={{ padding: '1rem', borderRadius: '12px', border: 'none', background: '#f1f5f9', cursor: 'pointer' }}><RotateCcw size={20} /></button>
          </div>
        </div>
      )}

      {tracker.type === 'mood' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Input State: Shown ONLY if no entry exists for today */}
          {!todayEntry && (
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => onAddEntry({ date: today, value: m.value })}
                  style={{
                    flex: '1 1 60px', minWidth: '60px', padding: '0.75rem', borderRadius: '12px',
                    border: '2px solid #f1f5f9', background: 'white', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{m.emoji}</div>
                  <span style={{ fontSize: '0.65rem', fontWeight: '600', color: '#64748b' }}>{m.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Summary State: Shown if entry exists for today */}
          {todayEntry && (
            <div style={{ padding: '1rem', borderRadius: '16px', background: `${tracker.color}10`, textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: tracker.color, fontWeight: '700', margin: '0 0 0.5rem 0' }}>
                Today's Mood: {MOOD_OPTIONS.find(m => m.value === todayEntry.value)?.label}
              </p>
              <div style={{ fontSize: '3rem' }}>
                {MOOD_OPTIONS.find(m => m.value === todayEntry.value)?.emoji}
              </div>
            </div>
          )}

          {/* Recent History (Always shown) */}
          <div style={{ marginTop: '0.5rem' }}>
            <h4 style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Recent History</h4>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
              {tracker.entries.slice(-7).reverse().map((entry, index) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '40px' }}>
                  <span style={{ fontSize: '1.25rem' }}>{MOOD_OPTIONS.find(m => m.value === entry.value)?.emoji || '❓'}</span>
                  <span style={{ fontSize: '0.6rem', color: '#64748b' }}>{entry.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(tracker.type === 'goal' || tracker.type === 'expense') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(() => {
            const currentTotal = tracker.entries.reduce((sum, e) => sum + (Number(e.value) || 0), 0);
            const percentage = Math.min((currentTotal / (tracker.target || 1)) * 100, 100);
            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{currentTotal} <span style={{ color: '#94a3b8' }}>/ {tracker.target}</span></span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: tracker.color }}>{percentage.toFixed(0)}%</span>
                </div>
                <div style={{ width: '100%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${percentage}%`, backgroundColor: tracker.color, transition: 'width 0.5s' }} />
                </div>
              </div>
            );
          })()}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="number" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Enter amount" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '2px solid #f1f5f9', outline: 'none' }} />
            <button onClick={handleSaveAmount} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', background: tracker.color, color: 'white', cursor: 'pointer', fontWeight: '600' }}>Add</button>
          </div>
        </div>
      )}
    </div>
  );
}