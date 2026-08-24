import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export default function NotFound({ darkMode = false }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
        color: darkMode ? '#f8fafc' : '#0f172a',
        borderRadius: '1rem',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: darkMode ? '#1e293b' : '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          color: '#10b981',
          boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        <Compass size={40} className="animate-spin-slow" />
      </div>

      <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
        404
      </h1>

      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: darkMode ? '#cbd5e1' : '#334155' }}>
        Oops! Page Not Found
      </h2>

      <p style={{ maxWidth: '400px', fontSize: '0.875rem', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '2rem', lineHeight: '1.5' }}>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>

      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          backgroundColor: '#10b981',
          color: '#ffffff',
          fontWeight: '600',
          fontSize: '0.875rem',
          textDecoration: 'none',
          boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)',
          transition: 'transform 0.2s ease, background-color 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
      >
        <Home size={18} />
        Back to Dashboard
      </Link>
    </div>
  );
}