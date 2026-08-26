import React from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, ShieldCheck, Zap, Bell, ArrowRight, UserPlus, LogIn, CheckCircle2, Target, Lock, Code2 } from "lucide-react";

export default function UnitrackPage() {
  return (
    <div className="min-vh-100 bg-light text-dark py-4 py-md-5 px-3" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      <div className="container" style={{ maxWidth: "900px" }}>
        
        {/* Top Navigation / Auth Quick Links */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 mb-4 p-3 bg-white rounded-4 shadow-sm border">
          <div className="d-flex align-items-center gap-2 text-primary">
            <LayoutDashboard size={22} className="flex-shrink-0" style={{ color: "#4f46e5" }} />
            <div className="d-flex flex-column">
              <span className="fw-bolder fs-5 lh-1" style={{ 
                letterSpacing: "-0.5px", 
                whiteSpace: "nowrap",
                background: "linear-gradient(90deg, #111827 0%, #4f46e5 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                UNI-TRACK
              </span>
              <span className="fw-bold" style={{ fontSize: "0.65rem", letterSpacing: "1px", whiteSpace: "nowrap", color: "#6b7280" }}>
                BY <span style={{ 
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontWeight: "900",
                  background: "linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}>AD3N1X</span>
              </span>
            </div>
          </div>
          <div className="d-flex gap-2 w-100 w-sm-auto justify-content-end">
            <Link to="/login" className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-1 px-3 fw-semibold flex-grow-1 flex-sm-grow-0">
              <LogIn size={15} /> Login
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm d-flex align-items-center justify-content-center gap-1 px-3 fw-semibold flex-grow-1 flex-sm-grow-0">
              <UserPlus size={15} /> Register
            </Link>
          </div>
        </div>

        {/* Main Content Hero Box */}
        <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border mb-4">
          
          <div className="badge bg-primary bg-opacity-10 text-primary mb-3 px-3 py-2 rounded-pill fw-semibold d-inline-flex align-items-center gap-1 text-wrap text-start" style={{ fontSize: "0.825rem" }}>
            <Zap size={13} className="flex-shrink-0" /> The Ultimate Productivity & Privacy Ecosystem
          </div>

          <h1 className="fw-bolder mb-3 fs-3 fs-md-2 text-dark" style={{ letterSpacing: "-0.7px", lineHeight: "1.2" }}>
            <span style={{ 
              background: "linear-gradient(90deg, #4f46e5 0%, #ec4899 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              UNI-TRACK
            </span> – Smart End-to-End Encrypted Tracking System
          </h1>

          <p className="text-secondary mb-4 fs-6 fs-md-5" style={{ lineHeight: "1.65", fontWeight: "400" }}>
            <strong>UNITRACK</strong> is a high-performance, React-powered tracking ecosystem engineered specifically for absolute user privacy, zero lag, and total control over your daily habits, goals, tasks, and metrics.
          </p>

          <div className="d-flex flex-column flex-sm-row gap-3 mb-4">
            <Link to="/register" className="btn btn-primary px-4 py-2.5 fw-semibold d-inline-flex align-items-center justify-content-center gap-2 shadow-sm text-decoration-none">
              Create Free Account <ArrowRight size={17} />
            </Link>
            <Link to="/login" className="btn btn-outline-secondary px-4 py-2.5 fw-semibold text-center text-decoration-none">
              Sign In to Existing Account
            </Link>
          </div>

          <hr className="my-4 text-muted opacity-25" />

          {/* Core Features Grid */}
          <h2 className="fw-bold mb-4 fs-5 text-dark" style={{ letterSpacing: "-0.3px" }}>Why UNI-TRACK Is Built Differently</h2>
          
          <div className="row g-4 mb-4">
            <div className="col-12 col-md-6">
              <div className="p-3 border rounded-3 bg-light h-100">
                <div className="d-flex align-items-center gap-2 text-primary mb-2 fw-bold" style={{ fontSize: "0.95rem" }}>
                  <ShieldCheck size={19} /> Client-Side E2EE
                </div>
                <p className="text-secondary small m-0" style={{ lineHeight: "1.5" }}>
                  Your metrics are encrypted locally right inside your browser. No one—not even server administrators—can read your private tracking data.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 border rounded-3 bg-light h-100">
                <div className="d-flex align-items-center gap-2 text-primary mb-2 fw-bold" style={{ fontSize: "0.95rem" }}>
                  <Zap size={19} /> Lightning-Fast React Core
                </div>
                <p className="text-secondary small m-0" style={{ lineHeight: "1.5" }}>
                  Optimized component rendering and clean asynchronous synchronization guarantee zero loading friction or interface lag.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 border rounded-3 bg-light h-100">
                <div className="d-flex align-items-center gap-2 text-primary mb-2 fw-bold" style={{ fontSize: "0.95rem" }}>
                  <Bell size={19} /> Push Notifications & PWA
                </div>
                <p className="text-secondary small m-0" style={{ lineHeight: "1.5" }}>
                  Never miss a habit check-in. Integrated service workers keep your progressive web app synced and alert-ready on all devices.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="p-3 border rounded-3 bg-light h-100">
                <div className="d-flex align-items-center gap-2 text-primary mb-2 fw-bold" style={{ fontSize: "0.95rem" }}>
                  <CheckCircle2 size={19} /> Flexible Tracker Types
                </div>
                <p className="text-secondary small m-0" style={{ lineHeight: "1.5" }}>
                  Manage counters, habits, logs, and targeted metrics seamlessly with dynamic color-coded interfaces and custom filters.
                </p>
              </div>
            </div>
          </div>

          {/* The Story / Why UNITRACK Was Created Section */}
          <div className="p-4 rounded-4 bg-primary bg-opacity-10 border border-primary border-opacity-25">
            <div className="d-flex align-items-center gap-2 text-primary mb-3 fw-bold fs-6" style={{ letterSpacing: "-0.2px" }}>
              <Target size={19} /> Why UNITRACK Was Created
            </div>
            <p className="text-secondary small mb-3" style={{ lineHeight: "1.7", fontSize: "0.9rem" }}>
              Most productivity apps fall into a bad habit: they are bloated with social distractions or they sustain themselves by harvesting and monetizing your personal behavioral data. 
            </p>
            <p className="text-secondary small mb-3" style={{ lineHeight: "1.7", fontSize: "0.9rem" }}>
              <strong>UNITRACK</strong> was built to prove that you can build a sustainable platform without selling out your users. While we plan to sustainably monetize through advanced productivity tools and premium features, your personal habits, metrics, and data will never be treated as commodities. 
            </p>
            <div className="d-flex align-items-start align-items-sm-center gap-2 text-dark small fw-semibold mt-2" style={{ fontSize: "0.875rem" }}>
              <Lock size={15} className="text-primary flex-shrink-0 mt-1 mt-sm-0" /> 
              <span>Sustainable software, zero data exploitation. Take back control of your workflow today.</span>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center text-muted small pb-3 d-flex flex-column gap-1" style={{ fontSize: "0.85rem" }}>
          <div>&copy; {new Date().getFullYear()} UNI-TRACK. Built for privacy, speed, and focus.</div>
          <div className="text-secondary fw-semibold d-inline-flex align-items-center justify-content-center gap-1">
            <Code2 size={14} style={{ color: "#4f46e5" }} /> Crafted with precision by 
            <span style={{ 
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontWeight: "900",
              background: "linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "1px"
            }}>
              AD3N1X
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}