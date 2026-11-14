import { Request, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import {
    Profile,
    PlatformSetting,
    SmtpConfig,
    EmailTemplate,
    ScheduledEmail,
    EmailLog,
    ActivityLog,
    Company,
    HrContact,
} from "../db/models.js";
import { AuthedRequest } from "../middleware/auth.js";
import { decryptSmtpPassword, encryptSmtpPassword } from "../crypto/smtpPassword.js";
import { runPythonMailer } from "../utils/pythonMailer.js";

async function getPlatformSetting(key: string, fallback: string) {
    const doc = await PlatformSetting.findOne({ key }).lean();
    return doc?.value ?? fallback;
}

async function isPremiumActive(userId: string) {
    const profile = await Profile.findOne({ user_id: userId }).lean();
    const tier = profile?.subscription_tier ?? "free";
    const expiresAt = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
    return tier === "premium" && (!expiresAt || expiresAt > new Date());
}

async function getLogRetentionHoursForUser(userId: string) {
    const premiumActive = await isPremiumActive(userId);
    const freeHours = Number(await getPlatformSetting("free_log_retention_hours", "24"));
    const premHours = Number(await getPlatformSetting("premium_log_retention_hours", "168"));
    return premiumActive ? premHours : freeHours;
}

export class CustomerService {
    static async updateProfile(userId: string, fullName: string) {
        const { User } = await import("../db/models.js");
        await User.findByIdAndUpdate(userId, { full_name: fullName });
    }

    static async logActivity(userId: string, action: string, details: any, ip: string | null, userAgent: string | null) {
        await ActivityLog.create({
            _id: uuidv4(),
            user_id: userId,
            action,
            details,
            ip_address: ip,
            user_agent: userAgent,
        });
    }

    static async getLogs(userId: string, limit: number) {
        const retentionHours = await getLogRetentionHoursForUser(userId);
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - retentionHours);

        const logs = await EmailLog.find({
            user_id: userId,
            created_at: { $gte: cutoffDate },
        })
            .sort({ created_at: -1 })
            .limit(limit)
            .lean();

        return logs.map((log) => ({
            id: log._id,
            subject: log.subject,
            recipient_email: log.recipient_email,
            recipient_name: log.recipient_name,
            status: log.status,
            error_message: log.error_message,
            sent_at: log.sent_at?.toISOString() || null,
            created_at: log.created_at.toISOString(),
        }));
    }

    static async getSmtpConfigs(userId: string) {
        const configs = await SmtpConfig.find({ user_id: userId })
            .sort({ created_at: -1 })
            .select("_id name host port from_name from_email username is_default status created_at")
            .lean();

        return configs.map((c) => ({
            id: c._id,
            name: c.name,
            host: c.host,
            port: c.port,
            from_name: c.from_name,
            from_email: c.from_email,
            username: c.username,
            is_default: c.is_default,
            status: c.status,
            created_at: c.created_at.toISOString(),
        }));
    }

    static async createSmtpConfig(userId: string, body: any) {
        const id = uuidv4();
        const password_enc = encryptSmtpPassword(body.password);

        const count = await SmtpConfig.countDocuments({ user_id: userId });
        const makeDefault = count === 0 || body.is_default === true;
        if (makeDefault) {
            await SmtpConfig.updateMany({ user_id: userId }, { is_default: false });
        }

        await SmtpConfig.create({
            _id: id,
            user_id: userId,
            name: body.name,
            host: body.host,
            port: body.port,
            from_name: body.from_name,
            from_email: body.from_email,
            username: body.username,
            password_enc,
            is_default: makeDefault,
            status: "inactive",
        });
        return id;
    }

    static async testSmtpConfig(userId: string, configId: string) {
        const cfg = await SmtpConfig.findOne({ _id: configId, user_id: userId }).lean();
        if (!cfg) throw new Error("SMTP configuration not found");

        try {
            let password = decryptSmtpPassword(cfg.password_enc)
                .replace(/\s+/g, '')                  // Remove accidental spaces
                .replace(/^["']|["']$/g, '');         // Remove accidental quotes
            
            const payload = {
                action: "test",
                smtp_host: cfg.host,
                smtp_port: cfg.port,
                user: cfg.username,
                password: password,
                from_name: cfg.from_name,
                from_email: cfg.from_email
            };
            
            const result = await runPythonMailer(payload);
            if (!result.success) {
                throw new Error(result.error || "Python script failed");
            }

            await SmtpConfig.updateOne({ _id: configId, user_id: userId }, { status: "active" });
        } catch (e: any) {
            await SmtpConfig.updateOne({ _id: configId, user_id: userId }, { status: "inactive" });
            
            let errorMessage = e.message || "Test failed";
            if (cfg.host.toLowerCase().includes("gmail")) {
                if (errorMessage.includes("535-5.7.8") || errorMessage.includes("Username and Password not accepted") || errorMessage.includes("535")) {
                    errorMessage = `Invalid login (${errorMessage}). Please ensure your USERNAME is your full Gmail address, and that you are using an App Password instead of your regular password. Generate it at https://myaccount.google.com/apppasswords`;
                }
            } else if (errorMessage.includes("535") || errorMessage.includes("Authentication failed") || errorMessage.includes("Username and Password not accepted")) {
                errorMessage = "Invalid login: Username and Password not accepted by the SMTP server.";
            }

            throw new Error(errorMessage);
        }
    }

    static async getTemplates(userId: string) {
        const templates = await EmailTemplate.find({ user_id: userId })
            .sort({ created_at: -1 })
            .lean();

        return templates.map((t) => ({
            id: t._id,
            name: t.name,
            subject: t.subject,
            html_content: t.html_content,
            variables: t.variables,
            tier: t.tier,
            attachments: t.attachments,
            created_at: t.created_at.toISOString(),
            updated_at: t.updated_at.toISOString(),
        }));
    }

    static async createTemplate(userId: string, body: any) {
        if (body.tier === "premium" && !(await isPremiumActive(userId))) {
            throw new Error("Premium templates require an active premium subscription.");
        }

        const id = uuidv4();
        await EmailTemplate.create({
            _id: id,
            user_id: userId,
            name: body.name,
            subject: body.subject,
            html_content: body.html_content,
            variables: body.variables,
            tier: body.tier || "standard",
            attachments: body.attachments || [],
        });
        return id;
    }

    static async updateTemplate(userId: string, templateId: string, body: any) {
        await EmailTemplate.updateOne(
            { _id: templateId, user_id: userId },
            {
                name: body.name,
                subject: body.subject,
                html_content: body.html_content,
                variables: body.variables,
                attachments: body.attachments || [],
            }
        );
    }

    static async getScheduled(userId: string, status?: string) {
        const filter: any = { user_id: userId };
        if (status) filter.status = status;

        const scheduled = await ScheduledEmail.find(filter).sort({ scheduled_time: 1 }).lean();
        return scheduled.map((s) => ({
            id: s._id,
            name: s.name,
            template_id: s.template_id,
            smtp_config_id: s.smtp_config_id,
            recipients: s.recipients,
            recipient_count: s.recipient_count,
            scheduled_time: s.scheduled_time.toISOString(),
            timezone: s.timezone,
            status: s.status,
            emails_sent: s.emails_sent,
            emails_failed: s.emails_failed,
            created_at: s.created_at.toISOString(),
        }));
    }

    static async createScheduled(userId: string, body: any) {
        if (body.template_id) {
            const template = await EmailTemplate.findOne({ _id: body.template_id, user_id: userId }).lean();
            if (!template) throw new Error("Template not found");
            if (template.tier === "premium" && !(await isPremiumActive(userId))) {
                throw new Error("Premium templates require an active premium subscription.");
            }
        }

        const id = uuidv4();
        await ScheduledEmail.create({
            _id: id,
            user_id: userId,
            name: body.name,
            template_id: body.template_id,
            smtp_config_id: body.smtp_config_id,
            recipients: body.recipients,
            recipient_count: body.recipient_count,
            scheduled_time: new Date(body.scheduled_time),
            timezone: body.timezone,
            status: "pending",
        });
        return id;
    }

    static async sendEmailOnDemand(userId: string, body: any) {
        const freeLimit = Number(await getPlatformSetting("max_emails_per_day_free", "250"));
        const profile = await Profile.findOne({ user_id: userId });
        if (!profile) throw new Error("Profile not found");

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastReset = new Date(profile.last_email_reset_date);
        lastReset.setHours(0, 0, 0, 0);
        if (lastReset < today) {
            profile.daily_email_count = 0;
            profile.last_email_reset_date = today;
            await profile.save();
        }

        const premiumActive =
            profile.subscription_tier === "premium" &&
            (!profile.subscription_expires_at || new Date(profile.subscription_expires_at) > new Date());

        if (!premiumActive && profile.daily_email_count >= freeLimit) {
            throw new Error("Daily email limit exceeded. Upgrade to premium for unlimited emails.");
        }

        const smtp = await SmtpConfig.findOne({ _id: body.smtp_config_id, user_id: userId }).lean();
        if (!smtp) throw new Error("SMTP configuration not found");

        let password = decryptSmtpPassword(smtp.password_enc)
            .replace(/\s+/g, '')                  // Remove accidental spaces
            .replace(/^["']|["']$/g, '');         // Remove accidental quotes
        
        try {
            const payload = {
                action: "send",
                smtp_host: smtp.host,
                smtp_port: smtp.port,
                user: smtp.username,
                password: password,
                from_name: smtp.from_name,
                from_email: smtp.from_email,
                to_email: body.recipient_email,
                to_name: body.recipient_name || "",
                subject: body.subject,
                html_body: body.html_content
            };
            
            const result = await runPythonMailer(payload);
            if (!result.success) {
                throw new Error(result.error || "Python script failed");
            }

            await EmailLog.create({
                _id: uuidv4(),
                user_id: userId,
                scheduled_email_id: body.scheduled_email_id || null,
                recipient_email: body.recipient_email,
                recipient_name: body.recipient_name || null,
                subject: body.subject,
                status: "sent",
                error_message: null,
                sent_at: new Date(),
            });

            profile.daily_email_count += 1;
            await profile.save();
        } catch (e: any) {
            const msg = e.message || "Send failed";
            await EmailLog.create({
                _id: uuidv4(),
                user_id: userId,
                scheduled_email_id: body.scheduled_email_id || null,
                recipient_email: body.recipient_email,
                recipient_name: body.recipient_name || null,
                subject: body.subject,
                status: "failed",
                error_message: msg,
                sent_at: null,
            });
            throw new Error(msg);
        }
    }

    static async getCompanies(
        userId: string,
        opts: { page?: number; limit?: number; search?: string; industry?: string; priority?: string }
    ) {
        const premium = await isPremiumActive(userId);
        const freeLimit = 5;
        const page = Math.max(1, opts.page || 1);
        const limit = premium ? Math.min(50, Math.max(1, opts.limit || 20)) : freeLimit;

        const filter: Record<string, unknown> = {};
        if (opts.search?.trim()) {
            const q = opts.search.trim();
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { industry: { $regex: q, $options: "i" } },
                { office_locations: { $regex: q, $options: "i" } },
                { fresher_roles: { $regex: q, $options: "i" } },
                { hq_location: { $regex: q, $options: "i" } },
            ];
        }
        if (opts.industry?.trim()) {
            filter.industry = opts.industry.trim();
        }
        if (opts.priority?.trim()) {
            filter.priority = { $regex: `^${opts.priority.trim()}`, $options: "i" };
        }

        const total = await Company.countDocuments(filter);
        const industries = await Company.distinct("industry");

        // Free users always see only the first 5 companies from the full ordered directory
        // (not filtered beyond the hard preview cap), so the upgrade preview stays consistent.
        const queryFilter = premium ? filter : {};
        const queryTotal = premium ? total : await Company.countDocuments({});
        const skip = premium ? (page - 1) * limit : 0;
        const rows = await Company.find(queryFilter)
            .sort({ sort_order: 1, name: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const companies = rows.map((c) => ({
            id: c._id,
            name: c.name,
            industry: c.industry,
            employer_type: c.employer_type,
            company_size: c.company_size,
            founded_year: c.founded_year,
            hq_location: c.hq_location,
            office_locations: c.office_locations,
            fresher_roles: c.fresher_roles,
            ctc_software_engineer: c.ctc_software_engineer,
            ctc_fullstack: c.ctc_fullstack,
            ctc_system_engineer: c.ctc_system_engineer,
            ctc_frontend: c.ctc_frontend,
            ctc_backend: c.ctc_backend,
            ctc_mern: c.ctc_mern,
            ctc_data_scientist: c.ctc_data_scientist,
            ctc_aiml: c.ctc_aiml,
            ctc_data_analyst: c.ctc_data_analyst,
            ctc_marketing: c.ctc_marketing,
            description: c.description,
            work_mode: c.work_mode,
            website: c.website,
            careers_link: c.careers_link,
            fresher_hiring_signal: c.fresher_hiring_signal,
            priority: c.priority,
            pay_caveat: c.pay_caveat,
            last_reviewed: c.last_reviewed,
            sort_order: c.sort_order,
        }));

        return {
            companies,
            total: queryTotal,
            page: premium ? page : 1,
            limit,
            totalPages: premium ? Math.max(1, Math.ceil(queryTotal / limit)) : 1,
            isPremium: premium,
            freePreviewLimit: freeLimit,
            lockedCount: premium ? 0 : Math.max(0, queryTotal - freeLimit),
            industries: industries.filter(Boolean).sort(),
            disclaimer:
                "Please re-verify all company details, openings, eligibility, salary, and careers links before applying. This directory is for research assistance only. MailFlow is not responsible for hiring outcomes, outdated listings, or any decisions made using this data.",
        };
    }

    static async getCompanyById(userId: string, companyId: string) {
        const premium = await isPremiumActive(userId);
        const company = await Company.findById(companyId).lean();
        if (!company) throw new Error("Company not found");

        if (!premium) {
            const rank = await Company.countDocuments({
                $or: [
                    { sort_order: { $lt: company.sort_order } },
                    { sort_order: company.sort_order, name: { $lt: company.name } },
                ],
            });
            if (rank >= 5) {
                throw new Error("Upgrade to premium to view the full company directory.");
            }
        }

        return {
            id: company._id,
            name: company.name,
            industry: company.industry,
            employer_type: company.employer_type,
            company_size: company.company_size,
            size_confidence: company.size_confidence,
            founded_year: company.founded_year,
            hq_location: company.hq_location,
            office_locations: company.office_locations,
            location_confidence: company.location_confidence,
            fresher_roles: company.fresher_roles,
            ctc_software_engineer: company.ctc_software_engineer,
            ctc_fullstack: company.ctc_fullstack,
            ctc_system_engineer: company.ctc_system_engineer,
            ctc_frontend: company.ctc_frontend,
            ctc_backend: company.ctc_backend,
            ctc_mern: company.ctc_mern,
            ctc_data_scientist: company.ctc_data_scientist,
            ctc_aiml: company.ctc_aiml,
            ctc_data_analyst: company.ctc_data_analyst,
            ctc_marketing: company.ctc_marketing,
            description: company.description,
            work_mode: company.work_mode,
            website: company.website,
            website_status: company.website_status,
            careers_link: company.careers_link,
            fresher_hiring_signal: company.fresher_hiring_signal,
            priority: company.priority,
            pay_caveat: company.pay_caveat,
            profile_source: company.profile_source,
            last_reviewed: company.last_reviewed,
            sort_order: company.sort_order,
            isPremium: premium,
            canApply: premium,
            disclaimer:
                "Please re-verify all company details, openings, eligibility, salary, and careers links before applying. This directory is for research assistance only. MailFlow is not responsible for hiring outcomes, outdated listings, or any decisions made using this data.",
        };
    }

    static async getHrContacts(
        userId: string,
        opts: { page?: number; limit?: number; search?: string; company?: string }
    ) {
        const premium = await isPremiumActive(userId);
        const freeLimit = 5;
        const page = Math.max(1, opts.page || 1);
        const limit = premium ? Math.min(50, Math.max(1, opts.limit || 20)) : freeLimit;

        const filter: Record<string, unknown> = {};
        if (opts.search?.trim()) {
            const q = opts.search.trim();
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } },
                { title: { $regex: q, $options: "i" } },
                { company: { $regex: q, $options: "i" } },
            ];
        }
        if (opts.company?.trim()) {
            filter.company = opts.company.trim();
        }

        const total = await HrContact.countDocuments(filter);
        const companies = await HrContact.distinct("company");

        const queryFilter = premium ? filter : {};
        const queryTotal = premium ? total : await HrContact.countDocuments({});
        const skip = premium ? (page - 1) * limit : 0;
        const rows = await HrContact.find(queryFilter)
            .sort({ sort_order: 1, name: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const contacts = rows.map((c) => ({
            id: c._id,
            name: c.name,
            email: premium ? c.email : null,
            title: c.title,
            company: c.company,
            sort_order: c.sort_order,
        }));

        return {
            contacts,
            total: queryTotal,
            page: premium ? page : 1,
            limit,
            totalPages: premium ? Math.max(1, Math.ceil(queryTotal / limit)) : 1,
            isPremium: premium,
            freePreviewLimit: freeLimit,
            lockedCount: premium ? 0 : Math.max(0, queryTotal - freeLimit),
            companies: companies.filter(Boolean).sort(),
            canEmail: premium,
            disclaimer:
                "Please re-verify all HR contact details, email addresses, titles, and company affiliation before using them. This directory is for research assistance only. MailFlow is not responsible for outdated contacts, delivery failures, or any outreach outcomes.",
        };
    }

    static async getHrContactById(userId: string, contactId: string) {
        const premium = await isPremiumActive(userId);
        const contact = await HrContact.findById(contactId).lean();
        if (!contact) throw new Error("HR contact not found");

        if (!premium) {
            const rank = await HrContact.countDocuments({
                $or: [
                    { sort_order: { $lt: contact.sort_order } },
                    { sort_order: contact.sort_order, name: { $lt: contact.name } },
                ],
            });
            if (rank >= 5) {
                throw new Error("Upgrade to premium to view the full HR directory.");
            }
        }

        return {
            id: contact._id,
            name: contact.name,
            email: premium ? contact.email : null,
            title: contact.title,
            company: contact.company,
            sort_order: contact.sort_order,
            isPremium: premium,
            canEmail: premium,
            disclaimer:
                "Please re-verify all HR contact details, email addresses, titles, and company affiliation before using them. This directory is for research assistance only. MailFlow is not responsible for outdated contacts, delivery failures, or any outreach outcomes.",
        };
    }
}
