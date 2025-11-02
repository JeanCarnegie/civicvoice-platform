const STORAGE_PREFIX = 'civicvoice.comments.';
const SALT = new TextEncoder().encode('civicvoice-feedback-comment');

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bufferToBase64(buffer: Uint8Array) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }
  let binary = '';
  buffer.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBuffer(value: string) {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(value, 'base64'));
  }
  const binary = atob(value);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}

async function deriveKey(account: string) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(account.toLowerCase()), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 5000,
      hash: 'SHA-256',
    },
    material,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptComment(account: string, value: string) {
  const key = await deriveKey(account);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(value));
  return {
    ciphertext: bufferToBase64(new Uint8Array(cipherBuffer)),
    iv: bufferToBase64(iv),
  };
}

export async function decryptComment(account: string, ciphertext: string, iv: string) {
  const key = await deriveKey(account);
  const buffer = base64ToBuffer(ciphertext);
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: base64ToBuffer(iv),
    },
    key,
    buffer,
  );
  return decoder.decode(decrypted);
}

export async function storeEncryptedComment(account: string, comment: string) {
  if (!comment || typeof window === 'undefined') return;
  const payload = await encryptComment(account, comment);
  const key = `${STORAGE_PREFIX}${account.toLowerCase()}`;
  const existingRaw = window.localStorage.getItem(key);
  const existing = existingRaw ? (JSON.parse(existingRaw) as Array<{ ciphertext: string; iv: string; timestamp: number }>) : [];
  existing.push({ ...payload, timestamp: Date.now() });
  window.localStorage.setItem(key, JSON.stringify(existing.slice(-20)));
}


