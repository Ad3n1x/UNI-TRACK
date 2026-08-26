import React from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, ArrowLeft } from "lucide-react";

export default function UnitrackPage() {
  return (
    <div className="min-vh-100 bg-light text-dark py-5">
      <div className="container" style={{ maxWidth: "800px" }}>
        
        {/* Back Link */}
        <Link to="/" className="btn btn-outline-secondary btn-sm mb-4 d-inline-flex align-items-center gap-2">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        {/* Content Box */}
        <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
          <div className="d-flex align-items-center gap-2 mb-3 text-primary">
            <LayoutDashboard size={32} />
            <span className="fw-bold fs-4">UNITRACK</span>
          </div>

          <h1 className="fw-bold mb-3" style={{ fontSize: "2rem" }}>
            UNITRACK – Modern Secure Tracking System
          </h1>

          <p className="lead text-muted mb-4">
            <strong>UNITRACK</strong> (also widely searched as UniTrack, unitrack, uni-track, or uni track) is a fast, secure, React-based tracking ecosystem designed for total user privacy and speed.
          </p>

          <hr className="my-4" />

          <h3 className="h5 fw-bold mb-3">Why Choose UNITRACK?</h3>
          <ul className="list-unstyled mb-4">
            <li className="mb-2">🔒 <strong>End-to-End Encryption (E2EE):</strong> Your trackers and entries are encrypted locally in your browser.</li>
            <li className="mb-2">⚡ <strong>Lightning Fast:</strong> Built with modern web standards and React for zero-lag interactions.</li>
            <li className="mb-2">📱 <strong>PWA & Push Notifications:</strong> Stay on top of your daily goals with built-in push alert capabilities.</li>
          </ul>

          <div className="d-flex gap-3">
            <Link to="/" className="btn btn-primary px-4 py-2 fw-semibold">
              Get Started with Uni-Track
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}