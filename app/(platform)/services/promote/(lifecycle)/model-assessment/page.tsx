"use client";

import { ModelAssessmentTab } from "@/components/promote/model-assessment-tab";
import { PromoteLifecycleStagePage } from "@/components/promote/promote-lifecycle-stage-page";

export default function PromoteModelAssessmentPage() {
  return (
    <PromoteLifecycleStagePage>
      {(strategy) => <ModelAssessmentTab strategy={strategy} />}
    </PromoteLifecycleStagePage>
  );
}
