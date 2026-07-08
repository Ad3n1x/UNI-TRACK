import axios from "axios";
import { useFormik } from "formik";
import { jwtDecode } from "jwt-decode";
import React from "react";
import Cookies from "universal-cookie";
import * as yup from "yup";
import { Link } from 'react-router-dom'

const Formikk = () => {
  const cookie = new Cookies();

  const formik = useFormik({
    initialValues: {
      firstname: "",
      lastname: "",
      email: "",
      password: "",
    },

    validationSchema: yup.object({
      firstname: yup.string().required("First name is required").min(3, "minimum of three letters"),
      lastname: yup.string().required("Last name is required"),
      email: yup.string().required("email is required").email("invalid email"),
      password: yup
        .string()
        .required("Password is required")
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          "Password is too weak"
        ),
    }),

    onSubmit: async (values) => {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/api/v1/register`,
          {
            firstName: values.firstname,
            lastName: values.lastname,
            email: values.email,
            password: values.password,
            image: ""
          }
        );

        alert(response.data.message);

        const token = response.data.data.token;
        const expiryTime = jwtDecode(token);

        cookie.set("token", token, {
          expires: new Date(expiryTime.exp * 1000),
        });
      } catch (error) {
        alert(error.response?.data?.message || "Registration failed");
      }
    },
  });

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100">
      <div className="p-4 rounded shadow-lg bg-light" style={{ width: "420px" }}>
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
              <small className="text-danger">{formik.errors.password}</small>
            )}
          </div>

          <Link className="nav-link" to={"index"}>
            <button type="submit" className="btn btn-primary w-100 mt-3 fw-semibold">
              {formik.isSubmitting ? "Registering..." : "Register"}
            </button>
          </Link>
        </form>
      </div>
    </div>
  );
};

export default Formikk;
