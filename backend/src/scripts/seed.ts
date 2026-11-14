import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { connectDb, disconnectDb } from "../db/pool.js";
import { env } from "../config/env.js";
import { User, Profile, UserRole, PlatformSetting } from "../db/models.js";

const DEFAULT_PLATFORM_SETTINGS: Array<{ key: string; value: string }> = [
  { key: "site_name", value: "MailFlow" },
  { key: "support_email", value: "support@mailflow.app" },
  { key: "max_emails_per_day_free", value: "250" },
  { key: "premium_max_emails", value: "0" },
  { key: "free_log_retention_hours", value: "24" },
  { key: "premium_log_retention_hours", value: "168" },
  { key: "enable_signups", value: "true" },
  { key: "require_email_verification", value: "true" },
  { key: "enable_notifications", value: "true" },
  { key: "maintenance_mode", value: "false" },
];

async function upsertPlatformSettings() {
  for (const s of DEFAULT_PLATFORM_SETTINGS) {
    await PlatformSetting.findOneAndUpdate(
      { key: s.key },
      { _id: uuidv4(), key: s.key, value: s.value },
      { upsert: true, new: true }
    );
  }
}

async function ensureAdminUser() {
  const existing = await User.findOne({ email: env.ADMIN_EMAIL }).lean();

  let adminId = existing?._id;
  if (!adminId) {
    adminId = uuidv4();
    const hash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
    await User.create({
      _id: adminId,
      email: env.ADMIN_EMAIL,
      password_hash: hash,
      full_name: "Admin",
    });
  }

  // Profile
  await Profile.findOneAndUpdate(
    { user_id: adminId },
    {
      _id: uuidv4(),
      user_id: adminId,
      subscription_tier: "premium",
      last_email_reset_date: new Date(),
    },
    { upsert: true, new: true }
  );

  // Role
  await UserRole.findOneAndUpdate(
    { user_id: adminId, role: "admin" },
    {
      _id: uuidv4(),
      user_id: adminId,
      role: "admin",
    },
    { upsert: true, new: true }
  );

  // eslint-disable-next-line no-console
  console.log(`[db:seed] ensured admin user ${env.ADMIN_EMAIL}`);
}

async function run() {
  await connectDb();
  await upsertPlatformSettings();
  await ensureAdminUser();
  await disconnectDb();
}

run()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("[db:seed] completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[db:seed] failed", err);
    process.exit(1);
  });
