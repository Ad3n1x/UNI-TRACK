const DB_NAME = "unitrack-offline-cache";
const STORE_NAME = "tracker-snapshots";
const DB_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("Offline storage is not supported in this browser."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open offline storage."));
  });
}

const accountKey = (email) => String(email || "").trim().toLowerCase();

export async function saveEncryptedTrackerSnapshot(email, trackers) {
  if (!Array.isArray(trackers)) return;
  const db = await openDatabase();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put({ trackers, savedAt: new Date().toISOString() }, accountKey(email));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error("Could not save offline snapshot."));
      tx.onabort = () => reject(tx.error || new Error("Offline snapshot save was aborted."));
    });
  } finally {
    db.close();
  }
}

export async function loadEncryptedTrackerSnapshot(email) {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(accountKey(email));
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Could not read offline snapshot."));
    });
  } finally {
    db.close();
  }
}

export async function clearEncryptedTrackerSnapshot(email) {
  const db = await openDatabase();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(accountKey(email));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error("Could not clear offline snapshot."));
    });
  } finally {
    db.close();
  }
}
