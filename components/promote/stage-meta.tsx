import type { ElementType } from "react";
import {
  Database,
  FlaskConical,
  Shield,
  ShieldCheck,
  TestTube,
  Zap,
} from "lucide-react";
import type { PromotionStage } from "./types";

export const STAGE_META: Record<
  PromotionStage,
  { label: string; icon: ElementType; description: string }
> = {
  data_validation: {
    label: "Data Validation",
    icon: Database,
    description: "Data quality, coverage, integrity",
  },
  model_assessment: {
    label: "Model & Signal",
    icon: FlaskConical,
    description: "ML metrics, backtest, signal quality",
  },
  risk_stress: {
    label: "Risk & Stress",
    icon: Shield,
    description: "VaR, stress tests, tail risk",
  },
  execution_readiness: {
    label: "Execution",
    icon: Zap,
    description: "Venue connectivity, fills, capacity",
  },
  paper_trading: {
    label: "Paper Trading",
    icon: TestTube,
    description: "Shadow mode, live-backtest divergence",
  },
  governance: {
    label: "Governance",
    icon: ShieldCheck,
    description: "Committee review, sign-off",
  },
};
