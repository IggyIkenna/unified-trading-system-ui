export interface StrategySignal {
  direction: string;
  confidence: number;
  timestamp: string;
}

export interface StrategyInstructionDetail {
  operationType: string;
  side: string;
  quantity: number;
  price: number;
  venue: string;
}

export interface StrategyFill {
  fillPrice: number;
  fillQty: number;
  slippageBps: number;
  status: string;
}

export interface StrategyInstruction {
  id: string;
  strategyId: string;
  strategyType: string;
  signal: StrategySignal;
  instruction: StrategyInstructionDetail;
  fill: StrategyFill | null;
}

export interface InstructionsSummary {
  total: number;
  filled: number;
  partial: number;
  pending: number;
  avgSlippage: number;
}
