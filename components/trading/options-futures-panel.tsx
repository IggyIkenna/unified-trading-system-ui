"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { placeMockOrder } from "@/lib/api/mock-trade-ledger";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  Star,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  BarChart3,
  Grid3X3,
  Activity,
} from "lucide-react";

// ---------- Types ----------

type Asset = "BTC" | "ETH" | "SOL" | "AVAX";
type Settlement = "inverse" | "linear";
type Market = "deribit" | "okx" | "bybit";
type MainTab = "options" | "futures" | "strategies";
type TradeDirection = "buy" | "sell";
type OrderType = "limit" | "market" | "post-only" | "reduce-only";
type GreekSurface = "delta" | "gamma" | "vega" | "theta";
type StrategiesMode = "futures-spreads" | "options-combos";
type ComboType =
  | "vertical-spread"
  | "straddle"
  | "strangle"
  | "calendar"
  | "butterfly"
  | "risk-reversal";

interface ComboLeg {
  strike: number;
  type: "call" | "put";
  direction: "buy" | "sell";
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

interface OptionRow {
  strike: number;
  callBid: number;
  callAsk: number;
  callMark: number;
  callIvBid: number;
  callIvAsk: number;
  callDelta: number;
  callOi: number;
  callSize: number;
  putBid: number;
  putAsk: number;
  putMark: number;
  putIvBid: number;
  putIvAsk: number;
  putDelta: number;
  putOi: number;
  putSize: number;
}

interface FutureRow {
  contract: string;
  asset: Asset;
  settlement: string;
  markPrice: number;
  change24h: number;
  volume24h: number;
  openInterest: number;
  fundingRate: number | null;
  basis: number | null;
  isPerpetual: boolean;
  favourite: boolean;
}

interface SpreadCell {
  longLabel: string;
  shortLabel: string;
  spreadLabel: string;
  bid: number;
  ask: number;
  bidDepth: number;
  askDepth: number;
}

interface SelectedInstrument {
  name: string;
  type: "option" | "future" | "spread" | "combo";
  strike?: number;
  expiry?: string;
  putCall?: "C" | "P";
  price: number;
  lastPrice?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  iv?: number;
  // Spread-specific fields
  longLeg?: string;
  shortLeg?: string;
  spreadBid?: number;
  spreadAsk?: number;
  // Combo-specific fields
  legs?: ComboLeg[];
  comboType?: string;
  netDebit?: number;
}

// ---------- Constants ----------

const ASSETS: Asset[] = ["BTC", "ETH", "SOL", "AVAX"];

const SPOT_PRICES: Record<Asset, number> = {
  BTC: 71583,
  ETH: 3456,
  SOL: 187.4,
  AVAX: 42.15,
};

const IV_INDEX: Record<Asset, number> = {
  BTC: 50.9,
  ETH: 55.2,
  SOL: 72.1,
  AVAX: 68.4,
};

const EXPIRY_DATES = [
  "ALL",
  "24 MAR 26",
  "25 MAR 26",
  "26 MAR 26",
  "27 MAR 26",
  "03 APR 26",
  "10 APR 26",
  "24 APR 26",
  "29 MAY 26",
  "26 JUN 26",
  "25 SEP 26",
  "25 DEC 26",
] as const;

const EXPIRIES_WITH_POSITIONS = new Set(["26 JUN 26", "25 DEC 26"]);

const STRIKE_INCREMENTS: Record<Asset, number> = {
  BTC: 2000,
  ETH: 100,
  SOL: 10,
  AVAX: 5,
};

// ---------- Mock Data Generators ----------

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateStrikes(asset: Asset): number[] {
  const spot = SPOT_PRICES[asset];
  const inc = STRIKE_INCREMENTS[asset];
  const strikes: number[] = [];
  const low = Math.floor((spot * 0.8) / inc) * inc;
  const high = Math.ceil((spot * 1.2) / inc) * inc;
  for (let s = low; s <= high; s += inc) {
    strikes.push(s);
  }
  return strikes;
}

function generateOptionChain(asset: Asset, _expiry: string): OptionRow[] {
  const spot = SPOT_PRICES[asset];
  const strikes = generateStrikes(asset);
  const baseIv = IV_INDEX[asset];
  const timeToExpiry = 0.25; // ~3 months

  return strikes.map((strike, idx) => {
    const moneyness = (strike - spot) / spot;
    const absMoneyness = Math.abs(moneyness);

    // IV smile: higher for deep ITM/OTM
    const ivSmile = baseIv + absMoneyness * 30 + seededRandom(strike + 1) * 5;
    const ivBidOffset = 0.3 + absMoneyness * 0.5;
    const ivAskOffset = 0.3 + absMoneyness * 0.5;

    // Simplified Black-Scholes delta approximation
    const d1Approx = -moneyness / ((ivSmile / 100) * Math.sqrt(timeToExpiry));
    const callDelta = Math.max(
      0.01,
      Math.min(0.99, 0.5 + 0.4 * Math.tanh(d1Approx)),
    );
    const putDelta = callDelta - 1;

    // Mark price approximation (intrinsic + time value)
    const callIntrinsic = Math.max(0, spot - strike);
    const putIntrinsic = Math.max(0, strike - spot);
    const timeValue =
      spot *
      (ivSmile / 100) *
      Math.sqrt(timeToExpiry) *
      0.4 *
      (1 - absMoneyness * 0.5);
    const callMark = Math.max(
      callIntrinsic + timeValue * callDelta,
      spot * 0.001,
    );
    const putMark = Math.max(
      putIntrinsic + timeValue * (1 - callDelta),
      spot * 0.001,
    );

    // Spread: wider for OTM
    const spreadMultiplier = 1 + absMoneyness * 3;
    const callSpread = callMark * 0.02 * spreadMultiplier;
    const putSpread = putMark * 0.02 * spreadMultiplier;

    // OI: higher near ATM
    const oiBase = 25000 * (1 - absMoneyness * 2);
    const callOi = Math.max(
      500,
      Math.floor(oiBase + seededRandom(strike * 3) * 10000),
    );
    const putOi = Math.max(
      500,
      Math.floor(oiBase + seededRandom(strike * 7) * 10000),
    );

    return {
      strike,
      callBid: Math.max(0, callMark - callSpread),
      callAsk: callMark + callSpread,
      callMark,
      callIvBid: ivSmile - ivBidOffset,
      callIvAsk: ivSmile + ivAskOffset,
      callDelta,
      callOi,
      callSize: Math.floor(seededRandom(idx + 100) * 50),
      putBid: Math.max(0, putMark - putSpread),
      putAsk: putMark + putSpread,
      putMark,
      putIvBid: ivSmile - ivBidOffset,
      putIvAsk: ivSmile + ivAskOffset,
      putDelta,
      putOi,
      putSize: Math.floor(seededRandom(idx + 200) * 50),
    };
  });
}

function generateFuturesData(asset: Asset): FutureRow[] {
  const spot = SPOT_PRICES[asset];
  const settlement = asset === "BTC" || asset === "ETH" ? asset : "USDC";
  const rows: FutureRow[] = [];

  // Perpetual
  rows.push({
    contract: `${asset}-PERPETUAL`,
    asset,
    settlement,
    markPrice: spot + seededRandom(1) * spot * 0.001,
    change24h: (seededRandom(2) - 0.5) * 6,
    volume24h: 500_000_000 + seededRandom(3) * 1_000_000_000,
    openInterest: 200_000_000 + seededRandom(4) * 500_000_000,
    fundingRate: (seededRandom(5) - 0.45) * 0.03,
    basis: null,
    isPerpetual: true,
    favourite: false,
  });

  // Dated futures
  const quarters = ["26MAR26", "26JUN26", "25SEP26", "25DEC26", "26MAR27"];
  quarters.forEach((q, i) => {
    const basisBps = 3 + i * 2 + seededRandom(i + 10) * 4;
    rows.push({
      contract: `${asset}-${q}`,
      asset,
      settlement,
      markPrice: spot * (1 + basisBps / 100),
      change24h: (seededRandom(i + 20) - 0.5) * 5,
      volume24h: 50_000_000 + seededRandom(i + 30) * 200_000_000,
      openInterest: 30_000_000 + seededRandom(i + 40) * 150_000_000,
      fundingRate: null,
      basis: basisBps,
      isPerpetual: false,
      favourite: false,
    });
  });

  return rows;
}

// ---------- Futures Spreads Data ----------

const SPREAD_EXPIRIES = [
  "Perpetual",
  "27 MAR",
  "03 APR",
  "24 APR",
  "26 JUN",
  "25 SEP",
  "25 DEC",
] as const;

type SpreadAsset = "BTC" | "ETH";

function generateSpreadMatrix(asset: SpreadAsset): (SpreadCell | null)[][] {
  const spot = SPOT_PRICES[asset];
  // Mark prices per expiry (increasing contango)
  const marks = SPREAD_EXPIRIES.map(
    (_, i) => spot * (1 + i * 0.008 + seededRandom(i + 50) * 0.003),
  );

  const matrix: (SpreadCell | null)[][] = [];

  for (let longIdx = 0; longIdx < SPREAD_EXPIRIES.length; longIdx++) {
    const row: (SpreadCell | null)[] = [];
    for (let shortIdx = 0; shortIdx < SPREAD_EXPIRIES.length; shortIdx++) {
      if (shortIdx <= longIdx) {
        // Upper triangle + diagonal: invalid (long must be before short, or same)
        row.push(null);
      } else {
        const rawSpread = marks[shortIdx] - marks[longIdx];
        const halfWidth =
          Math.abs(rawSpread) * 0.02 +
          seededRandom(longIdx * 10 + shortIdx) * 2;
        const bid = rawSpread - halfWidth;
        const ask = rawSpread + halfWidth;
        const bidDepth = Math.floor(
          5 + seededRandom(longIdx * 7 + shortIdx * 3) * 40,
        );
        const askDepth = Math.floor(
          5 + seededRandom(longIdx * 11 + shortIdx * 5) * 40,
        );

        const longLabel =
          SPREAD_EXPIRIES[longIdx] === "Perpetual"
            ? "PERP"
            : SPREAD_EXPIRIES[longIdx];
        const shortLabel =
          SPREAD_EXPIRIES[shortIdx] === "Perpetual"
            ? "PERP"
            : SPREAD_EXPIRIES[shortIdx];

        row.push({
          longLabel,
          shortLabel,
          spreadLabel: `${shortLabel} \u2013 ${longLabel}`,
          bid,
          ask,
          bidDepth,
          askDepth,
        });
      }
    }
    matrix.push(row);
  }

  return matrix;
}

function formatUsd(value: number, decimals: number = 2): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  return `$${value.toFixed(decimals)}`;
}

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

