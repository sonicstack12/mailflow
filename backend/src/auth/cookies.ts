import type { CookieOptions, Response } from "express";
import { env } from "../config/env.js";

const COOKIE_NAME = "access_token";

/** Cross-origin frontends on Render need SameSite=None + Secure. */
export function authCookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, authCookieOptions());
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, authCookieOptions());
}

export { COOKIE_NAME };
