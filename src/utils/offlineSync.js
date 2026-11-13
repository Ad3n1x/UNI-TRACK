const STORAGE_KEY = "unitrack.pendingTrackerWrites.v1";

function readQueue() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.slice(-100)));
  window.dispatchEvent(new CustomEvent("unitrack:queue-change"));
}

export function getPendingTrackerWriteCount() {
  return readQueue().length;
}

export function getPendingTrackerWrites() {
  return readQueue();
}

export function queueEncryptedTrackerWrite(trackerId, encryptedEntries, expectedUpdatedAt) {
  const queue = readQueue().filter((item) => String(item.trackerId) !== String(trackerId));
  queue.push({
    trackerId: String(trackerId),
    body: { entries: encryptedEntries },
    expectedUpdatedAt: expectedUpdatedAt ? new Date(expectedUpdatedAt).getTime() : null,
    queuedAt: new Date().toISOString(),
  });
  writeQueue(queue);
}

export async function syncEncryptedTrackerWrite({ baseUrl, trackerId, encryptedEntries, headers, expectedUpdatedAt }) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    queueEncryptedTrackerWrite(trackerId, encryptedEntries, expectedUpdatedAt);
    return { queued: true };
  }

  try {
    const response = await fetch(`${baseUrl}/api/v1/trackers/${encodeURIComponent(trackerId)}`, {
      method: "PUT",
      headers: { ...headers, ...(expectedUpdatedAt ? { "If-Match": String(new Date(expectedUpdatedAt).getTime()) } : {}) },
      body: JSON.stringify({ entries: encryptedEntries }),
    });
    if (!response.ok) {
      const error = new Error(response.status === 409
        ? "This tracker changed on another device. Refresh and review the latest version before trying again."
        : `Tracker sync failed (HTTP ${response.status}).`);
      error.status = response.status;
      error.code = response.status === 409 ? "TRACKER_VERSION_CONFLICT" : undefined;
      throw error;
    }
    return { queued: false, response };
  } catch (error) {
    if (error instanceof TypeError || (typeof navigator !== "undefined" && navigator.onLine === false)) {
      queueEncryptedTrackerWrite(trackerId, encryptedEntries, expectedUpdatedAt);
      return { queued: true };
    }
    throw error;
  }
}

export async function flushPendingTrackerWrites({ baseUrl, headers }) {
  const queue = readQueue();
  if (!queue.length || (typeof navigator !== "undefined" && navigator.onLine === false)) {
    return { synced: 0, pending: queue.length, conflicts: 0 };
  }

  let synced = 0;
  let conflicts = 0;
  const remaining = [];
  for (const item of queue) {
    try {
      const response = await fetch(`${baseUrl}/api/v1/trackers/${encodeURIComponent(item.trackerId)}`, {
        method: "PUT",
        headers: { ...headers, ...(item.expectedUpdatedAt ? { "If-Match": String(item.expectedUpdatedAt) } : {}) },
        body: JSON.stringify(item.body),
      });
      if (response.ok) {
        synced += 1;
      } else {
        remaining.push(item);
        if (response.status === 409) conflicts += 1;
        // Authentication, validation and version conflicts need user attention.
        if ([400, 401, 403, 409].includes(response.status)) {
          remaining.push(...queue.slice(queue.indexOf(item) + 1));
          break;
        }
      }
    } catch {
      remaining.push(item, ...queue.slice(queue.indexOf(item) + 1));
      break;
    }
  }

  writeQueue(remaining);
  return { synced, pending: remaining.length, conflicts };
}
