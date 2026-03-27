import type { BundleOperationType } from "@/lib/config/services/bundle.config";

export interface BundleStep {
  id: string;
  operationType: BundleOperationType;
  instrument: string;
  venue: string;
  side: "BUY" | "SELL";
  quantity: string;
  price: string;
  dependsOn: string | null;
}

export interface BundleTemplate {
  name: string;
  description: string;
  category: string;
  steps: Omit<BundleStep, "id">[];
  estimatedCost: number;
  estimatedProfit: number;
}
