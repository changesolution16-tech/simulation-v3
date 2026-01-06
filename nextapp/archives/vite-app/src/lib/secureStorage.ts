const ENCRYPTION_KEY_NAME = 'app_encryption_key';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  const existingKeyStr = sessionStorage.getItem(ENCRYPTION_KEY_NAME);

  if (existingKeyStr) {
    try {
      const keyData = JSON.parse(existingKeyStr);
      return await crypto.subtle.importKey(
        'jwk',
        keyData,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.warn('[SecureStorage] Failed to import existing key, generating new one');
    }
  }

  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const exportedKey = await crypto.subtle.exportKey('jwk', key);
  sessionStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exportedKey));

  return key;
}

export async function encryptData(data: string): Promise<string> {
  try {
    const key = await getOrCreateEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('[SecureStorage] Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

export async function decryptData(encryptedStr: string): Promise<string> {
  try {
    const key = await getOrCreateEncryptionKey();
    const combined = Uint8Array.from(atob(encryptedStr), c => c.charCodeAt(0));

    const iv = combined.slice(0, IV_LENGTH);
    const encryptedData = combined.slice(IV_LENGTH);

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('[SecureStorage] Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

export async function setSecureItem(key: string, value: any): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    const encrypted = await encryptData(serialized);
    sessionStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('[SecureStorage] Failed to store item:', error);
    throw error;
  }
}

export async function getSecureItem<T>(key: string): Promise<T | null> {
  try {
    const encrypted = sessionStorage.getItem(key);
    if (!encrypted) return null;

    const decrypted = await decryptData(encrypted);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error('[SecureStorage] Failed to retrieve item:', error);
    sessionStorage.removeItem(key);
    return null;
  }
}

export function removeSecureItem(key: string): void {
  sessionStorage.removeItem(key);
}

export function clearSecureStorage(): void {
  sessionStorage.clear();
}
