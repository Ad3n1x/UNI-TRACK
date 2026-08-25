import React, { useState, useEffect } from "react";
import { generateKeyPair, encryptData, decryptData } from "../utils/e2ee";

export default function E2EEDemo() {
  const [keys, setKeys] = useState(null);
  const [inputText, setInputText] = useState("");
  const [ciphertext, setCiphertext] = useState("");
  const [decryptedText, setDecryptedText] = useState("");

  // Generate keys locally when component loads (in real apps, save private key to IndexedDB)
  useEffect(() => {
    async function initKeys() {
      const keyPair = await generateKeyPair();
      const exportedPublicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
      setKeys({ ...keyPair, exportedPublicKey });
    }
    initKeys();
  }, []);

  const handleEncrypt = async () => {
    if (!keys) return;
    const encrypted = await encryptData(keys.exportedPublicKey, inputText);
    setCiphertext(encrypted);
    setDecryptedText(""); // Reset decryption view
  };

  const handleDecrypt = async () => {
    if (!keys || !ciphertext) return;
    const decrypted = await decryptData(keys.privateKey, ciphertext);
    setDecryptedText(decrypted);
  };

  return (
    <div className="p-4 border rounded shadow-sm bg-white">
      <h3 className="fw-bold mb-3">E2EE Local Test Demo</h3>
      
      <div className="mb-3">
        <label className="form-label">Secret Message (Plaintext):</label>
        <input
          type="text"
          className="form-control"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type something secret..."
        />
        <button className="btn btn-primary mt-2" onClick={handleEncrypt}>
          Encrypt Client-Side
        </button>
      </div>

      {ciphertext && (
        <div className="mb-3 p-3 bg-light rounded">
          <p className="small text-muted mb-1">What the server / database sees (Ciphertext):</p>
          <code className="text-break text-danger">{ciphertext}</code>
          <div>
            <button className="btn btn-success btn-sm mt-2" onClick={handleDecrypt}>
              Decrypt Locally
            </button>
          </div>
        </div>
      )}

      {decryptedText && (
        <div className="alert alert-success mt-3">
          <strong>Successfully Decrypted:</strong> {decryptedText}
        </div>
      )}
    </div>
  );
}