import React, { useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { Link, useNavigate } from "react-router-dom";

const RAW_BASE_URL =
  import.meta.env.VITE_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://lv3node.onrender.com";

const BASE_URL = RAW_BASE_URL.replace(/\/$/, "");

export default function LoginForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: email.trim(),
        password: password.trim(),
      });

      const cookies = new Cookies();
      cookies.set("token", response.data.token, { path: "/" });

      if (onSuccess) {
        onSuccess(response.data);
      } else {
        navigate("/homepage");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid credentials or login failed."
      );
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
        <div className="login-card p-4 rounded-4 shadow-lg bg-white border-0">
          <h2 className="text-center mb-4 fw-bold text-dark">Welcome Back</h2>

          {error && (
            <div className="alert alert-danger py-2 px-3 small mb-3 rounded-3" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold small text-secondary">Email</label>
              <input
                type="email"
                className="form-control form-control-md rounded-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold small text-secondary">Password</label>
              <input
                type="password"
                className="form-control form-control-md rounded-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              className="btn btn-primary w-100 py-2 mt-2 fw-semibold rounded-3 shadow-sm"
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center mt-3 mb-0 small text-muted">
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