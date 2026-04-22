/**
 * AES-256-GCM encryption helpers for form data at rest.
 * Key is sourced from FORM_DATA_ENCRYPTION_KEY env var (64-char hex = 32 bytes).
 *
 * Each record gets its own random 12-byte IV. The GCM auth tag is stored
 * alongside the ciphertext so tampering is detectable on read.
 */

import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;   // 96-bit IV — recommended for GCM
const TAG_BYTES = 16;  // 128-bit auth tag

function getKey(): Buffer {
  const hex = process.env.FORM_DATA_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'FORM_DATA_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return Buffer.from(hex, 'hex');
}

export interface EncryptedBlob {
  iv: string;       // hex
  tag: string;      // hex
  data: string;     // hex ciphertext
}

/** Encrypt an arbitrary JSON-serialisable value. */
export function encryptValues(plaintext: Record<string, string>): EncryptedBlob {
  const key = getKey();
  const iv  = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);

  const json = JSON.stringify(plaintext);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv:   iv.toString('hex'),
    tag:  tag.toString('hex'),
    data: encrypted.toString('hex'),
  };
}

/** Decrypt a blob produced by encryptValues. Throws if auth tag fails. */
export function decryptValues(blob: EncryptedBlob): Record<string, string> {
  const key = getKey();
  const decipher = crypto.createDecipheriv(
    ALGO,
    key,
    Buffer.from(blob.iv, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(blob.tag, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(blob.data, 'hex')),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString('utf8')) as Record<string, string>;
}
