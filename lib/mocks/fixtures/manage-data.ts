/** Manage service pages — compliance & mandates fallback fixtures. */

export interface ComplianceRule {
  ruleId: string;
  description: string;
  category: "Trading" | "Risk" | "Reporting" | "KYC";
  severity: "critical" | "high" | "medium";
  status: "compliant" | "violated" | "warning";
  lastCheck: string;
}

export interface Violation {
  date: string;
  ruleId: string;
  detail: string;
  severity: "critical" | "high" | "medium";
  resolution: "open" | "investigating" | "resolved";
  assignedTo: string;
}

export interface AuditEvent {
  timestamp: string;
  event: string;
  user: string;
  detail: string;
}

export const FALLBACK_RULES: ComplianceRule[] = [
  {
    ruleId: "FCA-001",
    description: "Client money segregation — CASS 7",
    category: "Trading",
    severity: "critical",
    status: "compliant",
    lastCheck: "2026-03-22T08:00:00Z",
  },
  {
    ruleId: "FCA-002",
    description: "Best execution policy compliance — MiFID II Article 27",
    category: "Trading",
    severity: "critical",
    status: "compliant",
    lastCheck: "2026-03-22T08:00:00Z",
  },
  {
    ruleId: "FCA-003",
    description: "Transaction reporting — MiFIR Article 26",
    category: "Reporting",
    severity: "critical",
    status: "warning",
    lastCheck: "2026-03-21T23:59:00Z",
  },
  {
    ruleId: "RISK-001",
    description: "Position limit breach monitoring",
    category: "Risk",
    severity: "high",
    status: "violated",
    lastCheck: "2026-03-22T07:30:00Z",
  },
  {
    ruleId: "RISK-002",
    description: "Counterparty exposure limits",
    category: "Risk",
    severity: "high",
    status: "compliant",
    lastCheck: "2026-03-22T06:00:00Z",
  },
  {
    ruleId: "RISK-003",
    description: "Leverage ratio monitoring — AIFMD",
    category: "Risk",
    severity: "high",
    status: "compliant",
    lastCheck: "2026-03-22T08:00:00Z",
  },
  {
    ruleId: "KYC-001",
    description: "Client identity verification — MLR 2017",
    category: "KYC",
    severity: "critical",
    status: "compliant",
    lastCheck: "2026-03-20T12:00:00Z",
  },
  {
    ruleId: "KYC-002",
    description: "Sanctions screening — OFSI",
    category: "KYC",
    severity: "critical",
    status: "compliant",
    lastCheck: "2026-03-22T00:00:00Z",
  },
  {
    ruleId: "RPT-001",
    description: "Monthly regulatory returns — FCA RegData",
    category: "Reporting",
    severity: "medium",
    status: "compliant",
    lastCheck: "2026-03-15T09:00:00Z",
  },
  {
    ruleId: "RPT-002",
    description: "Suspicious activity reporting — NCA SAR",
    category: "Reporting",
    severity: "high",
    status: "warning",
    lastCheck: "2026-03-21T16:00:00Z",
  },
];

export const FALLBACK_VIOLATIONS: Violation[] = [
  {
    date: "2026-03-22",
    ruleId: "RISK-001",
    detail: "Meridian Fund equities allocation exceeded 65% hard limit (64.1%)",
    severity: "high",
    resolution: "investigating",
    assignedTo: "J. Harper",
  },
  {
    date: "2026-03-21",
    ruleId: "FCA-003",
    detail: "3 transactions missing ARM submission within T+1 deadline",
    severity: "critical",
    resolution: "open",
    assignedTo: "S. Chen",
  },
  {
    date: "2026-03-20",
    ruleId: "RPT-002",
    detail: "Unusual transfer pattern flagged for client ACC-4412 — pending SAR review",
    severity: "high",
    resolution: "investigating",
    assignedTo: "M. Okafor",
  },
  {
    date: "2026-03-18",
    ruleId: "RISK-001",
    detail: "Pinnacle Investments credit allocation drift exceeded 3% threshold",
    severity: "high",
    resolution: "resolved",
    assignedTo: "J. Harper",
  },
  {
    date: "2026-03-15",
    ruleId: "KYC-001",
    detail: "Enhanced due diligence overdue for 2 high-risk clients",
    severity: "critical",
    resolution: "resolved",
    assignedTo: "A. Williams",
  },
  {
    date: "2026-03-12",
    ruleId: "FCA-002",
    detail: "Best execution review missed quarterly deadline — completed 2 days late",
    severity: "critical",
    resolution: "resolved",
    assignedTo: "S. Chen",
  },
  {
    date: "2026-03-10",
    ruleId: "RPT-001",
    detail: "February RegData submission contained 4 data quality errors",
    severity: "medium",
    resolution: "resolved",
    assignedTo: "L. Patel",
  },
];

