export interface BookTrade {
  id: string;
  timestamp: string;
  instrument: string;
  venue: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  fees: number;
  total: number;
  status: "filled" | "partially_filled" | "settled";
  counterparty: string;
  settlementDate: string;
  tradeType: "Exchange" | "OTC" | "DeFi" | "Manual";
}

export function generateMockTrades(): BookTrade[] {
  const instruments = ["BTC-USDT", "ETH-USDT", "SOL-USDT", "WETH-USDC", "BTC-PERP"];
  const venues = ["Binance", "Hyperliquid", "Uniswap", "OTC Desk"];
  const tradeTypes: BookTrade["tradeType"][] = ["Exchange", "OTC", "DeFi", "Manual"];
  const counterparties = ["Jane Street", "Jump Trading", "Wintermute", "Alameda", "DRW", "Internal"];
  const statuses: BookTrade["status"][] = ["filled", "filled", "filled", "partially_filled", "settled"];
  const basePrices: Record<string, number> = {
    "BTC-USDT": 67250,
    "ETH-USDT": 3420,
    "SOL-USDT": 142.5,
    "WETH-USDC": 3415,
    "BTC-PERP": 67300,
  };
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const trades: BookTrade[] = [];
  for (let i = 0; i < 20; i++) {
    const instrument = instruments[i % instruments.length];
    const basePrice = basePrices[instrument];
    const priceVariation = basePrice * (0.98 + Math.sin(i * 1.7) * 0.02);
    const price = Math.round(priceVariation * 100) / 100;
    const side: "buy" | "sell" = i % 3 === 0 ? "sell" : "buy";
    const quantity = instrument.includes("BTC") ? 0.1 + (i % 5) * 0.15 : 1 + (i % 8) * 2.5;
    const roundedQty = Math.round(quantity * 1000) / 1000;
    const fees = Math.round(price * roundedQty * 0.001 * 100) / 100;
    const total = Math.round(price * roundedQty * 100) / 100;
    const venueIdx = i < 8 ? 0 : i < 13 ? 1 : i < 17 ? 2 : 3;
    const tradeType = tradeTypes[venueIdx];
    const timestamp = new Date(now - Math.round((sevenDays * (20 - i)) / 20)).toISOString();
    const settlementDate = new Date(
      now - Math.round((sevenDays * (20 - i)) / 20) + 2 * 24 * 60 * 60 * 1000,
    ).toISOString();
    trades.push({
      id: `TRD-${String(1000 + i)}`,
      timestamp,
      instrument,
      venue: venues[venueIdx],
      side,
      quantity: roundedQty,
      price,
      fees,
      total,
      status: statuses[i % statuses.length],
      counterparty: counterparties[i % counterparties.length],
      settlementDate,
      tradeType,
    });
  }
  return trades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const MOCK_TRADES = generateMockTrades();
