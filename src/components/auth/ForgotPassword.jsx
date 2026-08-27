import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

const RAW_BASE_URL =
  (typeof process !== "undefined" && process.env && (process.env.REACT_APP_API_URL || process.env.REACT_APP_BASE_URL)) ||
  (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL)) ||
  "https://lv3node.onrender.com";

const BASE_URL = RAW_BASE_URL.replace(/\/$/, "");

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Request Email, 2: Enter OTP & New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Sending Code...");

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    setLoadingText("Sending Code...");

    try {
      const res = await axios.post(
        `${BASE_URL}/api/v1/auth/forgot-password`,
        {
          email: email.trim().toLowerCase(),
        },
        { timeout: 60000 }
      );

      toast.success(res.data.message || "Reset code sent! 🎉");
      setStep(2);
    } catch (err) {
      console.error("Forgot password error:", err);

      let errorMsg = "Failed to send reset code.";
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        errorMsg = "Request took too long. Please try again.";
      } else if (!err.response) {
        errorMsg = "Network error: Unable to complete request. Check your connection.";
      } else {
        errorMsg = err.response?.data?.message || err.response?.data?.error || errorMsg;
      }

      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setLoadingText("Sending Code...");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    setLoadingText("Resetting Password...");

    try {
      const res = await axios.post(
        `${BASE_URL}/api/v1/auth/reset-password`,
        {
          email: email.trim().toLowerCase(),
          otp,
          newPassword,
        },
        { timeout: 60000 }
      );

      toast.success(res.data.message || "Password reset successfully! 🎉");
      navigate("/login");
    } catch (err) {
      console.error("Reset password error:", err);

      let errorMsg = "Password reset failed.";
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        errorMsg = "Request timed out. Please try again.";
      } else if (!err.response) {
        errorMsg = "Network error: Please check your connection.";
      } else {
        errorMsg = err.response?.data?.message || err.response?.data?.error || errorMsg;
      }

      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setLoadingText("Resetting Password...");
    }
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 px-3 py-4 bg-light">
      <div className="p-4 p-md-5 rounded-4 shadow-lg bg-white w-100 border border-light" style={{ maxWidth: "440px" }}>
        
        {step === 1 ? (
          <>
            <div className="text-center mb-4">
              <h3 className="fw-bold text-dark">Forgot Password?</h3>
              <p className="text-muted small">Enter your email and we'll send you a recovery code.</p>
            </div>

            <form onSubmit={handleRequestOtp}>
              <div className="mb-3">
                <label className="form-label fw-semibold text-secondary small">Email Address</label>
                <input
                  type="email"
                  className="form-control rounded-3 py-2 shadow-sm"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-100 py-2 fw-semibold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2 mb-3"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    {loadingText}
                  </>
                ) : (
                  "Send Reset Code →"
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-4">
              <h3 className="fw-bold text-dark">Reset Password</h3>
              <p className="text-muted small">Enter the 6-digit code sent to <strong className="text-dark">{email}</strong> and your new password.</p>
            </div>

            <form onSubmit={handleResetPassword}>
              <div className="mb-3">
                <label className="form-label fw-semibold text-secondary small">6-Digit OTP Code</label>
                <input
                  type="text"
                  className="form-control text-center fw-bold fs-4 rounded-3 shadow-sm"
                  placeholder="------"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  style={{ letterSpacing: "8px", fontFamily: "monospace" }}
                  required
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold text-secondary small">New Password</label>
                <input
                  type="password"
                  className="form-control rounded-3 py-2 shadow-sm"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-success w-100 py-2 fw-semibold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2 mb-3"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    {loadingText}
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          </>
        )}

        <div className="text-center mt-2">
          <Link to="/login" className="text-decoration-none text-muted small fw-semibold">
            ← Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;