import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Homepage from "./pages/Homepage";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import TrackerDetail from "./components/trackers/TrackerDetail";
import NotFound from "./pages/Notfound";

export default function App() {
  return (
    <>
      <Routes>
        {/* Top-Level Routes */}
        <Route index element={<LoginForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/homepage" element={<Homepage />} />
        
        {/* Dynamic route for individual tracker entries */}
        <Route path="/trackers/:trackerId" element={<TrackerDetail />} />

        {/* Catch-All 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}