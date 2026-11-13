import React, { useEffect, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
// ❌ Removed unused Helmet import
import Cookies from "universal-cookie";
import { toast } from "react-toastify";

import Homepage from "./pages/Homepage";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import NotFound from "./pages/Notfound";
import ForgotPassword from "./components/auth/ForgotPassword";
import UnitrackPage from "./pages/Unitrack";
import { lockUserKeys } from "./utils/e2ee";
import SettingsPage from "./pages/SettingsPage";

const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 1 Hour
const cookies = new Cookies();
const API_BASE = (import.meta.env.VITE_API_URL || "https://lv3node.onrender.com").replace(/\/$/, "");

function AutoLogoutWrapper({ children }) {
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    const token = cookies.get("token") || localStorage.getItem("token");
    if (token) {
      try {
        await fetch(`${API_BASE}/api/v1/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
      } catch { /* Always complete local sign-out. */ }
    }
    lockUserKeys();
    cookies.remove("token", { path: "/" });
    cookies.remove("userEmail", { path: "/" });
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    toast.warning("Session expired due to 1 hour of inactivity. Please log in again.");
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (cookies.get("token") || localStorage.getItem("token")) {
        timeoutId = setTimeout(handleLogout, INACTIVITY_LIMIT_MS);
      }
    };

    const activityEvents = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

    let lastExecution = 0;
    const throttledResetTimer = () => {
      const now = Date.now();
      if (now - lastExecution > 1000) {
        lastExecution = now;
        resetTimer();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, throttledResetTimer);
    });

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, throttledResetTimer);
      });
    };
  }, [handleLogout]);

  return <>{children}</>;
}

export default function App() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("Offline app shell registration failed:", error.message);
      });
    }
  }, []);

  return (
    <AutoLogoutWrapper>
      <Routes>
        {/* Landing Page */}
        <Route index element={<UnitrackPage />} />
        <Route path="/unitrack" element={<UnitrackPage />} />

        {/* Auth & App Routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/homepage" element={<Homepage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Catch-All 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AutoLogoutWrapper>
  );
}