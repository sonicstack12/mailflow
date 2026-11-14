import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireSignupsEnabled } from "../middleware/platform.js";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/signup", authLimiter, requireSignupsEnabled, AuthController.signup);
authRouter.post("/login", authLimiter, AuthController.login);
authRouter.post("/logout", AuthController.logout);
authRouter.get("/me", requireAuth, AuthController.getMe);
authRouter.post("/change-password", requireAuth, AuthController.changePassword);
