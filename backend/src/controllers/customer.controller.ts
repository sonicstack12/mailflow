import { Response } from "express";
import { z } from "zod";
import { CustomerService } from "../services/customer.service.js";
import { AuthedRequest } from "../middleware/auth.js";
import { SmtpConfig, EmailTemplate, ScheduledEmail } from "../db/models.js";
import { v4 as uuidv4 } from "uuid";

export class CustomerController {
    static async updateProfile(req: AuthedRequest, res: Response) {
        try {
            const schema = z.object({ full_name: z.string().min(1).max(191) });
            const body = schema.parse(req.body);
            await CustomerService.updateProfile(req.auth!.userId, body.full_name);
            res.json({ ok: true });
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    }

    static async logActivity(req: AuthedRequest, res: Response) {
        try {
            const schema = z.object({
                action: z.string().min(1),
                details: z.any().optional(),
            });
            const body = schema.parse(req.body);
            // Some proxies or load balancers might use x-forwarded-for
            const ip = (req.headers["x-forwarded-for"] as string) || req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers["user-agent"] || null;

            await CustomerService.logActivity(req.auth!.userId, body.action, body.details, ip, userAgent);
            res.json({ ok: true });
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    }

    static async getLogs(req: AuthedRequest, res: Response) {
        try {
            const limit = Math.min(Number(req.query.limit || 500), 500);
            const logs = await CustomerService.getLogs(req.auth!.userId, limit);
            res.json({ logs });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // SMTP 
    static async getSmtpConfigs(req: AuthedRequest, res: Response) {
        const configs = await CustomerService.getSmtpConfigs(req.auth!.userId);
        res.json({ configs });
    }

    static async createSmtpConfig(req: AuthedRequest, res: Response) {
        try {
            const schema = z.object({
                name: z.string().trim().min(1),
                host: z.string().trim().min(1),
                port: z.coerce.number().int().min(1).max(65535).default(587),
                from_name: z.string().trim().min(1),
                from_email: z.string().trim().email(),
                username: z.string().trim().min(1),
                password: z.string().min(1),
                is_default: z.boolean().optional(),
            });
            const id = await CustomerService.createSmtpConfig(req.auth!.userId, schema.parse(req.body));
            res.json({ ok: true, id });
        } catch (e: any) {
            res.status(400).json({ error: e.message });
        }
    }

    // Other SMTP logic bypassed slightly for controller compactness - will use models directly if simple
    static async updateSmtpConfig(req: AuthedRequest, res: Response) {
        const id = z.string().uuid().parse(req.params.id);
        const schema = z.object({
            name: z.string().trim().min(1), host: z.string().trim().min(1),
            port: z.coerce.number().int().min(1).max(65535),
            from_name: z.string().trim().min(1), from_email: z.string().trim().email(),
            username: z.string().trim().min(1), password: z.string().optional(),
        });
        const body = schema.parse(req.body);
        const update: any = { ...body };
        if (body.password) {
            const { encryptSmtpPassword } = await import("../crypto/smtpPassword.js");
            update.password_enc = encryptSmtpPassword(body.password);
            delete update.password;
        }
        await SmtpConfig.updateOne({ _id: id, user_id: req.auth!.userId }, update);
        res.json({ ok: true });
    }

    static async deleteSmtpConfig(req: AuthedRequest, res: Response) {
        const id = z.string().uuid().parse(req.params.id);
        await SmtpConfig.deleteOne({ _id: id, user_id: req.auth!.userId });
        res.json({ ok: true });
    }

    static async setDefaultSmtp(req: AuthedRequest, res: Response) {
        const id = z.string().uuid().parse(req.params.id);
        await SmtpConfig.updateMany({ user_id: req.auth!.userId }, { is_default: false });
        await SmtpConfig.updateOne({ _id: id, user_id: req.auth!.userId }, { is_default: true });
        res.json({ ok: true });
    }

    static async testSmtpConfig(req: AuthedRequest, res: Response) {
        try {
            const id = z.string().uuid().parse(req.params.id);
            await CustomerService.testSmtpConfig(req.auth!.userId, id);
            res.json({ success: true, message: "SMTP connection and authentication successful" });
        } catch (e: any) {
            res.status(400).json({ success: false, error: e.message });
        }
    }

    // Templates
    static async getTemplates(req: AuthedRequest, res: Response) {
        const templates = await CustomerService.getTemplates(req.auth!.userId);
        res.json({ templates });
    }

    static async createTemplate(req: AuthedRequest, res: Response) {
        try {
            const schema = z.object({
                name: z.string().min(1), subject: z.string().min(1),
                html_content: z.string().min(1), variables: z.array(z.string()).default([]),
                tier: z.enum(["standard", "premium"]).default("standard"),
                attachments: z.array(z.object({ filename: z.string(), content_type: z.string(), data: z.string() })).default([]),
            });
            const id = await CustomerService.createTemplate(req.auth!.userId, schema.parse(req.body));
            res.json({ ok: true, id });
        } catch (e: any) { res.status(400).json({ error: e.message }); }
    }

    static async bulkCreateTemplates(req: AuthedRequest, res: Response) {
        try {
            const schema = z.object({
                templates: z.array(z.object({
                    name: z.string().min(1), subject: z.string().min(1),
                    html_content: z.string().min(1), variables: z.array(z.string()).default([]),
                    tier: z.enum(["standard", "premium"]).default("standard"),
                    attachments: z.array(z.object({ filename: z.string(), content_type: z.string(), data: z.string() })).default([]),
                }))
            });
            const body = schema.parse(req.body);
            const toInsert = body.templates.map(t => ({ ...t, _id: uuidv4(), user_id: req.auth!.userId }));
            await EmailTemplate.insertMany(toInsert);
            res.json({ ok: true });
        } catch (e: any) { res.status(400).json({ error: e.message }); }
    }

    static async updateTemplate(req: AuthedRequest, res: Response) {
        const id = z.string().uuid().parse(req.params.id);
        const schema = z.object({
            name: z.string().min(1), subject: z.string().min(1),
            html_content: z.string().min(1), variables: z.array(z.string()).default([]),
            attachments: z.array(z.object({ filename: z.string(), content_type: z.string(), data: z.string() })).default([]),
        });
        await CustomerService.updateTemplate(req.auth!.userId, id, schema.parse(req.body));
        res.json({ ok: true });
    }

    static async deleteTemplate(req: AuthedRequest, res: Response) {
        const id = z.string().uuid().parse(req.params.id);
        await EmailTemplate.deleteOne({ _id: id, user_id: req.auth!.userId });
        res.json({ ok: true });
    }

    // Scheduled
    static async getScheduled(req: AuthedRequest, res: Response) {
        const status = req.query.status ? z.string().parse(req.query.status) : undefined;
        const scheduled = await CustomerService.getScheduled(req.auth!.userId, status);
        res.json({ scheduled });
    }

    static async createScheduled(req: AuthedRequest, res: Response) {
        try {
            const schema = z.object({
                name: z.string().min(1), template_id: z.string().uuid(),
                smtp_config_id: z.string().uuid(), recipients: z.array(z.record(z.string(), z.any())),
                recipient_count: z.number().int().min(1), scheduled_time: z.string(),
                timezone: z.string().default("UTC"),
            });
            const id = await CustomerService.createScheduled(req.auth!.userId, schema.parse(req.body));
            res.json({ ok: true, id });
        } catch (e: any) { res.status(400).json({ error: e.message }); }
    }

    static async updateScheduled(req: AuthedRequest, res: Response) {
        const id = z.string().uuid().parse(req.params.id);
        const schema = z.object({ name: z.string().min(1), scheduled_time: z.string(), timezone: z.string().min(1) });
        const body = schema.parse(req.body);
        await ScheduledEmail.updateOne({ _id: id, user_id: req.auth!.userId }, { name: body.name, scheduled_time: new Date(body.scheduled_time), timezone: body.timezone });
        res.json({ ok: true });
    }

    static async deleteScheduled(req: AuthedRequest, res: Response) {
        const id = z.string().uuid().parse(req.params.id);
        await ScheduledEmail.deleteOne({ _id: id, user_id: req.auth!.userId });
        res.json({ ok: true });
    }

    static async sendScheduledNow(req: AuthedRequest, res: Response) {
        const id = z.string().uuid().parse(req.params.id);
        const updateResult = await ScheduledEmail.findOneAndUpdate(
            { _id: id, user_id: req.auth!.userId, status: "pending" },
            { scheduled_time: new Date(), status: "sending" },
            { new: true }
        ).lean();
        
        if (updateResult) {
            import("../scheduler/emailWorker.js").then((worker) => {
                worker.processScheduledJob(updateResult as any).catch(e => {
                    console.error("sendScheduledNow crashed:", e);
                });
            });
        } else {
            // Already sending, failed, or completed
            await ScheduledEmail.updateOne({ _id: id, user_id: req.auth!.userId }, { scheduled_time: new Date() });
        }
        res.json({ ok: true });
    }

    static async sendEmailOnDemand(req: AuthedRequest, res: Response) {
        try {
            const schema = z.object({
                smtp_config_id: z.string().uuid(), recipient_email: z.string().email(),
                recipient_name: z.string().optional(), subject: z.string().min(1),
                html_content: z.string().min(1), scheduled_email_id: z.string().uuid().optional(),
            });
            await CustomerService.sendEmailOnDemand(req.auth!.userId, schema.parse(req.body));
            res.json({ success: true });
        } catch (e: any) {
            if (e.message.includes("Daily email limit exceeded")) res.status(429).json({ error: e.message });
            else res.status(500).json({ error: e.message });
        }
    }

    static async getCompanies(req: AuthedRequest, res: Response) {
        try {
            const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
            const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10) || 20));
            const search = typeof req.query.search === "string" ? req.query.search : undefined;
            const industry = typeof req.query.industry === "string" ? req.query.industry : undefined;
            const priority = typeof req.query.priority === "string" ? req.query.priority : undefined;

            const data = await CustomerService.getCompanies(req.auth!.userId, {
                page,
                limit,
                search,
                industry,
                priority,
            });
            res.json(data);
        } catch (e: any) {
            res.status(500).json({ error: e.message || "Failed to load companies" });
        }
    }

    static async getCompanyById(req: AuthedRequest, res: Response) {
        try {
            const id = z.string().uuid().parse(req.params.id);
            const company = await CustomerService.getCompanyById(req.auth!.userId, id);
            res.json({ company });
        } catch (e: any) {
            const status = e.message?.includes("Upgrade to premium") ? 403
                : e.message === "Company not found" ? 404
                : 400;
            res.status(status).json({ error: e.message || "Failed to load company" });
        }
    }

    static async getHrContacts(req: AuthedRequest, res: Response) {
        try {
            const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
            const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10) || 20));
            const search = typeof req.query.search === "string" ? req.query.search : undefined;
            const company = typeof req.query.company === "string" ? req.query.company : undefined;

            const data = await CustomerService.getHrContacts(req.auth!.userId, {
                page,
                limit,
                search,
                company,
            });
            res.json(data);
        } catch (e: any) {
            res.status(500).json({ error: e.message || "Failed to load HR contacts" });
        }
    }

    static async getHrContactById(req: AuthedRequest, res: Response) {
        try {
            const id = z.string().uuid().parse(req.params.id);
            const contact = await CustomerService.getHrContactById(req.auth!.userId, id);
            res.json({ contact });
        } catch (e: any) {
            const status = e.message?.includes("Upgrade to premium") ? 403
                : e.message === "HR contact not found" ? 404
                : 400;
            res.status(status).json({ error: e.message || "Failed to load HR contact" });
        }
    }
}
