import { Router } from "express";
import { PublicContentController, AdminContentController } from "../controllers/content.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export const contentRouter = Router();

// Public routes - no authentication required
contentRouter.get("/all", PublicContentController.getAllContent);
contentRouter.get("/features", PublicContentController.getFeatures);
contentRouter.get("/steps", PublicContentController.getSteps);
contentRouter.get("/benefits", PublicContentController.getBenefits);
contentRouter.get("/use-cases", PublicContentController.getUseCases);
contentRouter.get("/pricing", PublicContentController.getPricingPlans);

// Admin routes - authentication required
contentRouter.post("/features", requireAuth, requireAdmin, AdminContentController.createFeature);
contentRouter.patch("/features/:id", requireAuth, requireAdmin, AdminContentController.updateFeature);
contentRouter.delete("/features/:id", requireAuth, requireAdmin, AdminContentController.deleteFeature);

contentRouter.post("/steps", requireAuth, requireAdmin, AdminContentController.createStep);
contentRouter.patch("/steps/:id", requireAuth, requireAdmin, AdminContentController.updateStep);
contentRouter.delete("/steps/:id", requireAuth, requireAdmin, AdminContentController.deleteStep);

contentRouter.post("/benefits", requireAuth, requireAdmin, AdminContentController.createBenefit);
contentRouter.patch("/benefits/:id", requireAuth, requireAdmin, AdminContentController.updateBenefit);
contentRouter.delete("/benefits/:id", requireAuth, requireAdmin, AdminContentController.deleteBenefit);

contentRouter.post("/use-cases", requireAuth, requireAdmin, AdminContentController.createUseCase);
contentRouter.patch("/use-cases/:id", requireAuth, requireAdmin, AdminContentController.updateUseCase);
contentRouter.delete("/use-cases/:id", requireAuth, requireAdmin, AdminContentController.deleteUseCase);

contentRouter.post("/pricing", requireAuth, requireAdmin, AdminContentController.createPricingPlan);
contentRouter.patch("/pricing/:id", requireAuth, requireAdmin, AdminContentController.updatePricingPlan);
contentRouter.delete("/pricing/:id", requireAuth, requireAdmin, AdminContentController.deletePricingPlan);
