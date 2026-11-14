import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const customerRouter = Router();

customerRouter.use(requireAuth);

customerRouter.patch("/profile", CustomerController.updateProfile);
customerRouter.post("/activity", CustomerController.logActivity);
customerRouter.get("/logs", CustomerController.getLogs);

customerRouter.get("/smtp", CustomerController.getSmtpConfigs);
customerRouter.post("/smtp", CustomerController.createSmtpConfig);
customerRouter.patch("/smtp/:id", CustomerController.updateSmtpConfig);
customerRouter.delete("/smtp/:id", CustomerController.deleteSmtpConfig);
customerRouter.post("/smtp/:id/default", CustomerController.setDefaultSmtp);
customerRouter.post("/smtp/:id/test", CustomerController.testSmtpConfig);

customerRouter.get("/templates", CustomerController.getTemplates);
customerRouter.post("/templates", CustomerController.createTemplate);
customerRouter.post("/templates/bulk", CustomerController.bulkCreateTemplates);
customerRouter.patch("/templates/:id", CustomerController.updateTemplate);
customerRouter.delete("/templates/:id", CustomerController.deleteTemplate);

customerRouter.get("/scheduled", CustomerController.getScheduled);
customerRouter.post("/scheduled", CustomerController.createScheduled);
customerRouter.patch("/scheduled/:id", CustomerController.updateScheduled);
customerRouter.delete("/scheduled/:id", CustomerController.deleteScheduled);
customerRouter.post("/scheduled/:id/send-now", CustomerController.sendScheduledNow);

customerRouter.post("/send-email", CustomerController.sendEmailOnDemand);

customerRouter.get("/companies", CustomerController.getCompanies);
customerRouter.get("/companies/:id", CustomerController.getCompanyById);

customerRouter.get("/hr-contacts", CustomerController.getHrContacts);
customerRouter.get("/hr-contacts/:id", CustomerController.getHrContactById);
