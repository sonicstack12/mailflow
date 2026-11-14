import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

// Prefer .env when present; otherwise fallback to env.example (Cursor blocks creating .env in some setups)
const envPath = path.resolve(process.cwd(), ".env");
const fallbackPath = path.resolve(process.cwd(), "env.example");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else if (fs.existsSync(fallbackPath)) {
  dotenv.config({ path: fallbackPath });
} else {
  dotenv.config();
}

const DEV_JWT_SECRET = "dev_jwt_secret_change_me_please_32chars";
const DEV_SMTP_KEY_BASE64 = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="; // 32 bytes of zero in base64

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGINS: z.string().default("http://localhost:5173,http://localhost:5174"),

  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/mail_genie"),

  JWT_SECRET: z.string().min(20).default(DEV_JWT_SECRET),
  JWT_EXPIRES_IN: z.string().default("7d"),

  SMTP_ENCRYPTION_KEY_BASE64: z.string().min(10).default(DEV_SMTP_KEY_BASE64),

  ADMIN_EMAIL: z.string().email().default("samarthzamre891@gmail.com"),
  ADMIN_PASSWORD: z.string().min(8).default("Samarth@321"),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

// Prevent accidental insecure defaults in production
if (env.NODE_ENV === "production") {
  if (env.JWT_SECRET === DEV_JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in production.");
  }
  if (env.SMTP_ENCRYPTION_KEY_BASE64 === DEV_SMTP_KEY_BASE64) {
    throw new Error("SMTP_ENCRYPTION_KEY_BASE64 must be set in production.");
  }
}

export const corsOrigins = env.CORS_ORIGINS.split(",")
  .map((s) => s.trim())
  .filter(Boolean);


