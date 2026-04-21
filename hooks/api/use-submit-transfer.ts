import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { isMockDataMode } from "@/lib/runtime/data-mode";

export type TransferDirection = "deposit" | "withdraw" | "internal" | "cross_venue";
export type TransferStatus = "submitted" | "confirming" | "settled" | "rejected";

export interface SubmitTransferRequest {
  direction: TransferDirection;
  from_account_id: string;
  to_account_id: string;
  from_venue: string;
  to_venue: string;
  asset: string;
  amount: string;
  network?: string | null;
  address?: string | null;
  memo?: string | null;
  idempotency_key: string;
}

export interface SubmitTransferResult {
  transfer_id: string;
  status: TransferStatus;
  submitted_at: string;
  estimated_settlement_ms: number | null;
}

const isMock = isMockDataMode();

/**
 * Tracks backend feature request BFR-002 (see docs/audits/backend-feature-requests.md).
 * Mock: synthesises transfer_id after ~150ms. Live: POST /api/accounts/transfer.
 * Widget is responsible for also appending to the local transfer-history context after a successful call.
 */
export function useSubmitTransfer() {
  const { token } = useAuth();

  return useMutation<SubmitTransferResult, Error, SubmitTransferRequest>({
    mutationFn: async (params) => {
      if (isMock) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        return {
          transfer_id: `tx-mock-${Date.now().toString(36)}`,
          status: "submitted",
          submitted_at: new Date().toISOString(),
          estimated_settlement_ms: params.direction === "internal" ? 2_000 : 30_000,
        };
      }
      const result = await apiFetch("/api/accounts/transfer", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      return result as SubmitTransferResult;
    },
  });
}