// ---------- Vol Surface Data ----------

function generateVolSurface(asset: Asset): {
  strikes: number[];
  expiries: string[];
  ivs: number[][];
} {
  const spot = SPOT_PRICES[asset];
  const inc = STRIKE_INCREMENTS[asset];
  const baseIv = IV_INDEX[asset];

  const strikes = [
    Math.floor((spot * 0.85) / inc) * inc,
    Math.floor((spot * 0.9) / inc) * inc,
    Math.floor((spot * 0.95) / inc) * inc,
    Math.round(spot / inc) * inc,
    Math.ceil((spot * 1.05) / inc) * inc,
    Math.ceil((spot * 1.1) / inc) * inc,
  ];
  const expiries = ["1W", "1M", "3M", "6M", "1Y"];

  const ivs = strikes.map((strike) => {
    const moneyness = Math.abs((strike - spot) / spot);
    return expiries.map((_, eIdx) => {
      const termPremium = eIdx * 1.5;
      const smile = moneyness * 25;
      return baseIv + smile + termPremium + seededRandom(strike + eIdx) * 3;
    });
  });

  return { strikes, expiries, ivs };
}

function ivToColor(iv: number): string {
  const minIv = 40;
  const maxIv = 80;
  const ratio = Math.max(0, Math.min(1, (iv - minIv) / (maxIv - minIv)));
  // Blue (cold) to orange (warm)
  const r = Math.round(50 + ratio * 200);
  const g = Math.round(100 + (1 - Math.abs(ratio - 0.5) * 2) * 100);
  const b = Math.round(220 - ratio * 180);
  return `rgb(${r}, ${g}, ${b})`;
}

// ---------- Sub-components ----------

