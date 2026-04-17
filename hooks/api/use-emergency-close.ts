import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { isMockDataMode } from "@/lib/runtime/data-mode";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface EmergencyCloseRequest {
  rationale: string;
  dry_run: boolean;
}

export interface EmergencyCloseResult {
  success: boolean;
  client_id: string;
  positions_closed: number;
  total_notional: number;
  dry_run: boolean;
  message: string;
  timestamp: string;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

const isMock = isMockDataMode();

/**
 * Emergency close all positions for a given client.
 * Mock mode: returns simulated results after a brief delay.
 * Live mode: POST /api/v1/emergency/close-all/{clientId} to client-reporting-api.
 */
export function useEmergencyCloseAll(clientId: string) {
  const { token } = useAuth();

  return useMutation<EmergencyCloseResult, Error, EmergencyCloseRequest>({
    mutationFn: async (params) => {
      if (isMock) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return {
          success: true,
          client_id: clientId,
          positions_closed: params.dry_run ? 0 : 24,
          total_notional: 2_450_000,
          dry_run: params.dry_run,
          message: params.dry_run
            ? `Dry run complete: would close 24 positions ($2.45M notional) for ${clientId}`
            : `Emergency close executed: 24 positions closed ($2.45M notional) for ${clientId}`,
          timestamp: new Date().toISOString(),
        };
      }
      const result = await apiFetch(
        `/api/v1/emergency/close-all/${encodeURIComponent(clientId)}`,
        token,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        },
      );
      return result as EmergencyCloseResult;
    },
  });
}
