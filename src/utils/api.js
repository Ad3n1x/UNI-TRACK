const RAW_API_BASE = (import.meta.env?.VITE_API_URL || "").trim();
export const API_BASE_URL = RAW_API_BASE.replace(/\/$/, "");

export function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function readCookie(name) {
  if (typeof document === "undefined") return "";
  const escapedName = name.replace(/[.*+?^\x24{}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export function getAuthHeaders(extraHeaders = {}) {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const csrfToken = readCookie("unitrack_csrf");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    ...extraHeaders,
  };
}

export async function apiFetch(input, options = {}) {
  const url = typeof input === "string" ? apiUrl(input) : input;
  const headers = new Headers(options.headers || {});
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const csrfToken = readCookie("unitrack_csrf");

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (csrfToken && !headers.has("X-CSRF-Token")) {
    headers.set("X-CSRF-Token", csrfToken);
  }

  return fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });
}
