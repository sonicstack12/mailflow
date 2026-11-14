import { Router } from "express";
import { PublicController } from "../controllers/public.controller.js";

export const publicRouter = Router();

publicRouter.get("/status", PublicController.getStatus);
