"use client";

import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";
import { PresentationShell } from "../_shared/presentation-shell";
import { slides } from "./data";

export default function RegulatoryPresentationPage() {
  return (
    <PageEntitlementGate entitlement="investor-regulatory" featureName="Regulatory Umbrella Presentation">
      <PresentationShell slides={slides} />
    </PageEntitlementGate>
  );
}
