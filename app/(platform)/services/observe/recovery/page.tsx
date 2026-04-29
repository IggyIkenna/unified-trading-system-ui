"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Heart,
  Info,
  Power,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldOff,
  Wifi,
  WifiOff,
  XCircle,
  Zap,
} from "lucide-react";
import * as React from "react";
import { MOCK_ENTITIES } from "@/lib/mocks/fixtures/kill-switch-entities";
import { MOCK_TREASURY_RESERVE } from "@/lib/mocks/fixtures/recovery-controls";
import type { CircuitBreakerState, TransferStatus, ReconHealth, ExecConnectivity } from "@/lib/mocks/fixtures/recovery-controls";
import {
  useKillSwitchStatus,
  useKillSwitchActivate,
  useKillSwitchDeactivate,
  useCircuitBreakerStates,
  useForceOpenBreaker,
  useForceCloseBreaker,
  useActiveTransfers,
  useHealthFactors,
  useVenueReconStatus,
} from "@/hooks/api/use-recovery-controls";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatUsd(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${formatNumber(v / 1_000_000, 1)}M`;
  if (Math.abs(v) >= 1_000) return `$${formatNumber(v / 1_000, 1)}K`;
  return `$${formatNumber(v, 0)}`;
}

function cbStateColor(state: CircuitBreakerState): string {
  switch (state) {
    case "CLOSED":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "DEGRADED":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "OPEN":
      return "bg-rose-500/20 text-rose-400 border-rose-500/30";
    case "HALF_OPEN":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  }
}

function cbCardBorder(state: CircuitBreakerState): string {
  switch (state) {
    case "CLOSED":
      return "border-emerald-500/20";
    case "DEGRADED":
      return "border-amber-500/20";
    case "OPEN":
      return "border-rose-500/30";
    case "HALF_OPEN":
      return "border-blue-500/20";
  }
}

function transferStatusColor(status: TransferStatus): string {
  switch (status) {
    case "initiated":
      return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    case "pending":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "confirmed":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    case "failed":
      return "text-rose-400 bg-rose-500/10 border-rose-500/30";
  }
}

function hfColor(hf: number): string {
  if (hf < 1.0) return "text-white bg-zinc-900";
  if (hf < 1.2) return "text-rose-400";
  if (hf < 1.5) return "text-orange-400";
  if (hf < 2.0) return "text-amber-400";
  return "text-emerald-400";
}

function hfBand(hf: number): string {
  if (hf < 1.0) return "LIQUIDATION RISK";
  if (hf < 1.2) return "Critical";
  if (hf < 1.5) return "Warning";
  if (hf < 2.0) return "Caution";
  return "Healthy";
}

function reconHealthColor(health: ReconHealth): string {
  switch (health) {
    case "HEALTHY":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    case "STALE":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "FAILED":
      return "text-rose-400 bg-rose-500/10 border-rose-500/30";
  }
}

function execConnColor(conn: ExecConnectivity): string {
  switch (conn) {
    case "CONNECTED":
      return "text-emerald-400";
    case "DEGRADED":
      return "text-amber-400";
    case "DISCONNECTED":
      return "text-rose-400";
  }
}

// ── Batch Mode Banner ──────────────────────────────────────────────────────

function BatchModeBanner() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border border-sky-500/30 bg-sky-500/5">
      <Info className="size-5 text-sky-400 shrink-0" />
      <div>
        <p className="text-sm font-medium text-sky-400">Recovery controls are only available in live mode</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Switch to Live mode using the toggle above to access manual recovery actions.
        </p>
      </div>
    </div>
  );
}

// ── Section 1: Kill Switch Controls ────────────────────────────────────────

function KillSwitchControls({ disabled }: { disabled: boolean }) {
  const [activateOpen, setActivateOpen] = React.useState(false);
  const [deactivateOpen, setDeactivateOpen] = React.useState(false);
  const [scope, setScope] = React.useState<"firm" | "client" | "strategy" | "venue">("firm");
  const [scopeEntityId, setScopeEntityId] = React.useState<string>("all");
  const [autoDeactivateMinutes, setAutoDeactivateMinutes] = React.useState(30);
  const [autoDeactivateEnabled, setAutoDeactivateEnabled] = React.useState(true);
  const [rationale, setRationale] = React.useState("");
  const [deactivateRationale, setDeactivateRationale] = React.useState("");

  const { data: ksStatus } = useKillSwitchStatus();
  const activateMutation = useKillSwitchActivate();
  const deactivateMutation = useKillSwitchDeactivate();
  const isSubmitting = activateMutation.isPending || deactivateMutation.isPending;

  const scopeEntities = React.useMemo(() => {
    switch (scope) {
      case "client":
        return MOCK_ENTITIES.clients.map((c) => ({ id: c.id, name: c.name }));
      case "strategy":
        return MOCK_ENTITIES.strategies.map((s) => ({ id: s.id, name: s.name }));
      case "venue":
        return MOCK_ENTITIES.venues.map((v) => ({ id: v.id, name: v.name }));
      default:
        return MOCK_ENTITIES.firms.map((f) => ({ id: f.id, name: f.name }));
    }
  }, [scope]);

  const handleActivate = async () => {
    if (!rationale.trim()) return;
    await activateMutation.mutateAsync({
      scope,
      entity_id: scopeEntityId,
      rationale,
      auto_deactivate_minutes: autoDeactivateEnabled ? autoDeactivateMinutes : undefined,
    });
    setActivateOpen(false);
    setRationale("");
  };

  const handleDeactivate = async () => {
    if (!deactivateRationale.trim()) return;
    await deactivateMutation.mutateAsync({ rationale: deactivateRationale });
    setDeactivateOpen(false);
    setDeactivateRationale("");
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Power className="size-4" />
          Kill Switch Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status indicator */}
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
          <div
            className={cn(
              "size-3 rounded-full",
              ksStatus?.isActive ? "bg-rose-500 animate-pulse" : "bg-emerald-500",
            )}
          />
          <div className="flex-1">
            {ksStatus?.isActive ? (
              <div>
                <p className="text-sm font-medium text-rose-400">Kill Switch Active</p>
                <p className="text-xs text-muted-foreground">
                  Scope: {ksStatus?.scope} | Since: {ksStatus?.activeSince} | By: {ksStatus?.activatedBy}
                  {ksStatus?.autoDeactivateMinutes && ` | Auto-off in ${ksStatus?.autoDeactivateMinutes} min`}
                </p>
              </div>
            ) : (
              <p className="text-sm text-emerald-400 font-medium">Kill Switch Inactive</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Dialog open={activateOpen} onOpenChange={setActivateOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="gap-2" disabled={disabled || ksStatus?.isActive}>
                <ShieldAlert className="size-4" />
                Activate Kill Switch
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-[var(--status-error)]">
                  <AlertOctagon className="size-5" />
                  Activate Kill Switch
                </DialogTitle>
                <DialogDescription>
                  This will halt all trading activity within the selected scope.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Scope</label>
                    <Select value={scope} onValueChange={(v: "firm" | "client" | "strategy" | "venue") => setScope(v)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="firm">Firm</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="strategy">Strategy</SelectItem>
                        <SelectItem value="venue">Venue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Entity</label>
                    <Select value={scopeEntityId} onValueChange={setScopeEntityId}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {scopeEntities.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground">Auto-Deactivation Timer</label>
                    <div className="flex items-center gap-2">
                      <Switch checked={autoDeactivateEnabled} onCheckedChange={setAutoDeactivateEnabled} />
                      <span className="text-xs text-muted-foreground">Enable</span>
                    </div>
                  </div>
                  {autoDeactivateEnabled && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={autoDeactivateMinutes}
                        onChange={(e) => setAutoDeactivateMinutes(parseInt(e.target.value) || 30)}
                        className="w-20 h-8"
                        min={5}
                        max={1440}
                      />
                      <span className="text-xs text-muted-foreground">minutes</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Rationale (required)</label>
                  <Textarea
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="Describe the reason for activating the kill switch..."
                    className="h-20"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setActivateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleActivate}
                  disabled={isSubmitting || !rationale.trim()}
                  className="bg-[var(--status-error)] hover:bg-[var(--status-error)]/90"
                >
                  {isSubmitting ? "Activating..." : "Confirm Activation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                disabled={disabled || !ksStatus?.isActive}
              >
                <ShieldOff className="size-4" />
                Deactivate Kill Switch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="size-5" />
                  Deactivate Kill Switch
                </DialogTitle>
                <DialogDescription>
                  This will resume trading activity for the affected scope.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Rationale (required)</label>
                  <Textarea
                    value={deactivateRationale}
                    onChange={(e) => setDeactivateRationale(e.target.value)}
                    placeholder="Describe the reason for deactivating the kill switch..."
                    className="h-20"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeactivateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleDeactivate}
                  disabled={isSubmitting || !deactivateRationale.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSubmitting ? "Deactivating..." : "Confirm Deactivation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Section 2: Circuit Breaker Dashboard ───────────────────────────────────

function CircuitBreakerDashboard({ disabled }: { disabled: boolean }) {
  const [forceRationale, setForceRationale] = React.useState("");
  const [forceTarget, setForceTarget] = React.useState<{ venueId: string; action: "open" | "close" } | null>(null);

  const { data: venues = [] } = useCircuitBreakerStates();
  const forceOpenMutation = useForceOpenBreaker();
  const forceCloseMutation = useForceCloseBreaker();
  const openCount = venues.filter((v) => v.state === "OPEN" || v.state === "DEGRADED").length;
  const cascadePct = venues.length > 0 ? Math.round((openCount / venues.length) * 100) : 0;

  const handleForceAction = async () => {
    if (!forceRationale.trim() || !forceTarget) return;
    if (forceTarget.action === "open") {
      await forceOpenMutation.mutateAsync({ venueId: forceTarget.venueId, rationale: forceRationale });
    } else {
      await forceCloseMutation.mutateAsync({ venueId: forceTarget.venueId, rationale: forceRationale });
    }
    setForceTarget(null);
    setForceRationale("");
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="size-4" />
            Circuit Breaker Dashboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {openCount}/{venues.length} venues degraded/open ({cascadePct}%)
            </span>
            {cascadePct > 50 && (
              <Badge variant="destructive" className="text-[10px]">
                CASCADE WARNING
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {venues.map((venue) => (
            <div
              key={venue.venueId}
              className={cn(
                "p-3 rounded-lg border bg-card space-y-2",
                cbCardBorder(venue.state),
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{venue.venueName}</p>
                  <p className="text-[10px] text-muted-foreground">{venue.domain}</p>
                </div>
                <Badge variant="outline" className={cn("text-[10px]", cbStateColor(venue.state))}>
                  {venue.state}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-muted-foreground">Failure rate: </span>
                  <span className={cn("font-mono", venue.failureRatePct > 50 ? "text-rose-400" : venue.failureRatePct > 10 ? "text-amber-400" : "text-emerald-400")}>
                    {formatNumber(venue.failureRatePct, 1)}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Backoff: </span>
                  <span className="font-mono">{venue.backoffCycle}x</span>
                </div>
                {venue.cooldownRemainingMs > 0 && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Cooldown: </span>
                    <span className="font-mono text-amber-400">{Math.ceil(venue.cooldownRemainingMs / 1000)}s</span>
                  </div>
                )}
              </div>
              <div className="flex gap-1.5 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2 text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                  disabled={disabled || venue.state === "OPEN"}
                  onClick={() => setForceTarget({ venueId: venue.venueId, action: "open" })}
                >
                  Force Open
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                  disabled={disabled || venue.state === "CLOSED"}
                  onClick={() => setForceTarget({ venueId: venue.venueId, action: "close" })}
                >
                  Force Close
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Force action dialog */}
        <Dialog open={forceTarget !== null} onOpenChange={(open) => { if (!open) setForceTarget(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Force {forceTarget?.action === "open" ? "Open" : "Close"} Circuit Breaker
              </DialogTitle>
              <DialogDescription>
                Venue: {forceTarget?.venueId}. This will manually override the circuit breaker state.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Rationale (required)</label>
                <Textarea
                  value={forceRationale}
                  onChange={(e) => setForceRationale(e.target.value)}
                  placeholder="Describe the reason for this override..."
                  className="h-20"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setForceTarget(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleForceAction}
                disabled={!forceRationale.trim()}
                className={cn(
                  forceTarget?.action === "open"
                    ? "bg-[var(--status-error)] hover:bg-[var(--status-error)]/90"
                    : "bg-emerald-600 hover:bg-emerald-700",
                )}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ── Section 3: Transfer Controls ───────────────────────────────────────────

function TransferControls({ disabled }: { disabled: boolean }) {
  const [transferOpen, setTransferOpen] = React.useState(false);
  const [fromVenue, setFromVenue] = React.useState<string>("");
  const [toVenue, setToVenue] = React.useState<string>("");
  const [tokenValue, setTokenValue] = React.useState<string>("");
  const [amount, setAmount] = React.useState<string>("");
  const [transferRationale, setTransferRationale] = React.useState("");

  const { data: transfers = [] } = useActiveTransfers();
  const treasury = MOCK_TREASURY_RESERVE;

  const handleTransfer = async () => {
    if (!transferRationale.trim()) return;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setTransferOpen(false);
    setTransferRationale("");
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowLeftRight className="size-4" />
            Transfer Controls
          </CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Treasury:</span>
            <span className={cn("font-mono", treasury.currentPct < treasury.targetPct ? "text-amber-400" : "text-emerald-400")}>
              {formatNumber(treasury.currentPct, 1)}%
            </span>
            <span className="text-muted-foreground">/ {formatNumber(treasury.targetPct, 1)}% target</span>
            {treasury.currentPct < treasury.targetPct && (
              <span className="text-[10px] text-amber-400">(rebalance {formatUsd(treasury.rebalanceAmountUsd)})</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Transfers Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-[10px]">Status</TableHead>
              <TableHead className="text-[10px]">Type</TableHead>
              <TableHead className="text-[10px]">From</TableHead>
              <TableHead className="text-[10px]">To</TableHead>
              <TableHead className="text-[10px]">Token</TableHead>
              <TableHead className="text-[10px] text-right">Amount</TableHead>
              <TableHead className="text-[10px]">Tx Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>
                  <Badge variant="outline" className={cn("text-[9px]", transferStatusColor(tx.status))}>
                    {tx.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-[11px] font-mono">{tx.type}</TableCell>
                <TableCell className="text-[11px]">{tx.fromVenue}</TableCell>
                <TableCell className="text-[11px]">{tx.toVenue}</TableCell>
                <TableCell className="text-[11px] font-mono">{tx.token}</TableCell>
                <TableCell className="text-[11px] font-mono text-right">{formatNumber(tx.amount, 4)}</TableCell>
                <TableCell className="text-[11px] font-mono text-muted-foreground">
                  {tx.txHash ?? "--"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Manual Transfer Button */}
        <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={disabled}>
              <ArrowLeftRight className="size-4" />
              Initiate Manual Transfer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Initiate Manual Transfer</DialogTitle>
              <DialogDescription>
                Create a cross-venue or internal transfer. Type will be auto-detected.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">From Venue</label>
                  <Select value={fromVenue} onValueChange={setFromVenue}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select venue" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_ENTITIES.venues.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">To Venue</label>
                  <Select value={toVenue} onValueChange={setToVenue}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select venue" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_ENTITIES.venues.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Token</label>
                  <Select value={tokenValue} onValueChange={setTokenValue}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDT">USDT</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="WETH">WETH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Amount</label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-8"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Rationale (required)</label>
                <Textarea
                  value={transferRationale}
                  onChange={(e) => setTransferRationale(e.target.value)}
                  placeholder="Describe the reason for this transfer..."
                  className="h-20"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTransferOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={!transferRationale.trim() || !fromVenue || !toVenue || !tokenValue || !amount}
              >
                Submit Transfer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ── Section 4: Health Factor Panel ─────────────────────────────────────────

function HealthFactorPanel({ disabled }: { disabled: boolean }) {
  const { data: healthFactors = [] } = useHealthFactors();
  const [deleverageTarget, setDeleverageTarget] = React.useState<string | null>(null);
  const [deleverageRationale, setDeleverageRationale] = React.useState("");

  const handleDeleverage = async () => {
    if (!deleverageRationale.trim()) return;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setDeleverageTarget(null);
    setDeleverageRationale("");
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Heart className="size-4" />
          Health Factor Panel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-[10px]">Strategy</TableHead>
              <TableHead className="text-[10px]">Venue</TableHead>
              <TableHead className="text-[10px]">Domain</TableHead>
              <TableHead className="text-[10px] text-right">HF</TableHead>
              <TableHead className="text-[10px]">Band</TableHead>
              <TableHead className="text-[10px] text-right">Collateral</TableHead>
              <TableHead className="text-[10px] text-right">Debt</TableHead>
              <TableHead className="text-[10px] text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {healthFactors.sort((a, b) => a.healthFactor - b.healthFactor).map((entry) => (
              <TableRow key={`${entry.strategyId}-${entry.venue}`}>
                <TableCell className="text-[11px] font-medium">{entry.strategyName}</TableCell>
                <TableCell className="text-[11px] font-mono">{entry.venue}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[9px]">
                    {entry.domain}
                  </Badge>
                </TableCell>
                <TableCell className={cn("text-[11px] font-mono font-semibold text-right", hfColor(entry.healthFactor))}>
                  {formatNumber(entry.healthFactor, 2)}
                </TableCell>
                <TableCell>
                  <span className={cn("text-[10px]", hfColor(entry.healthFactor))}>
                    {hfBand(entry.healthFactor)}
                  </span>
                </TableCell>
                <TableCell className="text-[11px] font-mono text-right">{formatUsd(entry.collateralUsd)}</TableCell>
                <TableCell className="text-[11px] font-mono text-right">{formatUsd(entry.debtUsd)}</TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    disabled={disabled || entry.healthFactor > 2.0}
                    onClick={() => setDeleverageTarget(entry.strategyId)}
                  >
                    Deleverage
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Deleverage confirmation dialog */}
        <Dialog open={deleverageTarget !== null} onOpenChange={(open) => { if (!open) setDeleverageTarget(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[var(--status-warning)]">
                <Zap className="size-5" />
                Confirm Deleverage
              </DialogTitle>
              <DialogDescription>
                This will reduce leverage for strategy: {deleverageTarget}. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Rationale (required)</label>
                <Textarea
                  value={deleverageRationale}
                  onChange={(e) => setDeleverageRationale(e.target.value)}
                  placeholder="Describe the reason for deleveraging..."
                  className="h-20"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleverageTarget(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleDeleverage}
                disabled={!deleverageRationale.trim()}
                className="bg-[var(--status-warning)] hover:bg-[var(--status-warning)]/90 text-black"
              >
                Confirm Deleverage
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ── Section 5: Reconciliation Status ───────────────────────────────────────

function ReconciliationStatus({ disabled }: { disabled: boolean }) {
  const { data: reconStatus = [] } = useVenueReconStatus();
  const [forceReconTarget, setForceReconTarget] = React.useState<string | null>(null);
  const [forceReconRationale, setForceReconRationale] = React.useState("");

  const hasDualFailure = reconStatus.some((v) => v.isDualFailure);

  const handleForceRecon = async () => {
    if (!forceReconRationale.trim()) return;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setForceReconTarget(null);
    setForceReconRationale("");
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <RefreshCw className="size-4" />
          Reconciliation Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dual failure warning */}
        {hasDualFailure && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-rose-500/30 bg-rose-500/5">
            <AlertTriangle className="size-5 text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-rose-400">Dual Failure Detected</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {reconStatus.filter((v) => v.isDualFailure)
                  .map((v) => v.venueName)
                  .join(", ")}{" "}
                -- stale recon + degraded/disconnected execution. Positions may be unreliable.
              </p>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-[10px]">Venue</TableHead>
              <TableHead className="text-[10px]">Recon Health</TableHead>
              <TableHead className="text-[10px]">Exec Connectivity</TableHead>
              <TableHead className="text-[10px]">Last Recon</TableHead>
              <TableHead className="text-[10px] text-right">Drift</TableHead>
              <TableHead className="text-[10px] text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reconStatus.map((venue) => (
              <TableRow key={venue.venueId} className={cn(venue.isDualFailure && "bg-rose-500/5")}>
                <TableCell className="text-[11px] font-medium">
                  <div className="flex items-center gap-1.5">
                    {venue.venueName}
                    {venue.isDualFailure && (
                      <Badge variant="destructive" className="text-[8px] px-1 py-0">
                        DUAL FAILURE
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-[9px]", reconHealthColor(venue.reconHealth))}>
                    {venue.reconHealth}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {venue.execConnectivity === "CONNECTED" ? (
                      <Wifi className="size-3 text-emerald-400" />
                    ) : venue.execConnectivity === "DEGRADED" ? (
                      <Wifi className="size-3 text-amber-400" />
                    ) : (
                      <WifiOff className="size-3 text-rose-400" />
                    )}
                    <span className={cn("text-[10px]", execConnColor(venue.execConnectivity))}>
                      {venue.execConnectivity}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-[11px] font-mono text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(venue.lastReconAt).toLocaleTimeString()}
                  </div>
                </TableCell>
                <TableCell className={cn(
                  "text-[11px] font-mono text-right",
                  venue.driftPct > 2 ? "text-rose-400" : venue.driftPct > 0.5 ? "text-amber-400" : "text-emerald-400",
                )}>
                  {formatNumber(venue.driftPct, 1)}%
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    disabled={disabled}
                    onClick={() => setForceReconTarget(venue.venueId)}
                  >
                    Force Recon
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Link to Position Recon page */}
        <div className="text-xs text-muted-foreground">
          For detailed position drift view, see{" "}
          <a href="/services/observe/reconciliation" className="text-primary hover:underline">
            Position Reconciliation
          </a>
        </div>

        {/* Force recon dialog */}
        <Dialog open={forceReconTarget !== null} onOpenChange={(open) => { if (!open) setForceReconTarget(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Force Reconciliation</DialogTitle>
              <DialogDescription>
                Venue: {forceReconTarget}. This will trigger an immediate position reconciliation cycle.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Rationale (required)</label>
                <Textarea
                  value={forceReconRationale}
                  onChange={(e) => setForceReconRationale(e.target.value)}
                  placeholder="Describe the reason for forcing reconciliation..."
                  className="h-20"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setForceReconTarget(null)}>
                Cancel
              </Button>
              <Button onClick={handleForceRecon} disabled={!forceReconRationale.trim()}>
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function RecoveryControlsPage() {
  const scope = useWorkspaceScope();
  const isBatchMode = scope.mode === "batch";

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">Recovery Controls -- Manual Override</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          These controls trigger the same actions the system takes autonomously. Use when you need to override or
          accelerate the system.
        </p>
      </div>

      {/* Warning banner */}
      <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
        <AlertTriangle className="size-5 text-amber-400 shrink-0" />
        <p className="text-xs text-amber-400">
          All actions require a rationale for the audit trail. Actions are logged and broadcast as recovery events.
        </p>
      </div>

      {isBatchMode && <BatchModeBanner />}

      {/* Section 1: Kill Switch */}
      <KillSwitchControls disabled={isBatchMode} />

      {/* Section 2: Circuit Breakers */}
      <CircuitBreakerDashboard disabled={isBatchMode} />

      {/* Section 3: Transfers */}
      <TransferControls disabled={isBatchMode} />

      {/* Section 4: Health Factors */}
      <HealthFactorPanel disabled={isBatchMode} />

      {/* Section 5: Reconciliation */}
      <ReconciliationStatus disabled={isBatchMode} />
    </div>
  );
}
