"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
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
import {
  Landmark,
  ArrowLeftRight,
  Droplets,
  Coins,
  Zap,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Fuel,
  Shield,
  ArrowDown,
  TrendingUp,
  Send,
  Globe,
  Wallet,
} from "lucide-react";
import { placeMockOrder } from "@/lib/api/mock-trade-ledger";
import { toast } from "@/hooks/use-toast";

// ---------- Types ----------

type DeFiTab =
  | "lending"
  | "swap"
  | "liquidity"
  | "staking"
  | "flash"
  | "transfer";

interface LendingProtocol {
  name: string;
  assets: string[];
  supplyApy: Record<string, number>;
  borrowApy: Record<string, number>;
}

interface SwapRoute {
  path: string[];
  pools: string[];
  priceImpactPct: number;
  expectedOutput: number;
  gasEstimateEth: number;
  gasEstimateUsd: number;
}

interface LiquidityPool {
  name: string;
  token0: string;
  token1: string;
  feeTier: number;
  tvl: number;
  apr24h: number;
}

interface StakingProtocol {
  name: string;
  asset: string;
  apy: number;
  tvl: number;
  minStake: number;
  unbondingDays: number;
}

interface FlashLoanStep {
  id: string;
  operationType: string;
  asset: string;
  amount: string;
  venue: string;
}

// ---------- Mock Data ----------

const LENDING_PROTOCOLS: LendingProtocol[] = [
  {
    name: "Aave V3",
    assets: ["ETH", "USDC", "USDT", "DAI", "WBTC", "LINK"],
    supplyApy: {
      ETH: 3.2,
      USDC: 5.8,
      USDT: 5.4,
      DAI: 5.1,
      WBTC: 0.8,
      LINK: 1.2,
    },
    borrowApy: {
      ETH: 4.1,
      USDC: 7.2,
      USDT: 6.9,
      DAI: 6.5,
      WBTC: 1.5,
      LINK: 2.8,
    },
  },
  {
    name: "Morpho",
    assets: ["ETH", "USDC", "DAI", "WBTC"],
    supplyApy: { ETH: 3.8, USDC: 6.2, DAI: 5.6, WBTC: 1.0 },
    borrowApy: { ETH: 4.5, USDC: 7.8, DAI: 7.0, WBTC: 1.9 },
  },
  {
    name: "Compound V3",
    assets: ["ETH", "USDC", "WBTC"],
    supplyApy: { ETH: 2.9, USDC: 5.5, WBTC: 0.6 },
    borrowApy: { ETH: 3.8, USDC: 6.8, WBTC: 1.3 },
  },
];

const SWAP_TOKENS = [
  "ETH",
  "USDC",
  "USDT",
  "DAI",
  "WBTC",
  "LINK",
  "UNI",
  "AAVE",
  "CRV",
  "LDO",
] as const;

const MOCK_SWAP_ROUTE: SwapRoute = {
  path: ["ETH", "USDC"],
  pools: ["UniswapV3 ETH/USDC 0.05%"],
  priceImpactPct: 0.03,
  expectedOutput: 3456.12,
  gasEstimateEth: 0.0042,
  gasEstimateUsd: 14.52,
};

const LIQUIDITY_POOLS: LiquidityPool[] = [
  {
    name: "ETH/USDC",
    token0: "ETH",
    token1: "USDC",
    feeTier: 0.05,
    tvl: 485_000_000,
    apr24h: 18.4,
  },
  {
    name: "ETH/USDT",
    token0: "ETH",
    token1: "USDT",
    feeTier: 0.05,
    tvl: 312_000_000,
    apr24h: 15.2,
  },
  {
    name: "WBTC/ETH",
    token0: "WBTC",
    token1: "ETH",
    feeTier: 0.3,
    tvl: 198_000_000,
    apr24h: 8.7,
  },
  {
    name: "USDC/USDT",
    token0: "USDC",
    token1: "USDT",
    feeTier: 0.01,
    tvl: 542_000_000,
    apr24h: 4.1,
  },
  {
    name: "ETH/DAI",
    token0: "ETH",
    token1: "DAI",
    feeTier: 0.3,
    tvl: 87_000_000,
    apr24h: 12.3,
  },
];

