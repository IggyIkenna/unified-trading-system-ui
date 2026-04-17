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
import { useTickingNowMs } from "@/hooks/use-ticking-now";
import { cn } from "@/lib/utils";
import { Activity, AlertOctagon, Ban, Clock, Shield, Timer, TrendingDown, Users, Zap } from "lucide-react";
import * as React from "react";
import { formatNumber } from "@/lib/utils/formatters";
import { MOCK_ENTITIES } from "@/lib/mocks/fixtures/kill-switch-entities";
import { CostComparison } from "@/components/trading/cost-preview-card";
import { useUnwindComparison } from "@/hooks/api/use-unwind-preview";

// Exit playbook types
const EXIT_PLAYBOOKS = [
  {
    id: "STOP_NEW_ONLY",
    name: "Stop New Orders",
    description: "Block new orders, keep existing positions",
    icon: Ban,
    severity: "low",
  },
  {
    id: "FAST_UNWIND",
    name: "Fast Unwind",
    description: "Market orders to close all positions immediately",
    icon: Zap,
    severity: "critical",
  },
  {
    id: "SLOW_UNWIND",
    name: "Slow Unwind (TWAP)",
    description: "TWAP over 30 minutes to minimize impact",
    icon: TrendingDown,
    severity: "high",
  },
  {
    id: "DELTA_HEDGE",
    name: "Delta Hedge",
    description: "Hedge all delta exposure, keep positions",
    icon: Shield,
    severity: "medium",
  },
  {
    id: "DELEVERAGE_SEQUENCE",
    name: "Deleverage Sequence",
    description: "Reduce leverage to 1x progressively",
    icon: Activity,
    severity: "medium",
  },
  {
    id: "ATOMIC_UNWIND",
    name: "Atomic Unwind (DeFi)",
    description: "Single atomic transaction to close all",
    icon: Zap,
    severity: "high",
  },
] as const;

/** Static demo anchor — avoids module-scope Date.now() for lint purity. */
const DEMO_KILL_SWITCH_ARMED_AT_MS = 1_735_689_600_000;

// Mock active kill switches
const ACTIVE_KILL_SWITCHES = [
  {
    id: "ks-001",
    scope: {
      entity: "client",
      entityId: "apex-capital",
      entityName: "Apex Capital",
    },
    strategy: "all",
    venue: "all",
    instrument: "all",
    playbook: "STOP_NEW_ONLY",
    armedAt: new Date(DEMO_KILL_SWITCH_ARMED_AT_MS),
    armedBy: "risk-manager@odum.io",
    autoResumeMinutes: 30,
    autoResumeEnabled: true,
    affectedPositions: 8,
    affectedExposure: 2450000,
  },
];

interface KillSwitchPanelProps {
  className?: string;
}

