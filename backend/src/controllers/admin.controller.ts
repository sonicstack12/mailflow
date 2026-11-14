import { Response } from "express";
import { z } from "zod";
import { AdminService } from "../services/admin.service.js";
import { AuthedRequest } from "../middleware/auth.js";

export class AdminController {
    static async getUsers(_req: AuthedRequest, res: Response) {
        try {
            const users = await AdminService.getUsers();
            res.json({ users });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async getActivities(req: AuthedRequest, res: Response) {
        try {
            const page = Math.max(1, parseInt(req.query.page as string || "1", 10));
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || "50", 10)));
            const activities = await AdminService.getActivities(page, limit);
            res.json(activities);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async updateSubscription(req: AuthedRequest, res: Response) {
        try {
            const schema = z.object({ subscription_tier: z.enum(["free", "premium"]) });
            const body = schema.parse(req.body);
            const userId = z.string().uuid().parse(req.params.userId);

            await AdminService.updateSubscription(userId, body.subscription_tier);
            res.json({ ok: true });
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    }

    static async getSettings(_req: AuthedRequest, res: Response) {
        try {
            const settings = await AdminService.getSettings();
            res.json({ settings });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async saveSettings(req: AuthedRequest, res: Response) {
        try {
            const schema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));
            const body = schema.parse(req.body);

            await AdminService.saveSettings(body);
            res.json({ ok: true });
        } catch (e: any) {
            if (e instanceof z.ZodError) {
                res.status(400).json({ error: `Validation error: ${e.errors.map(err => err.message).join(', ')}` });
            } else {
                res.status(400).json({ error: e.message || "Unknown error occurred" });
            }
        }
    }

    static async getStats(_req: AuthedRequest, res: Response) {
        try {
            const stats = await AdminService.getStats();
            res.json(stats);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async getAnalytics(req: AuthedRequest, res: Response) {
        try {
            const period = z.enum(["7d", "30d"]).parse((req.query.period as string) || "7d");
            const analytics = await AdminService.getAnalytics(period);
            res.json(analytics);
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    }
}
