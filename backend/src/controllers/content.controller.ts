import { Request, Response } from "express";
import { z } from "zod";
import { ContentService } from "../services/content.service.js";
import { AuthedRequest } from "../middleware/auth.js";

// Public endpoints (no auth required)
export class PublicContentController {
  static async getAllContent(_req: Request, res: Response) {
    try {
      const content = await ContentService.getAllPublicContent();
      res.json(content);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  static async getFeatures(_req: Request, res: Response) {
    try {
      const features = await ContentService.getFeatures();
      res.json({ features });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  static async getSteps(_req: Request, res: Response) {
    try {
      const steps = await ContentService.getSteps();
      res.json({ steps });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  static async getBenefits(_req: Request, res: Response) {
    try {
      const benefits = await ContentService.getBenefits();
      res.json({ benefits });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  static async getUseCases(_req: Request, res: Response) {
    try {
      const useCases = await ContentService.getUseCases();
      res.json({ useCases });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  static async getPricingPlans(_req: Request, res: Response) {
    try {
      const pricingPlans = await ContentService.getPricingPlans();
      res.json({ pricingPlans });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}

// Admin endpoints (auth required)
export class AdminContentController {
  // Features
  static async createFeature(req: AuthedRequest, res: Response) {
    try {
      const schema = z.object({
        icon: z.string(),
        title: z.string(),
        description: z.string(),
        order: z.number().optional(),
      });
      const data = schema.parse(req.body);
      const feature = await ContentService.createFeature(data);
      res.status(201).json({ feature });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async updateFeature(req: AuthedRequest, res: Response) {
    try {
      const schema = z.object({
        icon: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        order: z.number().optional(),
        isActive: z.boolean().optional(),
      });
      const data = schema.parse(req.body);
      const id = z.string().uuid().parse(req.params.id);
      await ContentService.updateFeature(id, data);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async deleteFeature(req: AuthedRequest, res: Response) {
    try {
      const id = z.string().uuid().parse(req.params.id);
      await ContentService.deleteFeature(id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  // Steps
  static async createStep(req: AuthedRequest, res: Response) {
    try {
      const schema = z.object({
        number: z.string(),
        title: z.string(),
        description: z.string(),
        icon: z.string(),
        order: z.number().optional(),
      });
      const data = schema.parse(req.body);
      const step = await ContentService.createStep(data);
      res.status(201).json({ step });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async updateStep(req: AuthedRequest, res: Response) {
    try {
      const schema = z.object({
        number: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        order: z.number().optional(),
        isActive: z.boolean().optional(),
      });
      const data = schema.parse(req.body);
      const id = z.string().uuid().parse(req.params.id);
      await ContentService.updateStep(id, data);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async deleteStep(req: AuthedRequest, res: Response) {
    try {
      const id = z.string().uuid().parse(req.params.id);
      await ContentService.deleteStep(id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  // Benefits
  static async createBenefit(req: AuthedRequest, res: Response) {
    try {
      const schema = z.object({
        icon: z.string(),
        title: z.string(),
        description: z.string(),
        order: z.number().optional(),
      });
      const data = schema.parse(req.body);
      const benefit = await ContentService.createBenefit(data);
      res.status(201).json({ benefit });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async updateBenefit(req: AuthedRequest, res: Response) {
    try {
      const schema = z.object({
        icon: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        order: z.number().optional(),
        isActive: z.boolean().optional(),
      });
      const data = schema.parse(req.body);
      const id = z.string().uuid().parse(req.params.id);
      await ContentService.updateBenefit(id, data);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async deleteBenefit(req: AuthedRequest, res: Response) {
    try {
      const id = z.string().uuid().parse(req.params.id);
      await ContentService.deleteBenefit(id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  // Use Cases
  static async createUseCase(req: AuthedRequest, res: Response) {
    try {
      const schema = z.object({
        title: z.string(),
        description: z.string(),
        icon: z.string(),
        order: z.number().optional(),
      });
      const data = schema.parse(req.body);
      const useCase = await ContentService.createUseCase(data);
      res.status(201).json({ useCase });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async updateUseCase(req: AuthedRequest, res: Response) {
    try {
      const schema = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        order: z.number().optional(),
        isActive: z.boolean().optional(),
      });
      const data = schema.parse(req.body);
      const id = z.string().uuid().parse(req.params.id);
      await ContentService.updateUseCase(id, data);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async deleteUseCase(req: AuthedRequest, res: Response) {
    try {
      const id = z.string().uuid().parse(req.params.id);
      await ContentService.deleteUseCase(id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  // Pricing Plans
  static async createPricingPlan(req: AuthedRequest, res: Response) {
    try {
      const schema = z.object({
        name: z.string(),
        icon: z.string(),
        description: z.string(),
        monthlyPrice: z.number(),
        yearlyPrice: z.number(),
        features: z.array(z.string()),
        cta: z.string(),
        popular: z.boolean().optional(),
        highlight: z.string().optional(),
        order: z.number().optional(),
      });
      const data = schema.parse(req.body);
      const plan = await ContentService.createPricingPlan(data);
      res.status(201).json({ plan });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async updatePricingPlan(req: AuthedRequest, res: Response) {
    try {
      const schema = z.object({
        name: z.string().optional(),
        icon: z.string().optional(),
        description: z.string().optional(),
        monthlyPrice: z.number().optional(),
        yearlyPrice: z.number().optional(),
        features: z.array(z.string()).optional(),
        cta: z.string().optional(),
        popular: z.boolean().optional(),
        highlight: z.string().optional(),
        order: z.number().optional(),
        isActive: z.boolean().optional(),
      });
      const data = schema.parse(req.body);
      const id = z.string().uuid().parse(req.params.id);
      await ContentService.updatePricingPlan(id, data);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  static async deletePricingPlan(req: AuthedRequest, res: Response) {
    try {
      const id = z.string().uuid().parse(req.params.id);
      await ContentService.deletePricingPlan(id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
}
