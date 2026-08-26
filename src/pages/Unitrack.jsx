import React from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, ShieldCheck, Zap, Bell, ArrowRight, UserPlus, LogIn, CheckCircle2, Lock, Cpu, Globe } from "lucide-react";

export default function UnitrackPage() {
  return (
    <div className="min-vh-100 bg-light text-dark py-4 py-md-5">
      <div className="container" style={{ maxWidth: "900px" }}>
        
        {/* Top Navigation / Auth Quick Links */}
        <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white rounded-4 shadow-sm border">
          <div className="d-flex align-items-center gap-2 text-primary">
            <LayoutDashboard size={24} />
            <span className="fw-bold fs-5 tracking-wide">UNITRACK</span>
          </div>
          <div className="d-flex gap-2">
            <Link to="/login" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 px-3 fw-semibold">
              <LogIn size={16} /> Login
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm d-flex align-items-center gap-1 px-3 fw-semibold">
              <UserPlus size={16} /> Register
            </Link>
          </div>
        </div>

        {/* Main Content Hero Box */}
        <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border mb-4">
          
          <div className="badge bg-primary bg-opacity-10 text-primary mb-3 px-3 py-2 rounded-pill fw-semibold d-inline-flex align-items-center gap-1">
            <Zap size={14} /> The Ultimate Productivity & Privacy Ecosystem
          </div>

          <h1 className="fw-bold mb-3 display-6" style={{ fontSize: "2.25rem", letterSpacing: "-0.5px" }}>
            UNITRACK – Smart End-to-End Encrypted Tracking System
          </h1>

          <p className="lead text-muted mb-4" style={{ fontSize: "1.05rem", lineHeight: "1.6" }}>
            <strong>UNITRACK</strong> (widely searched as UniTrack, unitrack, uni-track, or uni track) is a high-performance, React-powered tracking ecosystem engineered specifically for absolute user privacy, zero lag, and total control over your daily habits, goals, tasks, and metrics.
          </p>

          <div className="d-flex flex-wrap gap-3 mb-4">
            <Link to="/register" className="btn btn-primary px-4 py-2.5 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm">
              Create Free Account <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-outline-secondary px-4 py-2.5 fw-semibold">
              Sign In to Dashboard
            </Link>
          </div>

          <hr className="my-4" />

          {/* Core Features Grid */}
          <h2 className="h4 fw-bold mb-4">Why UNITRACK Is Built Differently</h2>
          
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="p-3 border rounded-3 bg-light h-100">
                <div className="d-flex align-items-center gap-2 text-primary mb-2 fw-bold">
                  <ShieldCheck size={20} /> Client-Side E2EE
                </div>
                <p className="text-muted small m-0">
                  Your metrics are encrypted locally right inside your browser. No one—not even server administrators—can read your private tracking data.
                </p>
              </div>
            </div>

            <div className="col-md-6">
              <div className="p-3 border rounded-3 bg-light h-100">
                <div className="d-flex align-items-center gap-2 text-primary mb-2 fw-bold">
                  <Zap size={20} /> Lightning-Fast React Core
                </div>
                <p className="text-muted small m-0">
                  Optimized component rendering and clean asynchronous synchronization guarantee zero loading friction or interface lag.
                </p>
              </div>
            </div>

            <div className="col-md-6">
              <div className="p-3 border rounded-3 bg-light h-100">
                <div className="d-flex align-items-center gap-2 text-primary mb-2 fw-bold">
                  <Bell size={20} /> Push Notifications & PWA
                </div>
                <p className="text-muted small m-0">
                  Never miss a habit check-in. Integrated service workers keep your progressive web app synced and alert-ready on all devices.
                </p>
              </div>
            </div>

            <div className="col-md-6">
              <div className="p-3 border rounded-3 bg-light h-100">
                <div className="d-flex align-items-center gap-2 text-primary mb-2 fw-bold">
                  <CheckCircle2 size={20} /> Flexible Tracker Types
                </div>
                <p className="text-muted small m-0">
                  Manage counters, habits, logs, and targeted metrics seamlessly with dynamic color-coded interfaces and custom filters.
                </p>
              </div>
            </div>
          </div>

          {/* SEO & Keyword Context Footer Section */}
          <div className="p-4 rounded-4 bg-primary bg-opacity-10 border border-primary border-opacity-25">
            <div className="d-flex align-items-center gap-2 text-primary mb-2 fw-bold">
              <Globe size={18} /> About the UNITRACK Platform
            </div>
            <p className="small text-secondary mb-0" style={{ lineHeight: "1.6" }}>
              Whether you searched for <strong>UNITRACK</strong>, <strong>UniTrack</strong>, <strong>unitrack</strong>, or <strong>uni-track</strong>, you have landed on the official home of the system. Designed with modern web standards, state-of-the-art authentication (OTP verification), and robust backend syncing via Render, UNITRACK gives you the reliability you need. Sign up today or log into your portal to view your secure dashboard stats.
            </p>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center text-muted small">
          &copy; {new Date().getFullYear()} UNITRACK. Built for privacy, speed, and focus.
        </div>
      </div>
    </div>
  );
}