export function KillSwitchPanel({ className }: KillSwitchPanelProps) {
  const nowMs = useTickingNowMs(1000);
  const [open, setOpen] = React.useState(false);
  const [entityLevel, setEntityLevel] = React.useState<"firm" | "client">("firm");
  const [entityId, setEntityId] = React.useState<string>("all");
  const [strategyId, setStrategyId] = React.useState<string>("all");
  const [venueId, setVenueId] = React.useState<string>("all");
  const [instrumentId, setInstrumentId] = React.useState<string>("all");
  const [playbook, setPlaybook] = React.useState<string>("STOP_NEW_ONLY");
  const [autoResumeMinutes, setAutoResumeMinutes] = React.useState(30);
  const [autoResumeEnabled, setAutoResumeEnabled] = React.useState(true);
  const [rationale, setRationale] = React.useState("");
  const [isArming, setIsArming] = React.useState(false);

  const formatCurrency = (v: number) => {
    if (Math.abs(v) >= 1000000) return `$${formatNumber(v / 1000000, 1)}M`;
    if (Math.abs(v) >= 1000) return `$${formatNumber(v / 1000, 0)}K`;
    return `$${formatNumber(v, 0)}`;
  };

  const selectedPlaybook = EXIT_PLAYBOOKS.find((p) => p.id === playbook);

  // Cost comparison for unwind playbooks
  const unwindExposure = React.useMemo(
    () => (playbook === "FAST_UNWIND" || playbook === "SLOW_UNWIND")
      ? (entityId === "all" ? 120000 : 45000) * 20
      : null,
    [playbook, entityId],
  );
  const { data: costComparison, isLoading: isCostLoading } = useUnwindComparison(unwindExposure);

  // Calculate impact preview (mock)
  const impactPreview = React.useMemo(
    () => ({
      affectedPositions: entityId === "all" ? 24 : 12,
      estimatedImpact: entityId === "all" ? 120000 : 45000,
      impactBps: entityId === "all" ? 42 : 23,
      affectedClients: entityId === "all" ? 5 : 3,
      clientNames: ["Apex Capital", "Meridian Fund", "QuantEdge HK"],
    }),
    [entityId],
  );

  const handleArm = async () => {
    if (!rationale.trim()) return;
    setIsArming(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsArming(false);
    setOpen(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Active Kill Switches */}
      {ACTIVE_KILL_SWITCHES.length > 0 && (
        <Card className="border-[var(--status-error)]/30 bg-[var(--status-error)]/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-[var(--status-error)]">
              <AlertOctagon className="size-4" />
              Active Kill Switches ({ACTIVE_KILL_SWITCHES.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ACTIVE_KILL_SWITCHES.map((ks) => {
              const minutesRemaining = ks.autoResumeEnabled
                ? Math.max(0, ks.autoResumeMinutes - Math.floor((nowMs - ks.armedAt.getTime()) / 60000))
                : null;

              return (
                <div key={ks.id} className="p-3 bg-background rounded-lg border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        {ks.playbook.replace("_", " ")}
                      </Badge>
                      <span className="text-sm font-medium">{ks.scope.entityName}</span>
                      {ks.strategy !== "all" && <span className="text-xs text-muted-foreground">/ {ks.strategy}</span>}
                    </div>
                    <Button variant="outline" size="sm" className="h-6 text-xs">
                      Disarm
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="size-3" />
                      Armed {Math.floor((nowMs - ks.armedAt.getTime()) / 60000)} min ago
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="size-3" />
                      by {ks.armedBy}
                    </div>
                    {minutesRemaining !== null && (
                      <div className="flex items-center gap-1 text-[var(--status-warning)]">
                        <Timer className="size-3" />
                        Auto-resume in {minutesRemaining} min
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Arm New Kill Switch */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" className="gap-2">
            <AlertOctagon className="size-4" />
            Arm Kill Switch
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--status-error)]">
              <AlertOctagon className="size-5" />
              Arm Kill Switch
            </DialogTitle>
            <DialogDescription>Configure the scope and exit playbook for the kill switch.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Section 1: Scope Selector */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Scope Selector</h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Entity Level</label>
                  <Select value={entityLevel} onValueChange={(v: "firm" | "client") => setEntityLevel(v)}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="firm">Firm</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">{entityLevel === "firm" ? "Firm" : "Client"}</label>
                  <Select value={entityId} onValueChange={setEntityId}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {(entityLevel === "firm" ? MOCK_ENTITIES.firms : MOCK_ENTITIES.clients).map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Strategy</label>
                  <Select value={strategyId} onValueChange={setStrategyId}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {MOCK_ENTITIES.strategies.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Venue</label>
                  <Select value={venueId} onValueChange={setVenueId}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {MOCK_ENTITIES.venues.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 2: Exit Playbook */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Exit Playbook</h4>
              <div className="grid grid-cols-2 gap-2">
                {EXIT_PLAYBOOKS.map((pb) => {
                  const Icon = pb.icon;
                  return (
                    <button
                      key={pb.id}
                      onClick={() => setPlaybook(pb.id)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        playbook === pb.id
                          ? pb.severity === "critical"
                            ? "border-[var(--status-error)] bg-[var(--status-error)]/5 ring-2 ring-[var(--status-error)]/20"
                            : pb.severity === "high"
                              ? "border-[var(--status-warning)] bg-[var(--status-warning)]/5 ring-2 ring-[var(--status-warning)]/20"
                              : "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-border/80",
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          className={cn(
                            "size-4",
                            pb.severity === "critical" && "text-[var(--status-error)]",
                            pb.severity === "high" && "text-[var(--status-warning)]",
                            pb.severity === "medium" && "text-blue-500",
                            pb.severity === "low" && "text-muted-foreground",
                          )}
                        />
                        <span className="font-medium text-sm">{pb.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{pb.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auto-Deactivate Timer */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Auto-Deactivate Timer</h4>
                <div className="flex items-center gap-2">
                  <Switch checked={autoResumeEnabled} onCheckedChange={setAutoResumeEnabled} />
                  <span className="text-xs text-muted-foreground">Enable auto-resume</span>
                </div>
              </div>
              {autoResumeEnabled && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Auto-resume after:</span>
                  <Input
                    type="number"
                    value={autoResumeMinutes}
                    onChange={(e) => setAutoResumeMinutes(parseInt(e.target.value) || 30)}
                    className="w-20 h-8"
                    min={5}
                    max={1440}
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
              )}
            </div>

            {/* Impact Preview */}
            <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
              <h4 className="text-sm font-medium">Impact Preview</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Affected positions:</span>
                  <span className="ml-2 font-mono font-medium">{impactPreview.affectedPositions}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Affected clients:</span>
                  <span className="ml-2 font-mono font-medium">{impactPreview.affectedClients}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Clients:</span>
                  <span className="ml-2 text-xs">{impactPreview.clientNames.join(", ")}</span>
                </div>
              </div>
              {/* Cost breakdown for unwind playbooks */}
              {(playbook === "FAST_UNWIND" || playbook === "SLOW_UNWIND") && (
                <>
                  {isCostLoading && (
                    <div className="text-xs text-muted-foreground">Loading cost comparison...</div>
                  )}
                  {costComparison && (
                    <CostComparison
                      conservative={costComparison.conservative}
                      aggressive={costComparison.aggressive}
                    />
                  )}
                </>
              )}
            </div>

            {/* Rationale */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Rationale (required)</label>
              <Textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Describe the reason for arming this kill switch..."
                className="h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleArm}
              disabled={isArming || !rationale.trim()}
              className="bg-[var(--status-error)] hover:bg-[var(--status-error)]/90"
            >
              {isArming ? "Arming..." : "Confirm & Arm Kill Switch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
