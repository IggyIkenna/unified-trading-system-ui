import type { ExpiryGroup, OptionsChainResponse } from "./types";

export const UNDERLYINGS = ["BTC", "ETH", "SPY"] as const;

export function generateMockExpiry(
  expiry: string,
  daysToExpiry: number,
  spotPrice: number,
  tickSize: number,
): ExpiryGroup {
  const numStrikes = 11;
  const halfRange = Math.floor(numStrikes / 2);
  const roundedSpot = Math.round(spotPrice / tickSize) * tickSize;
  const rows: ExpiryGroup["rows"] = [];

  for (let i = -halfRange; i <= halfRange; i++) {
    const strike = roundedSpot + i * tickSize;
    const moneyness = spotPrice / strike;
    const baseIv = 0.4 + 0.15 * Math.pow(moneyness - 1, 2) * 100 + (daysToExpiry / 365) * 0.05;

    const callItm = spotPrice > strike;
    const putItm = spotPrice < strike;

    const callIntrinsic = Math.max(spotPrice - strike, 0);
    const putIntrinsic = Math.max(strike - spotPrice, 0);

    const timeValue = spotPrice * baseIv * Math.sqrt(daysToExpiry / 365) * 0.05;
    const callMid = callIntrinsic + timeValue * (1 + (callItm ? 0.1 : 0.3));
    const putMid = putIntrinsic + timeValue * (1 + (putItm ? 0.1 : 0.3));

    const spread = spotPrice * 0.0005;

    const callDelta = callItm
      ? 0.5 + 0.5 * (1 - Math.exp(-Math.abs(i) * 0.3))
      : 0.5 - 0.5 * (1 - Math.exp(-Math.abs(i) * 0.3));
    const putDelta = callDelta - 1;

    const gamma = 0.001 * Math.exp((-0.5 * i * i) / 4);
    const theta = (-(spotPrice * baseIv) / (2 * Math.sqrt(daysToExpiry / 365) * 365)) * gamma * 10000;
    const vega = spotPrice * Math.sqrt(daysToExpiry / 365) * gamma * 100;

    rows.push({
      strike,
      call: {
        bid: Math.max(callMid - spread / 2, 0.01),
        ask: callMid + spread / 2,
        last: callMid + (Math.random() - 0.5) * spread * 0.5,
        iv: baseIv + (Math.random() - 0.5) * 0.02,
        greeks: { delta: callDelta, gamma, theta, vega },
        volume: Math.floor(Math.random() * 500 + 10),
        openInterest: Math.floor(Math.random() * 5000 + 100),
      },
      put: {
        bid: Math.max(putMid - spread / 2, 0.01),
        ask: putMid + spread / 2,
        last: putMid + (Math.random() - 0.5) * spread * 0.5,
        iv: baseIv + 0.01 + (Math.random() - 0.5) * 0.02,
        greeks: {
          delta: putDelta,
          gamma,
          theta: theta * 0.9,
          vega: vega * 0.95,
        },
        volume: Math.floor(Math.random() * 400 + 10),
        openInterest: Math.floor(Math.random() * 4000 + 100),
      },
    });
  }

  return { expiry, daysToExpiry, rows, spotPrice };
}

export function generateMockOptionsChain(underlying: string, venue: string): OptionsChainResponse {
  const spots: Record<string, number> = {
    BTC: 67234.5,
    ETH: 3456.78,
    SPY: 542.3,
  };
  const ticks: Record<string, number> = { BTC: 1000, ETH: 50, SPY: 5 };

  const spotPrice = spots[underlying] ?? 100;
  const tickSize = ticks[underlying] ?? 1;

  const now = new Date();
  const expiries: ExpiryGroup[] = [
    { label: "Weekly", days: 7 },
    { label: "Bi-weekly", days: 14 },
    { label: "Monthly", days: 30 },
    { label: "Quarterly", days: 90 },
  ].map(({ days }) => {
    const d = new Date(now.getTime() + days * 86400000);
    const label = d.toISOString().slice(0, 10);
    return generateMockExpiry(label, days, spotPrice, tickSize);
  });

  return { underlying, venue, spotPrice, expiries };
}
