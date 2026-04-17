/**
 * Unity meta-broker child book declarations (UI-side mirror of UAC SSOT).
 *
 * SSOT: `unified-api-contracts/unified_api_contracts/internal/unity_child_books.py`
 *
 * 8 books confirmed (with commissions); 2 still pending from
 * https://quant-portal.olesportsresearch.com/unity (phase 13 follow-up).
 *
 * Commercial parameters come from
 * `codex/02-venues/unity-integration.md` and
 * `codex/04-architecture/execution-service-polymorphic-routing.md`.
 */

export type UnitySport = "SOCCER" | "TENNIS" | "BASKETBALL";

export type UnityCommissionType = "FLAT" | "COMMISSION_ON_WIN";

export interface UnityChildBook {
  child_venue_id: string;
  display_name: string;
  commission_bps: number | null;
  commission_type: UnityCommissionType;
  supported_sports: readonly UnitySport[];
  notes: string;
  confirmed: boolean;
}

export const UNITY_CHILD_BOOKS: readonly UnityChildBook[] = [
  {
    child_venue_id: "PINNACLE_VIA_UNITY",
    display_name: "Pinnacle (via Unity)",
    commission_bps: 40,
    commission_type: "FLAT",
    supported_sports: ["SOCCER", "TENNIS", "BASKETBALL"],
    notes: "Sharp book via Unity — lower limits than direct Pinnacle",
    confirmed: true,
  },
  {
    child_venue_id: "VX",
    display_name: "VX",
    commission_bps: 20,
    commission_type: "FLAT",
    supported_sports: ["SOCCER", "TENNIS", "BASKETBALL"],
    notes: "Cheapest child book; preferred first",
    confirmed: true,
  },
  {
    child_venue_id: "SHARPBET",
    display_name: "SharpBet",
    commission_bps: 20,
    commission_type: "FLAT",
    supported_sports: ["SOCCER", "TENNIS", "BASKETBALL"],
    notes: "Cheapest child book; preferred first",
    confirmed: true,
  },
  {
    child_venue_id: "BETFAIR_VIA_UNITY",
    display_name: "Betfair (via Unity)",
    commission_bps: 50,
    commission_type: "COMMISSION_ON_WIN",
    supported_sports: ["SOCCER", "TENNIS", "BASKETBALL"],
    notes: "Back+lay exchange via Unity aggregated book",
    confirmed: true,
  },
  {
    child_venue_id: "BROKER3",
    display_name: "Broker 3 (confidential)",
    commission_bps: null,
    commission_type: "FLAT",
    supported_sports: ["SOCCER"],
    notes: "Commission TBD per commercial; existence confirmed",
    confirmed: true,
  },
  {
    child_venue_id: "BROKER4",
    display_name: "Broker 4 (confidential)",
    commission_bps: null,
    commission_type: "FLAT",
    supported_sports: ["SOCCER"],
    notes: "Commission TBD per commercial; existence confirmed",
    confirmed: true,
  },
  {
    child_venue_id: "BROKER5",
    display_name: "Broker 5 (confidential)",
    commission_bps: 300,
    commission_type: "FLAT",
    supported_sports: ["SOCCER", "TENNIS", "BASKETBALL"],
    notes: "High commission; only route if spread justifies",
    confirmed: true,
  },
  {
    child_venue_id: "IBCBET",
    display_name: "IBCBet",
    commission_bps: 150,
    commission_type: "FLAT",
    supported_sports: ["SOCCER", "BASKETBALL"],
    notes: "Mid-commission; Asian handicap specialist",
    confirmed: true,
  },
  {
    child_venue_id: "TBD_BOOK_9",
    display_name: "TBD — pending from quant-portal",
    commission_bps: null,
    commission_type: "FLAT",
    supported_sports: [],
    notes: "Commission + identity pending from quant-portal.olesportsresearch.com/unity",
    confirmed: false,
  },
  {
    child_venue_id: "TBD_BOOK_10",
    display_name: "TBD — pending from quant-portal",
    commission_bps: null,
    commission_type: "FLAT",
    supported_sports: [],
    notes: "Commission + identity pending from quant-portal.olesportsresearch.com/unity",
    confirmed: false,
  },
];

export interface UnityCommercialTerms {
  depositUsd: number;
  refundThresholdLifetimeTurnoverUsd: number;
  monthlySubscriptionUsd: number;
  monthlyTurnoverWaiverUsd: number;
  rolloverMultiplier: number;
  shareClass: "USD";
  enabledSports: readonly UnitySport[];
}

export const UNITY_COMMERCIAL: UnityCommercialTerms = {
  depositUsd: 10_800,
  refundThresholdLifetimeTurnoverUsd: 5_300_000,
  monthlySubscriptionUsd: 2_600,
  monthlyTurnoverWaiverUsd: 260_000,
  rolloverMultiplier: 1,
  shareClass: "USD",
  enabledSports: ["SOCCER", "TENNIS", "BASKETBALL"],
};

export function unityChildBooksConfirmed(): readonly UnityChildBook[] {
  return UNITY_CHILD_BOOKS.filter((b) => b.confirmed);
}

export function unityChildBooksPending(): readonly UnityChildBook[] {
  return UNITY_CHILD_BOOKS.filter((b) => !b.confirmed);
}
