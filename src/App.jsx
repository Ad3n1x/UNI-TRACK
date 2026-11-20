import React, { lazy, Suspense, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
// ❌ Removed unused Helmet import
import Cookies from "universal-cookie";
import { toast } from "react-toastify";
import { apiFetch } from "./utils/api";

const Homepage = lazy(() => import("./pages/Homepage"));
const LoginForm = lazy(() => import("./components/auth/LoginForm"));
const RegisterForm = lazy(() => import("./components/auth/RegisterForm"));
const NotFound = lazy(() => import("./pages/Notfound"));
const ForgotPassword = lazy(() => import("./components/auth/ForgotPassword"));
const UnitrackPage = lazy(() => import("./pages/Unitrack"));

function RouteLoading() {
  return (
    <main className="ut-route-loading" role="status" aria-live="polite">
      <span className="ut-route-loading-mark" aria-hidden="true" />
      <p>Loading your UniTrack workspace…</p>
    </main>
  );
}

const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 1 Hour
const cookies = new Cookies();

function AutoLogoutWrapper({ children }) {
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" });
    } catch (error) {
      console.warn("Server logout could not be confirmed:", error);
    }
    cookies.remove("token", { path: "/" });
    cookies.remove("userEmail", { path: "/" });
    cookies.remove("userId", { path: "/" });
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("unitrack_authenticated");
    toast.warning("Session expired due to 1 hour of inactivity. Please log in again.");
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (cookies.get("token") || localStorage.getItem("token") || localStorage.getItem("unitrack_authenticated") === "true") {
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
      <Suspense fallback={<RouteLoading />}>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<UnitrackPage />} />
        <Route path="/unitrack" element={<UnitrackPage />} />

        {/* Auth & App Routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/homepage" element={<Homepage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Catch-All 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </AutoLogoutWrapper>
  );
}