import {
  CRYPTO_VENUES,
  TRADFI_VENUES,
  DEFI_VENUES,
  type MarketsAssetClass,
} from "@/lib/config/services/markets.config";
import type { LiveBookUpdate, OrderFlowEntry } from "@/lib/types/markets";

function venuesForAssetClass(assetClass: MarketsAssetClass): readonly string[] {
  if (assetClass === "crypto") return CRYPTO_VENUES;
  if (assetClass === "tradfi") return TRADFI_VENUES;
  return DEFI_VENUES;
}

export function generateLiveBookUpdates(
  range: "1d" | "1w" | "1m",
  assetClass: MarketsAssetClass,
  depth: number = 5,
): LiveBookUpdate[] {
  const updates: LiveBookUpdate[] = [];
  const count = range === "1d" ? 200 : range === "1w" ? 800 : 2000;
  const venues = venuesForAssetClass(assetClass);
  const basePrice = assetClass === "crypto" ? 67000 : assetClass === "tradfi" ? 450 : 1800;
  const tickSize = assetClass === "crypto" ? 0.01 : assetClass === "tradfi" ? 0.01 : 0.1;

  let seed = 12345;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const now = new Date("2026-03-18T12:00:00Z").getTime();
  const rangeMs =
    range === "1d" ? 24 * 60 * 60 * 1000 : range === "1w" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;

  let currentMid = basePrice;

  for (let i = 0; i < count; i++) {
    const exchangeTs = new Date(now - (i / count) * rangeMs);
    const delayMs = Math.floor(0.5 + rand() * 15);
    const localTs = new Date(exchangeTs.getTime() + delayMs);
    const isTrade = rand() > 0.7;
    const venue = venues[Math.floor(rand() * venues.length)];

    currentMid += (rand() - 0.48) * tickSize * 5;

    if (isTrade) {
      const isOwn = rand() > 0.92;
      const side = rand() > 0.5 ? "buy" : "sell";
      const aggressor = rand() > 0.5 ? "buyer" : "seller";
      const tradePrice = currentMid + (rand() - 0.5) * tickSize * 2;

      updates.push({
        id: `upd-${i}`,
        exchangeTime: exchangeTs.toISOString(),
        localTime: localTs.toISOString(),
        delayMs,
        updateType: "trade",
        trade: {
          price: Math.round(tradePrice * 100) / 100,
          size: Math.round((0.01 + rand() * 2) * 10000) / 10000,
          side,
          aggressor,
          isOwn,
          orderId: isOwn ? `ORD-${Math.floor(rand() * 100000)}` : undefined,
        },
        venue,
      });
    } else {
      const spread = tickSize * (1 + rand() * 3);
      const updatedBidLevel = Math.floor(rand() * depth);
      const updatedAskLevel = Math.floor(rand() * depth);

      const bidLevels = Array.from({ length: depth }, (_, j) => ({
        price: Math.round((currentMid - spread / 2 - j * tickSize) * 100) / 100,
        size: Math.round((5 + rand() * 100) * 1000) / 1000,
        updated: j === updatedBidLevel,
      }));

      const askLevels = Array.from({ length: depth }, (_, j) => ({
        price: Math.round((currentMid + spread / 2 + j * tickSize) * 100) / 100,
        size: Math.round((5 + rand() * 100) * 1000) / 1000,
        updated: j === updatedAskLevel,
      }));

      updates.push({
        id: `upd-${i}`,
        exchangeTime: exchangeTs.toISOString(),
        localTime: localTs.toISOString(),
        delayMs,
        updateType: "book",
        bidLevels,
        askLevels,
        venue,
      });
    }
  }

  return updates;
}

export function generateOrderFlowData(range: "1d" | "1w" | "1m", assetClass: MarketsAssetClass): OrderFlowEntry[] {
  const entries: OrderFlowEntry[] = [];
  const count = range === "1d" ? 100 : range === "1w" ? 500 : 1500;
  const venues = venuesForAssetClass(assetClass);
  const basePrice = assetClass === "crypto" ? 67000 : assetClass === "tradfi" ? 450 : 1800;

  let seed = 12345;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const now = new Date("2026-03-18T12:00:00Z").getTime();
  const rangeMs =
    range === "1d" ? 24 * 60 * 60 * 1000 : range === "1w" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const exchangeTs = new Date(now - rand() * rangeMs);
    const delayMs = Math.floor(0.5 + rand() * 15);
    const localTs = new Date(exchangeTs.getTime() + delayMs);
    const isTrade = rand() > 0.4;
    const side = rand() > 0.5 ? "buy" : "sell";
    const priceOffset = (rand() - 0.5) * basePrice * 0.003;
    const isOwn = rand() > 0.92;

    entries.push({
      id: `ord-${i}-${now}`,
      exchangeTime: exchangeTs.toISOString(),
      localTime: localTs.toISOString(),
      delayMs,
      type: isTrade ? "trade" : side === "buy" ? "bid" : "ask",
      side,
      price: Math.round((basePrice + priceOffset) * 100) / 100,
      size: Math.round((0.01 + rand() * 2) * 10000) / 10000,
      venue: venues[Math.floor(rand() * venues.length)] as string,
      isOwn,
      orderId: isOwn ? `ORD-${Math.floor(rand() * 100000)}` : undefined,
      aggressor: isTrade ? (rand() > 0.5 ? "buyer" : "seller") : undefined,
      level: !isTrade ? Math.floor(rand() * 5) + 1 : undefined,
    });
  }

  return entries.sort((a, b) => new Date(b.exchangeTime).getTime() - new Date(a.exchangeTime).getTime());
}
