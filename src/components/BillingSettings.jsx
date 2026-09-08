// 3. Frontend Billing Management Component (components/BillingSettings.jsx)
// Allows Pro users to update their payment card or cancel their subscription.
import React from 'react';

const BillingSettings = ({ darkMode, isPro }) => {
  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/v1/subscription/create-portal-session', {
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
      console.error('Portal error:', error);
    }
  };

  if (!isPro) return null;

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
      width: "100%",
      boxSizing: "border-box"
    }}>
      <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: darkMode ? "#f8fafc" : "#0f172a" }}>
        Subscription Management ⭐
      </h4>
      <p style={{ margin: 0, fontSize: "0.85rem", color: darkMode ? "#94a3b8" : "#64748b" }}>
        You are currently on the Universal Tracker Pro plan.
      </p>
      <button
        onClick={handleManageBilling}
        style={{
          marginTop: "6px",
          backgroundColor: darkMode ? "#334155" : "#e2e8f0",
          color: darkMode ? "#f8fafc" : "#1e293b",
          border: "none",
          padding: "9px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "0.82rem",
          fontWeight: 600,
          alignSelf: "flex-start"
        }}
      >
        Manage Billing & Invoices
      </button>
    </div>
  );
};

export default BillingSettings;