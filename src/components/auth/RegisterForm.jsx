import React from "react";

export default function RegisterForm() {
  return (
    <form className="card border-0 shadow-sm rounded-4 p-3">
      <h5 className="fw-semibold mb-3">Register</h5>
      <div className="mb-2">
        <label className="form-label small">Email</label>
        <input type="email" className="form-control form-control-sm" />
      </div>
      <div className="mb-2">
        <label className="form-label small">Password</label>
        <input type="password" className="form-control form-control-sm" />
      </div>
      <button className="btn btn-outline-primary btn-sm mt-2" type="button">
        Register (demo)
      </button>
    </form>
  );
}
