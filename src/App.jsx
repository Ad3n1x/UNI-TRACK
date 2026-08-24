import React from "react";
import { Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Auth from "./components/auth/Auth";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";

export default function App() {
  return (
    <Routes>
      {/* Top-Level Routes */}
      <Route index element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/homepage" element={<Homepage />} />

      {/* Nested Auth Routes */}
      <Route path="/auth" element={<Auth />}>
        <Route index element={<LoginForm />} />
        <Route path="login" element={<LoginForm />} />
        <Route path="register" element={<RegisterForm />} />
      </Route>

      {/* Catch-All 404 Route */}
      <Route
        path="*"
        element={
          <div className="p-8 text-center text-slate-500 font-semibold">
            404 - Page Not Found
          </div>
        }
      />
    </Routes>
  );
}