function InstrumentSelectorBar({
  asset,
  setAsset,
  settlement,
  setSettlement,
  market,
  setMarket,
}: {
  asset: Asset;
  setAsset: (a: Asset) => void;
  settlement: Settlement;
  setSettlement: (s: Settlement) => void;
  market: Market;
  setMarket: (m: Market) => void;
}) {
  const spot = SPOT_PRICES[asset];
  const iv = IV_INDEX[asset];

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/20 overflow-x-auto">
      {/* Asset segmented buttons */}
      <div className="flex items-center gap-0.5 rounded-lg border p-0.5 bg-muted/30">
        {ASSETS.map((a) => (
          <Button
            key={a}
            variant={asset === a ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-7 px-3 text-xs font-mono",
              asset === a && "shadow-sm",
            )}
            onClick={() => setAsset(a)}
          >
            {a}
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Settlement toggle */}
      <div className="flex items-center gap-0.5 rounded-lg border p-0.5 bg-muted/30">
        <Button
          variant={settlement === "inverse" ? "default" : "ghost"}
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={() => setSettlement("inverse")}
        >
          Inverse
        </Button>
        <Button
          variant={settlement === "linear" ? "default" : "ghost"}
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={() => setSettlement("linear")}
        >
          Linear
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Market dropdown */}
      <Select value={market} onValueChange={(v) => setMarket(v as Market)}>
        <SelectTrigger className="h-8 w-28 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="deribit">Deribit</SelectItem>
          <SelectItem value="okx">OKX</SelectItem>
          <SelectItem value="bybit">Bybit</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6" />

      {/* Spot price */}
      <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
        <span className="text-muted-foreground">Spot:</span>
        <span className="font-mono font-bold">
          {formatUsd(spot)} {asset}
        </span>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* IV Index */}
      <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
        <Activity className="size-3 text-muted-foreground" />
        <span className="font-mono font-medium">IV: {iv.toFixed(1)}%</span>
        <span className="text-[10px] text-muted-foreground">
          (VoV: {(iv * 0.15).toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}

function OptionsChainTab({
  asset,
  onSelectInstrument,
}: {
  asset: Asset;
  onSelectInstrument: (inst: SelectedInstrument) => void;
}) {
  const [selectedExpiry, setSelectedExpiry] = React.useState("26 JUN 26");
  const [aroundAtm, setAroundAtm] = React.useState(false);
  const [showExpectedMove, setShowExpectedMove] = React.useState(false);
  const [displayUsd, setDisplayUsd] = React.useState(true);

  const spot = SPOT_PRICES[asset];
  const chain = React.useMemo(
    () => generateOptionChain(asset, selectedExpiry),
    [asset, selectedExpiry],
  );

  const filteredChain = aroundAtm
    ? chain.filter((row) => Math.abs(row.strike - spot) / spot < 0.08)
    : chain;

  // Expected move bounds (1-sigma)
  const iv = IV_INDEX[asset];
  const sigma1 = spot * (iv / 100) * Math.sqrt(94 / 365);
  const moveUpper = spot + sigma1;
  const moveLower = spot - sigma1;

  const handleCellClick = (
    row: OptionRow,
    side: "C" | "P",
    useAsk: boolean,
  ) => {
    const price =
      side === "C"
        ? useAsk
          ? row.callAsk
          : row.callBid
        : useAsk
          ? row.putAsk
          : row.putBid;
    const delta = side === "C" ? row.callDelta : row.putDelta;
    const mark = side === "C" ? row.callMark : row.putMark;

    onSelectInstrument({
      name: `${asset}-${selectedExpiry.replace(/ /g, "")}-${row.strike}-${side}`,
      type: "option",
      strike: row.strike,
      expiry: selectedExpiry,
      putCall: side,
      price,
      delta,
      gamma: 0.003 + seededRandom(row.strike) * 0.005,
      theta: -(8 + seededRandom(row.strike + 1) * 15),
      vega: 0.1 + seededRandom(row.strike + 2) * 0.2,
      iv:
        side === "C"
          ? (row.callIvBid + row.callIvAsk) / 2
          : (row.putIvBid + row.putIvAsk) / 2,
    });
  };

  const closestAtmStrike = chain.reduce((prev, curr) =>
    Math.abs(curr.strike - spot) < Math.abs(prev.strike - spot) ? curr : prev,
  ).strike;

  return (
    <div className="space-y-3">
      {/* Expiry strip */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-muted-foreground">
            Underlying future:{" "}
            <span className="font-mono font-medium text-foreground">
              {formatUsd(spot + spot * 0.001, 2)}
            </span>
          </span>
          <span className="text-muted-foreground">
            Time to Expiry:{" "}
            <span className="font-mono text-foreground">94d 18h 13m</span>
            <span className="text-[10px] ml-1">(Quarterly)</span>
          </span>
        </div>
        <ScrollArea className="w-full">
          <div className="flex items-center gap-1 pb-2">
            {EXPIRY_DATES.map((exp) => (
              <Button
                key={exp}
                variant={selectedExpiry === exp ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 px-2.5 text-[10px] font-mono whitespace-nowrap shrink-0",
                  selectedExpiry === exp && "shadow-sm",
                )}
                onClick={() => setSelectedExpiry(exp)}
              >
                {exp}
                {EXPIRIES_WITH_POSITIONS.has(exp) && (
                  <Badge
                    variant="secondary"
                    className="ml-1 text-[8px] px-1 py-0 h-3.5"
                  >
                    POS
                  </Badge>
                )}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Filter toolbar */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex items-center gap-1.5">
          <Checkbox
            id="around-atm"
            checked={aroundAtm}
            onCheckedChange={(c) => setAroundAtm(c === true)}
          />
          <label
            htmlFor="around-atm"
            className="text-xs text-muted-foreground cursor-pointer"
          >
            Around ATM
          </label>
        </div>
        <div className="flex items-center gap-1.5">
          <Checkbox
            id="expected-move"
            checked={showExpectedMove}
            onCheckedChange={(c) => setShowExpectedMove(c === true)}
          />
          <label
            htmlFor="expected-move"
            className="text-xs text-muted-foreground cursor-pointer"
          >
            Expected move
          </label>
        </div>
        <div className="flex items-center gap-0.5 rounded-md border p-0.5 bg-muted/30">
          <Button
            variant={displayUsd ? "default" : "ghost"}
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={() => setDisplayUsd(true)}
          >
            USD
          </Button>
          <Button
            variant={!displayUsd ? "default" : "ghost"}
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={() => setDisplayUsd(false)}
          >
            Coin
          </Button>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
          <Download className="size-3" />
          CSV
        </Button>
      </div>

      {/* Options chain table */}
      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="w-full">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b bg-muted/40">
                <th
                  colSpan={6}
                  className="text-center text-xs font-semibold py-1.5 text-emerald-400 border-r"
                >
                  CALLS
                </th>
                <th className="text-center text-xs font-semibold py-1.5 px-3 border-x bg-muted/60">
                  STRIKE
                </th>
                <th
                  colSpan={6}
                  className="text-center text-xs font-semibold py-1.5 text-rose-400 border-l"
                >
                  PUTS
                </th>
              </tr>
              <tr className="border-b bg-muted/20 text-muted-foreground">
                <th className="py-1 px-1.5 text-right font-normal">OI</th>
                <th className="py-1 px-1.5 text-right font-normal">Delta</th>
                <th className="py-1 px-1.5 text-right font-normal">Size</th>
                <th className="py-1 px-1.5 text-right font-normal">IV</th>
                <th className="py-1 px-1.5 text-right font-normal">Bid</th>
                <th className="py-1 px-1.5 text-right font-normal border-r">
                  Mark
                </th>
                <th className="py-1 px-3 text-center font-semibold text-foreground border-x bg-muted/40" />
                <th className="py-1 px-1.5 text-left font-normal border-l">
                  Mark
                </th>
                <th className="py-1 px-1.5 text-left font-normal">Ask</th>
                <th className="py-1 px-1.5 text-left font-normal">IV</th>
                <th className="py-1 px-1.5 text-left font-normal">Delta</th>
                <th className="py-1 px-1.5 text-left font-normal">OI</th>
              </tr>
            </thead>
            <tbody>
              {filteredChain.map((row) => {
                const isAtm = row.strike === closestAtmStrike;
                const callItm = row.strike < spot;
                const putItm = row.strike > spot;
                const inExpectedMove =
                  showExpectedMove &&
                  row.strike >= moveLower &&
                  row.strike <= moveUpper;
                const coinDivisor = displayUsd ? 1 : spot;

                return (
                  <tr
                    key={row.strike}
                    className={cn(
                      "border-b hover:bg-muted/30 transition-colors cursor-pointer",
                      isAtm && "bg-amber-500/10 border-amber-500/30",
                      inExpectedMove && !isAtm && "bg-blue-500/5",
                    )}
                  >
                    {/* Calls side */}
                    <td
                      className={cn(
                        "py-1 px-1.5 text-right font-mono",
                        callItm && "bg-emerald-500/5",
                      )}
                      onClick={() => handleCellClick(row, "C", false)}
                    >
                      {formatCompact(row.callOi)}
                    </td>
                    <td
                      className={cn(
                        "py-1 px-1.5 text-right font-mono",
                        callItm && "bg-emerald-500/5",
                      )}
                      onClick={() => handleCellClick(row, "C", false)}
                    >
                      <span
                        className={cn(
                          row.callDelta > 0.7
                            ? "text-emerald-500"
                            : row.callDelta > 0.3
                              ? "text-emerald-400/70"
                              : "text-muted-foreground",
                        )}
                      >
                        {row.callDelta.toFixed(2)}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "py-1 px-1.5 text-right font-mono text-muted-foreground",
                        callItm && "bg-emerald-500/5",
                      )}
                      onClick={() => handleCellClick(row, "C", false)}
                    >
                      {row.callSize}
                    </td>
                    <td
                      className={cn(
                        "py-1 px-1.5 text-right font-mono text-muted-foreground",
                        callItm && "bg-emerald-500/5",
                      )}
                      onClick={() => handleCellClick(row, "C", false)}
                    >
                      {row.callIvBid.toFixed(1)}%
                    </td>
                    <td
                      className={cn(
                        "py-1 px-1.5 text-right font-mono font-medium text-emerald-400",
                        callItm && "bg-emerald-500/5",
                      )}
                      onClick={() => handleCellClick(row, "C", false)}
                    >
                      {displayUsd
                        ? formatUsd(row.callBid)
                        : (row.callBid / coinDivisor).toFixed(4)}
                    </td>
                    <td
                      className={cn(
                        "py-1 px-1.5 text-right font-mono border-r",
                        callItm && "bg-emerald-500/5",
                      )}
                      onClick={() => handleCellClick(row, "C", true)}
                    >
                      {displayUsd
                        ? formatUsd(row.callMark)
                        : (row.callMark / coinDivisor).toFixed(4)}
                    </td>

                    {/* Strike centre */}
                    <td
                      className={cn(
                        "py-1 px-3 text-center font-mono font-bold border-x bg-muted/20",
                        isAtm && "text-amber-400",
                      )}
                    >
                      {row.strike.toLocaleString()}
                      {isAtm && (
                        <span className="text-[8px] ml-1 text-amber-400/70">
                          ATM
                        </span>
                      )}
                    </td>

                    {/* Puts side */}
                    <td
                      className={cn(
                        "py-1 px-1.5 text-left font-mono border-l",
                        putItm && "bg-rose-500/5",
                      )}
                      onClick={() => handleCellClick(row, "P", false)}
                    >
                      {displayUsd
                        ? formatUsd(row.putMark)
                        : (row.putMark / coinDivisor).toFixed(4)}
                    </td>
                    <td
                      className={cn(
                        "py-1 px-1.5 text-left font-mono font-medium text-rose-400",
                        putItm && "bg-rose-500/5",
                      )}
                      onClick={() => handleCellClick(row, "P", true)}
                    >
                      {displayUsd
                        ? formatUsd(row.putAsk)
                        : (row.putAsk / coinDivisor).toFixed(4)}
                    </td>
                    <td
                      className={cn(
                        "py-1 px-1.5 text-left font-mono text-muted-foreground",
                        putItm && "bg-rose-500/5",
                      )}
                      onClick={() => handleCellClick(row, "P", true)}
                    >
                      {row.putIvAsk.toFixed(1)}%
                    </td>
                    <td
                      className={cn(
                        "py-1 px-1.5 text-left font-mono",
                        putItm && "bg-rose-500/5",
                      )}
                      onClick={() => handleCellClick(row, "P", true)}
                    >
                      <span
                        className={cn(
                          row.putDelta < -0.7
                            ? "text-rose-500"
                            : row.putDelta < -0.3
                              ? "text-rose-400/70"
                              : "text-muted-foreground",
                        )}
                      >
                        {row.putDelta.toFixed(2)}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "py-1 px-1.5 text-left font-mono",
                        putItm && "bg-rose-500/5",
                      )}
                      onClick={() => handleCellClick(row, "P", true)}
                    >
                      {formatCompact(row.putOi)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}

function FuturesTab({
  asset,
  onSelectInstrument,
}: {
  asset: Asset;
  onSelectInstrument: (inst: SelectedInstrument) => void;
}) {
  const [filter, setFilter] = React.useState("all");
  const [assetFilter, setAssetFilter] = React.useState<"all" | Asset>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [favourites, setFavourites] = React.useState<Set<string>>(new Set());

  const allFutures = React.useMemo(() => {
    const rows: FutureRow[] = [];
    const assets = assetFilter === "all" ? ASSETS : [assetFilter];
    for (const a of assets) {
      rows.push(...generateFuturesData(a));
    }
    return rows;
  }, [assetFilter]);

  const filteredFutures = allFutures.filter((f) => {
    if (filter === "perpetuals" && !f.isPerpetual) return false;
    if (
      filter !== "all" &&
      filter !== "perpetuals" &&
      !f.contract.includes(filter.replace(/ /g, ""))
    )
      return false;
    if (
      searchQuery &&
      !f.contract.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const toggleFavourite = (contract: string) => {
    setFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(contract)) next.delete(contract);
      else next.add(contract);
      return next;
    });
  };

  const handleRowClick = (row: FutureRow) => {
    onSelectInstrument({
      name: row.contract,
      type: "future",
      price: row.markPrice,
    });
  };

  return (
    <div className="space-y-3">
      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <ScrollArea className="flex-1">
          <div className="flex items-center gap-1">
            {["all", "perpetuals", ...EXPIRY_DATES.slice(1, 6)].map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                className="h-7 px-2.5 text-[10px] font-mono whitespace-nowrap shrink-0"
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : f === "perpetuals" ? "Perpetuals" : f}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Asset filter + search */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg border p-0.5 bg-muted/30">
          <Button
            variant={assetFilter === "all" ? "default" : "ghost"}
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={() => setAssetFilter("all")}
          >
            All
          </Button>
          {ASSETS.map((a) => (
            <Button
              key={a}
              variant={assetFilter === a ? "default" : "ghost"}
              size="sm"
              className="h-6 px-2 text-[10px] font-mono"
              onClick={() => setAssetFilter(a)}
            >
              {a}
            </Button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="relative">
          <Search className="size-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 w-40 text-xs"
          />
        </div>
      </div>

      {/* Futures table */}
      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="w-full">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th className="py-1.5 px-1.5 text-center w-8 font-normal" />
                <th className="py-1.5 px-2 text-left font-normal">Contract</th>
                <th className="py-1.5 px-2 text-left font-normal">
                  Settlement
                </th>
                <th className="py-1.5 px-2 text-right font-normal">
                  Mark Price
                </th>
                <th className="py-1.5 px-2 text-right font-normal">24h %</th>
                <th className="py-1.5 px-2 text-right font-normal">
                  24h Volume
                </th>
                <th className="py-1.5 px-2 text-right font-normal">
                  Open Interest
                </th>
                <th className="py-1.5 px-2 text-right font-normal">Funding</th>
                <th className="py-1.5 px-2 text-right font-normal">Basis%</th>
              </tr>
            </thead>
            <tbody>
              {filteredFutures.map((row) => (
                <tr
                  key={row.contract}
                  className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(row)}
                >
                  <td className="py-1.5 px-1.5 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavourite(row.contract);
                      }}
                    >
                      <Star
                        className={cn(
                          "size-3",
                          favourites.has(row.contract)
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground",
                        )}
                      />
                    </Button>
                  </td>
                  <td className="py-1.5 px-2 font-mono font-medium">
                    {row.contract}
                    {row.isPerpetual && (
                      <Badge
                        variant="outline"
                        className="ml-1.5 text-[8px] px-1 py-0 h-3.5"
                      >
                        PERP
                      </Badge>
                    )}
                  </td>
                  <td className="py-1.5 px-2 font-mono text-muted-foreground">
                    {row.settlement}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono">
                    {formatUsd(row.markPrice)}
                  </td>
                  <td
                    className={cn(
                      "py-1.5 px-2 text-right font-mono font-medium",
                      row.change24h >= 0 ? "text-emerald-400" : "text-rose-400",
                    )}
                  >
                    {row.change24h >= 0 ? "+" : ""}
                    {row.change24h.toFixed(2)}%
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">
                    {formatUsd(row.volume24h)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">
                    {formatUsd(row.openInterest)}
                  </td>
                  <td
                    className={cn(
                      "py-1.5 px-2 text-right font-mono",
                      row.fundingRate !== null
                        ? row.fundingRate >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {row.fundingRate !== null
                      ? `${row.fundingRate >= 0 ? "+" : ""}${(row.fundingRate * 100).toFixed(4)}%`
                      : "--"}
                  </td>
                  <td
                    className={cn(
                      "py-1.5 px-2 text-right font-mono",
                      row.basis !== null
                        ? "text-blue-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {row.basis !== null ? `${row.basis.toFixed(2)}%` : "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}

function FuturesSpreadsTab({
  onSelectInstrument,
}: {
  onSelectInstrument: (inst: SelectedInstrument) => void;
}) {
  const [spreadAsset, setSpreadAsset] = React.useState<SpreadAsset>("BTC");

  const matrix = React.useMemo(
    () => generateSpreadMatrix(spreadAsset),
    [spreadAsset],
  );

  const handleCellClick = (cell: SpreadCell) => {
    const longContract = `${spreadAsset}-${cell.longLabel.replace(/ /g, "")}`;
    const shortContract = `${spreadAsset}-${cell.shortLabel.replace(/ /g, "")}`;
    onSelectInstrument({
      name: `Long: ${longContract} / Short: ${shortContract}`,
      type: "spread",
      price: (cell.bid + cell.ask) / 2,
      longLeg: longContract,
      shortLeg: shortContract,
      spreadBid: cell.bid,
      spreadAsk: cell.ask,
    });
  };

  return (
    <div className="space-y-3">
      {/* Asset selector pills */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Asset:</span>
        <div className="flex items-center gap-0.5 rounded-lg border p-0.5 bg-muted/30">
          {(["BTC", "ETH"] as const).map((a) => (
            <Button
              key={a}
              variant={spreadAsset === a ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs font-mono"
              onClick={() => setSpreadAsset(a)}
            >
              {a}
            </Button>
          ))}
        </div>
      </div>

      {/* Calendar spread matrix */}
      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="w-full">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  Long Leg &darr; / Short Leg &rarr;
                </th>
                {SPREAD_EXPIRIES.map((exp) => (
                  <th
                    key={exp}
                    className="py-2 px-2 text-center font-mono font-medium text-xs whitespace-nowrap"
                  >
                    {exp === "Perpetual" ? "PERP" : exp}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SPREAD_EXPIRIES.map((longExp, longIdx) => (
                <tr key={longExp} className="border-b">
                  <td className="py-2 px-2 font-mono font-medium text-xs whitespace-nowrap bg-muted/20">
                    {longExp === "Perpetual" ? "PERP" : longExp}
                  </td>
                  {SPREAD_EXPIRIES.map((_, shortIdx) => {
                    const cell = matrix[longIdx][shortIdx];
                    if (!cell) {
                      return (
                        <td
                          key={shortIdx}
                          className={cn(
                            "py-2 px-2 text-center",
                            shortIdx === longIdx
                              ? "bg-muted/40"
                              : "bg-muted/15",
                          )}
                        >
                          {shortIdx === longIdx ? (
                            <span className="text-muted-foreground/40">
                              &mdash;
                            </span>
                          ) : null}
                        </td>
                      );
                    }
                    return (
                      <td
                        key={shortIdx}
                        className="py-1 px-1.5 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => handleCellClick(cell)}
                      >
                        <div className="rounded border bg-card/80 p-1.5 min-w-[90px] space-y-0.5">
                          <p className="text-[9px] text-muted-foreground font-medium truncate">
                            {cell.spreadLabel}
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono text-emerald-400 font-medium">
                              {cell.bid >= 0 ? "+" : ""}
                              {cell.bid.toFixed(1)}
                            </span>
                            <span className="font-mono text-muted-foreground">
                              {cell.ask >= 0 ? "+" : ""}
                              {cell.ask.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-2 text-[8px] text-muted-foreground/60">
                            <span>{cell.bidDepth} bid</span>
                            <span>{cell.askDepth} ask</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <p className="text-[10px] text-muted-foreground px-1">
        Click a cell to pre-fill a two-legged spread order in the Trade Panel.
        Values show net spread (far mark - near mark). Green = bid, grey = ask.
      </p>
    </div>
  );
}

// ---------- Options Combos ----------

const COMBO_TYPES: { value: ComboType; label: string }[] = [
  { value: "vertical-spread", label: "Vertical Spread" },
  { value: "straddle", label: "Straddle" },
  { value: "strangle", label: "Strangle" },
  { value: "calendar", label: "Calendar" },
  { value: "butterfly", label: "Butterfly" },
  { value: "risk-reversal", label: "Risk Reversal" },
];

const CALENDAR_EXPIRIES = [
  "26 JUN 26",
  "25 SEP 26",
  "25 DEC 26",
  "26 MAR 27",
  "26 JUN 27",
  "25 SEP 27",
] as const;

function OptionsCombosPanel({
  asset,
  onSelectInstrument,
}: {
  asset: Asset;
  onSelectInstrument: (inst: SelectedInstrument) => void;
}) {
  const [comboType, setComboType] =
    React.useState<ComboType>("vertical-spread");
  const spot = SPOT_PRICES[asset];
  const strikes = React.useMemo(() => generateStrikes(asset), [asset]);
  const chain = React.useMemo(
    () => generateOptionChain(asset, "26 JUN 26"),
    [asset],
  );
  const inc = STRIKE_INCREMENTS[asset];

  // Map strike -> OptionRow for quick lookup
  const chainMap = React.useMemo(() => {
    const m = new Map<number, OptionRow>();
    for (const row of chain) {
      m.set(row.strike, row);
    }
    return m;
  }, [chain]);

  const closestAtmStrike = strikes.reduce((prev, curr) =>
    Math.abs(curr - spot) < Math.abs(prev - spot) ? curr : prev,
  );
  const atmIdx = strikes.indexOf(closestAtmStrike);

  // Strikes above and below ATM for directional combos
  const strikesAboveAtm = strikes.filter((s) => s > closestAtmStrike);
  const strikesBelowAtm = strikes.filter((s) => s < closestAtmStrike);

  // Wing widths for butterfly
  const wingWidths = [1, 2, 3, 4, 5].map((n) => n * inc);

  const getGreeks = (strike: number, side: "call" | "put") => {
    const row = chainMap.get(strike);
    if (!row) {
      return { price: 0, delta: 0, gamma: 0, theta: 0, vega: 0 };
    }
    if (side === "call") {
      return {
        price: row.callMark,
        delta: row.callDelta,
        gamma: 0.003 + seededRandom(strike) * 0.005,
        theta: -(8 + seededRandom(strike + 1) * 15),
        vega: 0.1 + seededRandom(strike + 2) * 0.2,
      };
    }
    return {
      price: row.putMark,
      delta: row.putDelta,
      gamma: 0.003 + seededRandom(strike + 10) * 0.005,
      theta: -(8 + seededRandom(strike + 11) * 15),
      vega: 0.1 + seededRandom(strike + 12) * 0.2,
    };
  };

  const buildComboInstrument = (
    label: string,
    legs: ComboLeg[],
    type: string,
    netDebit: number,
  ): SelectedInstrument => ({
    name: label,
    type: "combo",
    price: Math.abs(netDebit),
    delta: legs.reduce(
      (s, l) => s + l.delta * (l.direction === "buy" ? 1 : -1),
      0,
    ),
    gamma: legs.reduce(
      (s, l) => s + l.gamma * (l.direction === "buy" ? 1 : -1),
      0,
    ),
    theta: legs.reduce(
      (s, l) => s + l.theta * (l.direction === "buy" ? 1 : -1),
      0,
    ),
    vega: legs.reduce(
      (s, l) => s + l.vega * (l.direction === "buy" ? 1 : -1),
      0,
    ),
    legs,
    comboType: type,
    netDebit,
  });

  // --- Vertical Spread ---
  if (comboType === "vertical-spread") {
    return (
      <div className="space-y-3">
        <ComboTypePills comboType={comboType} setComboType={setComboType} />
        <p className="text-[10px] text-muted-foreground px-1">
          Bull call spread: BUY lower strike call, SELL higher strike call (same
          expiry). Lower triangle shows valid combinations. Click a cell to
          trade.
        </p>
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="w-full">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Long &darr; / Short &rarr;
                  </th>
                  {strikes.map((s) => (
                    <th
                      key={s}
                      className="py-2 px-1.5 text-center font-mono font-medium text-[10px] whitespace-nowrap"
                    >
                      {s.toLocaleString()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {strikes.map((longStrike, lIdx) => (
                  <tr key={longStrike} className="border-b">
                    <td className="py-2 px-2 font-mono font-medium text-[10px] whitespace-nowrap bg-muted/20">
                      {longStrike.toLocaleString()}
                    </td>
                    {strikes.map((shortStrike, sIdx) => {
                      if (sIdx <= lIdx) {
                        return (
                          <td
                            key={sIdx}
                            className={cn(
                              "py-1.5 px-1 text-center",
                              sIdx === lIdx ? "bg-muted/40" : "bg-muted/15",
                            )}
                          >
                            {sIdx === lIdx ? (
                              <span className="text-muted-foreground/40">
                                &mdash;
                              </span>
                            ) : null}
                          </td>
                        );
                      }
                      const longG = getGreeks(longStrike, "call");
                      const shortG = getGreeks(shortStrike, "call");
                      const netDebit = longG.price - shortG.price;
                      const spread =
                        Math.abs(netDebit) * 0.02 +
                        seededRandom(longStrike + shortStrike) * 2;
                      const legs: ComboLeg[] = [
                        {
                          strike: longStrike,
                          type: "call",
                          direction: "buy",
                          ...longG,
                        },
                        {
                          strike: shortStrike,
                          type: "call",
                          direction: "sell",
                          ...shortG,
                        },
                      ];

                      return (
                        <td
                          key={sIdx}
                          className="py-1 px-1 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => {
                            const label = `BUY ${asset}-26JUN26-${longStrike}-C / SELL ${asset}-26JUN26-${shortStrike}-C`;
                            onSelectInstrument(
                              buildComboInstrument(
                                label,
                                legs,
                                "Vertical Spread",
                                netDebit,
                              ),
                            );
                          }}
                        >
                          <div className="rounded border bg-card/80 p-1 min-w-[80px] space-y-0.5">
                            <div className="flex items-center justify-center gap-1.5">
                              <span
                                className={cn(
                                  "font-mono font-medium",
                                  netDebit > 0
                                    ? "text-rose-400"
                                    : "text-emerald-400",
                                )}
                              >
                                {formatUsd(Math.abs(netDebit - spread), 1)}
                              </span>
                              <span className="font-mono text-muted-foreground">
                                {formatUsd(Math.abs(netDebit + spread), 1)}
                              </span>
                            </div>
                            <p className="text-[8px] text-muted-foreground/60 truncate">
                              {netDebit > 0 ? "Debit" : "Credit"}
                            </p>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    );
  }

  // --- Straddle (list/table, not matrix) ---
  if (comboType === "straddle") {
    const straddleStrikes = strikes.slice(
      Math.max(0, atmIdx - 5),
      Math.min(strikes.length, atmIdx + 6),
    );

    return (
      <div className="space-y-3">
        <ComboTypePills comboType={comboType} setComboType={setComboType} />
        <p className="text-[10px] text-muted-foreground px-1">
          Buy call + buy put at the same strike. Click a row to trade.
        </p>
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="w-full">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground">
                  <th className="py-1.5 px-2 text-right font-normal">Strike</th>
                  <th className="py-1.5 px-2 text-right font-normal">
                    Call Price
                  </th>
                  <th className="py-1.5 px-2 text-right font-normal">
                    Put Price
                  </th>
                  <th className="py-1.5 px-2 text-right font-normal">
                    Net Cost
                  </th>
                  <th className="py-1.5 px-2 text-right font-normal">
                    Combined IV
                  </th>
                  <th className="py-1.5 px-2 text-right font-normal">
                    Net Delta
                  </th>
                </tr>
              </thead>
              <tbody>
                {straddleStrikes.map((strike) => {
                  const callG = getGreeks(strike, "call");
                  const putG = getGreeks(strike, "put");
                  const netCost = callG.price + putG.price;
                  const row = chainMap.get(strike);
                  const combinedIv = row
                    ? (row.callIvBid +
                        row.callIvAsk +
                        row.putIvBid +
                        row.putIvAsk) /
                      4
                    : 0;
                  const netDelta = callG.delta + putG.delta;
                  const isAtm = strike === closestAtmStrike;
                  const legs: ComboLeg[] = [
                    { strike, type: "call", direction: "buy", ...callG },
                    { strike, type: "put", direction: "buy", ...putG },
                  ];

                  return (
                    <tr
                      key={strike}
                      className={cn(
                        "border-b hover:bg-muted/30 transition-colors cursor-pointer",
                        isAtm && "bg-amber-500/10 border-amber-500/30",
                      )}
                      onClick={() => {
                        const label = `BUY ${asset}-26JUN26-${strike}-C + BUY ${asset}-26JUN26-${strike}-P`;
                        onSelectInstrument(
                          buildComboInstrument(
                            label,
                            legs,
                            "Straddle",
                            netCost,
                          ),
                        );
                      }}
                    >
                      <td className="py-1.5 px-2 text-right font-mono font-medium">
                        {strike.toLocaleString()}
                        {isAtm && (
                          <span className="text-[8px] ml-1 text-amber-400/70">
                            ATM
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono">
                        {formatUsd(callG.price)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono">
                        {formatUsd(putG.price)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-medium text-rose-400">
                        {formatUsd(netCost)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">
                        {combinedIv.toFixed(1)}%
                      </td>
                      <td
                        className={cn(
                          "py-1.5 px-2 text-right font-mono",
                          netDelta >= 0 ? "text-emerald-400" : "text-rose-400",
                        )}
                      >
                        {netDelta >= 0 ? "+" : ""}
                        {netDelta.toFixed(3)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    );
  }

  // --- Strangle (OTM call + OTM put, full matrix) ---
  if (comboType === "strangle") {
    const callStrikes = strikesAboveAtm.slice(0, 8);
    const putStrikes = strikesBelowAtm.slice(-8);

    return (
      <div className="space-y-3">
        <ComboTypePills comboType={comboType} setComboType={setComboType} />
        <p className="text-[10px] text-muted-foreground px-1">
          Buy OTM call + buy OTM put at different strikes. Full matrix (any
          combination valid).
        </p>
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="w-full">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Call &darr; / Put &rarr;
                  </th>
                  {putStrikes.map((s) => (
                    <th
                      key={s}
                      className="py-2 px-1.5 text-center font-mono font-medium text-[10px] whitespace-nowrap"
                    >
                      {s.toLocaleString()}P
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {callStrikes.map((callStrike) => (
                  <tr key={callStrike} className="border-b">
                    <td className="py-2 px-2 font-mono font-medium text-[10px] whitespace-nowrap bg-muted/20">
                      {callStrike.toLocaleString()}C
                    </td>
                    {putStrikes.map((putStrike) => {
                      const callG = getGreeks(callStrike, "call");
                      const putG = getGreeks(putStrike, "put");
                      const netCost = callG.price + putG.price;
                      const legs: ComboLeg[] = [
                        {
                          strike: callStrike,
                          type: "call",
                          direction: "buy",
                          ...callG,
                        },
                        {
                          strike: putStrike,
                          type: "put",
                          direction: "buy",
                          ...putG,
                        },
                      ];

                      return (
                        <td
                          key={putStrike}
                          className="py-1 px-1 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => {
                            const label = `BUY ${asset}-26JUN26-${callStrike}-C + BUY ${asset}-26JUN26-${putStrike}-P`;
                            onSelectInstrument(
                              buildComboInstrument(
                                label,
                                legs,
                                "Strangle",
                                netCost,
                              ),
                            );
                          }}
                        >
                          <div className="rounded border bg-card/80 p-1 min-w-[70px] space-y-0.5">
                            <span className="font-mono font-medium text-rose-400">
                              {formatUsd(netCost, 1)}
                            </span>
                            <p className="text-[8px] text-muted-foreground/60">
                              Debit
                            </p>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    );
  }

  // --- Calendar Spread (same strike, different expiries) ---
  if (comboType === "calendar") {
    const calStrikes = strikes.slice(
      Math.max(0, atmIdx - 4),
      Math.min(strikes.length, atmIdx + 5),
    );

    return (
      <div className="space-y-3">
        <ComboTypePills comboType={comboType} setComboType={setComboType} />
        <p className="text-[10px] text-muted-foreground px-1">
          Long far-expiry call, short near-expiry call at the same strike. Net
          debit shown.
        </p>
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="w-full">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Strike &darr; / Expiry &rarr;
                  </th>
                  {CALENDAR_EXPIRIES.map((exp) => (
                    <th
                      key={exp}
                      className="py-2 px-1.5 text-center font-mono font-medium text-[10px] whitespace-nowrap"
                    >
                      {exp}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calStrikes.map((strike) => {
                  const isAtm = strike === closestAtmStrike;
                  const baseG = getGreeks(strike, "call");

                  return (
                    <tr
                      key={strike}
                      className={cn("border-b", isAtm && "bg-amber-500/10")}
                    >
                      <td className="py-2 px-2 font-mono font-medium text-[10px] whitespace-nowrap bg-muted/20">
                        {strike.toLocaleString()}
                        {isAtm && (
                          <span className="text-[8px] ml-1 text-amber-400/70">
                            ATM
                          </span>
                        )}
                      </td>
                      {CALENDAR_EXPIRIES.map((exp, eIdx) => {
                        // Near expiry is always first column; further expiries cost more
                        const timePremium = (eIdx + 1) * baseG.price * 0.08;
                        const farPrice = baseG.price + timePremium;
                        const nearPrice = baseG.price;
                        const netDebit = farPrice - nearPrice;
                        const legs: ComboLeg[] = [
                          {
                            strike,
                            type: "call",
                            direction: "buy",
                            price: farPrice,
                            delta: baseG.delta * 0.95,
                            gamma: baseG.gamma * 0.9,
                            theta: baseG.theta * 0.7,
                            vega: baseG.vega * 1.2,
                          },
                          {
                            strike,
                            type: "call",
                            direction: "sell",
                            price: nearPrice,
                            delta: baseG.delta,
                            gamma: baseG.gamma,
                            theta: baseG.theta,
                            vega: baseG.vega,
                          },
                        ];

                        return (
                          <td
                            key={exp}
                            className="py-1 px-1 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                            onClick={() => {
                              const label = `BUY ${asset}-${exp.replace(/ /g, "")}-${strike}-C / SELL ${asset}-26JUN26-${strike}-C`;
                              onSelectInstrument(
                                buildComboInstrument(
                                  label,
                                  legs,
                                  "Calendar Spread",
                                  netDebit,
                                ),
                              );
                            }}
                          >
                            <div className="rounded border bg-card/80 p-1 min-w-[70px] space-y-0.5">
                              <span className="font-mono font-medium text-rose-400">
                                {formatUsd(netDebit, 1)}
                              </span>
                              <p className="text-[8px] text-muted-foreground/60">
                                Debit
                              </p>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    );
  }

  // --- Butterfly (buy 1 lower, sell 2 middle, buy 1 upper) ---
  if (comboType === "butterfly") {
    const centerStrikes = strikes.slice(
      Math.max(0, atmIdx - 4),
      Math.min(strikes.length, atmIdx + 5),
    );

    return (
      <div className="space-y-3">
        <ComboTypePills comboType={comboType} setComboType={setComboType} />
        <p className="text-[10px] text-muted-foreground px-1">
          Buy 1 lower wing, sell 2 center, buy 1 upper wing. Net debit shown.
        </p>
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="w-full">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Center &darr; / Width &rarr;
                  </th>
                  {wingWidths.map((w) => (
                    <th
                      key={w}
                      className="py-2 px-1.5 text-center font-mono font-medium text-[10px] whitespace-nowrap"
                    >
                      {w.toLocaleString()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {centerStrikes.map((center) => {
                  const isAtm = center === closestAtmStrike;
                  return (
                    <tr
                      key={center}
                      className={cn("border-b", isAtm && "bg-amber-500/10")}
                    >
                      <td className="py-2 px-2 font-mono font-medium text-[10px] whitespace-nowrap bg-muted/20">
                        {center.toLocaleString()}
                        {isAtm && (
                          <span className="text-[8px] ml-1 text-amber-400/70">
                            ATM
                          </span>
                        )}
                      </td>
                      {wingWidths.map((width) => {
                        const lower = center - width;
                        const upper = center + width;
                        // Check that both wing strikes exist in the chain
                        const lowerG = getGreeks(lower, "call");
                        const centerG = getGreeks(center, "call");
                        const upperG = getGreeks(upper, "call");
                        const hasData =
                          chainMap.has(lower) && chainMap.has(upper);

                        if (!hasData) {
                          return (
                            <td
                              key={width}
                              className="py-1.5 px-1 text-center bg-muted/15"
                            >
                              <span className="text-muted-foreground/40 text-[9px]">
                                N/A
                              </span>
                            </td>
                          );
                        }

                        const netDebit =
                          lowerG.price - 2 * centerG.price + upperG.price;
                        const legs: ComboLeg[] = [
                          {
                            strike: lower,
                            type: "call",
                            direction: "buy",
                            ...lowerG,
                          },
                          {
                            strike: center,
                            type: "call",
                            direction: "sell",
                            price: centerG.price,
                            delta: centerG.delta * -2,
                            gamma: centerG.gamma * -2,
                            theta: centerG.theta * -2,
                            vega: centerG.vega * -2,
                          },
                          {
                            strike: upper,
                            type: "call",
                            direction: "buy",
                            ...upperG,
                          },
                        ];
                        // Fix center leg: direction=sell but we store raw greeks; sign handled in buildComboInstrument
                        legs[1] = {
                          strike: center,
                          type: "call",
                          direction: "sell",
                          price: centerG.price,
                          delta: centerG.delta,
                          gamma: centerG.gamma,
                          theta: centerG.theta,
                          vega: centerG.vega,
                        };

                        // Sell 2x center: duplicate the sell leg
                        const allLegs: ComboLeg[] = [
                          {
                            strike: lower,
                            type: "call",
                            direction: "buy",
                            ...lowerG,
                          },
                          {
                            strike: center,
                            type: "call",
                            direction: "sell",
                            price: centerG.price,
                            delta: centerG.delta,
                            gamma: centerG.gamma,
                            theta: centerG.theta,
                            vega: centerG.vega,
                          },
                          {
                            strike: center,
                            type: "call",
                            direction: "sell",
                            price: centerG.price,
                            delta: centerG.delta,
                            gamma: centerG.gamma,
                            theta: centerG.theta,
                            vega: centerG.vega,
                          },
                          {
                            strike: upper,
                            type: "call",
                            direction: "buy",
                            ...upperG,
                          },
                        ];

                        return (
                          <td
                            key={width}
                            className="py-1 px-1 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                            onClick={() => {
                              const label = `BUY ${lower}C / SELL 2x${center}C / BUY ${upper}C`;
                              onSelectInstrument(
                                buildComboInstrument(
                                  label,
                                  allLegs,
                                  "Butterfly",
                                  netDebit,
                                ),
                              );
                            }}
                          >
                            <div className="rounded border bg-card/80 p-1 min-w-[70px] space-y-0.5">
                              <span
                                className={cn(
                                  "font-mono font-medium",
                                  netDebit > 0
                                    ? "text-rose-400"
                                    : "text-emerald-400",
                                )}
                              >
                                {formatUsd(Math.abs(netDebit), 1)}
                              </span>
                              <p className="text-[8px] text-muted-foreground/60">
                                {netDebit > 0 ? "Debit" : "Credit"}
                              </p>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    );
  }

  // --- Risk Reversal (sell OTM put, buy OTM call) ---
  // comboType === "risk-reversal"
  const rrCallStrikes = strikesAboveAtm.slice(0, 8);
  const rrPutStrikes = strikesBelowAtm.slice(-8);

  return (
    <div className="space-y-3">
      <ComboTypePills comboType={comboType} setComboType={setComboType} />
      <p className="text-[10px] text-muted-foreground px-1">
        Sell OTM put, buy OTM call. Net credit or debit shown.
      </p>
      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="w-full">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  Call &darr; / Put &rarr;
                </th>
                {rrPutStrikes.map((s) => (
                  <th
                    key={s}
                    className="py-2 px-1.5 text-center font-mono font-medium text-[10px] whitespace-nowrap"
                  >
                    {s.toLocaleString()}P
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rrCallStrikes.map((callStrike) => (
                <tr key={callStrike} className="border-b">
                  <td className="py-2 px-2 font-mono font-medium text-[10px] whitespace-nowrap bg-muted/20">
                    {callStrike.toLocaleString()}C
                  </td>
                  {rrPutStrikes.map((putStrike) => {
                    const callG = getGreeks(callStrike, "call");
                    const putG = getGreeks(putStrike, "put");
                    // Net = sell put premium - buy call premium
                    const netCredit = putG.price - callG.price;
                    const legs: ComboLeg[] = [
                      {
                        strike: callStrike,
                        type: "call",
                        direction: "buy",
                        ...callG,
                      },
                      {
                        strike: putStrike,
                        type: "put",
                        direction: "sell",
                        ...putG,
                      },
                    ];

                    return (
                      <td
                        key={putStrike}
                        className="py-1 px-1 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => {
                          const label = `BUY ${asset}-26JUN26-${callStrike}-C / SELL ${asset}-26JUN26-${putStrike}-P`;
                          onSelectInstrument(
                            buildComboInstrument(
                              label,
                              legs,
                              "Risk Reversal",
                              -netCredit,
                            ),
                          );
                        }}
                      >
                        <div className="rounded border bg-card/80 p-1 min-w-[70px] space-y-0.5">
                          <span
                            className={cn(
                              "font-mono font-medium",
                              netCredit >= 0
                                ? "text-emerald-400"
                                : "text-rose-400",
                            )}
                          >
                            {formatUsd(Math.abs(netCredit), 1)}
                          </span>
                          <p className="text-[8px] text-muted-foreground/60">
                            {netCredit >= 0 ? "Credit" : "Debit"}
                          </p>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}

function ComboTypePills({
  comboType,
  setComboType,
}: {
  comboType: ComboType;
  setComboType: (ct: ComboType) => void;
}) {
  return (
    <ScrollArea className="w-full">
      <div className="flex items-center gap-1 pb-1">
        {COMBO_TYPES.map((ct) => (
          <Button
            key={ct.value}
            variant={comboType === ct.value ? "default" : "outline"}
            size="sm"
            className="h-7 px-2.5 text-[10px] whitespace-nowrap shrink-0"
            onClick={() => setComboType(ct.value)}
          >
            {ct.label}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

function TradePanel({ instrument }: { instrument: SelectedInstrument | null }) {
  const [direction, setDirection] = React.useState<TradeDirection>("buy");
  const [orderType, setOrderType] = React.useState<OrderType>("limit");
  const [price, setPrice] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [leverage, setLeverage] = React.useState([10]);

  // Sync price when instrument changes
  React.useEffect(() => {
    if (instrument) {
      setPrice(instrument.price.toFixed(2));
    }
  }, [instrument]);

  const amountNum = parseFloat(amount) || 0;
  const priceNum = parseFloat(price) || 0;
  const leverageVal = leverage[0];

  // Futures liquidation price: price * (1 - 1/leverage) for longs, price * (1 + 1/leverage) for shorts
  const liqPrice =
    instrument?.type === "future" && priceNum > 0 && leverageVal > 1
      ? direction === "buy"
        ? priceNum * (1 - 1 / leverageVal)
        : priceNum * (1 + 1 / leverageVal)
      : null;

  const marginRequired =
    amountNum > 0 && priceNum > 0
      ? (amountNum * priceNum) /
        (instrument?.type === "future" ? leverageVal : 1)
      : 0;

  // Spread margin: combined margin for both legs
  const spreadMargin =
    instrument?.type === "spread" && amountNum > 0
      ? Math.abs(instrument.spreadAsk ?? 0) * amountNum * 1.2
      : 0;

  const noInstrument = !instrument;

  // ---------- Mode 4: Combo Trade Panel ----------
  if (instrument?.type === "combo") {
    const legs = instrument.legs ?? [];
    const netDelta = legs.reduce(
      (s, l) => s + l.delta * (l.direction === "buy" ? 1 : -1),
      0,
    );
    const netGamma = legs.reduce(
      (s, l) => s + l.gamma * (l.direction === "buy" ? 1 : -1),
      0,
    );
    const netTheta = legs.reduce(
      (s, l) => s + l.theta * (l.direction === "buy" ? 1 : -1),
      0,
    );
    const netVega = legs.reduce(
      (s, l) => s + l.vega * (l.direction === "buy" ? 1 : -1),
      0,
    );
    const netDebit = instrument.netDebit ?? 0;
    const comboMargin =
      amountNum > 0 ? Math.abs(netDebit) * amountNum * 1.2 : 0;

    return (
      <div className="space-y-3">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground">Combo Order</p>
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
              {instrument.comboType}
            </Badge>
          </div>
        </div>

        {/* Legs */}
        <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Legs
          </p>
          {legs.map((leg, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs"
            >
              <span
                className={cn(
                  "font-mono font-medium",
                  leg.direction === "buy"
                    ? "text-emerald-400"
                    : "text-rose-400",
                )}
              >
                {leg.direction === "buy" ? "BUY" : "SELL"}{" "}
                {leg.strike.toLocaleString()}
                {leg.type === "call" ? "C" : "P"}
              </span>
              <span className="font-mono text-muted-foreground">
                {formatUsd(leg.price)}
              </span>
            </div>
          ))}
        </div>

        <Separator />

        {/* Net Debit/Credit */}
        <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Net {netDebit > 0 ? "Debit" : "Credit"}
            </span>
            <span
              className={cn(
                "font-mono font-bold text-sm",
                netDebit > 0 ? "text-rose-400" : "text-emerald-400",
              )}
            >
              {formatUsd(Math.abs(netDebit))}
            </span>
          </div>
        </div>

        {/* Combined Greeks */}
        <div className="p-3 rounded-lg border bg-muted/30">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Combined Greeks
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <p className="text-[10px] text-muted-foreground">&Delta;</p>
                    <p
                      className={cn(
                        "font-mono text-xs font-medium",
                        netDelta >= 0 ? "text-emerald-400" : "text-rose-400",
                      )}
                    >
                      {netDelta >= 0 ? "+" : ""}
                      {netDelta.toFixed(3)}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Net delta across all legs</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <p className="text-[10px] text-muted-foreground">&Gamma;</p>
                    <p className="font-mono text-xs font-medium">
                      {netGamma.toFixed(4)}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Net gamma across all legs</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <p className="text-[10px] text-muted-foreground">&nu;</p>
                    <p className="font-mono text-xs font-medium">
                      {netVega.toFixed(3)}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Net vega across all legs</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <p className="text-[10px] text-muted-foreground">&Theta;</p>
                    <p className="font-mono text-xs font-medium">
                      {netTheta.toFixed(1)}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Net theta across all legs (USD/day)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Size */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Size (contracts)
          </label>
          <Input
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="font-mono"
          />
          <div className="flex items-center gap-1">
            {[25, 50, 75, 100].map((pct) => (
              <Button
                key={pct}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] flex-1 font-mono"
                onClick={() => setAmount(String(Math.floor((100 * pct) / 100)))}
              >
                {pct}%
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Margin */}
        <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Combined Margin Required
            </span>
            <span className="font-mono font-medium">
              {comboMargin > 0 ? formatUsd(comboMargin) : "--"}
            </span>
          </div>
        </div>

        {/* Submit */}
        <Button
          className="w-full h-10 text-sm font-semibold bg-blue-600 hover:bg-blue-700"
          disabled={amountNum <= 0}
          onClick={() => {
            const legDesc = legs
              .map((l) => `${l.direction} ${l.strike}`)
              .join("+");
            const order = placeMockOrder({
              client_id: "internal-trader",
              instrument_id: `OPTIONS:COMBO:${instrument.comboType}:${legDesc}`,
              venue: "Deribit",
              side: "buy",
              order_type: "limit",
              quantity: amountNum,
              price: Math.abs(netDebit),
              asset_class: "CeFi",
              lane: "options",
            });
            setAmount("");
            toast({
              title: "Combo order placed",
              description: `${instrument.comboType} ${amountNum} contracts (${order.id})`,
            });
          }}
        >
          Place Combo Order
        </Button>
      </div>
    );
  }

  // ---------- Mode 3: Spread Trade Panel ----------
  if (instrument?.type === "spread") {
    return (
      <div className="space-y-3">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Spread Order</p>
          <div className="text-sm font-mono font-bold">
            <p className="truncate text-emerald-400">
              Long: {instrument.longLeg}
            </p>
            <p className="truncate text-rose-400">
              Short: {instrument.shortLeg}
            </p>
          </div>
        </div>

        <Separator />

        {/* Net cost (Bid/Ask) */}
        <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Spread Pricing
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Bid</span>
            <span className="font-mono font-medium text-emerald-400">
              {instrument.spreadBid !== undefined
                ? `${instrument.spreadBid >= 0 ? "+" : ""}${instrument.spreadBid.toFixed(2)}`
                : "--"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Ask</span>
            <span className="font-mono font-medium">
              {instrument.spreadAsk !== undefined
                ? `${instrument.spreadAsk >= 0 ? "+" : ""}${instrument.spreadAsk.toFixed(2)}`
                : "--"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Mid</span>
            <span className="font-mono">
              {instrument.spreadBid !== undefined &&
              instrument.spreadAsk !== undefined
                ? formatUsd((instrument.spreadBid + instrument.spreadAsk) / 2)
                : "--"}
            </span>
          </div>
        </div>

        {/* Size */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Size (contracts)
          </label>
          <Input
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="font-mono"
          />
          <div className="flex items-center gap-1">
            {[25, 50, 75, 100].map((pct) => (
              <Button
                key={pct}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] flex-1 font-mono"
                onClick={() => setAmount(String(Math.floor((100 * pct) / 100)))}
              >
                {pct}%
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Combined margin */}
        <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Combined Margin Required
            </span>
            <span className="font-mono font-medium">
              {spreadMargin > 0 ? formatUsd(spreadMargin) : "--"}
            </span>
          </div>
        </div>

        {/* Submit */}
        <Button
          className="w-full h-10 text-sm font-semibold bg-blue-600 hover:bg-blue-700"
          disabled={amountNum <= 0}
          onClick={() => {
            const order = placeMockOrder({
              client_id: "internal-trader",
              instrument_id: `OPTIONS:SPREAD:${instrument.longLeg}/${instrument.shortLeg}`,
              venue: "Deribit",
              side: "buy",
              order_type: "limit",
              quantity: amountNum,
              price: Math.abs(instrument.spreadAsk ?? 0),
              asset_class: "CeFi",
              lane: "options",
            });
            setAmount("");
            toast({
              title: "Spread order placed",
              description: `${instrument.longLeg} / ${instrument.shortLeg} ${amountNum} contracts (${order.id})`,
            });
          }}
        >
          Place Spread Order
        </Button>
      </div>
    );
  }

  // ---------- Mode 1 (Option) & Mode 2 (Future) ----------
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Selected Instrument</p>
        <p className="text-sm font-mono font-bold truncate">
          {instrument ? instrument.name : "Click a row to select"}
        </p>
      </div>

      <Separator />

      {/* Direction toggle */}
      <div className="grid grid-cols-2 gap-1.5">
        <Button
          variant={direction === "buy" ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-9 text-sm font-semibold",
            direction === "buy" && "bg-emerald-600 hover:bg-emerald-700",
          )}
          onClick={() => setDirection("buy")}
          disabled={noInstrument}
        >
          <TrendingUp className="size-4 mr-1.5" />
          Buy
        </Button>
        <Button
          variant={direction === "sell" ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-9 text-sm font-semibold",
            direction === "sell" && "bg-rose-600 hover:bg-rose-700",
          )}
          onClick={() => setDirection("sell")}
          disabled={noInstrument}
        >
          <TrendingDown className="size-4 mr-1.5" />
          Sell
        </Button>
      </div>

      {/* Order type */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Order Type</label>
        <div className="grid grid-cols-4 gap-1">
          {(["limit", "market", "post-only", "reduce-only"] as const).map(
            (ot) => (
              <Button
                key={ot}
                variant={orderType === ot ? "default" : "outline"}
                size="sm"
                className="text-[10px] h-7 px-1"
                onClick={() => setOrderType(ot)}
                disabled={noInstrument}
              >
                {ot === "post-only"
                  ? "Post"
                  : ot === "reduce-only"
                    ? "Reduce"
                    : ot.charAt(0).toUpperCase() + ot.slice(1)}
              </Button>
            ),
          )}
        </div>
      </div>

      {/* Price */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Price (USD)</label>
        <Input
          type="number"
          placeholder="0.00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="font-mono"
          disabled={noInstrument || orderType === "market"}
        />
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">
          {instrument?.type === "option"
            ? "Size (contracts)"
            : "Size (contracts)"}
        </label>
        <Input
          type="number"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="font-mono"
          disabled={noInstrument}
        />
        {/* Quick-size buttons */}
        <div className="flex items-center gap-1">
          {[25, 50, 75, 100].map((pct) => (
            <Button
              key={pct}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] flex-1 font-mono"
              onClick={() => setAmount(String(Math.floor((100 * pct) / 100)))}
              disabled={noInstrument}
            >
              {pct}%
            </Button>
          ))}
        </div>
      </div>

      {/* Options-specific: IV + Greeks (Mode 1 only) */}
      {instrument?.type === "option" && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              Implied Volatility
            </label>
            <div className="p-2 rounded-md border bg-muted/30 font-mono text-sm">
              {instrument.iv?.toFixed(1)}%
            </div>
          </div>
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
              Greeks
            </p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <p className="text-[10px] text-muted-foreground">
                        &Delta;
                      </p>
                      <p className="font-mono text-xs font-medium">
                        {instrument.delta?.toFixed(3)}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Delta: price sensitivity</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <p className="text-[10px] text-muted-foreground">
                        &Gamma;
                      </p>
                      <p className="font-mono text-xs font-medium">
                        {instrument.gamma?.toFixed(4)}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Gamma: delta sensitivity</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <p className="text-[10px] text-muted-foreground">
                        &Theta;
                      </p>
                      <p className="font-mono text-xs font-medium">
                        {instrument.theta?.toFixed(1)}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Theta: time decay (USD/day)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <p className="text-[10px] text-muted-foreground">&nu;</p>
                      <p className="font-mono text-xs font-medium">
                        {instrument.vega?.toFixed(3)}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Vega: IV sensitivity</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </>
      )}

      {/* Futures-specific: Leverage + Liquidation (Mode 2 only, NO Greeks) */}
      {instrument?.type === "future" && (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">Leverage</label>
              <span className="text-xs font-mono font-bold">
                {leverageVal}x
              </span>
            </div>
            <Slider
              value={leverage}
              onValueChange={setLeverage}
              min={1}
              max={50}
              step={1}
              className="w-full"
            />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
              <span>1x</span>
              <span>10x</span>
              <span>25x</span>
              <span>50x</span>
            </div>
          </div>
          {liqPrice !== null && (
            <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Liquidation Price</span>
                <span
                  className={cn(
                    "font-mono font-bold",
                    direction === "buy" ? "text-rose-400" : "text-emerald-400",
                  )}
                >
                  {formatUsd(liqPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Distance</span>
                <span className="font-mono text-muted-foreground">
                  {((Math.abs(priceNum - liqPrice) / priceNum) * 100).toFixed(
                    1,
                  )}
                  %
                </span>
              </div>
            </div>
          )}
        </>
      )}

      <Separator />

      {/* Margin / Total */}
      <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Order Value</span>
          <span className="font-mono">
            {amountNum > 0 && priceNum > 0
              ? formatUsd(amountNum * priceNum)
              : "--"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {instrument?.type === "future" ? "Margin Required" : "Total Cost"}
          </span>
          <span className="font-mono font-medium">
            {marginRequired > 0 ? formatUsd(marginRequired) : "--"}
          </span>
        </div>
      </div>

      {/* Submit */}
      <Button
        className={cn(
          "w-full h-10 text-sm font-semibold",
          direction === "buy"
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-rose-600 hover:bg-rose-700",
        )}
        disabled={
          noInstrument ||
          amountNum <= 0 ||
          (orderType !== "market" && priceNum <= 0)
        }
        onClick={() => {
          if (!instrument) return;
          const order = placeMockOrder({
            client_id: "internal-trader",
            instrument_id: instrument.name,
            venue: "Deribit",
            side: direction,
            order_type: orderType === "market" ? "market" : "limit",
            quantity: amountNum,
            price:
              orderType === "market"
                ? (instrument.lastPrice ?? priceNum)
                : priceNum,
            asset_class: "CeFi",
            lane: "options",
          });
          setAmount("");
          setPrice("");
          toast({
            title: "Order placed",
            description: `${direction.toUpperCase()} ${amountNum} ${instrument.name} @ ${orderType} (${order.id})`,
          });
        }}
      >
        Place {direction === "buy" ? "Buy" : "Sell"} Order
      </Button>
    </div>
  );
}

function VolSurfacePanel({ asset }: { asset: Asset }) {
  const [open, setOpen] = React.useState(false);
  const surface = React.useMemo(() => generateVolSurface(asset), [asset]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-9 px-3 text-xs"
        >
          <span className="flex items-center gap-1.5">
            <Grid3X3 className="size-3.5" />
            Vol Surface / Term Structure
          </span>
          {open ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-3 border rounded-lg mt-1">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr>
                  <th className="py-1 px-2 text-left text-muted-foreground font-normal">
                    Strike
                  </th>
                  {surface.expiries.map((exp) => (
                    <th
                      key={exp}
                      className="py-1 px-2 text-center text-muted-foreground font-normal"
                    >
                      {exp}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {surface.strikes.map((strike, sIdx) => (
                  <tr key={strike}>
                    <td className="py-1 px-2 font-mono font-medium">
                      {strike.toLocaleString()}
                    </td>
                    {surface.ivs[sIdx].map((iv, eIdx) => (
                      <td
                        key={eIdx}
                        className="py-1 px-2 text-center font-mono"
                        style={{
                          backgroundColor: ivToColor(iv),
                          color: iv > 65 ? "#fff" : "#1a1a2e",
                        }}
                      >
                        {iv.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-3 rounded"
                style={{ backgroundColor: ivToColor(42) }}
              />
              Low IV
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-3 rounded"
                style={{ backgroundColor: ivToColor(60) }}
              />
              Mid IV
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-3 rounded"
                style={{ backgroundColor: ivToColor(78) }}
              />
              High IV
            </span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function GreeksSurfacePanel({ asset }: { asset: Asset }) {
  const [open, setOpen] = React.useState(false);
  const [selectedGreek, setSelectedGreek] =
    React.useState<GreekSurface>("delta");
  const surface = React.useMemo(() => generateVolSurface(asset), [asset]);

  // Generate greek values from IV surface
  const greekValues = React.useMemo(() => {
    const spot = SPOT_PRICES[asset];
    return surface.strikes.map((strike, sIdx) => {
      const moneyness = (strike - spot) / spot;
      return surface.expiries.map((_, eIdx) => {
        const iv = surface.ivs[sIdx][eIdx];
        const t = (eIdx + 1) * 0.08; // rough time to expiry
        const sqrtT = Math.sqrt(t);
        const d1 = -moneyness / ((iv / 100) * sqrtT);
        const normCdf = 0.5 + 0.4 * Math.tanh(d1);

        switch (selectedGreek) {
          case "delta":
            return normCdf;
          case "gamma":
            return (
              (0.01 / ((iv / 100) * sqrtT * spot)) * Math.exp((-d1 * d1) / 2)
            );
          case "vega":
            return spot * sqrtT * Math.exp((-d1 * d1) / 2) * 0.01;
          case "theta":
            return (
              -(spot * (iv / 100) * Math.exp((-d1 * d1) / 2)) /
              (2 * sqrtT) /
              365
            );
        }
      });
    });
  }, [asset, surface, selectedGreek]);

  const formatGreek = (val: number): string => {
    switch (selectedGreek) {
      case "delta":
        return val.toFixed(2);
      case "gamma":
        return val.toFixed(5);
      case "vega":
        return val.toFixed(2);
      case "theta":
        return val.toFixed(2);
    }
  };

  const greekColor = (val: number): string => {
    switch (selectedGreek) {
      case "delta": {
        const ratio = Math.max(0, Math.min(1, val));
        const r = Math.round(50 + (1 - ratio) * 200);
        const g = Math.round(100 + ratio * 150);
        const b = Math.round(80 + ratio * 100);
        return `rgb(${r}, ${g}, ${b})`;
      }
      case "gamma":
      case "vega": {
        const maxVal = selectedGreek === "gamma" ? 0.0005 : 50;
        const ratio = Math.max(0, Math.min(1, Math.abs(val) / maxVal));
        const r = Math.round(50 + ratio * 180);
        const g = Math.round(120 + (1 - ratio) * 80);
        const b = Math.round(200 - ratio * 120);
        return `rgb(${r}, ${g}, ${b})`;
      }
      case "theta": {
        const ratio = Math.max(0, Math.min(1, Math.abs(val) / 50));
        const r = Math.round(200 + ratio * 55);
        const g = Math.round(150 - ratio * 100);
        const b = Math.round(80 - ratio * 40);
        return `rgb(${r}, ${g}, ${b})`;
      }
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-9 px-3 text-xs"
        >
          <span className="flex items-center gap-1.5">
            <BarChart3 className="size-3.5" />
            Greeks Surface
          </span>
          {open ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-3 border rounded-lg mt-1 space-y-2">
          <Select
            value={selectedGreek}
            onValueChange={(v) => setSelectedGreek(v as GreekSurface)}
          >
            <SelectTrigger className="h-7 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="delta">Delta</SelectItem>
              <SelectItem value="gamma">Gamma</SelectItem>
              <SelectItem value="vega">Vega</SelectItem>
              <SelectItem value="theta">Theta</SelectItem>
            </SelectContent>
          </Select>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr>
                  <th className="py-1 px-2 text-left text-muted-foreground font-normal">
                    Strike
                  </th>
                  {surface.expiries.map((exp) => (
                    <th
                      key={exp}
                      className="py-1 px-2 text-center text-muted-foreground font-normal"
                    >
                      {exp}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {surface.strikes.map((strike, sIdx) => (
                  <tr key={strike}>
                    <td className="py-1 px-2 font-mono font-medium">
                      {strike.toLocaleString()}
                    </td>
                    {greekValues[sIdx].map((val, eIdx) => (
                      <td
                        key={eIdx}
                        className="py-1 px-2 text-center font-mono"
                        style={{
                          backgroundColor: greekColor(val),
                          color: "#fff",
                        }}
                      >
                        {formatGreek(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---------- Main Component ----------

interface OptionsFuturesPanelProps {
  className?: string;
}

export function OptionsFuturesPanel({ className }: OptionsFuturesPanelProps) {
  const [asset, setAsset] = React.useState<Asset>("BTC");
  const [settlement, setSettlement] = React.useState<Settlement>("inverse");
  const [market, setMarket] = React.useState<Market>("deribit");
  const [selectedInstrument, setSelectedInstrument] =
    React.useState<SelectedInstrument | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>("options");
  const [strategiesMode, setStrategiesMode] =
    React.useState<StrategiesMode>("futures-spreads");

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-0 px-0 pt-0">
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="size-4" />
            Options &amp; Futures
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            {market.charAt(0).toUpperCase() + market.slice(1)}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono">
            {settlement === "inverse" ? "Coin-Settled" : "USDC-Settled"}
          </Badge>
        </div>
        <InstrumentSelectorBar
          asset={asset}
          setAsset={setAsset}
          settlement={settlement}
          setSettlement={setSettlement}
          market={market}
          setMarket={setMarket}
        />
      </CardHeader>
      <CardContent className="pt-3 px-0">
        <div className="flex">
          {/* Main content — 75% */}
          <div className="flex-1 min-w-0 px-4">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-3 h-8">
                <TabsTrigger value="options" className="text-xs gap-1.5">
                  <Grid3X3 className="size-3" />
                  Options Chain
                </TabsTrigger>
                <TabsTrigger value="futures" className="text-xs gap-1.5">
                  <TrendingUp className="size-3" />
                  Futures
                </TabsTrigger>
                <TabsTrigger value="strategies" className="text-xs gap-1.5">
                  <Activity className="size-3" />
                  Strategies
                </TabsTrigger>
              </TabsList>

              <div className="mt-3">
                <TabsContent value="options" className="mt-0">
                  <OptionsChainTab
                    asset={asset}
                    onSelectInstrument={setSelectedInstrument}
                  />
                </TabsContent>
                <TabsContent value="futures" className="mt-0">
                  <FuturesTab
                    asset={asset}
                    onSelectInstrument={setSelectedInstrument}
                  />
                </TabsContent>
                <TabsContent value="strategies" className="mt-0">
                  <div className="space-y-3">
                    {/* Strategies mode toggle */}
                    <div className="flex items-center gap-0.5 rounded-lg border p-0.5 bg-muted/30 w-fit">
                      <Button
                        variant={
                          strategiesMode === "futures-spreads"
                            ? "default"
                            : "ghost"
                        }
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => setStrategiesMode("futures-spreads")}
                      >
                        Futures Spreads
                      </Button>
                      <Button
                        variant={
                          strategiesMode === "options-combos"
                            ? "default"
                            : "ghost"
                        }
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => setStrategiesMode("options-combos")}
                      >
                        Options Combos
                      </Button>
                    </div>
                    {strategiesMode === "futures-spreads" ? (
                      <FuturesSpreadsTab
                        onSelectInstrument={setSelectedInstrument}
                      />
                    ) : (
                      <OptionsCombosPanel
                        asset={asset}
                        onSelectInstrument={setSelectedInstrument}
                      />
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {/* Visualisation panels — only visible on Options Chain tab */}
            {activeTab === "options" && (
              <div className="mt-4 space-y-1">
                <VolSurfacePanel asset={asset} />
                <GreeksSurfacePanel asset={asset} />
              </div>
            )}
          </div>

          {/* Trade panel — sticky right sidebar ~25% */}
          <div className="w-72 shrink-0 border-l px-4 py-1 sticky top-0 self-start">
            <TradePanel instrument={selectedInstrument} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
