// 5. Frontend React Upgrade Component (components/UpgradeBanner.jsx)
import React from 'react';

const UpgradeBanner = ({ darkMode }) => {
  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/subscription/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <div style={{
      backgroundColor: darkMode ? "#1e293b" : "#f8fafc",
      border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
      borderRadius: "1rem",
      padding: "1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      marginTop: "1rem",
      boxSizing: "border-box",
      width: "100%"
    }}>
      <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: darkMode ? "#f8fafc" : "#0f172a" }}>
        Unlock Universal Tracker Pro 🚀
      </h4>
      <p style={{ margin: 0, fontSize: "0.85rem", color: darkMode ? "#94a3b8" : "#64748b", lineHeight: 1.5 }}>
        Get unlimited trackers, deep analytics, and automated cloud backups.
      </p>
      <button
        onClick={handleUpgrade}
        style={{
          marginTop: "6px",
          backgroundColor: "#2563eb",
          color: "#ffffff",
          border: "none",
          padding: "9px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "0.82rem",
          fontWeight: 600,
          alignSelf: "flex-start"
        }}
      >
        Upgrade Now ($9/mo)
      </button>
    </div>
  );
};

export default UpgradeBanner;