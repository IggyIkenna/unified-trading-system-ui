import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { isMockDataMode } from "@/lib/runtime/data-mode";

export type KillSwitchActionType = "pause_strategy" | "cancel_orders" | "flatten_positions" | "disable_venue";
export type KillSwitchScope = "firm" | "client" | "strategy" | "venue";

export interface KillSwitchRequest {
  action: KillSwitchActionType;
  scope: KillSwitchScope;
  entity_id: string;
  rationale: string;
  idempotency_key: string;
}

export interface KillSwitchResult {
  request_id: string;
  accepted_at: string;
  estimated_completion_ms: number | null;
}

const isMock = isMockDataMode();

/**
 * Tracks backend feature request BFR-001 (see docs/audits/backend-feature-requests.md).
 * Mock: synthesises request_id/accepted_at after ~150ms. Live: POST /api/execution/kill-switch.
 */
export function useKillSwitch() {
  const { token } = useAuth();

  return useMutation<KillSwitchResult, Error, KillSwitchRequest>({
    mutationFn: async (params) => {
      if (isMock) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        return {
          request_id: `ks-mock-${Date.now().toString(36)}`,
          accepted_at: new Date().toISOString(),
          estimated_completion_ms: 1200,
        };
      }
      const result = await apiFetch("/api/execution/kill-switch", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      return result as KillSwitchResult;
    },
  });
}
