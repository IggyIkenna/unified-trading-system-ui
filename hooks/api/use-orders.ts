import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { typedFetch, type GatewayApiResponse } from "@/lib/api/typed-fetch";
import { withMode } from "@/lib/api/with-mode";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";

type OrdersResponse = GatewayApiResponse<"/api/execution/orders">;
type AlgosResponse = GatewayApiResponse<"/api/execution/algos">;
type VenuesResponse = GatewayApiResponse<"/api/execution/venues">;
type BacktestsResponse = GatewayApiResponse<"/api/execution/backtests">;

export function useOrders() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<OrdersResponse>({
    queryKey: ["orders", user?.id, scope.mode],
    queryFn: () =>
      typedFetch<OrdersResponse>(withMode("/api/execution/orders", scope.mode, scope.asOfTs ?? undefined), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useAlgos() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<AlgosResponse>({
    queryKey: ["algos", user?.id, scope.mode],
    queryFn: () =>
      typedFetch<AlgosResponse>(withMode("/api/execution/algos", scope.mode, scope.asOfTs ?? undefined), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useVenues() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<VenuesResponse>({
    queryKey: ["execution-venues", user?.id, scope.mode],
    queryFn: () =>
      typedFetch<VenuesResponse>(withMode("/api/execution/venues", scope.mode, scope.asOfTs ?? undefined), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useExecutionBacktests() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery<BacktestsResponse>({
    queryKey: ["execution-backtests", user?.id, scope.mode],
    queryFn: () =>
      typedFetch<BacktestsResponse>(withMode("/api/execution/backtests", scope.mode, scope.asOfTs ?? undefined), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useExecutionMetrics() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery({
    queryKey: ["execution-metrics", user?.id, scope.mode],
    queryFn: () => apiFetch(withMode("/api/execution/metrics", scope.mode, scope.asOfTs ?? undefined), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useExecutionCandidates() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();

  return useQuery({
    queryKey: ["execution-candidates", user?.id, scope.mode],
    queryFn: () => apiFetch(withMode("/api/execution/candidates", scope.mode, scope.asOfTs ?? undefined), token),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export function useExecutionHandoff(algoId?: string) {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();
  const base = `/api/execution/handoff${algoId ? `?algoId=${algoId}` : ""}`;

  return useQuery({
    queryKey: ["execution-handoff", algoId, user?.id, scope.mode],
    queryFn: () =>
      apiFetch(
        withMode(base, scope.mode, scope.asOfTs ?? undefined),
        token,
      ),
    enabled: !!user,
    refetchInterval: scope.mode === "batch" ? false : undefined,
  });
}

export interface PlaceOrderParams {
  instrument: string;
  side: "buy" | "sell";
  order_type: "limit" | "market";
  quantity: number;
  price?: number;
  venue?: string;
  strategy_id?: string;
  client_id?: string;
  reason?: string;
  execution_mode?: "execute" | "record_only";
  counterparty?: string;
  source_reference?: string;
  category?: string;
  portfolio_id?: string;
  algo?: string;
  algo_params?: Record<string, number>;
}

export interface PreTradeCheckParams {
  instrument: string;
  side: string;
  quantity: number;
  price?: number;
  strategy_id?: string;
}

export function usePreTradeCheck() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (params: PreTradeCheckParams) =>
      apiFetch("/api/compliance/pre-trade-check", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }),
  });
}

export function usePlaceOrder() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: PlaceOrderParams) =>
      apiFetch("/api/execution/orders", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
  });
}

export function useCancelOrder() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) =>
      apiFetch(`/api/execution/orders/${orderId}/cancel`, token, {
        method: "PUT",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useAmendOrder() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      orderId: string;
      quantity?: number;
      price?: number;
    }) =>
      apiFetch(`/api/execution/orders/${params.orderId}/amend`, token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: params.quantity,
          price: params.price,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
