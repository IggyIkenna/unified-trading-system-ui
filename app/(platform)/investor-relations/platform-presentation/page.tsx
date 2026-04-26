"use client";

import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";
import { PresentationShell } from "../_shared/presentation-shell";
import { slides } from "./data";

export default function PlatformPresentationPage() {
  return (
    <PageEntitlementGate entitlement="investor-platform" featureName="DART Trading Infrastructure Presentation">
      <PresentationShell slides={slides} />
    </PageEntitlementGate>
  );
}
