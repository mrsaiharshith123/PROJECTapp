import { clearGoogleToken, getGoogleAccessToken } from "./googleAuth.js";

const FILE_NAME = "committrack-backup.enc.json";

function bytesToBase64(bytes) {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveAesKey(passphrase, saltBytes) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations: 200000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptBackupPayload(payload, passphrase) {
  const enc = new TextEncoder();
  const plain = enc.encode(JSON.stringify(payload));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(passphrase, salt);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
  return {
    version: 1,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    cipherText: bytesToBase64(new Uint8Array(cipher)),
    createdAt: new Date().toISOString(),
  };
}

export async function decryptBackupPayload(encryptedPayload, passphrase) {
  if (!encryptedPayload?.salt || !encryptedPayload?.iv || !encryptedPayload?.cipherText) {
    throw new Error("Backup payload is invalid.");
  }
  const salt = base64ToBytes(encryptedPayload.salt);
  const iv = base64ToBytes(encryptedPayload.iv);
  const cipherBytes = base64ToBytes(encryptedPayload.cipherText);
  const key = await deriveAesKey(passphrase, salt);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherBytes);
  return JSON.parse(new TextDecoder().decode(plain));
}

async function googleFetch(path, opts = {}) {
  const token = await getGoogleAccessToken();
  const res = await fetch(`https://www.googleapis.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401) {
    clearGoogleToken();
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Drive error (${res.status}): ${text || "request failed"}`);
  }
  return res;
}

export async function findExistingBackupFileId() {
  const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false and 'appDataFolder' in parents`);
  const res = await googleFetch(`/drive/v3/files?q=${q}&spaces=appDataFolder&fields=files(id,name,modifiedTime)`);
  const json = await res.json();
  return json.files?.[0] || null;
}

export async function uploadEncryptedBackup(encryptedPayload) {
  const existing = await findExistingBackupFileId();
  const metadata = existing
    ? { name: FILE_NAME }
    : { name: FILE_NAME, parents: ["appDataFolder"] };
  const body =
    `--boundary\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--boundary\r\n` +
    `Content-Type: application/json\r\n\r\n${JSON.stringify(encryptedPayload)}\r\n--boundary--`;
  const method = existing ? "PATCH" : "POST";
  const endpoint = existing
    ? `/upload/drive/v3/files/${existing.id}?uploadType=multipart`
    : "/upload/drive/v3/files?uploadType=multipart";
  const res = await googleFetch(endpoint, {
    method,
    headers: { "Content-Type": "multipart/related; boundary=boundary" },
    body,
  });
  return res.json();
}

export async function downloadEncryptedBackup() {
  const existing = await findExistingBackupFileId();
  if (!existing?.id) return null;
  const res = await googleFetch(`/drive/v3/files/${existing.id}?alt=media`);
  const payload = await res.json();
  return { payload, file: existing };
}
