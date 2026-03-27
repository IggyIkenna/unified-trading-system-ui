import type { ReconRun } from "@/lib/types/markets";

export const MOCK_RECON_RUNS: ReconRun[] = [
  { date: "2026-03-17", status: "complete", breaks: 4, resolved: 2, totalValue: 18000 },
  { date: "2026-03-16", status: "complete", breaks: 2, resolved: 2, totalValue: 5200 },
  { date: "2026-03-15", status: "complete", breaks: 0, resolved: 0, totalValue: 0 },
  { date: "2026-03-14", status: "complete", breaks: 1, resolved: 1, totalValue: 3100 },
];
