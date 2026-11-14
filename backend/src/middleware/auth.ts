import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken, type JwtUser } from "../auth/jwt.js";

declare global {
  // eslint-disable-next-line no-var
  var __mailGenieAuthTypes: unknown;
}

export type AuthedRequest = Request & { auth?: JwtUser };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.access_token as string | undefined;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    req.auth = verifyAccessToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!req.auth.roles.includes("admin")) {
    return res.status(403).json({ error: "Forbidden" });
  }
  return next();
}


