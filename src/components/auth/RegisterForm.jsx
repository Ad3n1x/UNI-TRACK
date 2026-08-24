import React from "react";
import axios from "axios";
import { useFormik } from "formik";
import { jwtDecode } from "jwt-decode";
import Cookies from "universal-cookie";
import * as yup from "yup";
import { useNavigate, Link } from "react-router-dom";

const RAW_BASE_URL =
  import.meta.env.VITE_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://lv3node.onrender.com";

const BASE_URL = RAW_BASE_URL.replace(/\/$/, "");

const Register = () => {
  const cookie = new Cookies();
  const navigate = useNavigate();

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

        alert(response.data.message || "Registration successful!");

        const token = response.data.token || response.data.data?.token;

        if (token) {
          const expiryTime = jwtDecode(token);
          cookie.set("token", token, {
            path: "/",
            expires: expiryTime.exp ? new Date(expiryTime.exp * 1000) : undefined,
          });
        }

        // Navigate directly to login after registration
        navigate("/login");
      } catch (error) {
        alert(error.response?.data?.message || "Registration failed");
      }
    },
  });

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 px-3 py-4">
      {/* Responsive card wrapper using Bootstrap sizing columns */}
      <div className="p-4 rounded shadow-lg bg-light w-100" style={{ maxWidth: "450px" }}>
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
              className="form-control"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.password && formik.errors.password && (
              <small className="text-danger d-block mt-1">
                {formik.errors.password}
              </small>
            )}
          </div>

          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="btn btn-primary w-100 mt-3 fw-semibold"
          >
            {formik.isSubmitting ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center mt-3 mb-0 small text-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-primary text-decoration-none fw-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;