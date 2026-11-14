import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export type JwtUser = {
  userId: string;
  email: string;
  roles: Array<"admin" | "moderator" | "user">;
};

export function signAccessToken(payload: JwtUser) {
  const secret: Secret = env.JWT_SECRET;
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as any };
  return jwt.sign(payload, secret, options);
}

export function verifyAccessToken(token: string): JwtUser {
  const secret: Secret = env.JWT_SECRET;
  return jwt.verify(token, secret) as JwtUser;
}


