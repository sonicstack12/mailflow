import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { User, Profile, PlatformSetting, EmailLog, ScheduledEmail, ActivityLog } from "../db/models.js";

export class AdminService {
    static async getUsers() {
        const profiles = await Profile.find().sort({ created_at: -1 }).lean();
        const userIds = profiles.map((p) => p.user_id);
        const usersMap = new Map(
            (await User.find({ _id: { $in: userIds } }).lean()).map((u) => [u._id, u])
        );

        return profiles.map((p) => {
            const user = usersMap.get(p.user_id);
            return {
                id: p.user_id,
                user_id: p.user_id,
                full_name: user?.full_name || null,
                email: user?.email || "",
                subscription_tier: p.subscription_tier,
                subscription_expires_at: p.subscription_expires_at?.toISOString() || null,
                daily_email_count: p.daily_email_count,
                created_at: user?.created_at?.toISOString() || p.created_at.toISOString(),
            };
        });
    }

    static async getActivities(page: number, limit: number) {
        const skip = (page - 1) * limit;
        const total = await ActivityLog.countDocuments();
        const logs = await ActivityLog.find()
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const userIds = [...new Set(logs.map(l => l.user_id))];
        const users = await User.find({ _id: { $in: userIds } }).select("email full_name").lean();
        const userMap = new Map(users.map(u => [u._id, u]));

        const logsWithUser = logs.map(log => ({
            id: log._id,
            action: log.action,
            details: log.details,
            ip_address: log.ip_address,
            user_agent: log.user_agent,
            created_at: log.created_at.toISOString(),
            user: userMap.get(log.user_id) || { email: "Unknown", full_name: "Unknown" }
        }));

        return {
            logs: logsWithUser,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    static async updateSubscription(userId: string, tier: "free" | "premium") {
        const updateData: any = {
            subscription_tier: tier,
            subscription_expires_at: null,
        };
        if (tier === "premium") {
            const d = new Date();
            d.setMonth(d.getMonth() + 2);
            updateData.subscription_expires_at = d;
        }

        await Profile.updateOne({ user_id: userId }, updateData);
    }

    static async getSettings() {
        const settings = await PlatformSetting.find().lean();
        return settings.map((s) => ({
            key: s.key,
            value: s.value,
        }));
    }

    static async saveSettings(body: Record<string, string | number | boolean>) {
        const entries = Object.entries(body);
        
        for (const [key, value] of entries) {
            // Convert boolean to string for database storage
            const stringValue = typeof value === 'boolean' ? String(value) : String(value);
            
            await PlatformSetting.findOneAndUpdate(
                { key },
                { key, value: stringValue },
                { upsert: true, new: true }
            );
        }
    }

    static async getStats() {
        const totalUsers = await User.countDocuments();
        const premiumUsers = await Profile.countDocuments({
            subscription_tier: "premium",
            $or: [{ subscription_expires_at: null }, { subscription_expires_at: { $gt: new Date() } }],
        });
        const freeUsers = await Profile.countDocuments({ subscription_tier: "free" });
        const totalEmails = await EmailLog.countDocuments();
        const scheduledPending = await ScheduledEmail.countDocuments({ status: "pending" });

        return { totalUsers, premiumUsers, freeUsers, totalEmails, scheduledPending };
    }

    static async getAnalytics(period: "7d" | "30d") {
        const days = period === "7d" ? 7 : 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const emailLogs = await EmailLog.find({ created_at: { $gte: cutoffDate } }).select("created_at status").lean();
        const emailMap = new Map<string, { sent: number; failed: number }>();
        emailLogs.forEach((log) => {
            const day = log.created_at.toISOString().split("T")[0];
            if (!emailMap.has(day)) emailMap.set(day, { sent: 0, failed: 0 });
            const stats = emailMap.get(day)!;
            if (log.status === "sent") stats.sent++;
            if (log.status === "failed") stats.failed++;
        });

        const emailRows = Array.from(emailMap.entries())
            .map(([day, stats]) => ({ day, sent: stats.sent, failed: stats.failed }))
            .sort((a, b) => a.day.localeCompare(b.day));

        const users = await User.find({ created_at: { $gte: cutoffDate } }).select("created_at").lean();
        const userMap = new Map<string, number>();
        users.forEach((user) => {
            const day = user.created_at.toISOString().split("T")[0];
            userMap.set(day, (userMap.get(day) || 0) + 1);
        });

        const userRows = Array.from(userMap.entries())
            .map(([day, usersCount]) => ({ day, users: usersCount }))
            .sort((a, b) => a.day.localeCompare(b.day));

        return { emailRows, userRows };
    }
}