export const FALLBACK_AUDIT: AuditEvent[] = [
  {
    timestamp: "2026-03-22T08:15:00Z",
    event: "Compliance scan completed",
    user: "system",
    detail: "10 rules checked — 1 violated, 2 warnings",
  },
  {
    timestamp: "2026-03-22T07:45:00Z",
    event: "Violation opened",
    user: "system",
    detail: "RISK-001: Meridian Fund position limit breach",
  },
  {
    timestamp: "2026-03-21T17:30:00Z",
    event: "Investigation started",
    user: "M. Okafor",
    detail: "RPT-002: SAR review for ACC-4412 transfer pattern",
  },
  {
    timestamp: "2026-03-21T16:00:00Z",
    event: "Rule status changed",
    user: "system",
    detail: "FCA-003: compliant -> warning (ARM delay)",
  },
  {
    timestamp: "2026-03-18T14:20:00Z",
    event: "Violation resolved",
    user: "J. Harper",
    detail: "RISK-001: Pinnacle credit drift corrected via rebalance",
  },
  {
    timestamp: "2026-03-15T11:00:00Z",
    event: "KYC review completed",
    user: "A. Williams",
    detail: "EDD completed for 2 high-risk clients",
  },
];

export interface MandateDetail {
  allocationLimits: Record<string, { min: number; max: number }>;
  positionLimits: { maxSinglePosition: number; maxSectorExposure: number };
  drawdownThresholds: { soft: number; hard: number };
  feeStructure: {
    managementFee: number;
    performanceFee: number;
    hurdleRate: number;
  };
}

export interface Mandate {
  id: string;
  client: string;
  strategy: string;
  assetClass: string;
  allocationTarget: number;
  currentAllocation: number;
  drift: number;
  maxDrawdownLimit: number;
  status: "active" | "breached" | "under-review";
  lastReviewed: string;
  detail: MandateDetail;
}

