"use client";

import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";
import { BoardPresentationPageClient } from "./components/board-presentation-client";

export default function PresentationPage() {
  return (
    <PageEntitlementGate entitlement="investor-board" featureName="Board Presentation">
      <BoardPresentationPageClient />
    </PageEntitlementGate>
  );
}
