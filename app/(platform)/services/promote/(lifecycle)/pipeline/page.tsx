"use client";

import { PromoteLifecycleFrame } from "@/components/promote/promote-lifecycle-frame";
import { PromotePipelinePage } from "@/components/promote/promote-pipeline-page";

export default function PromotePipelineRoutePage() {
  return (
    <PromoteLifecycleFrame>
      <PromotePipelinePage />
    </PromoteLifecycleFrame>
  );
}
