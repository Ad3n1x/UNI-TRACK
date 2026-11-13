// Client-side hybrid encryption with a password-protected private-key vault.
// Tracker payloads remain encrypted with AES-GCM; each payload key is wrapped by RSA-OAEP.
// The RSA private JWK is never intentionally persisted in plaintext after migration.

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

function base64ToArrayBuffer(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = window.atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

const PRIVATE_VAULT_KEY = "e2ee_private_vault_v2";
const RECOVERY_VAULT_KEY = "e2ee_recovery_vault_v1";
const PUBLIC_KEY_KEY = "e2ee_public_key";
let unlockedPrivateKey = null;
let activeUserScope = "unassigned";

const scopedKey = (key) => `unitrack:${activeUserScope}:${key}`;
const getScopedItem = (key) => localStorage.getItem(scopedKey(key));
const setScopedItem = (key, value) => localStorage.setItem(scopedKey(key), value);
const removeScopedItem = (key) => localStorage.removeItem(scopedKey(key));

export function setKeyVaultUser(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) throw new Error("Cannot select a private-key vault without an account identity.");
  const nextScope = toBase64Url(new TextEncoder().encode(normalized));
  if (nextScope !== activeUserScope) {
    unlockedPrivateKey = null;
    sessionStorage.removeItem("unitrack.recoveryCodePending");
  }
  activeUserScope = nextScope;
  // Move legacy single-account keys to the first account that signs in on this browser.
  for (const key of [PRIVATE_VAULT_KEY, RECOVERY_VAULT_KEY, PUBLIC_KEY_KEY, "e2ee_private_key"]) {
    const scoped = scopedKey(key);
    if (!localStorage.getItem(scoped) && localStorage.getItem(key)) {
      localStorage.setItem(scoped, localStorage.getItem(key));
      localStorage.removeItem(key);
    }
  }
}

export function lockUserKeys() {
  unlockedPrivateKey = null;
}

export function clearUserKeyVault() {
  for (const key of [PRIVATE_VAULT_KEY, RECOVERY_VAULT_KEY, PUBLIC_KEY_KEY, "e2ee_private_key"]) {
    removeScopedItem(key);
  }
  unlockedPrivateKey = null;
}

const toBase64Url = (buffer) => arrayBufferToBase64(buffer).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
const randomBytes = (length) => window.crypto.getRandomValues(new Uint8Array(length));

async function deriveWrappingKey(secret, salt) {
  const material = await window.crypto.subtle.importKey(
    "raw", new TextEncoder().encode(String(secret)), "PBKDF2", false, ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function wrapPrivateJwk(privateJwk, secret) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveWrappingKey(secret, salt);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(privateJwk))
  );
  return { version: 2, kdf: "PBKDF2-SHA256", iterations: 310000, salt: toBase64Url(salt), iv: toBase64Url(iv), ciphertext: toBase64Url(ciphertext) };
}

async function unwrapPrivateJwk(envelope, secret) {
  if (!envelope || envelope.version !== 2) throw new Error("Unsupported private-key vault format.");
  const salt = base64ToArrayBuffer(envelope.salt);
  const iv = base64ToArrayBuffer(envelope.iv);
  const ciphertext = base64ToArrayBuffer(envelope.ciphertext);
  const key = await deriveWrappingKey(secret, salt);
  const plaintext = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(plaintext));
}

async function importPrivateKey(privateJwk) {
  return window.crypto.subtle.importKey(
    "jwk",
    privateJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );
}

function publicJwkFromPrivate(privateJwk) {
  return {
    kty: "RSA",
    n: privateJwk.n,
    e: privateJwk.e,
    alg: "RSA-OAEP-256",
    ext: true,
    key_ops: ["encrypt"],
  };
}

async function persistVault(privateJwk, password, recoveryCode) {
  const passwordEnvelope = await wrapPrivateJwk(privateJwk, password);
  const recoveryEnvelope = await wrapPrivateJwk(privateJwk, recoveryCode);
  setScopedItem(PRIVATE_VAULT_KEY, JSON.stringify(passwordEnvelope));
  setScopedItem(RECOVERY_VAULT_KEY, JSON.stringify(recoveryEnvelope));
  // Remove the old extractable private JWK after both recovery paths are stored.
  removeScopedItem("e2ee_private_key");
  await syncRecoveryEnvelope(recoveryEnvelope).catch((error) => console.warn("Recovery envelope sync will retry:", error.message));
  return recoveryCode;
}

