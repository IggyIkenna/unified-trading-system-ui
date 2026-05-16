"use client";

import type { ReactNode } from "react";
import { PromoteWorkflowProvider } from "@/components/promote/promote-workflow-context";
import { usePromoteLifecycleStore } from "@/lib/stores/promote-lifecycle-store";
import { useAuth } from "@/hooks/use-auth";
import { demoteCandidate, overrideCandidate } from "@/lib/api/promote-client";
import type { WorkflowPayload } from "@/components/promote/promote-workflow-context";
import type { PromotionStage } from "@/components/promote/types";

/** Connects workflow actions from tab UIs to the promote lifecycle Zustand store.
 *
 * Also fires backend calls for demote and override actions (Phase U4 audit trail).
 */
export function PromoteWorkflowBridge({ children }: { children: ReactNode }) {
  const recordWorkflow = usePromoteLifecycleStore((s) => s.recordWorkflow);
  const { token, user } = useAuth();

  const operator = user?.email ?? "operator";

  const recordWithBackend = (strategyId: string, stage: PromotionStage, payload: WorkflowPayload) => {
    recordWorkflow(strategyId, stage, payload);

    const manifestId = payload.manifestId ?? strategyId;

    if (payload.action === "demote" && payload.demoteToStage) {
      demoteCandidate(
        strategyId,
        manifestId,
        {
          demote_to_stage: payload.demoteToStage,
          operator,
          reason: payload.comment,
        },
        token,
      ).catch((err: unknown) => {
        console.error("[promote-bridge] demote backend call failed:", err);
      });
    } else if (payload.action === "override") {
      overrideCandidate(
        strategyId,
        manifestId,
        {
          override_stage: stage,
          operator,
          reason: payload.comment,
          risk_ack: payload.riskAck ?? false,
        },
        token,
      ).catch((err: unknown) => {
        console.error("[promote-bridge] override backend call failed:", err);
      });
    }
  };

  return (
    <PromoteWorkflowProvider onRecord={recordWithBackend} token={token}>
      {children}
    </PromoteWorkflowProvider>
  );
}
