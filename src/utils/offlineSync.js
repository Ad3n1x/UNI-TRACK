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

/**
 * Queue only the already encrypted tracker payload. PUT replaces the entries
 * collection, so retaining the newest payload per tracker is idempotent.
 */
export function queueEncryptedTrackerWrite(trackerId, encryptedEntries) {
  const queue = readQueue().filter((item) => String(item.trackerId) !== String(trackerId));
  queue.push({
    trackerId: String(trackerId),
    body: { entries: encryptedEntries },
    queuedAt: new Date().toISOString(),
  });
  writeQueue(queue);
}

export async function syncEncryptedTrackerWrite({ baseUrl, trackerId, encryptedEntries, headers }) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    queueEncryptedTrackerWrite(trackerId, encryptedEntries);
    return { queued: true };
  }

  try {
    const response = await fetch(`${baseUrl}/api/v1/trackers/${encodeURIComponent(trackerId)}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ entries: encryptedEntries }),
    });
    if (!response.ok) {
      const error = new Error(`Tracker sync failed (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return { queued: false, response };
  } catch (error) {
    if (error instanceof TypeError || (typeof navigator !== "undefined" && navigator.onLine === false)) {
      queueEncryptedTrackerWrite(trackerId, encryptedEntries);
      return { queued: true };
    }
    throw error;
  }
}

export async function flushPendingTrackerWrites({ baseUrl, headers }) {
  const queue = readQueue();
  if (!queue.length || (typeof navigator !== "undefined" && navigator.onLine === false)) {
    return { synced: 0, pending: queue.length };
  }

  let synced = 0;
  const remaining = [];
  for (const item of queue) {
    try {
      const response = await fetch(`${baseUrl}/api/v1/trackers/${encodeURIComponent(item.trackerId)}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(item.body),
      });
      if (response.ok) {
        synced += 1;
      } else {
        remaining.push(item);
        // Authentication and validation failures need user attention; don't hammer the API.
        if (response.status === 401 || response.status === 403 || response.status === 400) {
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
  return { synced, pending: remaining.length };
}
