"use client";

import { DataValidationTab } from "@/components/promote/data-validation-tab";
import { PromoteLifecycleStagePage } from "@/components/promote/promote-lifecycle-stage-page";

export default function PromoteDataValidationPage() {
  return (
    <PromoteLifecycleStagePage>
      {(strategy) => <DataValidationTab strategy={strategy} />}
    </PromoteLifecycleStagePage>
  );
}
