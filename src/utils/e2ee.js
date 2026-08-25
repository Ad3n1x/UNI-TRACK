// ==========================================
// 1. BASE64 CONVERSION HELPERS
// ==========================================

function arrayBufferToBase64(buffer) {
  let binary = "";
  let bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  let binary_string = window.atob(base64);
  let len = binary_string.length;
  let bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// ==========================================
// 2. HYBRID ENCRYPTION (AES-GCM + RSA-OAEP)
// ==========================================

export async function encryptData(publicKeyJwk, plaintextData) {
  const publicKey = await window.crypto.subtle.importKey(
    "jwk",
    publicKeyJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );

  // Generate a random AES-GCM key for this specific payload
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(plaintextData));

  // Encrypt the actual data with AES
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoded
  );

  // Export and lock the AES key using the user's RSA Public Key
  const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    rawAesKey
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(iv),
    encryptedKey: arrayBufferToBase64(encryptedKeyBuffer),
  };
}

// ==========================================
// 3. HYBRID DECRYPTION
// ==========================================

export async function decryptData(privateKeyInput, encryptedPayload) {
  // Fallback if data is unencrypted or plain text
  if (!encryptedPayload || typeof encryptedPayload !== "object" || !encryptedPayload.ciphertext) {
    return encryptedPayload;
  }

  try {
    let privateKey = privateKeyInput;
    if (typeof privateKeyInput === "object" && privateKeyInput.kty) {
      privateKey = await window.crypto.subtle.importKey(
        "jwk",
        privateKeyInput,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["decrypt"]
      );
    }

    const encryptedKeyBuffer = base64ToArrayBuffer(encryptedPayload.encryptedKey);
    const iv = base64ToArrayBuffer(encryptedPayload.iv);
    const ciphertextBuffer = base64ToArrayBuffer(encryptedPayload.ciphertext);

    // Decrypt the AES key using the RSA Private Key
    const rawAesKey = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedKeyBuffer
    );

    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      rawAesKey,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    // Decrypt the data using the AES key
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      ciphertextBuffer
    );

    const decodedString = new TextDecoder().decode(decryptedBuffer);
    try {
      return JSON.parse(decodedString);
    } catch {
      return decodedString;
    }
  } catch (err) {
    console.error("Decryption error:", err);
    return encryptedPayload;
  }
}

// ==========================================
// 4. KEY INITIALIZATION & BACKEND SYNC
// ==========================================

export async function initializeUserKeys() {
  let publicKeyJwk = localStorage.getItem("e2ee_public_key");
  let privateKeyJwk = localStorage.getItem("e2ee_private_key");

  if (!publicKeyJwk || !privateKeyJwk) {
    // Generate RSA Key Pair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );

    const pubKeyExported = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const privKeyExported = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

    publicKeyJwk = JSON.stringify(pubKeyExported);
    privateKeyJwk = JSON.stringify(privKeyExported);

    localStorage.setItem("e2ee_public_key", publicKeyJwk);
    localStorage.setItem("e2ee_private_key", privateKeyJwk);

    // Auto-sync public key to backend
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("https://lv3node.onrender.com/api/v1/auth/public-key", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ publicKey: pubKeyExported }),
        });
      }
    } catch (err) {
      console.error("Failed to sync public key to backend:", err);
    }
  }

  // Import private key as a usable CryptoKey object
  const privateKeyObj = await window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(privateKeyJwk),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );

  return {
    publicKey: JSON.parse(publicKeyJwk),
    privateKey: privateKeyObj,
  };
}