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

const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 1 Hour
const cookies = new Cookies();

function AutoLogoutWrapper({ children }) {
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    cookies.remove("token", { path: "/" });
    toast.warning("Session expired due to 1 hour of inactivity. Please log in again.");
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (cookies.get("token")) {
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
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Catch-All 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AutoLogoutWrapper>
  );
}