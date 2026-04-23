/**
 * Mock values for the IBKR SPAN margin breakdown section in the
 * risk-margin widget. These remain static until the margin summary API
 * is wired through; tracked in docs/manifest/widget-certification/risk-margin.json
 * (knownIssue: SPAN section hardcoded — waiting on /api/risk/margin/span).
 */
export const MOCK_SPAN_MARGIN_IBKR = {
  initialMargin: 180_000,
  maintenanceMargin: 135_000,
  crossMarginOffset: -22_000,
  netMarginRequired: 158_000,
  utilizationPct: 79,
} as const;
