import React from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, ShieldCheck, Zap, Bell, ArrowRight, UserPlus, LogIn, CheckCircle2, Target, Lock, Code2 } from "lucide-react";

export default function UnitrackPage() {
  return (
    <div className="min-vh-100 text-dark py-4 py-md-5 px-3" style={{ backgroundColor: "#f9fafb", fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      <div className="container" style={{ maxWidth: "900px" }}>
        
        {/* Premium Top Navigation */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 mb-5 p-3 bg-white rounded-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center justify-content-center bg-dark text-white rounded-3" style={{ width: "40px", height: "40px" }}>
              <LayoutDashboard size={20} />
            </div>
            <div className="d-flex flex-column">
              <span className="fw-bolder fs-5 lh-1" style={{ letterSpacing: "-0.5px", whiteSpace: "nowrap", color: "#111827" }}>
                UNI-TRACK
              </span>
              <div className="d-flex align-items-center gap-1 mt-1">
                <span className="badge text-uppercase" style={{ fontSize: "0.6rem", letterSpacing: "1px", backgroundColor: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" }}>
                  By AD3N1X
                </span>
              </div>
            </div>
          </div>
          <div className="d-flex gap-2 w-100 w-sm-auto justify-content-end">
            <Link to="/login" className="btn btn-light btn-sm d-flex align-items-center justify-content-center gap-1 px-3 fw-semibold flex-grow-1 flex-sm-grow-0" style={{ border: "1px solid #e5e7eb", color: "#374151" }}>
              <LogIn size={15} /> Login
            </Link>
            <Link to="/register" className="btn btn-dark btn-sm d-flex align-items-center justify-content-center gap-1 px-3 fw-semibold flex-grow-1 flex-sm-grow-0 shadow-sm">
              <UserPlus size={15} /> Register
            </Link>
          </div>
        </div>

        {/* Main Content Hero Box */}
        <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm mb-5" style={{ border: "1px solid rgba(0,0,0,0.05)", position: "relative", overflow: "hidden" }}>
          
          {/* Subtle background glow effect */}
          <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(255,255,255,0) 70%)", borderRadius: "50%" }}></div>

          <div className="d-inline-flex align-items-center gap-1 mb-4 px-3 py-1.5 rounded-pill fw-semibold" style={{ fontSize: "0.75rem", backgroundColor: "#eef2ff", color: "#4f46e5", border: "1px solid #e0e7ff" }}>
            <Zap size={13} className="flex-shrink-0" /> The Ultimate Productivity & Privacy Ecosystem
          </div>

          <h1 className="fw-bolder mb-3 fs-2 fs-md-1" style={{ letterSpacing: "-1px", lineHeight: "1.1" }}>
            <span style={{ 
              background: "linear-gradient(90deg, #111827 0%, #4f46e5 100%)", 
              WebkitBackgroundClip: "text", 
              WebkitTextFillColor: "transparent" 
            }}>
              Smart End-to-End Encrypted Tracking System
            </span>
          </h1>

          <p className="mb-4 fs-6 fs-md-5" style={{ lineHeight: "1.7", color: "#4b5563", fontWeight: "400", maxWidth: "800px" }}>
            <strong style={{ color: "#111827" }}>UNI-TRACK</strong> is a high-performance, React-powered tracking ecosystem engineered specifically for absolute user privacy, zero lag, and total control over your daily habits, goals, tasks, and metrics.
          </p>

          <div className="d-flex flex-column flex-sm-row gap-3 mb-2">
            <Link to="/register" className="btn px-4 py-2.5 fw-semibold d-inline-flex align-items-center justify-content-center gap-2 shadow-sm text-decoration-none text-white" style={{ backgroundColor: "#4f46e5", border: "none", transition: "all 0.2s ease" }}>
              Create Free Account <ArrowRight size={17} />
            </Link>
            <Link to="/login" className="btn px-4 py-2.5 fw-semibold text-center text-decoration-none" style={{ backgroundColor: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }}>
              Sign In to Existing Account
            </Link>
          </div>
        </div>

        {/* Bento Box Core Features Grid */}
        <h2 className="fw-bold mb-4 fs-5" style={{ letterSpacing: "-0.5px", color: "#111827" }}>Engineered for Focus</h2>
        
        <div className="row g-4 mb-5">
          <div className="col-12 col-md-6">
            <div className="p-4 rounded-4 bg-white h-100 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
              <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3" style={{ width: "36px", height: "36px", backgroundColor: "#eef2ff", color: "#4f46e5" }}>
                <ShieldCheck size={20} />
              </div>
              <h3 className="fw-bold fs-6 mb-2" style={{ color: "#111827" }}>Client-Side E2EE</h3>
              <p className="small m-0" style={{ lineHeight: "1.6", color: "#6b7280" }}>
                Your metrics are encrypted locally right inside your browser. No one—not even server administrators—can read your private tracking data.
              </p>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="p-4 rounded-4 bg-white h-100 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
              <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3" style={{ width: "36px", height: "36px", backgroundColor: "#eef2ff", color: "#4f46e5" }}>
                <Zap size={20} />
              </div>
              <h3 className="fw-bold fs-6 mb-2" style={{ color: "#111827" }}>Lightning-Fast React Core</h3>
              <p className="small m-0" style={{ lineHeight: "1.6", color: "#6b7280" }}>
                Optimized component rendering and clean asynchronous synchronization guarantee zero loading friction or interface lag.
              </p>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="p-4 rounded-4 bg-white h-100 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
              <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3" style={{ width: "36px", height: "36px", backgroundColor: "#eef2ff", color: "#4f46e5" }}>
                <Bell size={20} />
              </div>
              <h3 className="fw-bold fs-6 mb-2" style={{ color: "#111827" }}>Push Notifications & PWA</h3>
              <p className="small m-0" style={{ lineHeight: "1.6", color: "#6b7280" }}>
                Never miss a habit check-in. Integrated service workers keep your progressive web app synced and alert-ready on all devices.
              </p>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="p-4 rounded-4 bg-white h-100 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
              <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3" style={{ width: "36px", height: "36px", backgroundColor: "#eef2ff", color: "#4f46e5" }}>
                <CheckCircle2 size={20} />
              </div>
              <h3 className="fw-bold fs-6 mb-2" style={{ color: "#111827" }}>Flexible Tracker Types</h3>
              <p className="small m-0" style={{ lineHeight: "1.6", color: "#6b7280" }}>
                Manage counters, habits, logs, and targeted metrics seamlessly with dynamic color-coded interfaces and custom filters.
              </p>
            </div>
          </div>
        </div>

        {/* The Mission Section */}
        <div className="p-4 p-md-5 rounded-4 shadow-sm" style={{ backgroundColor: "#111827", color: "#f9fafb" }}>
          <div className="d-flex align-items-center gap-2 mb-3 fw-bold fs-5" style={{ color: "#a5b4fc" }}>
            <Target size={22} /> Why UNI-TRACK Was Created
          </div>
          <p className="small mb-3" style={{ lineHeight: "1.8", color: "#d1d5db", fontSize: "0.95rem" }}>
            Most productivity apps fall into a bad habit: they are bloated with social distractions or they sustain themselves by harvesting and monetizing your personal behavioral data. 
          </p>
          <p className="small mb-4" style={{ lineHeight: "1.8", color: "#d1d5db", fontSize: "0.95rem" }}>
            <strong style={{ color: "#fff" }}>UNI-TRACK</strong> was built to prove that you can build a sustainable platform without selling out your users. While we plan to sustainably monetize through advanced productivity tools and premium features, your personal habits, metrics, and data will never be treated as commodities. 
          </p>
          <div className="p-3 rounded-3 d-flex align-items-start align-items-sm-center gap-3" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="d-inline-flex p-2 rounded-circle" style={{ backgroundColor: "rgba(165,180,252,0.1)" }}>
              <Lock size={18} style={{ color: "#a5b4fc" }} /> 
            </div>
            <span className="small fw-semibold" style={{ color: "#e5e7eb" }}>
              Sustainable software, zero data exploitation. Take back control of your workflow today.
            </span>
          </div>
        </div>

        {/* Premium Footer */}
        <div className="text-center mt-5 pb-4 d-flex flex-column gap-2" style={{ fontSize: "0.85rem" }}>
          <div style={{ color: "#6b7280" }}>&copy; {new Date().getFullYear()} UNI-TRACK. Built for privacy, speed, and focus.</div>
          <div className="d-inline-flex align-items-center justify-content-center gap-1 mx-auto px-3 py-1.5 rounded-pill" style={{ backgroundColor: "#eef2ff", border: "1px solid #e0e7ff" }}>
            <Code2 size={14} style={{ color: "#4f46e5" }} /> 
            <span style={{ color: "#4b5563" }}>Crafted with precision by</span> 
            <span className="fw-bold" style={{ color: "#111827", letterSpacing: "0.5px" }}>AD3N1X</span>
          </div>
        </div>
      </div>
    </div>
  );
}