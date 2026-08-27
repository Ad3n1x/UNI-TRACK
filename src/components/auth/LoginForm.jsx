import React, { useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Cookies from "universal-cookie";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";

const RAW_BASE_URL =
  (typeof process !== "undefined" && process.env && (process.env.REACT_APP_API_URL || process.env.REACT_APP_BASE_URL)) ||
  (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL)) ||
  "https://lv3node.onrender.com";

const BASE_URL = RAW_BASE_URL.replace(/\/$/, "");

export default function LoginForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        `${BASE_URL}/api/v1/auth/login`,
        {
          email: email.trim().toLowerCase(),
          password: password,
        },
        { timeout: 60000 }
      );

      toast.success(response.data.message || "Login successful! 🎉");
      const token = response.data.token || response.data.data?.token;

      if (token) {
        const cookies = new Cookies();
        try {
          const decodedToken = jwtDecode(token);
          cookies.set("token", token, {
            path: "/",
            secure: window.location.protocol === "https:",
            sameSite: "lax",
            expires: decodedToken?.exp ? new Date(decodedToken.exp * 1000) : undefined,
          });
        } catch (decodeErr) {
          console.error("Failed to decode JWT token:", decodeErr);
          cookies.set("token", token, { path: "/", secure: window.location.protocol === "https:" });
        }
      }

      if (onSuccess) {
        onSuccess(response.data);
      } else {
        navigate("/homepage");
      }
    } catch (err) {
      console.error("Login error details:", err);

      let errorMsg = "Invalid credentials or login failed.";
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
    }
  };

  return (
    <>
      <style>{`
        .login-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }

        .login-card:hover {
          box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.15) !important;
        }

        .login-card .form-control:focus {
          border-color: #86b7fe;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
        }

        .login-card .btn-primary {
          transition: background-color 0.15s ease-in-out, transform 0.1s ease-in-out;
        }

        .login-card .btn-primary:active {
          transform: scale(0.98);
        }
      `}</style>

      <div className="login-container d-flex flex-column align-items-center justify-content-center p-3">
        <div className="login-card p-4 p-md-5 rounded-4 shadow-lg bg-white border-0">
          
          {/* Back to Unitrack Link */}
          <div className="mb-3">
            <Link to="/unitrack" className="text-secondary text-decoration-none small d-inline-flex align-items-center gap-1 fw-semibold">
              <ArrowLeft size={14} /> Back to Uni-Track
            </Link>
          </div>

          <div className="text-center mb-4">
            <h2 className="fw-bold text-dark">Welcome Back</h2>
            <p className="text-muted small">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold small text-secondary">Email Address</label>
              <input
                type="email"
                className="form-control form-control-md rounded-3 py-2 shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label fw-semibold small text-secondary mb-0">Password</label>
                <Link to="/forgot-password" style={{ fontSize: "0.8rem" }} className="text-primary text-decoration-none fw-semibold">
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                className="form-control form-control-md rounded-3 py-2 shadow-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              className="btn btn-primary w-100 py-2 fw-semibold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Signing In...
                </>
              ) : (
                "Login →"
              )}
            </button>
          </form>

          <p className="text-center mt-4 mb-0 small text-muted">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary text-decoration-none fw-semibold">
              Register
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}