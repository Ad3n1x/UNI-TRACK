import React, { lazy, Suspense, useEffect, useCallback, useState } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
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
      <p>Checking your sign-in…</p>
    </main>
  );
}

function RequireAuthenticatedWorkspace({ children }) {
  const [status, setStatus] = useState("checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    const verifySession = async () => {
      setStatus("checking");
      try {
        // The HttpOnly server session is authoritative. A localStorage flag alone
        // must never grant access to the private workspace.
        const response = await apiFetch("/api/v1/auth/me", {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("unitrack_authenticated");
          localStorage.removeItem("userEmail");
          if (active) setStatus("unauthenticated");
          return;
        }

        if (!response.ok) {
          throw new Error(`Session verification failed (${response.status}).`);
        }

        const data = await response.json();
        const user = data?.user || data;
        if (!user?.email) {
          localStorage.removeItem("unitrack_authenticated");
          localStorage.removeItem("userEmail");
          if (active) setStatus("unauthenticated");
          return;
        }

        localStorage.setItem("unitrack_authenticated", "true");
        localStorage.setItem("userEmail", String(user.email).trim().toLowerCase());
        if (active) setStatus("authenticated");
      } catch (error) {
        console.error("Could not verify UniTrack session:", error);
        if (active) setStatus("unavailable");
      }
    };

    verifySession();
    return () => {
      active = false;
    };
  }, [attempt]);

  if (status === "checking") return <RouteLoading />;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  if (status === "unavailable") {
    return (
      <main className="ut-route-loading" role="alert">
        <p>Your sign-in could not be verified. The private workspace remains locked.</p>
        <button type="button" onClick={() => setAttempt((value) => value + 1)}>
          Try again
        </button>
        <a href="/login">Return to sign in</a>
      </main>
    );
  }

  return children;
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
          {/* Public product landing page */}
          <Route path="/" element={<UnitrackPage />} />
          <Route path="/unitrack" element={<UnitrackPage />} />

          {/* Public authentication pages */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Private workspace: render only after the server confirms the session */}
          <Route
            path="/homepage"
            element={
              <RequireAuthenticatedWorkspace>
                <Homepage />
              </RequireAuthenticatedWorkspace>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AutoLogoutWrapper>
  );
}
