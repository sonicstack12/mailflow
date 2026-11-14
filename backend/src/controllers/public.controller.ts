import { Request, Response } from "express";
import { PlatformSetting } from "../db/models.js";

export class PublicController {
    static async getStatus(_req: Request, res: Response) {
        try {
            const setting = await PlatformSetting.findOne({ key: "maintenance_mode" }).lean();
            const limitSetting = await PlatformSetting.findOne({ key: "max_emails_per_day_free" }).lean();
            
            const isMaintenance = setting?.value === "true";
            const maxEmailsFree = limitSetting?.value || "250";

            res.json({ 
                maintenance_mode: isMaintenance,
                max_emails_per_day_free: maxEmailsFree
            });
        } catch (error) {
            console.error("Status error:", error);
            res.json({ 
                maintenance_mode: false,
                max_emails_per_day_free: "250"
            }); // Fallback
        }
    }
}
