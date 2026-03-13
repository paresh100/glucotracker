const ITERATION_COUNT = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATION_COUNT,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(plaintext: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  return JSON.stringify({
    version: 2,
    format: "glucotrack-encrypted",
    algorithm: "AES-256-GCM",
    kdf: "PBKDF2-SHA256",
    iterations: ITERATION_COUNT,
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    data: arrayBufferToBase64(ciphertext),
  });
}

export async function decryptData(payload: string, password: string): Promise<string> {
  const parsed = JSON.parse(payload);
  if (parsed.version !== 2 || parsed.format !== "glucotrack-encrypted") {
    throw new Error("Unsupported backup format");
  }

  const salt = new Uint8Array(base64ToArrayBuffer(parsed.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(parsed.iv));
  const ciphertext = base64ToArrayBuffer(parsed.data);
  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
