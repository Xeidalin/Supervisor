"use node";

import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits, standard for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Encrypt plaintext with AES-256-GCM.
 * Returns base64(iv + authTag + ciphertext).
 * Only called from actions (never exposed to frontend).
 */
export function encrypt(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, "hex");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypt a value produced by encrypt().
 * Takes base64(iv + authTag + ciphertext) and the key.
 * Only called from internal actions (never exposed to frontend).
 */
export function decrypt(encryptedBase64: string, keyHex: string): string {
  const key = Buffer.from(keyHex, "hex");
  const buffer = Buffer.from(encryptedBase64, "base64");

  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8",
  );
}

/**
 * Build masked key: "sk-...abcd"
 */
export function maskKey(plaintext: string): {
  prefix: string;
  last4: string;
  maskedKey: string;
} {
  const prefix = plaintext.substring(0, Math.min(8, plaintext.length - 4));
  const last4 = plaintext.slice(-4);
  return { prefix, last4, maskedKey: `${prefix}...${last4}` };
}
