/**
 * /services/research/allocate — research-time allocator workbench.
 *
 * Restored from commit dfc8c5ba^ (the G2.10 split deleted the original
 * /services/research/strategy/allocator/* and moved the operational view to
 * /services/investment-management/allocator + /services/trading-platform/
 * allocator). The research-flavoured surface — regime-aware allocation
 * backtests, model selection across allocator archetypes (FIXED /
 * PNL_WEIGHTED / SHARPE_WEIGHTED / RISK_PARITY / KELLY / MIN_CVAR /
 * REGIME_AWARE / MANUAL), shadow-vs-primary diff, directive history — is
 * a research workbench distinct from the IM operational view.
 *
 * Gated via PageEntitlementGate requiring strategy-full + ml-full so this
 * surfaces only under the new DART Research tile (DART-Full + admin only;
 * padlocked-visible "locked" for Signals-In). Operational allocator at
 * /services/investment-management/allocator continues to render unchanged
 * for IM personas.
 *
 * SSOT: codex/14-playbooks/dart/dart-terminal-vs-research.md.
 */

import { AllocatorResearchDashboard } from "./_components/allocator-research-dashboard";
import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";

export const dynamic = "force-static";

export default function AllocatorResearchPage() {
  return (
    <PageEntitlementGate
      entitlements={["strategy-full", "ml-full"]}
      featureName="Allocator Research"
      description="Research-time allocator workbench — regime-aware allocation backtests, model selection across allocator archetypes, shadow-vs-primary diff. Requires DART Full subscription."
    >
      <AllocatorResearchDashboard />
    </PageEntitlementGate>
  );
}
