export interface OrderFlowEntry {
  id: string;
  exchangeTime: string;
  localTime: string;
  delayMs: number;
  type: "bid" | "ask" | "trade";
  side: "buy" | "sell";
  price: number;
  size: number;
  venue: string;
  isOwn: boolean;
  orderId?: string;
  aggressor?: "buyer" | "seller";
  level?: number;
}

export interface LiveBookUpdate {
  id: string;
  exchangeTime: string;
  localTime: string;
  delayMs: number;
  updateType: "book" | "trade";
  bidLevels?: Array<{ price: number; size: number; updated?: boolean }>;
  askLevels?: Array<{ price: number; size: number; updated?: boolean }>;
  trade?: {
    price: number;
    size: number;
    side: "buy" | "sell";
    aggressor: "buyer" | "seller";
    isOwn: boolean;
    orderId?: string;
  };
  venue: string;
}

export interface ReconRun {
  date: string;
  status: string;
  breaks: number;
  resolved: number;
  totalValue: number;
}

export interface LatencyMetric {
  service: string;
  serviceId: string;
  p50: number;
  p95: number;
  p99: number;
  status: "healthy" | "warning" | "critical";
  lifecycle: Array<{ stage: string; p50: number; p95: number; p99: number }>;
  batch: { p50: number; p95: number; p99: number };
  timeSeries: Array<{ time: string; p50: number; p95: number; p99: number }>;
}
