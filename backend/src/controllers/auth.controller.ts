import { Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "../services/auth.service.js";
import { env } from "../config/env.js";

function setAuthCookie(res: Response, token: string) {
    res.cookie("access_token", token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}

export class AuthController {
    static async signup(req: Request, res: Response) {
        try {
            const schema = z.object({
                email: z.string().email(),
                password: z.string().min(8),
                fullName: z.string().min(1).max(191),
            });
            const body = schema.parse(req.body);

            const token = await AuthService.signup(body);
            setAuthCookie(res, token);
            res.json({ ok: true });
        } catch (e: any) {
            if (e.message === "Email already exists") {
                res.status(409).json({ error: e.message });
            } else {
                res.status(400).json({ error: e.message || "Bad Request" });
            }
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const schema = z.object({
                email: z.string().email(),
                password: z.string().min(1),
            });
            const body = schema.parse(req.body);

            const token = await AuthService.login(body);
            setAuthCookie(res, token);
            res.json({ ok: true });
        } catch (e: any) {
            res.status(401).json({ error: e.message || "Unauthorized" });
        }
    }

    static async logout(_req: Request, res: Response) {
        res.clearCookie("access_token", { path: "/" });
        res.json({ ok: true });
    }

    static async getMe(req: any, res: Response) {
        try {
            const auth = req.auth!;
            const data = await AuthService.getMe(auth.userId, auth.roles);
            res.json(data);
        } catch (e: any) {
            res.status(401).json({ error: e.message || "Unauthorized" });
        }
    }

    static async changePassword(req: any, res: Response) {
        try {
            const schema = z.object({
                currentPassword: z.string().min(1),
                newPassword: z.string().min(8),
            });
            const body = schema.parse(req.body);

            await AuthService.changePassword(req.auth!.userId, body);
            res.json({ ok: true });
        } catch (e: any) {
            res.status(400).json({ error: e.message || "Bad Request" });
        }
    }
}
