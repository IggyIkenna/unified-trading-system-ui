"use client";

import * as React from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Wallet,
  RefreshCw,
  Loader2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  ArrowRightLeft,
  ChevronDown,
  Copy,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/reference-data";
import { useBalances } from "@/hooks/api/use-positions";
import {
  MarginUtilization,
  type VenueMargin,
} from "@/components/trading/margin-utilization";

// Balance record from the API
interface BalanceRecord {
  venue: string;
  free: number;
  locked: number;
  total: number;
  margin_used?: number;
  margin_available?: number;
  margin_total?: number;
}

// ---------- Transfer Types ----------

type TransferType = "venue-to-venue" | "sub-account" | "withdraw" | "deposit";

const CEFI_VENUES = [
  "Binance",
  "OKX",
  "Deribit",
  "Bybit",
  "Hyperliquid",
] as const;
const SUB_ACCOUNT_VENUES = ["Binance", "OKX", "Bybit"] as const;
const TRANSFER_ASSETS = ["USDC", "BTC", "ETH", "SOL"] as const;
const NETWORKS = [
  "Ethereum",
  "Arbitrum",
  "Optimism",
  "Base",
  "Polygon",
] as const;
const SUB_ACCOUNTS = [
  "Trading-1",
  "Trading-2",
  "MM-Alpha",
  "Arb-Beta",
] as const;

interface TransferHistoryEntry {
  timestamp: string;
  type: string;
  from: string;
  to: string;
  asset: string;
  amount: number;
  status: "Completed" | "Pending" | "Processing";
  txHash: string;
}

const MOCK_TRANSFER_HISTORY: TransferHistoryEntry[] = [
  {
    timestamp: "2026-03-23 14:32",
    type: "Venue to Venue",
    from: "Binance",
    to: "OKX",
    asset: "USDC",
    amount: 50_000,
    status: "Completed",
    txHash: "0x3a7f...e2b1",
  },
  {
    timestamp: "2026-03-23 13:15",
    type: "Withdraw",
    from: "Bybit",
    to: "0x7a23...4f91",
    asset: "ETH",
    amount: 12.5,
    status: "Processing",
    txHash: "0x91cd...8f3a",
  },
  {
    timestamp: "2026-03-23 11:48",
    type: "Sub-account",
    from: "Trading-1",
    to: "Main",
    asset: "BTC",
    amount: 2.0,
    status: "Completed",
    txHash: "-",
  },
  {
    timestamp: "2026-03-22 22:05",
    type: "Venue to Venue",
    from: "OKX",
    to: "Deribit",
    asset: "BTC",
    amount: 5.0,
    status: "Completed",
    txHash: "0x6b4e...d102",
  },
  {
    timestamp: "2026-03-22 19:30",
    type: "Deposit",
    from: "0x8b12...c4a3",
    to: "Binance",
    asset: "USDC",
    amount: 100_000,
    status: "Pending",
    txHash: "0xf2a8...7e59",
  },
];

const MOCK_VENUE_BALANCES: Record<string, Record<string, number>> = {
  Binance: { USDC: 125_400, BTC: 3.2, ETH: 45.8, SOL: 312 },
  OKX: { USDC: 89_200, BTC: 1.8, ETH: 22.1, SOL: 150 },
  Deribit: { USDC: 45_000, BTC: 2.1, ETH: 15.0, SOL: 0 },
  Bybit: { USDC: 67_800, BTC: 0.9, ETH: 31.5, SOL: 85 },
  Hyperliquid: { USDC: 34_500, BTC: 0, ETH: 10.2, SOL: 0 },
};

// ---------- Transfer Panel ----------

