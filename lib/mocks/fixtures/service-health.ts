export interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  label: string;
}

export const MOCK_HEALTH: ServiceHealth[] = [
  { name: "execution-service", status: "healthy", label: "Execution" },
  { name: "strategy-service", status: "healthy", label: "Strategy" },
  { name: "risk-service", status: "healthy", label: "Risk" },
  { name: "market-data", status: "healthy", label: "Market Data" },
  { name: "features-delta-1", status: "degraded", label: "Features Δ1" },
  { name: "ml-inference", status: "healthy", label: "ML Inference" },
  { name: "pnl-attribution", status: "healthy", label: "P&L" },
  { name: "alerting", status: "healthy", label: "Alerting" },
  { name: "recon-service", status: "healthy", label: "Reconciliation" },
  { name: "instruments", status: "healthy", label: "Instruments" },
];
