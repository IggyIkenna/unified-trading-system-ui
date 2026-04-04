import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { typedFetch, type GatewayApiResponse } from "@/lib/api/typed-fetch";

type OrdersResponse = GatewayApiResponse<"/api/execution/orders">;
type AlgosResponse = GatewayApiResponse<"/api/execution/algos">;
type VenuesResponse = GatewayApiResponse<"/api/execution/venues">;
type BacktestsResponse = GatewayApiResponse<"/api/execution/backtests">;

export function useOrders() {
  const { user, token } = useAuth();

  return useQuery<OrdersResponse>({
    queryKey: ["orders", user?.id],
    queryFn: () =>
      typedFetch<OrdersResponse>("/api/execution/orders", token),
    enabled: !!user,
  });
}

export function useAlgos() {
  const { user, token } = useAuth();

  return useQuery<AlgosResponse>({
    queryKey: ["algos", user?.id],
    queryFn: () =>
      typedFetch<AlgosResponse>("/api/execution/algos", token),
    enabled: !!user,
  });
}

export function useVenues() {
  const { user, token } = useAuth();

  return useQuery<VenuesResponse>({
    queryKey: ["execution-venues", user?.id],
    queryFn: () =>
      typedFetch<VenuesResponse>("/api/execution/venues", token),
    enabled: !!user,
  });
}

export function useExecutionBacktests() {
  const { user, token } = useAuth();

  return useQuery<BacktestsResponse>({
    queryKey: ["execution-backtests", user?.id],
    queryFn: () =>
      typedFetch<BacktestsResponse>("/api/execution/backtests", token),
    enabled: !!user,
  });
}

export function useExecutionMetrics() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["execution-metrics", user?.id],
    queryFn: () => apiFetch("/api/execution/metrics", token),
    enabled: !!user,
  });
}

export function useExecutionCandidates() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["execution-candidates", user?.id],
    queryFn: () => apiFetch("/api/execution/candidates", token),
    enabled: !!user,
  });
}

export function useExecutionHandoff(algoId?: string) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["execution-handoff", algoId, user?.id],
    queryFn: () =>
      apiFetch(
        `/api/execution/handoff${algoId ? `?algoId=${algoId}` : ""}`,
        token,
      ),
    enabled: !!user,
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
