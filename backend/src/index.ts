import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { corsOrigins, env } from "./config/env.js";
import { connectDb } from "./db/pool.js";
import { authRouter } from "./routes/auth.js";
import { customerRouter } from "./routes/customer.js";
import { adminRouter } from "./routes/admin.js";
import { startScheduler } from "./scheduler/scheduler.js";

import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { User, Profile, UserRole } from "./db/models.js";

async function seedAdmin() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return;
  const existingAdmin = await User.findOne({ email: env.ADMIN_EMAIL });
  if (!existingAdmin) {
    const userId = uuidv4();
    const hash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
    await User.create({ _id: userId, email: env.ADMIN_EMAIL, password_hash: hash, full_name: "Admin" });
    await Profile.create({ _id: uuidv4(), user_id: userId, subscription_tier: "premium", last_email_reset_date: new Date() });
    await UserRole.create({ _id: uuidv4(), user_id: userId, role: "admin" });
    console.log("[db] seeded root admin user:", env.ADMIN_EMAIL);
  } else {
    const hash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
    await User.updateOne({ email: env.ADMIN_EMAIL }, { password_hash: hash });
    const hasAdminRole = await UserRole.findOne({ user_id: existingAdmin._id, role: "admin" });
    if (!hasAdminRole) {
      await UserRole.create({ _id: uuidv4(), user_id: existingAdmin._id, role: "admin" });
    }
  }
}

import { publicRouter } from "./routes/public.js";
import { contentRouter } from "./routes/content.js";
import { blockIfMaintenance } from "./middleware/platform.js";

async function main() {
  await connectDb();
  await seedAdmin();

  const app = express();

  app.disable("x-powered-by");
  // Render (and other proxies) terminate TLS; needed for correct secure cookies / IPs
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use(
    cors({
      origin: (origin, cb) => {
        // allow non-browser tools (no origin)
        if (!origin) return cb(null, true);
        if (corsOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // Global rate limiting suitable for 500+ users
  app.use(
    rateLimit({
      windowMs: 5 * 60_000, // 5 minutes
      limit: 10000, // 10k requests per IP per 5 mins
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many requests. Please try again later." }
    })
  );

  app.use("/api", blockIfMaintenance);

  app.use("/api/public", publicRouter);
  app.use("/api/content", contentRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/customer", customerRouter);
  app.use("/api/admin", adminRouter);

  // Centralized error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error(err);
    }
    res.status(500).json({ error: message });
  });

  const port = env.PORT;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[backend] listening on http://localhost:${port}`);
  });

  startScheduler();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[backend] failed to start", err);
  process.exit(1);
});
