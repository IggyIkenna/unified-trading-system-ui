import type { PromotionStage } from "@/components/promote/types";

/** Base path for strategy promotion lifecycle (row-2 “Strategy Promotion” + sub-routes). */
export const PROMOTE_LIFECYCLE_BASE = "/services/promote";

export const PROMOTE_PIPELINE_HREF = `${PROMOTE_LIFECYCLE_BASE}/pipeline`;

const STAGE_HREFS: Record<PromotionStage, string> = {
  data_validation: `${PROMOTE_LIFECYCLE_BASE}/data-validation`,
  model_assessment: `${PROMOTE_LIFECYCLE_BASE}/model-assessment`,
  risk_stress: `${PROMOTE_LIFECYCLE_BASE}/risk-stress`,
  execution_readiness: `${PROMOTE_LIFECYCLE_BASE}/execution-readiness`,
  paper_trading: `${PROMOTE_LIFECYCLE_BASE}/paper-trading`,
  governance: `${PROMOTE_LIFECYCLE_BASE}/governance`,
};

export const PROMOTE_CHAMPION_HREF = `${PROMOTE_LIFECYCLE_BASE}/champion`;
export const PROMOTE_CAPITAL_HREF = `${PROMOTE_LIFECYCLE_BASE}/capital-allocation`;

export function promoteHrefForStage(stage: PromotionStage): string {
  return STAGE_HREFS[stage];
}

export type PromoteLifecycleNavKey =
  | "pipeline"
  | PromotionStage
  | "champion"
  | "capital_allocation";

export interface PromoteLifecycleNavDefinition {
  key: PromoteLifecycleNavKey;
  label: string;
  href: string;
}

/** Row-3 navigation under Promote: pipeline plus each assessment view (order matches prior in-page tabs). */
export const PROMOTE_LIFECYCLE_NAV: PromoteLifecycleNavDefinition[] = [
  { key: "pipeline", label: "Pipeline", href: PROMOTE_PIPELINE_HREF },
  { key: "data_validation", label: "Data", href: STAGE_HREFS.data_validation },
  {
    key: "model_assessment",
    label: "Model",
    href: STAGE_HREFS.model_assessment,
  },
  { key: "risk_stress", label: "Risk", href: STAGE_HREFS.risk_stress },
  {
    key: "execution_readiness",
    label: "Execution",
    href: STAGE_HREFS.execution_readiness,
  },
  { key: "champion", label: "Champion", href: PROMOTE_CHAMPION_HREF },
  { key: "paper_trading", label: "Paper", href: STAGE_HREFS.paper_trading },
  { key: "capital_allocation", label: "Capital", href: PROMOTE_CAPITAL_HREF },
  { key: "governance", label: "Governance", href: STAGE_HREFS.governance },
];