function TransferPanel() {
  const [transferType, setTransferType] =
    React.useState<TransferType>("venue-to-venue");
  const [fromVenue, setFromVenue] = React.useState<string>(CEFI_VENUES[0]);
  const [toVenue, setToVenue] = React.useState<string>(CEFI_VENUES[1]);
  const [asset, setAsset] = React.useState<string>(TRANSFER_ASSETS[0]);
  const [amount, setAmount] = React.useState("");
  const [toAddress, setToAddress] = React.useState("");
  const [network, setNetwork] = React.useState<string>(NETWORKS[0]);
  const [direction, setDirection] = React.useState<
    "sub-to-main" | "main-to-sub"
  >("sub-to-main");
  const [subAccount, setSubAccount] = React.useState(SUB_ACCOUNTS[0] as string);
  const [copied, setCopied] = React.useState(false);

  const availableBalance = MOCK_VENUE_BALANCES[fromVenue]?.[asset] ?? 0;
  const amountNum = parseFloat(amount) || 0;

  const handleCopyAddress = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ArrowRightLeft className="size-4" />
          Transfer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transfer Type Selector */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Transfer Type</label>
          <Select
            value={transferType}
            onValueChange={(v) => setTransferType(v as TransferType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="venue-to-venue">Venue to Venue</SelectItem>
              <SelectItem value="sub-account">
                Sub-account &harr; Main
              </SelectItem>
              <SelectItem value="withdraw">Withdraw to Wallet</SelectItem>
              <SelectItem value="deposit">Deposit from Wallet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Venue to Venue */}
        {transferType === "venue-to-venue" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  From Venue
                </label>
                <Select
                  value={fromVenue}
                  onValueChange={(v) => setFromVenue(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CEFI_VENUES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  To Venue
                </label>
                <Select value={toVenue} onValueChange={(v) => setToVenue(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CEFI_VENUES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Asset</label>
              <Select value={asset} onValueChange={setAsset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSFER_ASSETS.map((a) => (
                    <SelectItem key={a} value={a}>
                      <span className="font-mono">{a}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Available Balance</span>
                <span className="font-mono">
                  {availableBalance.toLocaleString()} {asset}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Est. Arrival</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  ~30 min (blockchain confirmation)
                </span>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={
                amountNum <= 0 ||
                amountNum > availableBalance ||
                fromVenue === toVenue
              }
            >
              Initiate Transfer
            </Button>
          </div>
        )}

        {/* Sub-account <-> Main */}
        {transferType === "sub-account" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Venue</label>
              <Select value={fromVenue} onValueChange={(v) => setFromVenue(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUB_ACCOUNT_VENUES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <Button
                variant={direction === "sub-to-main" ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setDirection("sub-to-main")}
              >
                Sub &rarr; Main
              </Button>
              <Button
                variant={direction === "main-to-sub" ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setDirection("main-to-sub")}
              >
                Main &rarr; Sub
              </Button>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Sub-account
              </label>
              <Select value={subAccount} onValueChange={setSubAccount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUB_ACCOUNTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Asset</label>
              <Select value={asset} onValueChange={setAsset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSFER_ASSETS.map((a) => (
                    <SelectItem key={a} value={a}>
                      <span className="font-mono">{a}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <div className="p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Transfer Speed</span>
                <span className="text-emerald-400">
                  Instant (no blockchain confirmation)
                </span>
              </div>
            </div>
            <Button className="w-full" disabled={amountNum <= 0}>
              Transfer
            </Button>
          </div>
        )}

        {/* Withdraw to Wallet */}
        {transferType === "withdraw" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                From Venue
              </label>
              <Select value={fromVenue} onValueChange={(v) => setFromVenue(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CEFI_VENUES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                To Address
              </label>
              <Input
                placeholder="0x... or ENS name"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Network / Chain
              </label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Asset</label>
                <Select value={asset} onValueChange={setAsset}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSFER_ASSETS.map((a) => (
                      <SelectItem key={a} value={a}>
                        <span className="font-mono">{a}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>
            <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Available Balance</span>
                <span className="font-mono">
                  {availableBalance.toLocaleString()} {asset}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Network Fee (est.)
                </span>
                <span className="font-mono">~$2.50 ETH gas</span>
              </div>
            </div>
            <Button className="w-full" disabled={amountNum <= 0 || !toAddress}>
              Withdraw
            </Button>
          </div>
        )}

        {/* Deposit from Wallet */}
        {transferType === "deposit" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Deposit to Venue
              </label>
              <Select value={fromVenue} onValueChange={(v) => setFromVenue(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CEFI_VENUES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Network</label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Deposit Address</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-background px-2 py-1 rounded flex-1 truncate">
                    0x7a23b8c1d9e4f6a2b3c5d7e8f0a1b2c3d4e5f691
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs shrink-0"
                    onClick={handleCopyAddress}
                  >
                    {copied ? (
                      <CheckCircle2 className="size-3 text-emerald-400" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
              {/* QR placeholder */}
              <div className="flex items-center justify-center w-32 h-32 mx-auto rounded-lg border-2 border-dashed border-muted-foreground/30 bg-background">
                <span className="text-xs text-muted-foreground">QR</span>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              I&apos;ve sent the deposit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Transfer History ----------

function TransferHistoryTable() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Transfer History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tx Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_TRANSFER_HISTORY.map((tx, idx) => (
              <TableRow key={`${tx.txHash}-${idx}`}>
                <TableCell className="text-xs font-mono whitespace-nowrap">
                  {tx.timestamp}
                </TableCell>
                <TableCell className="text-xs">{tx.type}</TableCell>
                <TableCell className="text-xs font-mono">{tx.from}</TableCell>
                <TableCell className="text-xs font-mono">{tx.to}</TableCell>
                <TableCell className="text-xs font-mono">{tx.asset}</TableCell>
                <TableCell className="text-right text-xs font-mono">
                  {tx.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      tx.status === "Completed" &&
                        "border-emerald-500/50 text-emerald-400",
                      tx.status === "Processing" &&
                        "border-amber-500/50 text-amber-400",
                      tx.status === "Pending" &&
                        "border-blue-500/50 text-blue-400",
                    )}
                  >
                    {tx.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {tx.txHash}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function AccountsPage() {
  const [transferOpen, setTransferOpen] = React.useState(false);
  const { data: balancesRaw, isLoading, error, refetch } = useBalances();

  // Coerce API response to typed array
  const balances: BalanceRecord[] = React.useMemo(() => {
    if (!balancesRaw) return [];
    const raw = balancesRaw as Record<string, unknown>;
    const arr = Array.isArray(raw)
      ? raw
      : (raw as Record<string, unknown>).balances;
    return Array.isArray(arr) ? (arr as BalanceRecord[]) : [];
  }, [balancesRaw]);

  // Compute NAV and aggregate stats
  const totalNAV = React.useMemo(
    () => balances.reduce((sum, b) => sum + b.total, 0),
    [balances],
  );

  const totalFree = React.useMemo(
    () => balances.reduce((sum, b) => sum + b.free, 0),
    [balances],
  );

  const totalLocked = React.useMemo(
    () => balances.reduce((sum, b) => sum + b.locked, 0),
    [balances],
  );

  // Transform balances into VenueMargin for the MarginUtilization component
  const venueMargins: VenueMargin[] = React.useMemo(
    () =>
      balances.map((b) => {
        const marginUsed = b.margin_used ?? b.locked;
        const marginTotal = b.margin_total ?? b.total;
        const marginAvailable = b.margin_available ?? b.free;
        const utilization =
          marginTotal > 0 ? (marginUsed / marginTotal) * 100 : 0;
        return {
          venue: b.venue.toLowerCase().replace(/\s+/g, "-"),
          venueLabel: b.venue,
          used: marginUsed,
          available: marginAvailable,
          total: marginTotal,
          utilization,
          trend:
            utilization > 75
              ? ("up" as const)
              : utilization > 50
                ? ("stable" as const)
                : ("down" as const),
          marginCallDistance: utilization < 90 ? 90 - utilization : undefined,
          lastUpdate: new Date().toLocaleTimeString(),
        };
      }),
    [balances],
  );

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span>Loading accounts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <AlertCircle className="size-8 text-destructive" />
        <p>Failed to load account data</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="size-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <main className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="size-5 text-violet-400" />
          <h1 className="text-xl font-semibold">Accounts</h1>
          <Badge variant="outline" className="text-xs font-mono">
            {balances.length} venues
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={transferOpen ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setTransferOpen(!transferOpen)}
          >
            <ArrowRightLeft className="size-3.5" />
            Transfer
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform",
                transferOpen && "rotate-180",
              )}
            />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => refetch()}
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* NAV Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total NAV</span>
            </div>
            <div className="text-3xl font-semibold font-mono">
              ${formatCurrency(totalNAV)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="size-4 text-[var(--pnl-positive)]" />
              <span className="text-xs text-muted-foreground">
                Available (Free)
              </span>
            </div>
            <div className="text-3xl font-semibold font-mono text-[var(--pnl-positive)]">
              ${formatCurrency(totalFree)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Locked (In Use)
              </span>
            </div>
            <div className="text-3xl font-semibold font-mono">
              ${formatCurrency(totalLocked)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Panel (Collapsible) */}
      <Collapsible open={transferOpen} onOpenChange={setTransferOpen}>
        <CollapsibleContent className="space-y-6">
          <TransferPanel />
          <TransferHistoryTable />
        </CollapsibleContent>
      </Collapsible>

      {/* Margin Utilization Component */}
      {venueMargins.length > 0 && <MarginUtilization venues={venueMargins} />}

      {/* Per-Venue Balance Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Per-Venue Balances</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {balances.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No balance data available
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Venue</TableHead>
                  <TableHead className="text-right">Free</TableHead>
                  <TableHead className="text-right">Locked</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Margin Used</TableHead>
                  <TableHead className="text-right">Margin Available</TableHead>
                  <TableHead className="text-right">Utilization</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.map((b, idx) => {
                  const marginUsed = b.margin_used ?? b.locked;
                  const marginTotal = b.margin_total ?? b.total;
                  const utilization =
                    marginTotal > 0 ? (marginUsed / marginTotal) * 100 : 0;
                  return (
                    <TableRow key={`${b.venue}-${(b as any).account ?? idx}`}>
                      <TableCell className="font-medium">{b.venue}</TableCell>
                      <TableCell className="text-right font-mono">
                        ${formatCurrency(b.free)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${formatCurrency(b.locked)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        ${formatCurrency(b.total)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${formatCurrency(marginUsed)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${formatCurrency(b.margin_available ?? b.free)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-xs",
                            utilization >= 90
                              ? "border-[var(--status-error)] text-[var(--status-error)]"
                              : utilization >= 75
                                ? "border-[var(--status-warning)] text-[var(--status-warning)]"
                                : "border-[var(--status-live)] text-[var(--status-live)]",
                          )}
                        >
                          {utilization.toFixed(0)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
