interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

export function generateMockOrderBook(
  symbol: string,
  midPrice: number,
  tick: number = 0,
): { bids: OrderBookLevel[]; asks: OrderBookLevel[] } {
  const levels = 15;
  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];

  const tickSize = symbol.includes("BTC") ? 0.1 : symbol.includes("ETH") ? 0.01 : 0.01;
  const baseSpread = symbol.includes("BTC") ? 0.2 : symbol.includes("ETH") ? 0.05 : 0.02;

  const baseSeed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  let seedState = baseSeed + tick * 7919;
  const rand = () => {
    seedState = (seedState * 1103515245 + 12345) & 0x7fffffff;
    return (seedState % 1000) / 1000;
  };

  let bidCumulative = 0;
  let askCumulative = 0;

  const bestBid = midPrice - baseSpread / 2;
  const bestAsk = midPrice + baseSpread / 2;

  for (let i = 0; i < levels; i++) {
    const bidPrice = bestBid - tickSize * i - rand() * tickSize * 0.5;
    const bidSize = (0.1 + rand() * 0.3) * (1 + i * 0.3) * (symbol.includes("BTC") ? 1 : 10);
    bidCumulative += bidSize;
    bids.push({ price: bidPrice, size: bidSize, total: bidCumulative });

    const askPrice = bestAsk + tickSize * i + rand() * tickSize * 0.5;
    const askSize = (0.1 + rand() * 0.3) * (1 + i * 0.3) * (symbol.includes("BTC") ? 1 : 10);
    askCumulative += askSize;
    asks.push({ price: askPrice, size: askSize, total: askCumulative });
  }

  return { bids, asks };
}
