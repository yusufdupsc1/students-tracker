/**
 * Encrypted backup/restore using WebCrypto API.
 * Format: AES-256-GCM with PBKDF2 key derivation.
 */

export interface EncryptedBackup {
  iv: string
  salt: string
  ciphertext: string
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptBackup(json: string, password: string): Promise<EncryptedBackup> {
  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(json)
  )
  return {
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
    ciphertext: bufferToBase64(new Uint8Array(ciphertext))
  }
}

export async function decryptBackup(data: EncryptedBackup, password: string): Promise<string> {
  const iv = base64ToBuffer(data.iv)
  const salt = base64ToBuffer(data.salt)
  const key = await deriveKey(password, salt)
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    base64ToBuffer(data.ciphertext) as unknown as BufferSource
  )
  return new TextDecoder().decode(plaintext)
}

function bufferToBase64(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf))
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
