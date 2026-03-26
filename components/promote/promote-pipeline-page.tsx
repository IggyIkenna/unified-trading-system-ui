"use client";

import { PipelineOverview } from "@/components/promote/pipeline-overview";
import { usePromoteLifecycleStore } from "@/lib/stores/promote-lifecycle-store";

export function PromotePipelinePage() {
  const selectedId = usePromoteLifecycleStore((s) => s.selectedId);
  const setSelectedId = usePromoteLifecycleStore((s) => s.setSelectedId);

  return (
    <PipelineOverview
      selectedId={selectedId}
      onSelect={(id) => setSelectedId(id)}
    />
  );
}
