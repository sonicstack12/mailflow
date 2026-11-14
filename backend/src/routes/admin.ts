import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/users", AdminController.getUsers);
adminRouter.patch("/users/:userId/subscription", AdminController.updateSubscription);
adminRouter.get("/activities", AdminController.getActivities);

adminRouter.get("/settings", AdminController.getSettings);
adminRouter.post("/settings", AdminController.saveSettings);

adminRouter.get("/stats", AdminController.getStats);
adminRouter.get("/analytics", AdminController.getAnalytics);
