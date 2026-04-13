"use client";

import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";
import { PresentationShell } from "../_shared/presentation-shell";
import { slides } from "./data";

export default function InvestmentPresentationPage() {
  return (
    <PageEntitlementGate entitlement="investor-im" featureName="Investment Management Presentation">
      <PresentationShell slides={slides} />
    </PageEntitlementGate>
  );
}
