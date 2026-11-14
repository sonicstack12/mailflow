import { v4 as uuidv4 } from "uuid";
import { Feature, Step, Benefit, UseCase, PricingPlan } from "../db/models.js";

export class ContentService {
  // Features
  static async getFeatures() {
    const features = await Feature.find({ isActive: true })
      .sort({ order: 1 })
      .lean();
    return features.map((f) => ({
      id: f._id,
      icon: f.icon,
      title: f.title,
      description: f.description,
      order: f.order,
    }));
  }

  static async createFeature(data: { icon: string; title: string; description: string; order?: number }) {
    const feature = await Feature.create({
      _id: uuidv4(),
      ...data,
      isActive: true,
    });
    return feature;
  }

  static async updateFeature(id: string, data: Partial<{ icon: string; title: string; description: string; order: number; isActive: boolean }>) {
    await Feature.updateOne({ _id: id }, { $set: data });
  }

  static async deleteFeature(id: string) {
    await Feature.deleteOne({ _id: id });
  }

  // Steps (How It Works)
  static async getSteps() {
    const steps = await Step.find({ isActive: true })
      .sort({ order: 1 })
      .lean();
    return steps.map((s) => ({
      id: s._id,
      number: s.number,
      title: s.title,
      description: s.description,
      icon: s.icon,
      order: s.order,
    }));
  }

  static async createStep(data: { number: string; title: string; description: string; icon: string; order?: number }) {
    const step = await Step.create({
      _id: uuidv4(),
      ...data,
      isActive: true,
    });
    return step;
  }

  static async updateStep(id: string, data: Partial<{ number: string; title: string; description: string; icon: string; order: number; isActive: boolean }>) {
    await Step.updateOne({ _id: id }, { $set: data });
  }

  static async deleteStep(id: string) {
    await Step.deleteOne({ _id: id });
  }

  // Benefits
  static async getBenefits() {
    const benefits = await Benefit.find({ isActive: true })
      .sort({ order: 1 })
      .lean();
    return benefits.map((b) => ({
      id: b._id,
      icon: b.icon,
      title: b.title,
      description: b.description,
      order: b.order,
    }));
  }

  static async createBenefit(data: { icon: string; title: string; description: string; order?: number }) {
    const benefit = await Benefit.create({
      _id: uuidv4(),
      ...data,
      isActive: true,
    });
    return benefit;
  }

  static async updateBenefit(id: string, data: Partial<{ icon: string; title: string; description: string; order: number; isActive: boolean }>) {
    await Benefit.updateOne({ _id: id }, { $set: data });
  }

  static async deleteBenefit(id: string) {
    await Benefit.deleteOne({ _id: id });
  }

  // Use Cases
  static async getUseCases() {
    const useCases = await UseCase.find({ isActive: true })
      .sort({ order: 1 })
      .lean();
    return useCases.map((u) => ({
      id: u._id,
      title: u.title,
      description: u.description,
      icon: u.icon,
      order: u.order,
    }));
  }

  static async createUseCase(data: { title: string; description: string; icon: string; order?: number }) {
    const useCase = await UseCase.create({
      _id: uuidv4(),
      ...data,
      isActive: true,
    });
    return useCase;
  }

  static async updateUseCase(id: string, data: Partial<{ title: string; description: string; icon: string; order: number; isActive: boolean }>) {
    await UseCase.updateOne({ _id: id }, { $set: data });
  }

  static async deleteUseCase(id: string) {
    await UseCase.deleteOne({ _id: id });
  }

  // Pricing Plans
  static async getPricingPlans() {
    const plans = await PricingPlan.find({ isActive: true })
      .sort({ order: 1 })
      .lean();
    return plans.map((p) => ({
      id: p._id,
      name: p.name,
      icon: p.icon,
      description: p.description,
      monthlyPrice: p.monthlyPrice,
      yearlyPrice: p.yearlyPrice,
      features: p.features,
      cta: p.cta,
      popular: p.popular,
      highlight: p.highlight,
      order: p.order,
    }));
  }

  static async createPricingPlan(data: {
    name: string;
    icon: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
    cta: string;
    popular?: boolean;
    highlight?: string;
    order?: number;
  }) {
    const plan = await PricingPlan.create({
      _id: uuidv4(),
      ...data,
      isActive: true,
    });
    return plan;
  }

  static async updatePricingPlan(
    id: string,
    data: Partial<{
      name: string;
      icon: string;
      description: string;
      monthlyPrice: number;
      yearlyPrice: number;
      features: string[];
      cta: string;
      popular: boolean;
      highlight: string;
      order: number;
      isActive: boolean;
    }>
  ) {
    await PricingPlan.updateOne({ _id: id }, { $set: data });
  }

  static async deletePricingPlan(id: string) {
    await PricingPlan.deleteOne({ _id: id });
  }

  // Get all content for public endpoint
  static async getAllPublicContent() {
    const [features, steps, benefits, useCases, pricingPlans] = await Promise.all([
      this.getFeatures(),
      this.getSteps(),
      this.getBenefits(),
      this.getUseCases(),
      this.getPricingPlans(),
    ]);

    return {
      features,
      steps,
      benefits,
      useCases,
      pricingPlans,
    };
  }
}
