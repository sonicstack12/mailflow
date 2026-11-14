import crypto from "node:crypto";
import { env } from "../config/env.js";

function getKey() {
  const key = Buffer.from(env.SMTP_ENCRYPTION_KEY_BASE64, "base64");
  if (key.length !== 32) {
    throw new Error("SMTP_ENCRYPTION_KEY_BASE64 must be 32 bytes (base64-encoded).");
  }
  return key;
}

export function encryptSmtpPassword(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // v1:<iv>:<tag>:<ciphertext>
  return ["v1", iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":");
}

export function decryptSmtpPassword(enc: string): string {
  const key = getKey();
  const [v, ivB64, tagB64, ctB64] = enc.split(":");
  if (v !== "v1" || !ivB64 || !tagB64 || !ctB64) {
    throw new Error("Invalid encrypted password format.");
  }
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ct = Buffer.from(ctB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plain.toString("utf8");
}