async function fetchPublicKeyFromServer() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const baseUrl = (import.meta.env.VITE_API_URL || "https://lv3node.onrender.com").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/api/v1/auth/public-key`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const data = await response.json();
  if (!data.publicKey) return null;
  try {
    const parsed = typeof data.publicKey === "string" ? JSON.parse(data.publicKey) : data.publicKey;
    if (parsed?.kty !== "RSA" || !parsed?.n || !parsed?.e) return null;
    setScopedItem(PUBLIC_KEY_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return null;
  }
}

async function syncRecoveryEnvelope(envelope) {
  const token = localStorage.getItem("token");
  if (!token) return;
  const baseUrl = (import.meta.env.VITE_API_URL || "https://lv3node.onrender.com").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/api/v1/auth/key-vault/recovery`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ envelope }),
  });
  if (!response.ok) throw new Error("Could not sync encrypted recovery envelope.");
}

async function fetchRecoveryEnvelopeFromServer() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const baseUrl = (import.meta.env.VITE_API_URL || "https://lv3node.onrender.com").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/api/v1/auth/key-vault/recovery`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.envelope || null;
}

async function syncPublicKey(publicKeyJwk) {
  const token = localStorage.getItem("token");
  if (!token) return;
  const baseUrl = (import.meta.env.VITE_API_URL || "https://lv3node.onrender.com").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/api/v1/auth/public-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ publicKey: JSON.stringify(publicKeyJwk) }),
  });
  if (!response.ok) throw new Error("Could not sync the public encryption key.");
}

function getPublicKey() {
  const raw = getScopedItem(PUBLIC_KEY_KEY);
  return raw ? JSON.parse(raw) : null;
}

function rememberPrivateKey(privateJwk) {
  return importPrivateKey(privateJwk).then((key) => {
    unlockedPrivateKey = key;
    return key;
  });
}

export async function initializeUserKeys(password) {
  let publicKeyStored = getPublicKey();
  if (!publicKeyStored) publicKeyStored = await fetchPublicKeyFromServer();
  if (!publicKeyStored) {
    const remoteRecovery = await fetchRecoveryEnvelopeFromServer();
    if (remoteRecovery) {
      setScopedItem(RECOVERY_VAULT_KEY, JSON.stringify(remoteRecovery));
      const error = new Error("A recovery envelope exists for this account. Enter your recovery code to restore the existing private key.");
      error.code = "KEY_VAULT_RECOVERY_REQUIRED";
      throw error;
    }
  }
  const vaultRaw = getScopedItem(PRIVATE_VAULT_KEY);

  if (vaultRaw) {
    if (!password) {
      if (!unlockedPrivateKey) {
        const error = new Error("Unlock your private data with your account password or recovery code.");
        error.code = "KEY_VAULT_LOCKED";
        throw error;
      }
      return { publicKey: publicKeyStored, privateKey: unlockedPrivateKey };
    }
    const privateJwk = await unwrapPrivateJwk(JSON.parse(vaultRaw), String(password).trim());
    const recoveryEnvelopeRaw = getScopedItem(RECOVERY_VAULT_KEY);
    if (recoveryEnvelopeRaw) await syncRecoveryEnvelope(JSON.parse(recoveryEnvelopeRaw)).catch((error) => console.warn("Recovery envelope sync will retry:", error.message));
    const privateKey = await rememberPrivateKey(privateJwk);
    if (!publicKeyStored) {
      const derivedPublic = publicJwkFromPrivate(privateJwk);
      setScopedItem(PUBLIC_KEY_KEY, JSON.stringify(derivedPublic));
      await syncPublicKey(derivedPublic).catch((error) => console.warn("Public-key sync will retry:", error.message));
      return { publicKey: derivedPublic, privateKey };
    }
    await syncPublicKey(publicKeyStored).catch((error) => console.warn("Public-key sync will retry:", error.message));
    return { publicKey: publicKeyStored, privateKey };
  }

  // Migrate existing local plaintext private keys without changing the key pair,
  // so existing RSA-encrypted tracker data remains decryptable.
  const legacyPrivate = getScopedItem("e2ee_private_key");
  if (legacyPrivate) {
    if (!password) {
      const error = new Error("Your existing private key needs a one-time password-protected migration.");
      error.code = "KEY_VAULT_MIGRATION_REQUIRED";
      throw error;
    }
    const privateJwk = JSON.parse(legacyPrivate);
    const publicKey = publicKeyStored || publicJwkFromPrivate(privateJwk);
    setScopedItem(PUBLIC_KEY_KEY, JSON.stringify(publicKey));
    const recoveryCode = toBase64Url(randomBytes(24));
    await persistVault(privateJwk, String(password).trim(), recoveryCode);
    const privateKey = await rememberPrivateKey(privateJwk);
    await syncPublicKey(publicKey).catch((error) => console.warn("Public-key sync will retry:", error.message));
    return { publicKey, privateKey, recoveryCode };
  }

  // If a public key exists but its private key is missing, never silently generate
  // a replacement: that would permanently orphan existing encrypted tracker data.
  if (publicKeyStored) {
    const error = new Error("This device is missing the private key for your existing encrypted data. Use your recovery code or a device that still has the key.");
    error.code = "KEY_VAULT_RECOVERY_REQUIRED";
    throw error;
  }

  if (!password) {
    const error = new Error("A sign-in password is required to create your private-key vault.");
    error.code = "KEY_VAULT_PASSWORD_REQUIRED";
    throw error;
  }

  const pair = await window.crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["encrypt", "decrypt"]
  );
  const publicKey = await window.crypto.subtle.exportKey("jwk", pair.publicKey);
  const privateJwk = await window.crypto.subtle.exportKey("jwk", pair.privateKey);
  setScopedItem(PUBLIC_KEY_KEY, JSON.stringify(publicKey));
  const recoveryCode = toBase64Url(randomBytes(24));
  await persistVault(privateJwk, String(password).trim(), recoveryCode);
  const privateKey = await rememberPrivateKey(privateJwk);
  await syncPublicKey(publicKey).catch((error) => console.warn("Public-key sync will retry:", error.message));
  return { publicKey, privateKey, recoveryCode };
}

export async function unlockUserKeysWithRecoveryCode(recoveryCode, newPassword) {
  if (!recoveryCode || !newPassword) throw new Error("Enter your recovery code and current account password.");
  let recoveryRaw = getScopedItem(RECOVERY_VAULT_KEY);
  if (!recoveryRaw) {
    const remoteEnvelope = await fetchRecoveryEnvelopeFromServer();
    if (remoteEnvelope) {
      recoveryRaw = JSON.stringify(remoteEnvelope);
      setScopedItem(RECOVERY_VAULT_KEY, recoveryRaw);
    }
  }
  if (!recoveryRaw) throw new Error("No recovery envelope is available for this account.");
  const privateJwk = await unwrapPrivateJwk(JSON.parse(recoveryRaw), String(recoveryCode).trim());
  const newRecoveryCode = toBase64Url(randomBytes(24));
  await persistVault(privateJwk, String(newPassword).trim(), newRecoveryCode);
  const privateKey = await rememberPrivateKey(privateJwk);
  const publicKey = getPublicKey() || publicJwkFromPrivate(privateJwk);
  setScopedItem(PUBLIC_KEY_KEY, JSON.stringify(publicKey));
  await syncPublicKey(publicKey).catch((error) => console.warn("Public-key sync will retry:", error.message));
  return { publicKey, privateKey, recoveryCode: newRecoveryCode };
}


export async function rotateRecoveryCode(password) {
  const vaultRaw = getScopedItem(PRIVATE_VAULT_KEY);
  if (!vaultRaw) throw new Error("No password-protected private-key vault exists on this device.");
  const privateJwk = await unwrapPrivateJwk(JSON.parse(vaultRaw), String(password).trim());
  const recoveryCode = toBase64Url(randomBytes(24));
  const recoveryEnvelope = await wrapPrivateJwk(privateJwk, recoveryCode);
  setScopedItem(RECOVERY_VAULT_KEY, JSON.stringify(recoveryEnvelope));
  await syncRecoveryEnvelope(recoveryEnvelope).catch((error) => console.warn("Recovery envelope sync will retry:", error.message));
  await rememberPrivateKey(privateJwk);
  return recoveryCode;
}

export async function encryptData(publicKeyJwk, plaintextData) {
  const publicKey = await window.crypto.subtle.importKey(
    "jwk", publicKeyJwk, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]
  );
  const aesKey = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const iv = randomBytes(12);
  const encoded = new TextEncoder().encode(JSON.stringify(plaintextData));
  const ciphertextBuffer = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoded);
  const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const encryptedKeyBuffer = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, rawAesKey);
  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(iv),
    encryptedKey: arrayBufferToBase64(encryptedKeyBuffer),
  };
}

export async function decryptData(privateKeyInput, encryptedPayload) {
  if (!encryptedPayload || typeof encryptedPayload !== "object" || !encryptedPayload.ciphertext) return encryptedPayload;
  try {
    let privateKey = privateKeyInput;
    if (typeof privateKeyInput === "object" && privateKeyInput.kty) {
      privateKey = await importPrivateKey(privateKeyInput);
    }
    const rawAesKey = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" }, privateKey, base64ToArrayBuffer(encryptedPayload.encryptedKey)
    );
    const aesKey = await window.crypto.subtle.importKey("raw", rawAesKey, { name: "AES-GCM" }, false, ["decrypt"]);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToArrayBuffer(encryptedPayload.iv) },
      aesKey,
      base64ToArrayBuffer(encryptedPayload.ciphertext)
    );
    const decoded = new TextDecoder().decode(decryptedBuffer);
    try { return JSON.parse(decoded); } catch { return decoded; }
  } catch (error) {
    // Do not silently return ciphertext as if it were valid user content.
    const wrapped = new Error("Could not decrypt this tracker with the unlocked private key.");
    wrapped.cause = error;
    wrapped.code = "TRACKER_DECRYPTION_FAILED";
    throw wrapped;
  }
}