export const FALLBACK_MANDATES: Mandate[] = [
  {
    id: "MND-001",
    client: "Apex Capital",
    strategy: "Global Macro",
    assetClass: "Equities",
    allocationTarget: 40,
    currentAllocation: 38.2,
    drift: -1.8,
    maxDrawdownLimit: 15,
    status: "active",
    lastReviewed: "2026-03-18",
    detail: {
      allocationLimits: {
        Equities: { min: 30, max: 50 },
        Bonds: { min: 20, max: 40 },
        Commodities: { min: 5, max: 15 },
        Cash: { min: 5, max: 20 },
      },
      positionLimits: { maxSinglePosition: 5, maxSectorExposure: 25 },
      drawdownThresholds: { soft: 10, hard: 15 },
      feeStructure: { managementFee: 1.5, performanceFee: 20, hurdleRate: 6 },
    },
  },
  {
    id: "MND-002",
    client: "Meridian Fund",
    strategy: "Stat Arb",
    assetClass: "Equities",
    allocationTarget: 60,
    currentAllocation: 64.1,
    drift: 4.1,
    maxDrawdownLimit: 10,
    status: "breached",
    lastReviewed: "2026-03-20",
    detail: {
      allocationLimits: {
        Equities: { min: 50, max: 65 },
        Derivatives: { min: 10, max: 30 },
        Cash: { min: 5, max: 20 },
      },
      positionLimits: { maxSinglePosition: 3, maxSectorExposure: 20 },
      drawdownThresholds: { soft: 7, hard: 10 },
      feeStructure: { managementFee: 2.0, performanceFee: 25, hurdleRate: 8 },
    },
  },
  {
    id: "MND-003",
    client: "Sterling Partners",
    strategy: "Fixed Income",
    assetClass: "Bonds",
    allocationTarget: 70,
    currentAllocation: 69.5,
    drift: -0.5,
    maxDrawdownLimit: 8,
    status: "active",
    lastReviewed: "2026-03-15",
    detail: {
      allocationLimits: {
        Bonds: { min: 60, max: 80 },
        Cash: { min: 10, max: 30 },
        Equities: { min: 0, max: 10 },
      },
      positionLimits: { maxSinglePosition: 8, maxSectorExposure: 30 },
      drawdownThresholds: { soft: 5, hard: 8 },
      feeStructure: { managementFee: 0.75, performanceFee: 10, hurdleRate: 4 },
    },
  },
  {
    id: "MND-004",
    client: "Vanguard Wealth",
    strategy: "Multi-Asset",
    assetClass: "Multi-Asset",
    allocationTarget: 50,
    currentAllocation: 48.7,
    drift: -1.3,
    maxDrawdownLimit: 12,
    status: "active",
    lastReviewed: "2026-03-19",
    detail: {
      allocationLimits: {
        Equities: { min: 25, max: 45 },
        Bonds: { min: 25, max: 45 },
        Alternatives: { min: 5, max: 20 },
        Cash: { min: 5, max: 15 },
      },
      positionLimits: { maxSinglePosition: 4, maxSectorExposure: 22 },
      drawdownThresholds: { soft: 8, hard: 12 },
      feeStructure: { managementFee: 1.25, performanceFee: 15, hurdleRate: 5 },
    },
  },
  {
    id: "MND-005",
    client: "Apex Capital",
    strategy: "Momentum",
    assetClass: "Commodities",
    allocationTarget: 15,
    currentAllocation: 17.8,
    drift: 2.8,
    maxDrawdownLimit: 20,
    status: "under-review",
    lastReviewed: "2026-03-21",
    detail: {
      allocationLimits: {
        Commodities: { min: 10, max: 20 },
        Equities: { min: 0, max: 10 },
        Cash: { min: 5, max: 15 },
      },
      positionLimits: { maxSinglePosition: 10, maxSectorExposure: 35 },
      drawdownThresholds: { soft: 15, hard: 20 },
      feeStructure: { managementFee: 1.75, performanceFee: 20, hurdleRate: 7 },
    },
  },
  {
    id: "MND-006",
    client: "Meridian Fund",
    strategy: "Long/Short Equity",
    assetClass: "Equities",
    allocationTarget: 35,
    currentAllocation: 34.2,
    drift: -0.8,
    maxDrawdownLimit: 18,
    status: "active",
    lastReviewed: "2026-03-17",
    detail: {
      allocationLimits: {
        Equities: { min: 25, max: 45 },
        Derivatives: { min: 15, max: 35 },
        Cash: { min: 5, max: 20 },
      },
      positionLimits: { maxSinglePosition: 6, maxSectorExposure: 28 },
      drawdownThresholds: { soft: 12, hard: 18 },
      feeStructure: { managementFee: 2.0, performanceFee: 20, hurdleRate: 6 },
    },
  },
  {
    id: "MND-007",
    client: "Pinnacle Investments",
    strategy: "Credit",
    assetClass: "Bonds",
    allocationTarget: 55,
    currentAllocation: 58.3,
    drift: 3.3,
    maxDrawdownLimit: 10,
    status: "breached",
    lastReviewed: "2026-03-22",
    detail: {
      allocationLimits: {
        Bonds: { min: 45, max: 55 },
        Cash: { min: 10, max: 25 },
        Equities: { min: 0, max: 10 },
      },
      positionLimits: { maxSinglePosition: 7, maxSectorExposure: 25 },
      drawdownThresholds: { soft: 6, hard: 10 },
      feeStructure: { managementFee: 1.0, performanceFee: 15, hurdleRate: 5 },
    },
  },
  {
    id: "MND-008",
    client: "Sterling Partners",
    strategy: "Relative Value",
    assetClass: "Derivatives",
    allocationTarget: 25,
    currentAllocation: 24.1,
    drift: -0.9,
    maxDrawdownLimit: 14,
    status: "active",
    lastReviewed: "2026-03-16",
    detail: {
      allocationLimits: {
        Derivatives: { min: 15, max: 30 },
        Equities: { min: 10, max: 25 },
        Bonds: { min: 10, max: 25 },
        Cash: { min: 5, max: 15 },
      },
      positionLimits: { maxSinglePosition: 5, maxSectorExposure: 20 },
      drawdownThresholds: { soft: 10, hard: 14 },
      feeStructure: { managementFee: 1.5, performanceFee: 20, hurdleRate: 6 },
    },
  },
  {
    id: "MND-009",
    client: "Vanguard Wealth",
    strategy: "DeFi Yield",
    assetClass: "Digital Assets",
    allocationTarget: 10,
    currentAllocation: 12.4,
    drift: 2.4,
    maxDrawdownLimit: 25,
    status: "under-review",
    lastReviewed: "2026-03-20",
    detail: {
      allocationLimits: {
        "Digital Assets": { min: 5, max: 15 },
        Cash: { min: 20, max: 40 },
        Equities: { min: 10, max: 30 },
      },
      positionLimits: { maxSinglePosition: 3, maxSectorExposure: 15 },
      drawdownThresholds: { soft: 18, hard: 25 },
      feeStructure: { managementFee: 2.5, performanceFee: 30, hurdleRate: 10 },
    },
  },
  {
    id: "MND-010",
    client: "Pinnacle Investments",
    strategy: "Global Macro",
    assetClass: "Multi-Asset",
    allocationTarget: 45,
    currentAllocation: 44.6,
    drift: -0.4,
    maxDrawdownLimit: 16,
    status: "active",
    lastReviewed: "2026-03-19",
    detail: {
      allocationLimits: {
        Equities: { min: 20, max: 40 },
        Bonds: { min: 15, max: 35 },
        Commodities: { min: 5, max: 20 },
        Cash: { min: 5, max: 15 },
      },
      positionLimits: { maxSinglePosition: 5, maxSectorExposure: 25 },
      drawdownThresholds: { soft: 11, hard: 16 },
      feeStructure: { managementFee: 1.25, performanceFee: 18, hurdleRate: 5 },
    },
  },
];
