import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  order: number;
}

export interface Step {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: string;
  order: number;
}

export interface Benefit {
  id: string;
  icon: string;
  title: string;
  description: string;
  order: number;
}

export interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  icon: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  cta: string;
  popular: boolean;
  highlight: string | null;
  order: number;
}

export interface ContentData {
  features: Feature[];
  steps: Step[];
  benefits: Benefit[];
  useCases: UseCase[];
  pricingPlans: PricingPlan[];
}

export function useContent() {
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        setLoading(true);
        const data = await apiFetch<ContentData>("/api/content/all");
        setContent(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, []);

  return { content, loading, error };
}

// Icon mapping for dynamic icon rendering
import {
  Server,
  FileText,
  Upload,
  Clock,
  BarChart3,
  Shield,
  Globe,
  Lock,
  Rocket,
  Target,
  RefreshCw,
  CheckCircle,
  Users,
  Mail,
  Gift,
  Sparkles,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  Server,
  FileText,
  Upload,
  Clock,
  BarChart3,
  Shield,
  Globe,
  Lock,
  Rocket,
  Target,
  RefreshCw,
  CheckCircle,
  Users,
  Mail,
  Gift,
  Sparkles,
};

export function getIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || Server;
}
