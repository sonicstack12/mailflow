import type { NextFunction, Request, Response } from "express";
import { PlatformSetting } from "../db/models.js";
import { verifyAccessToken } from "../auth/jwt.js";
import { extractAccessToken, type AuthedRequest } from "./auth.js";

async function getSettingFlag(key: string, fallback = "false") {
  const doc = await PlatformSetting.findOne({ key }).lean();
  return (doc?.value ?? fallback).toLowerCase() === "true";
}

/** Block signups when enable_signups is false. */
export async function requireSignupsEnabled(_req: Request, res: Response, next: NextFunction) {
  try {
    const enabled = await getSettingFlag("enable_signups", "true");
    if (!enabled) {
      return res.status(403).json({ error: "New signups are currently disabled." });
    }
    return next();
  } catch {
    return next();
  }
}

/**
 * When maintenance_mode is on, block customer APIs.
 * Always allow: health, public status, content reads, auth login/logout/me, admin routes.
 */
export async function blockIfMaintenance(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const path = req.path || "";
    const fullUrl = req.originalUrl || path;

    const allowed =
      fullUrl.startsWith("/api/health") ||
      fullUrl.startsWith("/api/public") ||
      fullUrl.startsWith("/api/content") ||
      fullUrl.startsWith("/api/admin") ||
      fullUrl === "/api/auth/login" ||
      fullUrl === "/api/auth/logout" ||
      fullUrl === "/api/auth/me" ||
      fullUrl.startsWith("/api/auth/login") ||
      fullUrl.startsWith("/api/auth/logout") ||
      fullUrl.startsWith("/api/auth/me");

    if (allowed) return next();

    const maintenance = await getSettingFlag("maintenance_mode", "false");
    if (!maintenance) return next();

    // Admins may continue using customer APIs during maintenance
    const token = extractAccessToken(req);
    if (token) {
      try {
        const auth = verifyAccessToken(token);
        if (auth.roles.includes("admin")) return next();
      } catch {
        // ignore invalid token
      }
    }

    return res.status(503).json({ error: "Platform is under maintenance. Please try again later." });
  } catch {
    return next();
  }
}
