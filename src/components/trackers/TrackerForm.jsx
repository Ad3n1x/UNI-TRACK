import { useState } from 'react';
import { Check, X } from 'lucide-react';
import * as Icons from 'lucide-react';

const trackerTypes = [
  { value: 'habit', label: 'Habit', description: 'Daily yes/no', emoji: '✅' },
  { value: 'counter', label: 'Counter', description: 'Count anything', emoji: '🔢' },
  { value: 'timer', label: 'Timer', description: 'Track time spent', emoji: '⏱️' },
  { value: 'goal', label: 'Goal', description: 'Progress to target', emoji: '🎯' },
  { value: 'expense', label: 'Expense', description: 'Monitor spending', emoji: '💸' },
  { value: 'mood', label: 'Mood', description: 'Log how you feel', emoji: '😊' },
];

const iconOptions = [
  'Dumbbell', 'Droplet', 'Book', 'Coffee', 'Moon', 'Sun',
  'Heart', 'Star', 'Target', 'TrendingUp', 'Zap', 'Apple',
  'Pizza', 'Bike', 'Music', 'Camera', 'Laptop', 'Phone',
  'PiggyBank', 'ShoppingCart', 'Wallet', 'DollarSign', 'Home', 'Car',
  'Briefcase', 'GraduationCap', 'Pill', 'Activity', 'Smile', 'Timer',
  'Flame', 'Leaf', 'Globe', 'Trophy',
];

const colorOptions = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

export default function TrackerForm({ onCreate, onClose }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('habit');
  const [icon, setIcon] = useState('Star');
  const [color, setColor] = useState('#3b82f6');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreate({
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      icon,
      color,
      target: target ? parseFloat(target) : undefined,
      unit: unit.trim() || undefined,
      entries: []
    });

    if (onClose) onClose();
  };

  const needsTarget = type === 'counter' || type === 'goal' || type === 'expense' || type === 'timer';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '16px', maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>

        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, color: '#1e293b' }}>New Tracker</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>Configure and start tracking</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '8px', border: 'none', background: '#f8fafc', cursor: 'pointer', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Tracker Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning Run…" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} autoFocus />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {trackerTypes.map(({ value, label, emoji }) => (
                <button key={value} type="button" onClick={() => setType(value)} style={{ padding: '0.75rem', borderRadius: '8px', border: type === value ? `2px solid ${color}` : '1px solid #e2e8f0', background: type === value ? `${color}10` : 'white', cursor: 'pointer', textAlign: 'left', flex: '1 1 calc(50% - 0.5rem)', minWidth: '120px', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: '1.25rem' }}>{emoji}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>{label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
              {iconOptions.map((iconName) => {
                const IC = Icons[iconName] || Icons.Circle;
                return (
                  <button key={iconName} type="button" onClick={() => setIcon(iconName)} style={{ padding: '0.5rem', borderRadius: '6px', border: 'none', background: icon === iconName ? color : 'transparent', color: icon === iconName ? 'white' : '#94a3b8', cursor: 'pointer', flex: '0 0 auto' }}>
                    <IC size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Color</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {colorOptions.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: color === c ? '2px solid #334155' : 'none', background: c, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {color === c && <Check size={14} color="white" />}
                </button>
              ))}
            </div>
          </div>

          {needsTarget && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target" style={{ flex: '1 1 120px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit" style={{ flex: '1 1 120px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} style={{ flex: '1 1 100px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
            <button type="submit" disabled={!name.trim()} style={{ flex: '1 1 100px', padding: '0.75rem', borderRadius: '8px', border: 'none', background: color, color: 'white', cursor: 'pointer', fontWeight: '600', opacity: !name.trim() ? 0.5 : 1 }}>Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}