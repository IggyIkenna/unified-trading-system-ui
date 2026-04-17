import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import {
  MOCK_KILL_SWITCH_STATUS,
  MOCK_CIRCUIT_BREAKERS,
  MOCK_ACTIVE_TRANSFERS,
  MOCK_HEALTH_FACTORS,
  MOCK_RECON_STATUS,
  type KillSwitchStatus,
  type CircuitBreakerVenue,
  type ActiveTransfer,
  type HealthFactorEntry,
  type VenueReconStatus,
} from "@/lib/mocks/fixtures/recovery-controls";

// ── Re-export types for consumers ──────────────────────────────────────────────

export type {
  KillSwitchStatus,
  CircuitBreakerVenue,
  CircuitBreakerState,
  ActiveTransfer,
  TransferStatus,
  HealthFactorEntry,
  VenueReconStatus,
  ReconHealth,
  ExecConnectivity,
} from "@/lib/mocks/fixtures/recovery-controls";

// ── Request/Response types ─────────────────────────────────────────────────────

export interface KillSwitchActivateRequest {
  scope: "firm" | "client" | "strategy" | "venue";
  entity_id: string;
  rationale: string;
  auto_deactivate_minutes?: number;
}

export interface KillSwitchDeactivateRequest {
  rationale: string;
}

export interface KillSwitchActionResult {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface CircuitBreakerForceResult {
  success: boolean;
  venue_id: string;
  new_state: string;
  message: string;
}

// ── Module-level mock check ────────────────────────────────────────────────────

const isMock = isMockDataMode();

// ── Kill Switch Hooks ──────────────────────────────────────────────────────────

/**
 * Fetch current kill switch status.
 * Mock mode: returns MOCK_KILL_SWITCH_STATUS fixture.
 * Live mode: GET /api/risk/kill-switch from execution-service.
 */
export function useKillSwitchStatus() {
  const { user, token } = useAuth();

  return useQuery<KillSwitchStatus>({
    queryKey: ["kill-switch-status", user?.id],
    queryFn: async () => {
      if (isMock) return MOCK_KILL_SWITCH_STATUS;
      const result = await apiFetch("/api/risk/kill-switch", token);
      return result as KillSwitchStatus;
    },
    enabled: !!user,
    refetchInterval: 5_000,
  });
}

/**
 * Activate the kill switch.
 * Mock mode: simulates a 1.5s delay and returns success.
 * Live mode: POST /api/risk/kill-switch (action: activate) to execution-service.
 */
export function useKillSwitchActivate() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<KillSwitchActionResult, Error, KillSwitchActivateRequest>({
    mutationFn: async (params) => {
      if (isMock) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return {
          success: true,
          message: `Kill switch activated for ${params.scope}: ${params.entity_id}`,
          timestamp: new Date().toISOString(),
        };
      }
      const result = await apiFetch("/api/risk/kill-switch", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate", ...params }),
      });
      return result as KillSwitchActionResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kill-switch-status"] });
    },
  });
}

/**
 * Deactivate the kill switch.
 * Mock mode: simulates a 1s delay and returns success.
 * Live mode: POST /api/risk/kill-switch (action: deactivate) to execution-service.
 */
export function useKillSwitchDeactivate() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<KillSwitchActionResult, Error, KillSwitchDeactivateRequest>({
    mutationFn: async (params) => {
      if (isMock) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          success: true,
          message: "Kill switch deactivated",
          timestamp: new Date().toISOString(),
        };
      }
      const result = await apiFetch("/api/risk/kill-switch", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deactivate", ...params }),
      });
      return result as KillSwitchActionResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kill-switch-status"] });
    },
  });
}

// ── Circuit Breaker Hooks ──────────────────────────────────────────────────────

/**
 * Fetch all circuit breaker states.
 * Mock mode: returns MOCK_CIRCUIT_BREAKERS fixture.
 * Live mode: GET /api/risk/circuit-breaker from execution-service.
 */
