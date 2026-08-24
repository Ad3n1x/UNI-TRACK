import React from "react";
import { Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import NotFound from "./pages/Notfound";

export default function App() {
  return (
    <Routes>
      {/* Top-Level Routes */}
      <Route index element={<LoginForm />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/homepage" element={<Homepage />} />


      {/* Catch-All 404 Route */}
      <Route
        path="*"
        element={
          <NotFound />
        }
      />
    </Routes>
  );
}