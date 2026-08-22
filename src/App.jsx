
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Auth from './components/auth/Auth';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import TrackerDashboard from './components/trackers/TrackerDashboard';

export default function App() {
  return (
    <Routes>
      <Route index element={<Homepage />} />
      <Route path="/trackers" element={<TrackerDashboard />} />
      {/* Route /list to the dashboard container component instead of plain TrackerList */}
      <Route path="/list" element={<TrackerDashboard />} />
      
      <Route path="/auth" element={<Auth />}>
        <Route index element={<LoginForm />} />
        <Route path="login" element={<LoginForm />} />
        <Route path="register" element={<RegisterForm />} />
      </Route>

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