export function useCircuitBreakerStates() {
  const { user, token } = useAuth();

  return useQuery<CircuitBreakerVenue[]>({
    queryKey: ["circuit-breakers", user?.id],
    queryFn: async () => {
      if (isMock) return MOCK_CIRCUIT_BREAKERS;
      const result = await apiFetch("/api/risk/circuit-breaker", token);
      return result as CircuitBreakerVenue[];
    },
    enabled: !!user,
    refetchInterval: 5_000,
  });
}

/**
 * Force-open a circuit breaker for a venue.
 * Mock mode: simulates a 1s delay and returns success.
 * Live mode: POST /api/risk/circuit-breaker (action: force-open) to execution-service.
 */
export function useForceOpenBreaker() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<CircuitBreakerForceResult, Error, { venueId: string; rationale: string }>({
    mutationFn: async ({ venueId, rationale }) => {
      if (isMock) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          success: true,
          venue_id: venueId,
          new_state: "OPEN",
          message: `Circuit breaker for ${venueId} forced open`,
        };
      }
      const result = await apiFetch("/api/risk/circuit-breaker", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venue_id: venueId, action: "force-open", rationale }),
      });
      return result as CircuitBreakerForceResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circuit-breakers"] });
    },
  });
}

/**
 * Force-close a circuit breaker for a venue.
 * Mock mode: simulates a 1s delay and returns success.
 * Live mode: POST /api/risk/circuit-breaker (action: force-close) to execution-service.
 */
export function useForceCloseBreaker() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<CircuitBreakerForceResult, Error, { venueId: string; rationale: string }>({
    mutationFn: async ({ venueId, rationale }) => {
      if (isMock) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          success: true,
          venue_id: venueId,
          new_state: "CLOSED",
          message: `Circuit breaker for ${venueId} forced closed`,
        };
      }
      const result = await apiFetch("/api/risk/circuit-breaker", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venue_id: venueId, action: "force-close", rationale }),
      });
      return result as CircuitBreakerForceResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circuit-breakers"] });
    },
  });
}

// ── Transfer Hooks ─────────────────────────────────────────────────────────────

/**
 * Fetch active transfers.
 * Mock mode: returns MOCK_ACTIVE_TRANSFERS fixture.
 * Live mode: GET /api/transfers/active from execution-service.
 */
export function useActiveTransfers() {
  const { user, token } = useAuth();

  return useQuery<ActiveTransfer[]>({
    queryKey: ["active-transfers", user?.id],
    queryFn: async () => {
      if (isMock) return MOCK_ACTIVE_TRANSFERS;
      const result = await apiFetch("/api/transfers/active", token);
      return result as ActiveTransfer[];
    },
    enabled: !!user,
    refetchInterval: 10_000,
  });
}

// ── Health Factor Hooks ────────────────────────────────────────────────────────

/**
 * Fetch health factors for all strategies.
 * Mock mode: returns MOCK_HEALTH_FACTORS fixture.
 * Live mode: GET /api/health-factors from execution-service (or PBMS).
 */
export function useHealthFactors() {
  const { user, token } = useAuth();

  return useQuery<HealthFactorEntry[]>({
    queryKey: ["health-factors", user?.id],
    queryFn: async () => {
      if (isMock) return MOCK_HEALTH_FACTORS;
      const result = await apiFetch("/api/health-factors", token);
      return result as HealthFactorEntry[];
    },
    enabled: !!user,
    refetchInterval: 10_000,
  });
}

// ── Reconciliation Status Hooks ────────────────────────────────────────────────

/**
 * Fetch venue-level reconciliation status (for recovery page).
 * Mock mode: returns MOCK_RECON_STATUS fixture.
 * Live mode: GET /api/reconciliation/venue-status from PBMS.
 */
export function useVenueReconStatus() {
  const { user, token } = useAuth();

  return useQuery<VenueReconStatus[]>({
    queryKey: ["venue-recon-status", user?.id],
    queryFn: async () => {
      if (isMock) return MOCK_RECON_STATUS;
      const result = await apiFetch("/api/reconciliation/venue-status", token);
      return result as VenueReconStatus[];
    },
    enabled: !!user,
    refetchInterval: 10_000,
  });
}
