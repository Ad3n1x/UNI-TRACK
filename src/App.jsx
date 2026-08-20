import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Auth from './components/auth/Auth';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import TrackerDashboard from './components/trackers/TrackerDashboard';
import TrackerList from './components/trackers/TrackerList';
export default function App() {
  return (
    <Routes>
      {/* Main dashboard page */}
      <Route index element={<Homepage />} />

      {/* Tracker dashboard page */}
      <Route path="/trackers" element={<TrackerDashboard />} />

      <Route path="/list" element={<TrackerList/>}/>
      {/* Auth nested routes */}
      <Route path="/auth" element={<Auth />}>
        <Route index element={<LoginForm />} />
        <Route path="login" element={<LoginForm />} />
        <Route path="register" element={<RegisterForm />} />
      </Route>

      {/* Fallback 404 route */}
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