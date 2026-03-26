"use client";

import { useRouter } from "next/navigation";
import { PipelineOverview } from "@/components/promote/pipeline-overview";
import { promoteHrefForStage } from "@/lib/config/services/promote.config";
import { usePromoteLifecycleStore } from "@/lib/stores/promote-lifecycle-store";

export function PromotePipelinePage() {
  const router = useRouter();
  const candidates = usePromoteLifecycleStore((s) => s.candidates);
  const selectedId = usePromoteLifecycleStore((s) => s.selectedId);
  const setSelectedId = usePromoteLifecycleStore((s) => s.setSelectedId);

  const onSelect = (id: string) => {
    setSelectedId(id);
    const strategy = usePromoteLifecycleStore
      .getState()
      .candidates.find((c) => c.id === id);
    if (strategy) {
      router.push(promoteHrefForStage(strategy.currentStage));
    }
  };

  return (
    <PipelineOverview
      candidates={candidates}
      selectedId={selectedId}
      onSelect={onSelect}
    />
  );
}
