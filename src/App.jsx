import React, { useEffect, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Cookies from "universal-cookie";
import { toast } from "react-toastify";

import Homepage from "./pages/Homepage";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import TrackerDetail from "./components/trackers/TrackerDetail";
import NotFound from "./pages/Notfound";
import ForgotPassword from "./components/auth/ForgotPassword";
import UnitrackPage from "./pages/Unitrack"; // 🚀 Added UNITRACK SEO Landing Page

const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // Exactly 1 hour

// AutoLogout wrapper component that uses useNavigate safely under main.jsx's BrowserRouter
function AutoLogoutWrapper({ children }) {
  const navigate = useNavigate();
  const cookies = new Cookies();

  const handleLogout = useCallback(() => {
    cookies.remove("token", { path: "/" });
    toast.warning("Session expired due to 1 hour of inactivity. Please log in again.");
    navigate("/login", { replace: true });
  }, [cookies, navigate]);

  useEffect(() => {
    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      // Only set the inactivity countdown if a session token actually exists
      if (cookies.get("token")) {
        timeoutId = setTimeout(handleLogout, INACTIVITY_LIMIT_MS);
      }
    };

    // User interaction events to track activity
    const activityEvents = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Initialize timer on mount
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [handleLogout, cookies]);

  return <>{children}</>;
}

export default function App() {
  return (
    <AutoLogoutWrapper>
      <Routes>
        {/* Top-Level Routes */}
        <Route index element={<LoginForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/homepage" element={<Homepage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* 🚀 Dedicated UNITRACK SEO Landing Page Route */}
        <Route path="/unitrack" element={<UnitrackPage />} />

        {/* Dynamic route for individual tracker entries */}
        <Route path="/trackers/:trackerId" element={<TrackerDetail />} />

        {/* Catch-All 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AutoLogoutWrapper>
  );
}