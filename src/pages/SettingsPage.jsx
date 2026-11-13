import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "universal-cookie";
import { ArrowLeft, ShieldCheck, MonitorSmartphone, LogOut, Trash2, RefreshCw, AlertTriangle, KeyRound } from "lucide-react";
import { rotateRecoveryCode, setKeyVaultUser, lockUserKeys, clearUserKeyVault } from "../utils/e2ee";
import { clearEncryptedTrackerSnapshot } from "../utils/offlineCache";

const API = (import.meta.env.VITE_API_URL || "https://lv3node.onrender.com").replace(/\/$/, "");
const authHeaders = () => {
  const cookies = new Cookies();
  const token = cookies.get("token") || localStorage.getItem("token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [newRecoveryCode, setNewRecoveryCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/api/v1/auth/sessions`, { headers: authHeaders() });
      if (response.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if (!response.ok) throw new Error("Could not load active sessions.");
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err.message || "Unable to load security information.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    try {
      setKeyVaultUser(localStorage.getItem("userEmail") || new Cookies().get("userEmail"));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const revokeSession = async (id) => {
    setBusy(id);
    setError("");
    try {
      const response = await fetch(`${API}/api/v1/auth/sessions/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!response.ok) throw new Error("Could not revoke that session.");
      setSessions((current) => current.filter((session) => session.id !== id));
      setMessage("Device session revoked.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const revokeAll = async () => {
    if (!window.confirm("Sign out every active device, including this one? You will need to sign in again.")) return;
    setBusy("all");
    try {
      const response = await fetch(`${API}/api/v1/auth/logout-all`, { method: "POST", headers: authHeaders() });
      if (!response.ok) throw new Error("Could not revoke all sessions.");
      lockUserKeys();
      new Cookies().remove("token", { path: "/" });
      localStorage.removeItem("token");
      localStorage.removeItem("userEmail");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy("");
    }
  };

  const createRecoveryCode = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const code = await rotateRecoveryCode(recoveryPassword);
      setNewRecoveryCode(code);
      setRecoveryPassword("");
    } catch (err) {
      setError(err.message || "Could not create a recovery code.");
    }
  };

  const deleteAccount = async (event) => {
    event.preventDefault();
    if (confirmation !== "DELETE") {
      setError("Type DELETE exactly to confirm account removal.");
      return;
    }
    if (!window.confirm("This permanently deletes your account, trackers, and registered notification subscriptions. Continue?")) return;
    setBusy("delete");
    setError("");
    const accountEmail = localStorage.getItem("userEmail") || new Cookies().get("userEmail") || "";
    try {
      const response = await fetch(`${API}/api/v1/auth/account`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ password, confirmation }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Account deletion failed.");
      new Cookies().remove("token", { path: "/" });
      new Cookies().remove("userEmail", { path: "/" });
      localStorage.removeItem("token");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("pro_payment_date");
      clearUserKeyVault();
      lockUserKeys();
      await clearEncryptedTrackerSnapshot(accountEmail).catch(() => {});
      sessionStorage.removeItem("unitrack.recoveryCodePending");
      setMessage("Account deleted.");
      navigate("/unitrack", { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy("");
    }
  };

  return (
    <main className="min-vh-100 py-4 py-md-5 bg-light">
      <div className="container" style={{ maxWidth: 900 }}>
        <Link to="/homepage" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2 mb-4">
          <ArrowLeft size={16} /> Back to workspace
        </Link>
        <header className="mb-4">
          <div className="d-flex align-items-center gap-2 text-primary mb-2"><ShieldCheck size={22} /><span className="small fw-bold text-uppercase">Account controls</span></div>
          <h1 className="display-6 fw-bold mb-2">Privacy & security</h1>
          <p className="text-secondary mb-0">Manage device access and control your UNI-TRACK account.</p>
        </header>

        {message && <div className="alert alert-success" role="status">{message}</div>}
        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        <section className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4">
          <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
            <div>
              <h2 className="h5 fw-bold mb-1">Active devices</h2>
              <p className="text-secondary small mb-0">Review signed-in devices and revoke access you no longer recognise.</p>
            </div>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadSessions} disabled={loading}><RefreshCw size={15} /></button>
          </div>
          {loading ? <p className="text-secondary small" role="status">Loading sessions…</p> : sessions.length ? (
            <div className="d-grid gap-2">
              {sessions.map((session) => (
                <div key={session.id} className="border rounded-3 p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
                  <div className="d-flex align-items-start gap-3">
                    <span className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary"><MonitorSmartphone size={19} /></span>
                    <div>
                      <div className="fw-semibold">{session.device || "Unknown device"} {session.isCurrent && <span className="badge text-bg-success ms-1">This device</span>}</div>
                      <div className="text-secondary small">IP: {session.ipAddress || "Unavailable"}</div>
                      <div className="text-secondary small">Last active: {new Date(session.lastSeenAt || session.createdAt).toLocaleString()}</div>
                      <div className="text-secondary small">Expires: {new Date(session.expiresAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <button type="button" className="btn btn-outline-danger btn-sm" disabled={busy === session.id || session.isCurrent} onClick={() => revokeSession(session.id)}>
                    {busy === session.id ? "Revoking…" : session.isCurrent ? "Current session" : "Revoke"}
                  </button>
                </div>
              ))}
            </div>
          ) : <p className="text-secondary small mb-0">No tracked device sessions were found. Older sign-ins may not appear until you sign in again.</p>}
          <button type="button" className="btn btn-outline-danger btn-sm mt-3 align-self-start" disabled={busy === "all" || sessions.length === 0} onClick={revokeAll}>
            <LogOut size={15} className="me-1" /> Sign out all devices
          </button>
        </section>

        <section className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4">
          <div className="d-flex align-items-center gap-2 mb-2 text-primary"><KeyRound size={19} /><h2 className="h5 fw-bold mb-0">Private-data recovery code</h2></div>
          <p className="text-secondary small">Create a fresh recovery code using your current account password. Store it offline in a password manager or another safe place. Anyone with this code and access to your account can recover your encrypted tracker key.</p>
          {newRecoveryCode && <div className="alert alert-warning small" role="status"><strong>Save this code now. It will not be shown again.</strong><code className="d-block bg-white text-dark rounded-3 p-3 mt-2 text-break user-select-all">{newRecoveryCode}</code><button type="button" className="btn btn-sm btn-dark mt-2" onClick={() => setNewRecoveryCode("")}>I've saved it</button></div>}
          <form onSubmit={createRecoveryCode} className="d-flex flex-wrap gap-2" style={{ maxWidth: 600 }}>
            <input type="password" autoComplete="current-password" className="form-control flex-grow-1" style={{ minWidth: 220 }} value={recoveryPassword} onChange={(e) => setRecoveryPassword(e.target.value)} placeholder="Current account password" required />
            <button type="submit" className="btn btn-outline-primary" disabled={!recoveryPassword}>Generate new recovery code</button>
          </form>
        </section>

        <section className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4">
          <h2 className="h5 fw-bold mb-2">How your privacy works</h2>
          <p className="text-secondary small mb-2">Tracker payloads use browser-side AES-GCM encryption with per-payload keys wrapped by RSA-OAEP. The private key is stored in a password-derived AES-GCM vault on this device, with a separate recovery code. This protects the key at rest, but it does not protect against a compromised browser, malicious extensions, XSS, or every account and tracker metadata field.</p>
          <div className="alert alert-warning small mb-0"><AlertTriangle size={15} className="me-1" /> UNI-TRACK does not currently claim that every account field, device backup or stored record is end-to-end encrypted. Avoid using it as a vault for passwords, financial credentials or highly sensitive secrets.</div>
        </section>

        <section className="card border border-danger-subtle shadow-sm rounded-4 p-3 p-md-4">
          <h2 className="h5 fw-bold text-danger mb-2">Delete account</h2>
          <p className="text-secondary small">Permanently remove your account, trackers, active sessions and push subscriptions. This cannot be undone.</p>
          <form onSubmit={deleteAccount} className="d-grid gap-3" style={{ maxWidth: 480 }}>
            <div>
              <label htmlFor="delete-password" className="form-label small fw-semibold">Confirm your password</label>
              <input id="delete-password" className="form-control" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="delete-confirmation" className="form-label small fw-semibold">Type DELETE to confirm</label>
              <input id="delete-confirmation" className="form-control" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-danger" disabled={busy === "delete" || confirmation !== "DELETE" || !password}>
              <Trash2 size={16} className="me-2" /> {busy === "delete" ? "Deleting account…" : "Permanently delete account"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
