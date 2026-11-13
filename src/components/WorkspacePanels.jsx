import React, { useEffect, useState } from "react";
import { Activity, Archive, RotateCcw, Clock3, Trash2 } from "lucide-react";
import { initializeUserKeys, decryptData } from "../utils/e2ee";

const getToken = () => localStorage.getItem("token");

async function decryptLabel(value) {
  try {
    const { privateKey } = await initializeUserKeys();
    const result = await decryptData(privateKey, value);
    return typeof result === "string" ? result : "Private tracker";
  } catch {
    return "Private tracker";
  }
}

export default function WorkspacePanels({ baseUrl, darkMode, onRefresh }) {
  const [panel, setPanel] = useState(null);
  const [activity, setActivity] = useState([]);
  const [recovery, setRecovery] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [labels, setLabels] = useState({});

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken() || ""}`,
  });

  const loadPanel = async (nextPanel) => {
    if (panel === nextPanel) {
      setPanel(null);
      return;
    }
    setPanel(nextPanel);
    setLoading(true);
    try {
      const endpoint = nextPanel === "activity"
        ? "/api/v1/trackers/activity/recent?limit=50"
        : "/api/v1/trackers/recovery/list";
      const response = await fetch(`${baseUrl}${endpoint}`, { headers: headers() });
      if (!response.ok) throw new Error("Could not load this section.");
      const data = await response.json();
      if (nextPanel === "activity") {
        const rows = data.activity || [];
        setActivity(rows);
        const pairs = await Promise.all(rows.map(async (row) => [String(row.trackerId), await decryptLabel(row.trackerName)]));
        setLabels(Object.fromEntries(pairs));
      } else {
        const rows = data.trackers || [];
        setRecovery(rows);
        const pairs = await Promise.all(rows.map(async (row) => [String(row._id), await decryptLabel(row.name)]));
        setLabels(Object.fromEntries(pairs));
      }
    } catch (error) {
      console.error("Workspace panel error:", error);
    } finally {
      setLoading(false);
    }
  };

  const restoreTracker = async (id) => {
    setBusyId(id);
    try {
      const response = await fetch(`${baseUrl}/api/v1/trackers/${id}/restore`, {
        method: "POST",
        headers: headers(),
      });
      if (!response.ok) throw new Error("Restore failed.");
      setRecovery((current) => current.filter((item) => String(item._id) !== String(id)));
      onRefresh?.();
    } catch (error) {
      window.alert(error.message || "Could not restore this tracker.");
    } finally {
      setBusyId(null);
    }
  };

  const surface = darkMode ? "bg-dark text-light border-secondary" : "bg-white text-dark border";
  return (
    <section className={`mt-4 rounded-4 p-3 p-md-4 ${surface}`} aria-label="Workspace history and recovery">
      <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
        <div>
          <h3 className="h5 fw-bold mb-1">Workspace tools</h3>
          <p className="text-muted small mb-0">Your recent changes and safely archived items.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button type="button" className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2" aria-expanded={panel === "activity"} onClick={() => loadPanel("activity")}>
            <Activity size={15} /> Activity
          </button>
          <button type="button" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2" aria-expanded={panel === "recovery"} onClick={() => loadPanel("recovery")}>
            <Archive size={15} /> Archive & trash
          </button>
        </div>
      </div>

      {panel && (
        <div className="mt-3 pt-3 border-top">
          {loading ? <p className="text-muted small mb-0" role="status">Loading workspace information…</p> : null}
          {!loading && panel === "activity" && (
            activity.length ? (
              <ol className="list-unstyled mb-0 d-grid gap-3">
                {activity.map((item, index) => (
                  <li key={`${item.trackerId}-${item.at}-${index}`} className="d-flex gap-3 align-items-start">
                    <span className="rounded-circle bg-primary bg-opacity-10 text-primary p-2"><Clock3 size={15} /></span>
                    <div className="min-w-0">
                      <div className="fw-semibold small">{item.label}</div>
                      <div className="text-muted small">{labels[String(item.trackerId)] || "Private tracker"}</div>
                      <time className="text-muted" style={{ fontSize: ".75rem" }} dateTime={item.at}>{new Date(item.at).toLocaleString()}</time>
                    </div>
                  </li>
                ))}
              </ol>
            ) : <p className="text-muted small mb-0">No recent activity yet. Your tracker changes will appear here.</p>
          )}
          {!loading && panel === "recovery" && (
            recovery.length ? (
              <div className="d-grid gap-2">
                {recovery.map((item) => (
                  <div key={item._id} className="d-flex flex-wrap gap-2 align-items-center justify-content-between rounded-3 border p-3">
                    <div className="min-w-0">
                      <div className="fw-semibold text-break">{labels[String(item._id)] || "Private tracker"}</div>
                      <div className="text-muted small">{item.deletedAt ? "Recently deleted" : "Archived"} · Updated {new Date(item.updatedAt).toLocaleDateString()}</div>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2" disabled={busyId === item._id} onClick={() => restoreTracker(item._id)}>
                      <RotateCcw size={14} /> {busyId === item._id ? "Restoring…" : "Restore"}
                    </button>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted small mb-0">Nothing in your archive or recently deleted area.</p>
          )}
        </div>
      )}
    </section>
  );
}
