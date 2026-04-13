export interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface OptionLeg {
  bid: number;
  ask: number;
  last: number;
  iv: number;
  greeks: OptionGreeks;
  volume: number;
  openInterest: number;
}

export interface OptionsRow {
  strike: number;
  call: OptionLeg;
  put: OptionLeg;
}

export interface ExpiryGroup {
  expiry: string;
  daysToExpiry: number;
  rows: OptionsRow[];
  spotPrice: number;
}

export interface OptionsChainResponse {
  underlying: string;
  venue: string;
  spotPrice: number;
  expiries: ExpiryGroup[];
}

export interface OptionsChainProps {
  underlying: string;
  venue: string;
  onSelectStrike?: (strike: number, expiry: string, side: "call" | "put") => void;
  className?: string;
}

export interface SpreadLeg {
  id: string;
  strike: number;
  expiry: string;
  side: "call" | "put";
  direction: "buy" | "sell";
  quantity: number;
}

export interface SpreadTemplate {
  name: string;
  description: string;
  buildLegs: (atmStrike: number, tickSize: number, expiry: string) => Omit<SpreadLeg, "id">[];
}
