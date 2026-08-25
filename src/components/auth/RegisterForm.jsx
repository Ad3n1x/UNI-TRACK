import React, { useState } from "react";
import axios from "axios";
import { useFormik } from "formik";
import * as yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

const RAW_BASE_URL =
  (typeof process !== "undefined" && process.env && (process.env.REACT_APP_API_URL || process.env.REACT_APP_BASE_URL)) ||
  (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL)) ||
  "https://lv3node.onrender.com";

const BASE_URL = RAW_BASE_URL.replace(/\/$/, "");

const Register = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState("register"); // "register" or "otp"
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [loadingText, setLoadingText] = useState("Sending Verification Code...");

  const formik = useFormik({
    initialValues: {
      firstname: "",
      lastname: "",
      email: "",
      password: "",
    },

    validationSchema: yup.object({
      firstname: yup
        .string()
        .required("First name is required")
        .min(3, "Minimum of three letters"),
      lastname: yup.string().required("Last name is required"),
      email: yup.string().required("Email is required").email("Invalid email address"),
      password: yup
        .string()
        .required("Password is required")
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          "Must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&)"
        ),
    }),

    onSubmit: async (values, { setSubmitting }) => {
      setLoadingText("Sending Verification Code...");
      
      // Render free-tier cold start notification handler
      const coldStartTimer = setTimeout(() => {
        setLoadingText("Waking up server (~30s)...");
        toast.info("Server is waking up from sleep mode, please wait...", { autoClose: 5000 });
      }, 4000);

      try {
        const response = await axios.post(
          `${BASE_URL}/api/v1/auth/register`,
          {
            firstName: values.firstname,
            lastName: values.lastname,
            email: values.email.trim().toLowerCase(),
            password: values.password,
          },
          { timeout: 60000 }
        );

        clearTimeout(coldStartTimer);
        toast.success(response.data.message || "OTP sent to your email! 🎉");
        setRegisteredEmail(values.email.trim().toLowerCase());
        setStep("otp");
      } catch (err) {
        clearTimeout(coldStartTimer);
        console.error("Registration error:", err);

        let errorMsg = "Registration failed";
        if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
          errorMsg = "Server took too long to respond. Please try submitting again.";
        } else if (!err.response) {
          errorMsg = "Network error: Unable to reach the server. Check your connection.";
        } else {
          errorMsg = err.response?.data?.message || err.response?.data?.error || errorMsg;
        }

        toast.error(errorMsg);
      } finally {
        setSubmitting(false);
        setLoadingText("Sending Verification Code...");
      }
    },
  });

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpValue || otpValue.length < 6) {
      toast.error("Please enter a valid 6-digit OTP code");
      return;
    }

    setIsVerifying(true);
    const coldStartTimer = setTimeout(() => {
      toast.info("Server is waking up, verification may take a moment...", { autoClose: 5000 });
    }, 4000);

    try {
      await axios.post(
        `${BASE_URL}/api/v1/auth/verify-otp`,
        {
          email: registeredEmail,
          otp: otpValue,
        },
        { timeout: 60000 }
      );

      clearTimeout(coldStartTimer);
      toast.success("Account verified successfully! 🎉 Please sign in.");
      navigate("/login");
    } catch (err) {
      clearTimeout(coldStartTimer);
      console.error("OTP verification error:", err);

      let errorMsg = "Invalid or expired OTP";
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        errorMsg = "Request timed out while verifying. Please try again.";
      } else if (!err.response) {
        errorMsg = "Network error: Unable to reach the server.";
      } else {
        errorMsg = err.response?.data?.message || err.response?.data?.error || errorMsg;
      }

      toast.error(errorMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 px-3 py-4 bg-light">
      <div className="p-4 p-md-5 rounded-4 shadow-lg bg-white w-100 border border-light" style={{ maxWidth: "480px" }}>
        
        {step === "register" ? (
          <>
            <div className="text-center mb-4">
              <h2 className="fw-bold text-dark">Create Account</h2>
              <p className="text-muted small">Join us and start tracking your progress today.</p>
            </div>

            <form onSubmit={formik.handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold text-secondary small">First Name</label>
                <input
                  type="text"
                  name="firstname"
                  className={`form-control ${formik.touched.firstname && formik.errors.firstname ? "is-invalid" : ""}`}
                  placeholder="John"
                  value={formik.values.firstname}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.firstname && formik.errors.firstname && (
                  <div className="invalid-feedback">{formik.errors.firstname}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-secondary small">Last Name</label>
                <input
                  type="text"
                  name="lastname"
                  className={`form-control ${formik.touched.lastname && formik.errors.lastname ? "is-invalid" : ""}`}
                  placeholder="Doe"
                  value={formik.values.lastname}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.lastname && formik.errors.lastname && (
                  <div className="invalid-feedback">{formik.errors.lastname}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-secondary small">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className={`form-control ${formik.touched.email && formik.errors.email ? "is-invalid" : ""}`}
                  placeholder="name@example.com"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.email && formik.errors.email && (
                  <div className="invalid-feedback">{formik.errors.email}</div>
                )}
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold text-secondary small">Password</label>
                <input
                  type="password"
                  name="password"
                  className={`form-control ${formik.touched.password && formik.errors.password ? "is-invalid" : ""}`}
                  placeholder="••••••••"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.password && formik.errors.password && (
                  <div className="invalid-feedback d-block mt-1">
                    <span className="small">{formik.errors.password}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="btn btn-primary w-100 py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
              >
                {formik.isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    {loadingText}
                  </>
                ) : (
                  "Register & Send OTP →"
                )}
              </button>
            </form>

            <p className="text-center mt-4 mb-0 small text-muted">
              Already have an account?{" "}
              <Link to="/login" className="text-primary text-decoration-none fw-semibold">
                Sign In
              </Link>
            </p>
          </>
        ) : (
          /* ================= OTP VERIFICATION SCREEN ================= */
          <div className="text-center py-2">
            <div className="mb-3 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-shield-lock" viewBox="0 0 16 16">
                <path d="M5.338 1.59a61 61 0 0 1-2.838.851.99.99 0 0 0-.634.421A60.002 60.002 0 0 0 2 11.93c.051 1.076.329 2.085 1.054 2.879A4.697 4.697 0 0 0 8 15c2.378 0 4.195-1.129 4.946-3.191.725-.794 1.003-1.803 1.054-2.879-.044-3.178-.97-6.046-2.508-9.068a.99.99 0 0 0-.634-.422c-.933-.234-1.895-.532-2.838-.851zm1.282-.767a65.02 65.02 0 0 1 2.756-.81c.214-.055.438.01.596.162a63.03 63.03 0 0 1 2.373 7.828c.04.205-.045.421-.212.536l-3.23 2.153a.999.999 0 0 1-1.108 0l-3.23-2.153a.994.994 0 0 1-.212-.536 63.02 63.02 0 0 1 2.373-7.828.988.988 0 0 1 .596-.162z"/>
              </svg>
            </div>
            
            <h2 className="fw-bold mb-2">Check Your Email</h2>
            <p className="text-muted small mb-4">
              We've sent a 6-digit verification code to <br />
              <strong className="text-dark bg-light px-2 py-1 rounded border d-inline-block mt-1">{registeredEmail}</strong>
            </p>

            <form onSubmit={handleVerifyOtp}>
              <div className="mb-4">
                <input
                  type="text"
                  className="form-control text-center fs-2 fw-bold rounded-3 py-2 shadow-sm"
                  placeholder="------"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                  style={{ letterSpacing: "12px", fontFamily: "monospace" }}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying || otpValue.length < 6}
                className="btn btn-success w-100 py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Verifying Code...
                  </>
                ) : (
                  "Verify & Complete Setup"
                )}
              </button>
            </form>

            <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
              <button
                type="button"
                className="btn btn-link btn-sm text-decoration-none text-muted p-0"
                onClick={() => setStep("register")}
              >
                ← Back to registration
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Register;