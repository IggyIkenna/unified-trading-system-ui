import type { Metadata } from "next";

import { ApprovalQueue } from "@/components/allocator/approval-queue";

/**
 * G2.10 Phase A — IM-side portfolio-allocator surface.
 *
 * Proposal-then-apply workflow. Human approvers see the pending directive
 * queue, pick a fund from the G2.8 ``FundBusinessUnitRegistry``, and click
 * Apply to commit. Applying emits a synthetic
 * ``ALLOCATION_APPLIED_BY_APPROVER`` UTL event.
 *
 * Audience: ``im_desk`` / ``im_client`` / ``admin`` (via
 * ``resolveAllocatorRoute`` in ``lib/auth/allocator-routing.ts``).
 */

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Portfolio allocator · Investment Management",
  description: "IM-side allocator surface — propose, review, approve, apply. Manual guardrail around every directive.",
};

export default function InvestmentManagementAllocatorPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-page-title font-semibold tracking-tight">Portfolio allocator</h1>
          <p className="text-body text-muted-foreground max-w-2xl">
            Investment Management side — proposal-then-apply flow. Every ``AllocationDirective`` from the
            portfolio-allocator core is held for human review before it routes capital. Pick the target fund from the
            UAC ``FundBusinessUnitRegistry`` and click Apply.
          </p>
        </div>
        <ApprovalQueue />
      </div>
    </div>
  );
}
