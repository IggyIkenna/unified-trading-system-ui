"use client";

/**
 * `useIsOpsUser()` — simple stub that gates ops-only actions in the IM Funds
 * surface (currently the Rebalance button on `/services/im/funds/allocations`).
 *
 * The workspace does not yet have a dedicated `ops` role — the closest
 * existing axis is `admin | internal | client` (see `lib/config/auth.ts`).
 * Both admin and internal-desk users are treated as "ops-capable" for the
 * fund-administration workflow until a first-class `ops` role + capability
 * claim lands. In mock mode (`NEXT_PUBLIC_MOCK_API=true`) we return `true`
 * so the demo allocations page renders the enabled Rebalance button without
 * requiring a signed-in admin persona.
 *
 * SSOT for role axes: `unified-trading-pm/codex/14-playbooks/authentication/`.
 * When a real ops role exists, swap the internals here and update callers
 * (only the allocations page today).
 */

import { useAuth } from "@/hooks/use-auth";
import { isMockDataMode } from "@/lib/runtime/data-mode";

export function useIsOpsUser(): boolean {
  const { isAdmin, isInternal } = useAuth();
  if (isMockDataMode()) return true;
  return isAdmin() || isInternal();
}
