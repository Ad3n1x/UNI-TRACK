import CryptoJS from "crypto-js";
import { apiFetch } from "./api";

// UNI-TRACK browser-side encryption helpers.
// Private RSA keys are stored as non-extractable CryptoKey objects in IndexedDB.
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

const KEY_DATABASE = "unitrack-secure-key-store";
const KEY_STORE = "user-keys";
const KEY_ID = "primary";

function openKeyDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("Secure browser key storage is unavailable in this browser."));
      return;
    }
    const request = window.indexedDB.open(KEY_DATABASE, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(KEY_STORE)) database.createObjectStore(KEY_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open secure key storage."));
    request.onblocked = () => reject(new Error("Secure key storage is blocked by another browser tab."));
  });
}

function readKeyRecord(database) {
  return new Promise((resolve, reject) => {
    const request = database.transaction(KEY_STORE, "readonly").objectStore(KEY_STORE).get(KEY_ID);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("Could not read the encryption key."));
  });
}

function writeKeyRecord(database, record) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(KEY_STORE, "readwrite");
    transaction.objectStore(KEY_STORE).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Could not save the encryption key."));
    transaction.onabort = () => reject(transaction.error || new Error("Saving the encryption key was interrupted."));
  });
}

export async function encryptData(publicKeyJwk, plaintextData) {
  const publicKey = await window.crypto.subtle.importKey(
    "jwk",
    publicKeyJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
  const aesKey = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(plaintextData));
  const ciphertextBuffer = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoded);
  const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const encryptedKeyBuffer = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, rawAesKey);
  return {
    version: 1,
    algorithm: "RSA-OAEP-256+A256GCM",
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(iv),
    encryptedKey: arrayBufferToBase64(encryptedKeyBuffer),
  };
}


// Legacy compatibility only: old records were encrypted with this client-side key.
// New records must use encryptData() and the user's public key. Remove this fallback
// only after the account migration has been completed and verified.
const LEGACY_CLIENT_SECRET = "your_client_side_encryption_secret";

export function decryptLegacyField(value) {
  if (typeof value !== "string" || !value.startsWith("U2FsdGVkX1")) return value;
  try {
    const bytes = CryptoJS.AES.decrypt(value, LEGACY_CLIENT_SECRET);
    const decoded = bytes.toString(CryptoJS.enc.Utf8);
    if (!decoded) return value;
    try {
      return JSON.parse(decoded);
    } catch {
      return decoded !== "" && Number.isFinite(Number(decoded)) ? Number(decoded) : decoded;
    }
  } catch {
    return value;
  }
}

export async function decryptField(privateKey, value) {
  if (typeof value === "string") {
    if (value.startsWith("U2FsdGVkX1")) return decryptLegacyField(value);
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && parsed.ciphertext) {
        return decryptData(privateKey, parsed);
      }
    } catch {
      // A non-JSON string is a normal plaintext value or a legacy payload we cannot decode.
    }
    return value;
  }
  return decryptData(privateKey, value);
}

export async function encryptField(publicKey, value, serialize = false) {
  const encrypted = await encryptData(publicKey, value);
  return serialize ? JSON.stringify(encrypted) : encrypted;
}

export async function decryptData(privateKeyInput, encryptedPayload) {
  if (!encryptedPayload || typeof encryptedPayload !== "object" || !encryptedPayload.ciphertext) return encryptedPayload;
  const privateKey = privateKeyInput && privateKeyInput.kty
    ? await window.crypto.subtle.importKey("jwk", privateKeyInput, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"])
    : privateKeyInput;
  const rawAesKey = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    base64ToArrayBuffer(encryptedPayload.encryptedKey)
  );
  const aesKey = await window.crypto.subtle.importKey("raw", rawAesKey, { name: "AES-GCM" }, false, ["decrypt"]);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToArrayBuffer(encryptedPayload.iv) },
    aesKey,
    base64ToArrayBuffer(encryptedPayload.ciphertext)
  );
  const decoded = new TextDecoder().decode(decryptedBuffer);
  try { return JSON.parse(decoded); } catch { return decoded; }
}

function publicJwkFromPrivate(privateJwk) {
  const publicJwk = { ...privateJwk };
  ["d", "p", "q", "dp", "dq", "qi"].forEach((field) => delete publicJwk[field]);
  publicJwk.key_ops = ["encrypt"];
  return publicJwk;
}

export async function initializeUserKeys() {
  const database = await openKeyDatabase();
  try {
    let record = await readKeyRecord(database);
    let publicKeyJwk;
    let privateKey;

    if (record?.privateKey && record?.publicKeyJwk) {
      publicKeyJwk = record.publicKeyJwk;
      privateKey = record.privateKey;
    } else {
      const legacyPrivate = localStorage.getItem("e2ee_private_key");
      const legacyPublic = localStorage.getItem("e2ee_public_key");
      publicKeyJwk = legacyPublic;

      if (legacyPrivate) {
        const privateJwk = JSON.parse(legacyPrivate);
        if (!publicKeyJwk) publicKeyJwk = JSON.stringify(publicJwkFromPrivate(privateJwk));
        privateKey = await window.crypto.subtle.importKey(
          "jwk",
          privateJwk,
          { name: "RSA-OAEP", hash: "SHA-256" },
          false,
          ["decrypt"]
        );
      } else {
        if (legacyPublic) {
          throw new Error("Your encryption private key is missing from this browser. Existing encrypted records cannot be unlocked without that key.");
        }
        const keyPair = await window.crypto.subtle.generateKey(
          { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
          true,
          ["encrypt", "decrypt"]
        );
        const exportedPublic = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
        const exportedPrivate = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
        publicKeyJwk = JSON.stringify(exportedPublic);
        privateKey = await window.crypto.subtle.importKey(
          "jwk",
          exportedPrivate,
          { name: "RSA-OAEP", hash: "SHA-256" },
          false,
          ["decrypt"]
        );
      }

      record = { id: KEY_ID, privateKey, publicKeyJwk };
      await writeKeyRecord(database, record);
      // Remove the exportable legacy private key only after IndexedDB confirms the write.
      localStorage.removeItem("e2ee_private_key");
    }

    localStorage.setItem("e2ee_public_key", publicKeyJwk);

    // Keep key publication independent of key creation/migration. Existing IndexedDB
    // records must also retry if a previous network request failed or the marker was lost.
    const apiBase = (import.meta.env?.DEV ? import.meta.env.VITE_API_URL || "" : "").replace(/\/$/, "");
    if (localStorage.getItem("e2ee_public_key_synced") !== publicKeyJwk) {
      try {
        const response = await apiFetch(`${apiBase}/api/v1/auth/public-key`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ publicKey: publicKeyJwk }),
        });
        if (response.ok) {
          localStorage.setItem("e2ee_public_key_synced", publicKeyJwk);
        } else {
          console.warn("Public-key sync was not accepted; it will be retried later.");
        }
      } catch (error) {
        console.warn("Public-key sync will be retried when the key is next initialized:", error);
      }
    }

    return { publicKey: JSON.parse(publicKeyJwk), privateKey };
  } finally {
    database.close();
  }
}
