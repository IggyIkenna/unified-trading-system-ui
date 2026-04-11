import type { NlDemoResponse } from "./executive-dashboard-data";

export interface ExecutiveSelectedStrategyData {
  totalAum: number;
  totalPnl: number;
  weightedSharpe: number;
  pnlPct: number;
  strategyAllocation: { name: string; value: number; color: string }[];
  count: number;
}

export interface ExecutiveNaturalLanguageCardProps {
  nlQuery: string;
  onNlQueryChange: (value: string) => void;
  onPickDemoQuestion: (question: string) => void;
  nlResponse: NlDemoResponse | null;
  nlLoading: boolean;
  onSubmitNl: () => void;
  nlDemoQuestions: readonly string[];
}
