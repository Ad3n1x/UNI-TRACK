import React from "react";

export default function LoginForm() {
  return (
    <form className="card border-0 shadow-sm rounded-4 p-3 mb-3">
      <h5 className="fw-semibold mb-3">Login</h5>
      <div className="mb-2">
        <label className="form-label small">Email</label>
        <input type="email" className="form-control form-control-sm" />
      </div>
      <div className="mb-2">
        <label className="form-label small">Password</label>
        <input type="password" className="form-control form-control-sm" />
      </div>
      <button className="btn btn-primary btn-sm mt-2" type="button">
        Login (demo)
      </button>
    </form>
  );
}
