"use client";

import type { ReactNode } from "react";
import type {
  CandidateStrategy,
  PromotionStage,
} from "@/components/promote/types";
import { PromoteLifecycleFrame } from "@/components/promote/promote-lifecycle-frame";
import { NoStrategySelected } from "@/components/promote/no-strategy-selected";
import { isPromoteStageLocked } from "@/components/promote/promote-stage-access";
import {
  selectPromoteSelectedStrategy,
  usePromoteLifecycleStore,
} from "@/lib/stores/promote-lifecycle-store";

export function PromoteLifecycleStagePage({
  gateStage,
  children,
}: {
  /** When set, shows a lock message if this official stage is not yet reachable for the selected strategy. */
  gateStage?: PromotionStage;
  children: (strategy: CandidateStrategy) => ReactNode;
}) {
  const strategy = usePromoteLifecycleStore(selectPromoteSelectedStrategy);

  if (!strategy) {
    return (
      <PromoteLifecycleFrame>
        <NoStrategySelected />
      </PromoteLifecycleFrame>
    );
  }

  if (gateStage && isPromoteStageLocked(strategy, gateStage)) {
    return (
      <PromoteLifecycleFrame>
        <div className="rounded-lg border border-border bg-card/40 px-4 py-6 text-sm text-muted-foreground">
          This stage is locked until earlier promotion gates pass for the
          selected strategy.
        </div>
      </PromoteLifecycleFrame>
    );
  }

  return <PromoteLifecycleFrame>{children(strategy)}</PromoteLifecycleFrame>;
}
