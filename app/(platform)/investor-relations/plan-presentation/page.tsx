"use client";

import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";
import { PresentationShell } from "../_shared/presentation-shell";
import { slides } from "./data";

export default function PlanPresentationPage() {
  return (
    <PageEntitlementGate entitlement="investor-plan" featureName="Plan & Longevity Presentation">
      <PresentationShell slides={slides} />
    </PageEntitlementGate>
  );
}
