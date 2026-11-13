import CryptoJS from "crypto-js";

// Transitional decoder for values created by the pre-v2 client-side field format.
// New tracker data must use the RSA-OAEP + AES-GCM functions in e2ee.js.
const LEGACY_CLIENT_SECRET = "your_client_side_encryption_secret";

export function isLegacyEncryptedField(value) {
  return typeof value === "string" && value.startsWith("U2FsdGVkX1");
}

export function decryptLegacyField(value) {
  if (!isLegacyEncryptedField(value)) return value;
  try {
    const bytes = CryptoJS.AES.decrypt(value, LEGACY_CLIENT_SECRET);
    const decoded = bytes.toString(CryptoJS.enc.Utf8);
    if (!decoded) return value;
    try { return JSON.parse(decoded); } catch {
      return decoded !== "" && !Number.isNaN(Number(decoded)) ? Number(decoded) : decoded;
    }
  } catch {
    return value;
  }
}
