import React, { useState } from "react";
import axios from "axios";
import { useFormik } from "formik";
import { jwtDecode } from "jwt-decode";
import Cookies from "universal-cookie";
import * as yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

const RAW_BASE_URL =
  import.meta.env.VITE_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://lv3node.onrender.com";

const BASE_URL = RAW_BASE_URL.replace(/\/$/, "");

const Register = () => {
  const cookie = new Cookies();
  const navigate = useNavigate();

  // State to toggle between registration form and OTP verification screen
  const [step, setStep] = useState("register"); // "register" or "otp"
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

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
        .min(3, "minimum of three letters"),
      lastname: yup.string().required("Last name is required"),
      email: yup.string().required("email is required").email("invalid email"),
      password: yup
        .string()
        .required("Password is required")
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          "Must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&)"
        ),
    }),

    onSubmit: async (values) => {
      try {
        const response = await axios.post(`${BASE_URL}/api/v1/auth/register`, {
          firstName: values.firstname,
          lastName: values.lastname,
          email: values.email,
          password: values.password,
        });

        toast.success(response.data.message || "OTP sent to your email!");
        setRegisteredEmail(values.email);
        setStep("otp"); // Switch view to OTP input screen
      } catch (error) {
        toast.error(error.response?.data?.message || "Registration failed");
      }
    },
  });

  // Handle final OTP submission
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpValue || otpValue.length < 4) {
      toast.error("Please enter a valid OTP code");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await axios.post(`${BASE_URL}/api/v1/auth/verify-otp`, {
        email: registeredEmail,
        otp: otpValue,
      });

      toast.success("Account verified successfully! 🎉");
      const token = response.data.token || response.data.data?.token;

      if (token) {
        const expiryTime = jwtDecode(token);
        cookie.set("token", token, {
          path: "/",
          expires: expiryTime.exp ? new Date(expiryTime.exp * 1000) : undefined,
        });
      }

      navigate("/homepage");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 px-3 py-4">
      <div className="p-4 rounded shadow-lg bg-light w-100" style={{ maxWidth: "450px" }}>
        
        {step === "register" ? (
          <>
            <h2 className="text-center mb-4 fw-bold">Create Account</h2>

            <form onSubmit={formik.handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">First Name</label>
                <input
                  type="text"
                  name="firstname"
                  className="form-control"
                  value={formik.values.firstname}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.firstname && formik.errors.firstname && (
                  <small className="text-danger">{formik.errors.firstname}</small>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Last Name</label>
                <input
                  type="text"
                  name="lastname"
                  className="form-control"
                  value={formik.values.lastname}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.lastname && formik.errors.lastname && (
                  <small className="text-danger">{formik.errors.lastname}</small>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.email && formik.errors.email && (
                  <small className="text-danger">{formik.errors.email}</small>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Password</label>
                <input
                  type="password"
                  name="password"
                  className={`form-control ${
                    formik.touched.password && formik.errors.password ? "is-invalid" : ""
                  }`}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />

                {formik.touched.password && formik.errors.password && (
                  <div className="invalid-feedback d-block mt-1">
                    <span className="fw-medium text-danger">{formik.errors.password}</span>
                    <div className="text-muted small mt-1">
                      💡 <span className="fst-italic">Example:</span> <code className="text-dark bg-light px-1 py-0.5 rounded">yourname@123</code>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="btn btn-primary w-100 mt-3 fw-semibold"
              >
                {formik.isSubmitting ? "Sending OTP..." : "Register & Send OTP"}
              </button>
            </form>

            <p className="text-center mt-3 mb-0 small text-muted">
              Already have an account?{" "}
              <Link to="/login" className="text-primary text-decoration-none fw-semibold">
                Login
              </Link>
            </p>
          </>
        ) : (
          /* ================= OTP VERIFICATION SCREEN ================= */
          <>
            <h2 className="text-center mb-2 fw-bold">Verify Your Email</h2>
            <p className="text-center text-muted small mb-4">
              We've sent a verification code to <strong>{registeredEmail}</strong>
            </p>

            <form onSubmit={handleVerifyOtp}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Enter OTP Code</label>
                <input
                  type="text"
                  className="form-control text-center fs-4 tracking-widest"
                  placeholder="123456"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="btn btn-success w-100 mt-3 fw-semibold"
              >
                {isVerifying ? "Verifying..." : "Verify OTP"}
              </button>
            </form>

            <div className="text-center mt-3">
              <button
                type="button"
                className="btn btn-link btn-sm text-decoration-none text-muted"
                onClick={() => setStep("register")}
              >
                ← Back to registration
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Register;