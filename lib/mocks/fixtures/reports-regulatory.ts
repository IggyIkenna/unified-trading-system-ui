/** Reports — regulatory filing fixtures. */

export type ReportStatus = "submitted" | "pending" | "overdue" | "draft";
export type ReportType = "MIFID_II_ART26" | "MIFID_II_ART27" | "FCA_BEST_EXEC" | "EMIR_DERIVATIVE" | "FCA_TRANSACTION";
export type Jurisdiction = "EU" | "UK";

export interface RegulatoryReport {
  id: string;
  reportType: ReportType;
  jurisdiction: Jurisdiction;
  period: string;
  filingDate: string | null;
  nextDueDate: string;
  status: ReportStatus;
  filingReference: string | null;
  instrumentsCovered: string[];
  bestExecutionMetrics: {
    avgSlippage: string;
    fillRate: string;
    priceImprovement: string;
    venueScore: string;
  } | null;
}

export const MOCK_REPORTS: RegulatoryReport[] = [
  {
    id: "reg-001",
    reportType: "MIFID_II_ART26",
    jurisdiction: "EU",
    period: "2026 Q1",
    filingDate: "2026-03-15",
    nextDueDate: "2026-06-30",
    status: "submitted",
    filingReference: "EU-ART26-2026Q1-00147",
    instrumentsCovered: ["BTC-USD", "ETH-USD", "SOL-USD", "AVAX-USD"],
    bestExecutionMetrics: null,
  },
  {
    id: "reg-002",
    reportType: "MIFID_II_ART27",
    jurisdiction: "EU",
    period: "2026 Q1",
    filingDate: null,
    nextDueDate: "2026-04-30",
    status: "pending",
    filingReference: null,
    instrumentsCovered: ["BTC-USD", "ETH-USD", "SOL-USD"],
    bestExecutionMetrics: {
      avgSlippage: "1.2 bps",
      fillRate: "98.4%",
      priceImprovement: "0.8 bps",
      venueScore: "A",
    },
  },
  {
    id: "reg-003",
    reportType: "FCA_BEST_EXEC",
    jurisdiction: "UK",
    period: "2025 Annual",
    filingDate: null,
    nextDueDate: "2026-03-20",
    status: "overdue",
    filingReference: null,
    instrumentsCovered: ["BTC-GBP", "ETH-GBP", "BTC-USD", "ETH-USD", "SOL-USD", "AVAX-USD"],
    bestExecutionMetrics: {
      avgSlippage: "1.5 bps",
      fillRate: "97.1%",
      priceImprovement: "0.5 bps",
      venueScore: "B+",
    },
  },
  {
    id: "reg-004",
    reportType: "EMIR_DERIVATIVE",
    jurisdiction: "EU",
    period: "2026 Q1",
    filingDate: "2026-03-10",
    nextDueDate: "2026-06-30",
    status: "submitted",
    filingReference: "EU-EMIR-2026Q1-00893",
    instrumentsCovered: ["BTC-PERP", "ETH-PERP", "SOL-PERP"],
    bestExecutionMetrics: null,
  },
  {
    id: "reg-005",
    reportType: "FCA_TRANSACTION",
    jurisdiction: "UK",
    period: "2026 W11",
    filingDate: "2026-03-17",
    nextDueDate: "2026-03-24",
    status: "submitted",
    filingReference: "UK-FCA-TXN-2026W11-02341",
    instrumentsCovered: ["BTC-GBP", "ETH-GBP"],
    bestExecutionMetrics: null,
  },
  {
    id: "reg-006",
    reportType: "MIFID_II_ART26",
    jurisdiction: "EU",
    period: "2025 Q4",
    filingDate: "2025-12-28",
    nextDueDate: "2026-03-31",
    status: "submitted",
    filingReference: "EU-ART26-2025Q4-00098",
    instrumentsCovered: ["BTC-USD", "ETH-USD"],
    bestExecutionMetrics: null,
  },
  {
    id: "reg-007",
    reportType: "FCA_BEST_EXEC",
    jurisdiction: "UK",
    period: "2026 Q1",
    filingDate: null,
    nextDueDate: "2026-06-30",
    status: "draft",
    filingReference: null,
    instrumentsCovered: ["BTC-GBP", "ETH-GBP", "SOL-GBP"],
    bestExecutionMetrics: {
      avgSlippage: "1.1 bps",
      fillRate: "98.8%",
      priceImprovement: "0.9 bps",
      venueScore: "A-",
    },
  },
  {
    id: "reg-008",
    reportType: "EMIR_DERIVATIVE",
    jurisdiction: "EU",
    period: "2025 Q4",
    filingDate: "2025-12-30",
    nextDueDate: "2026-03-31",
    status: "submitted",
    filingReference: "EU-EMIR-2025Q4-00654",
    instrumentsCovered: ["BTC-PERP", "ETH-PERP"],
    bestExecutionMetrics: null,
  },
  {
    id: "reg-009",
    reportType: "FCA_TRANSACTION",
    jurisdiction: "UK",
    period: "2026 W12",
    filingDate: null,
    nextDueDate: "2026-03-31",
    status: "pending",
    filingReference: null,
    instrumentsCovered: ["BTC-GBP", "ETH-GBP", "SOL-GBP", "AVAX-GBP"],
    bestExecutionMetrics: null,
  },
  {
    id: "reg-010",
    reportType: "MIFID_II_ART27",
    jurisdiction: "EU",
    period: "2025 Annual",
    filingDate: "2026-02-28",
    nextDueDate: "2027-03-31",
    status: "submitted",
    filingReference: "EU-ART27-2025-ANN-00012",
    instrumentsCovered: ["BTC-USD", "ETH-USD", "SOL-USD", "AVAX-USD", "LINK-USD"],
    bestExecutionMetrics: {
      avgSlippage: "1.3 bps",
      fillRate: "97.9%",
      priceImprovement: "0.7 bps",
      venueScore: "A-",
    },
  },
];