const STAKING_PROTOCOLS: StakingProtocol[] = [
  {
    name: "Lido",
    asset: "ETH",
    apy: 3.4,
    tvl: 32_400_000_000,
    minStake: 0,
    unbondingDays: 0,
  },
  {
    name: "EtherFi",
    asset: "ETH",
    apy: 3.6,
    tvl: 6_200_000_000,
    minStake: 0,
    unbondingDays: 0,
  },
  {
    name: "RocketPool",
    asset: "ETH",
    apy: 3.1,
    tvl: 4_800_000_000,
    minStake: 0.01,
    unbondingDays: 0,
  },
];

const FEE_TIERS = [
  { value: "0.01", label: "0.01%", description: "Stable pairs" },
  { value: "0.05", label: "0.05%", description: "Standard" },
  { value: "0.3", label: "0.30%", description: "Most pairs" },
  { value: "1", label: "1.00%", description: "Exotic pairs" },
] as const;

const FLASH_OPERATION_TYPES = [
  "SWAP",
  "LEND",
  "BORROW",
  "REPAY",
  "WITHDRAW",
  "ADD_LIQUIDITY",
  "REMOVE_LIQUIDITY",
  "TRADE",
  "TRANSFER",
] as const;

// ---------- Sub-components ----------

function LendingTab() {
  const [protocol, setProtocol] = React.useState("Aave V3");
  const [operation, setOperation] = React.useState<
    "LEND" | "BORROW" | "WITHDRAW" | "REPAY"
  >("LEND");
  const [asset, setAsset] = React.useState("ETH");
  const [amount, setAmount] = React.useState("");

  const selectedProtocol =
    LENDING_PROTOCOLS.find((p) => p.name === protocol) ?? LENDING_PROTOCOLS[0];
  const supplyApy = selectedProtocol.supplyApy[asset] ?? 0;
  const borrowApy = selectedProtocol.borrowApy[asset] ?? 0;

  // Mock health factor calculation
  const currentHf = 1.85;
  const amountNum = parseFloat(amount) || 0;
  const hfDelta =
    operation === "LEND" || operation === "REPAY"
      ? amountNum * 0.01
      : -(amountNum * 0.015);
  const newHf = Math.max(0, currentHf + hfDelta);

  return (
    <div className="space-y-4">
      {/* Protocol */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Protocol</label>
        <Select value={protocol} onValueChange={setProtocol}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LENDING_PROTOCOLS.map((p) => (
              <SelectItem key={p.name} value={p.name}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Operation */}
      <div className="grid grid-cols-4 gap-1">
        {(["LEND", "BORROW", "WITHDRAW", "REPAY"] as const).map((op) => (
          <Button
            key={op}
            variant={operation === op ? "default" : "outline"}
            size="sm"
            className={cn(
              "text-xs h-8",
              operation === op && (op === "LEND" || op === "REPAY")
                ? "bg-emerald-600 hover:bg-emerald-700"
                : operation === op
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "",
            )}
            onClick={() => setOperation(op)}
          >
            {op}
          </Button>
        ))}
      </div>

      {/* Asset */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Asset</label>
        <Select value={asset} onValueChange={setAsset}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {selectedProtocol.assets.map((a) => (
              <SelectItem key={a} value={a}>
                <span className="font-mono">{a}</span>
                <span className="text-[10px] text-muted-foreground ml-2">
                  Supply {selectedProtocol.supplyApy[a]?.toFixed(1)}% / Borrow{" "}
                  {selectedProtocol.borrowApy[a]?.toFixed(1)}%
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Amount</label>
        <Input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="font-mono"
        />
      </div>

      {/* APY Display */}
      <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Supply APY</span>
          <span className="font-mono text-emerald-400">
            {supplyApy.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Borrow APY</span>
          <span className="font-mono text-rose-400">
            {borrowApy.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Health Factor Preview */}
      <div className="p-3 rounded-lg border space-y-2">
        <p className="text-xs font-medium flex items-center gap-1.5">
          <Shield className="size-3.5" />
          Health Factor Preview
        </p>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Current</p>
            <p
              className={cn(
                "text-lg font-mono font-bold",
                currentHf >= 1.5
                  ? "text-emerald-400"
                  : currentHf >= 1.1
                    ? "text-amber-400"
                    : "text-rose-400",
              )}
            >
              {currentHf.toFixed(2)}
            </p>
          </div>
          <ArrowDown className="size-4 text-muted-foreground rotate-[-90deg]" />
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">After</p>
            <p
              className={cn(
                "text-lg font-mono font-bold",
                newHf >= 1.5
                  ? "text-emerald-400"
                  : newHf >= 1.1
                    ? "text-amber-400"
                    : "text-rose-400",
              )}
            >
              {amountNum > 0 ? newHf.toFixed(2) : "--"}
            </p>
          </div>
        </div>
        {newHf > 0 && newHf < 1.1 && amountNum > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400">
            <AlertTriangle className="size-3.5" />
            Liquidation risk! Health factor below 1.1
          </div>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Collateral Ratio</span>
          <span className="font-mono">{(currentHf * 75).toFixed(0)}%</span>
        </div>
      </div>

      <Button
        className="w-full"
        disabled={amountNum <= 0}
        onClick={() => {
          const order = placeMockOrder({
            client_id: "internal-trader",
            instrument_id: `${protocol.replace(/ /g, "_")}:${operation}:${asset}`,
            venue: protocol,
            side:
              operation === "LEND" || operation === "REPAY" ? "buy" : "sell",
            order_type: "market",
            quantity: amountNum,
            price: operation === "LEND" ? supplyApy : borrowApy,
            asset_class: "DeFi",
            lane: "defi",
          });
          setAmount("");
          toast({
            title: "DeFi order placed",
            description: `${operation} ${amountNum} ${asset} on ${protocol} (${order.id})`,
          });
        }}
      >
        {operation} {asset}
      </Button>
    </div>
  );
}

function SwapTab() {
  const [tokenIn, setTokenIn] = React.useState("ETH");
  const [tokenOut, setTokenOut] = React.useState("USDC");
  const [amountIn, setAmountIn] = React.useState("");
  const [slippage, setSlippage] = React.useState("0.5");

  const amountNum = parseFloat(amountIn) || 0;
  const route = amountNum > 0 ? MOCK_SWAP_ROUTE : null;

  return (
    <div className="space-y-4">
      {/* Token In */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">You Pay</label>
        <div className="flex gap-2">
          <Select value={tokenIn} onValueChange={setTokenIn}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SWAP_TOKENS.map((t) => (
                <SelectItem key={t} value={t}>
                  <span className="font-mono">{t}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="0.00"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            className="font-mono flex-1"
          />
        </div>
      </div>

      {/* Swap direction arrow */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 rounded-full p-0"
          onClick={() => {
            setTokenIn(tokenOut);
            setTokenOut(tokenIn);
          }}
        >
          <ArrowLeftRight className="size-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Token Out */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">You Receive</label>
        <div className="flex gap-2">
          <Select value={tokenOut} onValueChange={setTokenOut}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SWAP_TOKENS.map((t) => (
                <SelectItem key={t} value={t}>
                  <span className="font-mono">{t}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1 flex items-center px-3 border rounded-md bg-muted/30 font-mono text-sm">
            {route
              ? route.expectedOutput.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })
              : "0.00"}
          </div>
        </div>
      </div>

      {/* Slippage Tolerance */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">
          Slippage Tolerance
        </label>
        <div className="flex gap-1.5">
          {["0.1", "0.5", "1"].map((s) => (
            <Button
              key={s}
              variant={slippage === s ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs h-7"
              onClick={() => setSlippage(s)}
            >
              {s}%
            </Button>
          ))}
        </div>
      </div>

      {/* Route Display */}
      {route && (
        <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
          <p className="text-xs font-medium">Route</p>
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {route.path.map((token, i) => (
              <React.Fragment key={token}>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {token}
                </Badge>
                {i < route.path.length - 1 && (
                  <ArrowDown className="size-3 text-muted-foreground rotate-[-90deg]" />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {route.pools.join(" > ")}
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-1 text-xs">
            <span className="text-muted-foreground">Price Impact</span>
            <span
              className={cn(
                "font-mono",
                route.priceImpactPct > 0.5
                  ? "text-rose-400"
                  : "text-emerald-400",
              )}
            >
              {route.priceImpactPct.toFixed(2)}%
            </span>
            <span className="text-muted-foreground">Gas Estimate</span>
            <span className="font-mono">
              {route.gasEstimateEth.toFixed(4)} ETH
              <span className="text-muted-foreground ml-1">
                (${route.gasEstimateUsd.toFixed(2)})
              </span>
            </span>
          </div>
        </div>
      )}

      <Button
        className="w-full"
        disabled={amountNum <= 0}
        onClick={() => {
          const order = placeMockOrder({
            client_id: "internal-trader",
            instrument_id: `SWAP:${tokenIn}-${tokenOut}`,
            venue: "Uniswap",
            side: "buy",
            order_type: "market",
            quantity: amountNum,
            price: route?.expectedOutput ?? 0,
            asset_class: "DeFi",
            lane: "defi",
          });
          setAmountIn("");
          toast({
            title: "Swap submitted",
            description: `${amountNum} ${tokenIn} → ${tokenOut} (${order.id})`,
          });
        }}
      >
        <ArrowLeftRight className="size-4 mr-2" />
        Swap {tokenIn} for {tokenOut}
      </Button>
    </div>
  );
}

function LiquidityTab() {
  const [selectedPool, setSelectedPool] = React.useState(
    LIQUIDITY_POOLS[0].name,
  );
  const [feeTier, setFeeTier] = React.useState("0.05");
  const [operation, setOperation] = React.useState<
    "ADD_LIQUIDITY" | "REMOVE_LIQUIDITY"
  >("ADD_LIQUIDITY");
  const [amount, setAmount] = React.useState("");
  const [priceMin, setPriceMin] = React.useState("");
  const [priceMax, setPriceMax] = React.useState("");

  const pool =
    LIQUIDITY_POOLS.find((p) => p.name === selectedPool) ?? LIQUIDITY_POOLS[0];

  return (
    <div className="space-y-4">
      {/* Operation toggle */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={operation === "ADD_LIQUIDITY" ? "default" : "outline"}
          size="sm"
          className={cn(
            "text-xs",
            operation === "ADD_LIQUIDITY" &&
              "bg-emerald-600 hover:bg-emerald-700",
          )}
          onClick={() => setOperation("ADD_LIQUIDITY")}
        >
          <Plus className="size-3 mr-1.5" />
          Add Liquidity
        </Button>
        <Button
          variant={operation === "REMOVE_LIQUIDITY" ? "default" : "outline"}
          size="sm"
          className={cn(
            "text-xs",
            operation === "REMOVE_LIQUIDITY" && "bg-rose-600 hover:bg-rose-700",
          )}
          onClick={() => setOperation("REMOVE_LIQUIDITY")}
        >
          <Trash2 className="size-3 mr-1.5" />
          Remove Liquidity
        </Button>
      </div>

      {/* Pool Selector */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Pool</label>
        <Select value={selectedPool} onValueChange={setSelectedPool}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIQUIDITY_POOLS.map((p) => (
              <SelectItem key={p.name} value={p.name}>
                <span className="font-mono">{p.name}</span>
                <span className="text-[10px] text-muted-foreground ml-2">
                  TVL ${(p.tvl / 1_000_000).toFixed(0)}M / APR{" "}
                  {p.apr24h.toFixed(1)}%
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fee Tier */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Fee Tier</label>
        <div className="grid grid-cols-4 gap-1">
          {FEE_TIERS.map((ft) => (
            <Button
              key={ft.value}
              variant={feeTier === ft.value ? "default" : "outline"}
              size="sm"
              className="text-[10px] h-10 flex flex-col gap-0 px-1"
              onClick={() => setFeeTier(ft.value)}
            >
              <span className="font-mono font-bold">{ft.label}</span>
              <span className="text-muted-foreground">{ft.description}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">
          Price Range ({pool.token1} per {pool.token0})
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">Min Price</span>
            <Input
              type="number"
              placeholder="0.00"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">Max Price</span>
            <Input
              type="number"
              placeholder="0.00"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">
          Position Size ({pool.token0})
        </label>
        <Input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="font-mono"
        />
      </div>

      {/* Pool Info */}
      <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">TVL</span>
          <span className="font-mono">
            ${(pool.tvl / 1_000_000).toFixed(0)}M
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">24h APR</span>
          <span className="font-mono text-emerald-400">
            {pool.apr24h.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Fee Tier</span>
          <span className="font-mono">{pool.feeTier}%</span>
        </div>
      </div>

      <Button
        className="w-full"
        disabled={!amount || parseFloat(amount) <= 0}
        onClick={() => {
          const amountNum = parseFloat(amount) || 0;
          const order = placeMockOrder({
            client_id: "internal-trader",
            instrument_id: `UNISWAPV3:LP:${pool.name}`,
            venue: "Uniswap",
            side: operation === "ADD_LIQUIDITY" ? "buy" : "sell",
            order_type: "market",
            quantity: amountNum,
            price: pool.apr24h,
            asset_class: "DeFi",
            lane: "defi",
          });
          setAmount("");
          toast({
            title: "Liquidity order placed",
            description: `${operation === "ADD_LIQUIDITY" ? "Add" : "Remove"} ${amountNum} ${pool.token0} in ${pool.name} (${order.id})`,
          });
        }}
      >
        <Droplets className="size-4 mr-2" />
        {operation === "ADD_LIQUIDITY" ? "Add" : "Remove"} Liquidity
      </Button>
    </div>
  );
}

function StakingTab() {
  const [protocol, setProtocol] = React.useState("Lido");
  const [operation, setOperation] = React.useState<"STAKE" | "UNSTAKE">(
    "STAKE",
  );
  const [amount, setAmount] = React.useState("");

  const selected =
    STAKING_PROTOCOLS.find((p) => p.name === protocol) ?? STAKING_PROTOCOLS[0];
  const amountNum = parseFloat(amount) || 0;
  const annualYield = amountNum * (selected.apy / 100);

  return (
    <div className="space-y-4">
      {/* Operation */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={operation === "STAKE" ? "default" : "outline"}
          size="sm"
          className={cn(
            "text-xs",
            operation === "STAKE" && "bg-emerald-600 hover:bg-emerald-700",
          )}
          onClick={() => setOperation("STAKE")}
        >
          <TrendingUp className="size-3 mr-1.5" />
          Stake
        </Button>
        <Button
          variant={operation === "UNSTAKE" ? "default" : "outline"}
          size="sm"
          className={cn(
            "text-xs",
            operation === "UNSTAKE" && "bg-rose-600 hover:bg-rose-700",
          )}
          onClick={() => setOperation("UNSTAKE")}
        >
          Unstake
        </Button>
      </div>

      {/* Protocol */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Protocol</label>
        <Select value={protocol} onValueChange={setProtocol}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAKING_PROTOCOLS.map((p) => (
              <SelectItem key={p.name} value={p.name}>
                {p.name}
                <span className="text-[10px] text-muted-foreground ml-2">
                  APY {p.apy.toFixed(1)}% / TVL $
                  {(p.tvl / 1_000_000_000).toFixed(1)}B
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">
          Amount ({selected.asset})
        </label>
        <Input
          type="number"
          placeholder="0.00"
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
              className="h-6 px-2 text-[10px] flex-1"
              onClick={() => setAmount(((32 * pct) / 100).toFixed(4))}
            >
              {pct}%
            </Button>
          ))}
        </div>
      </div>

      {/* Protocol Info */}
      <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Expected APY</span>
          <span className="font-mono text-emerald-400 font-bold text-sm">
            {selected.apy.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Annual Yield</span>
          <span className="font-mono text-emerald-400">
            {amountNum > 0
              ? `${annualYield.toFixed(4)} ${selected.asset}`
              : "--"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">TVL</span>
          <span className="font-mono">
            ${(selected.tvl / 1_000_000_000).toFixed(1)}B
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Min Stake</span>
          <span className="font-mono">
            {selected.minStake > 0
              ? `${selected.minStake} ${selected.asset}`
              : "None"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Unbonding</span>
          <span className="font-mono">
            {selected.unbondingDays > 0
              ? `${selected.unbondingDays} days`
              : "Instant"}
          </span>
        </div>
      </div>

      <Button
        className="w-full"
        disabled={amountNum <= 0}
        onClick={() => {
          const order = placeMockOrder({
            client_id: "internal-trader",
            instrument_id: `${protocol.toUpperCase()}:${operation}:${selected.asset}`,
            venue: protocol,
            side: operation === "STAKE" ? "buy" : "sell",
            order_type: "market",
            quantity: amountNum,
            price: selected.apy,
            asset_class: "DeFi",
            lane: "defi",
          });
          setAmount("");
          toast({
            title: "Staking order placed",
            description: `${operation} ${amountNum} ${selected.asset} on ${protocol} (${order.id})`,
          });
        }}
      >
        <Coins className="size-4 mr-2" />
        {operation} {selected.asset} on {protocol}
      </Button>
    </div>
  );
}

function FlashLoanTab() {
  const [steps, setSteps] = React.useState<FlashLoanStep[]>([
    {
      id: "step-1",
      operationType: "SWAP",
      asset: "ETH",
      amount: "100",
      venue: "Uniswap",
    },
    {
      id: "step-2",
      operationType: "SWAP",
      asset: "USDC",
      amount: "345600",
      venue: "Curve",
    },
  ]);

  const addStep = () => {
    setSteps([
      ...steps,
      {
        id: `step-${Date.now()}`,
        operationType: "SWAP",
        asset: "ETH",
        amount: "",
        venue: "Uniswap",
      },
    ]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id));
  };

  const updateStep = (
    id: string,
    field: keyof FlashLoanStep,
    value: string,
  ) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  // Mock P&L calculation
  const flashFeeUsd = 27.5;
  const gasEstimateUsd = 42.3;
  const mockProfit = 185.6;
  const netPnl = mockProfit - flashFeeUsd - gasEstimateUsd;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="size-4 text-amber-400" />
        <span className="text-xs font-medium">Flash Loan Bundle Builder</span>
      </div>

      {/* Borrow leg (always first) */}
      <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2">
        <div className="flex items-center gap-1.5">
          <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
            FLASH_BORROW
          </Badge>
          <span className="text-xs text-muted-foreground">Auto-prepended</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <span className="text-muted-foreground">Protocol</span>
          <span className="font-mono">Aave V3</span>
          <span className="text-muted-foreground">Asset</span>
          <span className="font-mono">ETH</span>
          <span className="text-muted-foreground">Amount</span>
          <span className="font-mono">100 ETH</span>
          <span className="text-muted-foreground">Fee</span>
          <span className="font-mono text-amber-400">0.05% ($27.50)</span>
        </div>
      </div>

      {/* User steps */}
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Operations
        </p>
        {steps.map((step, index) => (
          <div key={step.id} className="p-2.5 rounded-lg border space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Step {index + 1}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-400"
                onClick={() => removeStep(step.id)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={step.operationType}
                onValueChange={(v) => updateStep(step.id, "operationType", v)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FLASH_OPERATION_TYPES.map((op) => (
                    <SelectItem key={op} value={op}>
                      {op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={step.venue}
                onValueChange={(v) => updateStep(step.id, "venue", v)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Uniswap", "Curve", "Aave", "Sushiswap", "Balancer"].map(
                    (v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={step.asset}
                onValueChange={(v) => updateStep(step.id, "asset", v)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SWAP_TOKENS.map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="font-mono">{t}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Amount"
                value={step.amount}
                onChange={(e) => updateStep(step.id, "amount", e.target.value)}
                className="h-7 text-xs font-mono"
              />
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={addStep}
        >
          <Plus className="size-3 mr-1.5" />
          Add Step
        </Button>
      </div>

      {/* Repay leg (always last) */}
      <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2">
        <div className="flex items-center gap-1.5">
          <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
            FLASH_REPAY
          </Badge>
          <span className="text-xs text-muted-foreground">Auto-appended</span>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          100 ETH + 0.05 ETH (fee) = 100.05 ETH
        </div>
      </div>

      {/* Profit Preview */}
      <div className="p-3 rounded-lg border space-y-2">
        <p className="text-xs font-medium">Profit Preview</p>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <span className="text-muted-foreground">Gross Profit</span>
          <span className="font-mono text-emerald-400">
            ${mockProfit.toFixed(2)}
          </span>
          <span className="text-muted-foreground">Flash Fee</span>
          <span className="font-mono text-rose-400">
            -${flashFeeUsd.toFixed(2)}
          </span>
          <span className="text-muted-foreground">Gas Estimate</span>
          <span className="font-mono text-rose-400">
            -${gasEstimateUsd.toFixed(2)}
          </span>
          <Separator className="col-span-2 my-1" />
          <span className="font-medium">Net P&L</span>
          <span
            className={cn(
              "font-mono font-bold",
              netPnl >= 0 ? "text-emerald-400" : "text-rose-400",
            )}
          >
            ${netPnl.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="text-xs">
          <Fuel className="size-3.5 mr-1.5" />
          Simulate
        </Button>
        <Button
          className="text-xs"
          disabled={steps.length === 0}
          onClick={() => {
            const order = placeMockOrder({
              client_id: "internal-trader",
              instrument_id: `FLASH_LOAN:${steps.map((s) => s.operationType).join(">")}`,
              venue: "Aave",
              side: "buy",
              order_type: "market",
              quantity: 100,
              price: netPnl,
              asset_class: "DeFi",
              lane: "defi",
            });
            toast({
              title: "Flash loan executed",
              description: `${steps.length}-step bundle — net P&L $${netPnl.toFixed(2)} (${order.id})`,
            });
          }}
        >
          <Zap className="size-3.5 mr-1.5" />
          Execute Bundle
        </Button>
      </div>
    </div>
  );
}

// ---------- Transfer Tab ----------

const DEFI_CHAINS = [
  "Ethereum",
  "Arbitrum",
  "Optimism",
  "Base",
  "Polygon",
] as const;
const DEFI_TOKENS = ["ETH", "USDC", "USDT", "WETH", "WBTC", "DAI"] as const;
const BRIDGE_PROTOCOLS = [
  "Auto (best rate)",
  "Across",
  "Stargate",
  "Hop",
] as const;

const MOCK_TOKEN_BALANCES: Record<string, number> = {
  ETH: 12.45,
  USDC: 34_520,
  USDT: 18_200,
  WETH: 5.2,
  WBTC: 0.85,
  DAI: 12_100,
};

function TransferTab() {
  const [mode, setMode] = React.useState<"send" | "bridge">("send");
  const [toAddress, setToAddress] = React.useState("");
  const [chain, setChain] = React.useState<string>(DEFI_CHAINS[0]);
  const [fromChain, setFromChain] = React.useState<string>(DEFI_CHAINS[0]);
  const [toChain, setToChain] = React.useState<string>(DEFI_CHAINS[1]);
  const [token, setToken] = React.useState<string>(DEFI_TOKENS[0]);
  const [amount, setAmount] = React.useState("");
  const [bridgeProtocol, setBridgeProtocol] = React.useState<string>(
    BRIDGE_PROTOCOLS[0],
  );

  const amountNum = parseFloat(amount) || 0;
  const balance = MOCK_TOKEN_BALANCES[token] ?? 0;

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="grid grid-cols-2 gap-1">
        <Button
          variant={mode === "send" ? "default" : "outline"}
          size="sm"
          className="text-xs h-8 gap-1"
          onClick={() => setMode("send")}
        >
          <Send className="size-3" />
          Send
        </Button>
        <Button
          variant={mode === "bridge" ? "default" : "outline"}
          size="sm"
          className="text-xs h-8 gap-1"
          onClick={() => setMode("bridge")}
        >
          <Globe className="size-3" />
          Bridge
        </Button>
      </div>

      {mode === "send" ? (
        /* ---------- Send Mode ---------- */
        <div className="space-y-4">
          {/* Connected Wallet */}
          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 text-xs">
              <Wallet className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">From Wallet</span>
              <code className="ml-auto font-mono text-[11px]">
                0x7a23...4f91
              </code>
            </div>
          </div>

          {/* To Address */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">To Address</label>
            <Input
              placeholder="0x... or ENS name"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          {/* Chain */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Chain</label>
            <Select value={chain} onValueChange={setChain}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFI_CHAINS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Token */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Token</label>
            <Select value={token} onValueChange={setToken}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFI_TOKENS.map((t) => (
                  <SelectItem key={t} value={t}>
                    <span className="font-mono">{t}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">
                      Bal: {(MOCK_TOKEN_BALANCES[t] ?? 0).toLocaleString()}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">Amount</label>
              <span className="text-[10px] text-muted-foreground font-mono">
                Balance: {balance.toLocaleString()} {token}
              </span>
            </div>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono"
            />
          </div>

          {/* Gas Estimate */}
          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Fuel className="size-3" />
                Gas Estimate
              </span>
              <span className="font-mono">~0.0008 ETH ($2.76)</span>
            </div>
          </div>

          <Button
            className="w-full"
            disabled={amountNum <= 0 || amountNum > balance || !toAddress}
          >
            <Send className="size-3.5 mr-1.5" />
            Send {token}
          </Button>
        </div>
      ) : (
        /* ---------- Bridge Mode ---------- */
        <div className="space-y-4">
          {/* From / To Chain */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                From Chain
              </label>
              <Select value={fromChain} onValueChange={setFromChain}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFI_CHAINS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">To Chain</label>
              <Select value={toChain} onValueChange={setToChain}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFI_CHAINS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bridge Protocol */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              Bridge Protocol
            </label>
            <Select value={bridgeProtocol} onValueChange={setBridgeProtocol}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BRIDGE_PROTOCOLS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Token */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Token</label>
            <Select value={token} onValueChange={setToken}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFI_TOKENS.map((t) => (
                  <SelectItem key={t} value={t}>
                    <span className="font-mono">{t}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">
                      Bal: {(MOCK_TOKEN_BALANCES[t] ?? 0).toLocaleString()}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">Amount</label>
              <span className="text-[10px] text-muted-foreground font-mono">
                Balance: {balance.toLocaleString()} {token}
              </span>
            </div>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono"
            />
          </div>

          {/* Bridge Info */}
          <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Bridge Fee</span>
              <span className="font-mono">~0.05% ($1.72)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Estimated Time</span>
              <span>~2-15 min</span>
            </div>
          </div>

          <Button
            className="w-full"
            disabled={
              amountNum <= 0 || amountNum > balance || fromChain === toChain
            }
          >
            <Globe className="size-3.5 mr-1.5" />
            Bridge {token}
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------- Main Component ----------

interface DeFiOpsPanelProps {
  className?: string;
}

export function DeFiOpsPanel({ className }: DeFiOpsPanelProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Landmark className="size-4" />
          DeFi Operations
          <Badge variant="secondary" className="text-[10px]">
            Ethereum
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="lending" className="w-full">
          <TabsList className="w-full grid grid-cols-6 h-8">
            <TabsTrigger value="lending" className="text-xs gap-1">
              <Landmark className="size-3" />
              Lend
            </TabsTrigger>
            <TabsTrigger value="swap" className="text-xs gap-1">
              <ArrowLeftRight className="size-3" />
              Swap
            </TabsTrigger>
            <TabsTrigger value="liquidity" className="text-xs gap-1">
              <Droplets className="size-3" />
              LP
            </TabsTrigger>
            <TabsTrigger value="staking" className="text-xs gap-1">
              <Coins className="size-3" />
              Stake
            </TabsTrigger>
            <TabsTrigger value="flash" className="text-xs gap-1">
              <Zap className="size-3" />
              Flash
            </TabsTrigger>
            <TabsTrigger value="transfer" className="text-xs gap-1">
              <Send className="size-3" />
              Transfer
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="lending" className="mt-0">
              <LendingTab />
            </TabsContent>
            <TabsContent value="swap" className="mt-0">
              <SwapTab />
            </TabsContent>
            <TabsContent value="liquidity" className="mt-0">
              <LiquidityTab />
            </TabsContent>
            <TabsContent value="staking" className="mt-0">
              <StakingTab />
            </TabsContent>
            <TabsContent value="flash" className="mt-0">
              <FlashLoanTab />
            </TabsContent>
            <TabsContent value="transfer" className="mt-0">
              <TransferTab />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
