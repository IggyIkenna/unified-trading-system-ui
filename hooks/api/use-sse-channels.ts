"use client";

import { useSSE, type UseSSEOptions } from "./use-sse";

// ---------------------------------------------------------------------------
// Channel-specific types
// ---------------------------------------------------------------------------

export interface PositionStreamEvent {
  instrument: string;
  venue: string;
  side: "LONG" | "SHORT";
  quantity: number;
  entry_price: number;
  mark_price: number;
  unrealised_pnl: number;
  timestamp: string;
}

export interface RiskAlertStreamEvent {
  alert_id: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  category: string;
  message: string;
  strategy_id: string;
  timestamp: string;
}

export interface SignalStreamEvent {
  signal_id: string;
  strategy_id: string;
  instrument: string;
  direction: "BUY" | "SELL";
  confidence: number;
  features: Record<string, number>;
  timestamp: string;
}

export interface PredictionStreamEvent {
  prediction_id: string;
  model_family: string;
  instrument: string;
  predicted_direction: "UP" | "DOWN" | "FLAT";
  probability: number;
  horizon_minutes: number;
  timestamp: string;
}

export interface DeployEventStreamEvent {
  deploy_id: string;
  service: string;
  status: "PENDING" | "IN_PROGRESS" | "SUCCESS" | "FAILED" | "ROLLED_BACK";
  version: string;
  environment: string;
  message: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Channel hooks
// ---------------------------------------------------------------------------

export function usePositionStream(
  options?: Omit<UseSSEOptions<PositionStreamEvent>, "mockGenerator">,
) {
  return useSSE<PositionStreamEvent>("/api/stream/positions", options);
}

export function useRiskAlertStream(
  options?: Omit<UseSSEOptions<RiskAlertStreamEvent>, "mockGenerator">,
) {
  return useSSE<RiskAlertStreamEvent>("/api/stream/risk-alerts", options);
}

export function useSignalStream(
  options?: UseSSEOptions<SignalStreamEvent>,
) {
  return useSSE<SignalStreamEvent>("/api/stream/signals", options);
}

export function usePredictionStream(
  options?: Omit<UseSSEOptions<PredictionStreamEvent>, "mockGenerator">,
) {
  return useSSE<PredictionStreamEvent>("/api/stream/predictions", options);
}

export function useDeployEventStream(
  options?: Omit<UseSSEOptions<DeployEventStreamEvent>, "mockGenerator">,
) {
  return useSSE<DeployEventStreamEvent>("/api/stream/deploy-events", options);
}
