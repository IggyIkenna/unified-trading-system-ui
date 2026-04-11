"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/shared/spinner";
import {
  Check,
  ChevronRight,
  AlertTriangle,
  Clock,
  Lock,
  Unlock,
  Play,
  XCircle,
  CheckCircle2,
  ArrowRight,
  Shield,
  TestTube,
  Server,
  Rocket,
} from "lucide-react";
import { TESTING_STAGE_CONFIG, type TestingStage } from "@/lib/taxonomy";

// Environment stage with gate requirements
interface EnvironmentGate {
  stage: TestingStage;
  label: string;
  description: string;
  icon: React.ReactNode;
  requirements: {
    id: string;
    label: string;
    status: "passed" | "failed" | "pending" | "skipped";
    mandatory: boolean;
    detail?: string;
  }[];
  status: "completed" | "current" | "locked" | "available";
}

interface PromoteFlowModalProps {
  strategyId: string;
  strategyName: string;
  currentStage: TestingStage;
  onPromote: (targetStage: TestingStage) => Promise<void>;
  trigger?: React.ReactNode;
  className?: string;
}

// Mock gate data based on stage
function getEnvironmentGates(currentStage: TestingStage): EnvironmentGate[] {
  const allStages: EnvironmentGate[] = [
    {
      stage: "MOCK",
      label: "Mock",
      description: "Simulated data, no external connections",
      icon: <TestTube className="size-4" />,
      requirements: [
        {
          id: "unit-tests",
          label: "Unit tests passing",
          status: "passed",
          mandatory: true,
        },
        {
          id: "config-valid",
          label: "Config schema valid",
          status: "passed",
          mandatory: true,
        },
      ],
      status: "completed",
    },
    {
      stage: "HISTORICAL",
      label: "Historical Backtest",
      description: "Run against historical market data",
      icon: <Clock className="size-4" />,
      requirements: [
        {
          id: "backtest-sharpe",
          label: "Sharpe ratio > 1.5",
          status: "passed",
          mandatory: true,
          detail: "Achieved: 2.1",
        },
        {
          id: "backtest-dd",
          label: "Max drawdown < 15%",
          status: "passed",
          mandatory: true,
          detail: "Achieved: 8.2%",
        },
        {
          id: "backtest-trades",
          label: "Min 100 trades",
          status: "passed",
          mandatory: true,
          detail: "Achieved: 847",
        },
        {
          id: "backtest-review",
          label: "Quant review approved",
          status: "passed",
          mandatory: false,
        },
      ],
      status: "completed",
    },
    {
      stage: "LIVE_MOCK",
      label: "Live Mock",
      description: "Live data feeds, simulated execution",
      icon: <Play className="size-4" />,
      requirements: [
        {
          id: "live-mock-24h",
          label: "24h stable operation",
          status: "passed",
          mandatory: true,
          detail: "Ran 72h",
        },
        {
          id: "live-mock-signals",
          label: "Signal generation verified",
          status: "passed",
          mandatory: true,
        },
        {
          id: "live-mock-latency",
          label: "Latency SLA met",
          status: "passed",
          mandatory: true,
          detail: "p99: 45ms",
        },
      ],
      status: "completed",
    },
    {
      stage: "LIVE_TESTNET",
      label: "Testnet",
      description: "Real execution on testnet/paper trading",
      icon: <Server className="size-4" />,
      requirements: [
        {
          id: "testnet-48h",
          label: "48h live operation",
          status: "passed",
          mandatory: true,
        },
        {
          id: "testnet-fills",
          label: "Fill rate > 95%",
          status: "passed",
          mandatory: true,
          detail: "Achieved: 98.2%",
        },
        {
          id: "testnet-recon",
          label: "Position reconciliation passing",
          status: "passed",
          mandatory: true,
        },
        {
          id: "testnet-risk",
          label: "Risk limits respected",
          status: "passed",
          mandatory: true,
        },
      ],
      status: "completed",
    },
    {
      stage: "STAGING",
      label: "Staging",
      description: "Full capital, reduced position limits",
      icon: <Rocket className="size-4" />,
      requirements: [
        {
          id: "staging-14d",
          label: "14-day staging period",
          status: "pending",
          mandatory: true,
          detail: "Day 8 of 14",
        },
        {
          id: "staging-limits",
          label: "Position limits enforced",
          status: "passed",
          mandatory: true,
        },
        {
          id: "staging-monitoring",
          label: "24/7 monitoring active",
          status: "passed",
          mandatory: true,
        },
        {
          id: "staging-risk-review",
          label: "Risk committee approval",
          status: "pending",
          mandatory: true,
        },
      ],
      status: "current",
    },
    {
      stage: "LIVE_REAL",
      label: "Live Production",
      description: "Full capital, full position limits",
      icon: <Rocket className="size-4" />,
      requirements: [
        {
          id: "prod-staging",
          label: "Staging gate complete",
          status: "pending",
          mandatory: true,
        },
        {
          id: "prod-capital",
          label: "Full capital allocated",
          status: "pending",
          mandatory: true,
        },
        {
          id: "prod-cio",
          label: "CIO sign-off",
          status: "pending",
          mandatory: true,
        },
        {
          id: "prod-docs",
          label: "Documentation complete",
          status: "pending",
          mandatory: false,
        },
      ],
      status: "locked",
    },
  ];

  // Update statuses based on current stage
  const currentIndex = allStages.findIndex((s) => s.stage === currentStage);
  return allStages.map((gate, idx) => {
    if (idx < currentIndex) {
      return { ...gate, status: "completed" as const };
    } else if (idx === currentIndex) {
      return { ...gate, status: "current" as const };
    } else if (idx === currentIndex + 1) {
      return { ...gate, status: "available" as const };
    } else {
      return { ...gate, status: "locked" as const };
    }
  });
}

export function PromoteFlowModal({
  strategyId,
  strategyName,
  currentStage,
  onPromote,
  trigger,
  className,
}: PromoteFlowModalProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedStage, setSelectedStage] = React.useState<TestingStage | null>(null);
  const [acknowledgedRisks, setAcknowledgedRisks] = React.useState(false);
  const [isPromoting, setIsPromoting] = React.useState(false);

  const gates = getEnvironmentGates(currentStage);
  const nextGate = gates.find((g) => g.status === "available");
  const selectedGate = selectedStage ? gates.find((g) => g.stage === selectedStage) : null;

  const canPromote = React.useMemo(() => {
    if (!selectedGate) return false;
    if (selectedGate.status === "locked") return false;
    const mandatoryRequirements = selectedGate.requirements.filter((r) => r.mandatory);
    const allMandatoryPassed = mandatoryRequirements.every((r) => r.status === "passed");
    return allMandatoryPassed && acknowledgedRisks;
  }, [selectedGate, acknowledgedRisks]);

  const handlePromote = async () => {
    if (!selectedStage || !canPromote) return;
    setIsPromoting(true);
    try {
      await onPromote(selectedStage);
      setOpen(false);
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className={cn("gap-2", className)}>
            <ArrowRight className="size-4" />
            Promote
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="size-5" />
            Promote Strategy: {strategyName}
          </DialogTitle>
          <DialogDescription>Review environment gates and promote to the next stage</DialogDescription>
        </DialogHeader>

        {/* Stage Progress */}
        <div className="py-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {gates.map((gate, idx) => (
              <React.Fragment key={gate.stage}>
                <button
                  onClick={() => gate.status !== "locked" && setSelectedStage(gate.stage)}
                  disabled={gate.status === "locked"}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all min-w-fit",
                    gate.status === "completed" && "bg-[var(--status-live)]/10 border-[var(--status-live)]/30",
                    gate.status === "current" && "bg-primary/10 border-primary ring-2 ring-primary/20",
                    gate.status === "available" &&
                      "bg-[var(--status-warning)]/10 border-[var(--status-warning)]/30 hover:border-[var(--status-warning)]",
                    gate.status === "locked" && "bg-muted/30 border-border/30 opacity-50 cursor-not-allowed",
                    selectedStage === gate.stage && "ring-2 ring-primary",
                  )}
                >
                  <div
                    className={cn(
                      "size-6 rounded-full flex items-center justify-center",
                      gate.status === "completed" && "bg-[var(--status-live)] text-white",
                      gate.status === "current" && "bg-primary text-primary-foreground",
                      gate.status === "available" && "bg-[var(--status-warning)] text-white",
                      gate.status === "locked" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {gate.status === "completed" ? (
                      <Check className="size-3.5" />
                    ) : gate.status === "locked" ? (
                      <Lock className="size-3" />
                    ) : (
                      gate.icon
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-medium">{gate.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {TESTING_STAGE_CONFIG[gate.stage]?.label || gate.stage}
                    </div>
                  </div>
                </button>
                {idx < gates.length - 1 && <ChevronRight className="size-4 text-muted-foreground shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Selected Gate Details */}
        {selectedGate && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedGate.label}</h3>
                <p className="text-sm text-muted-foreground">{selectedGate.description}</p>
              </div>
              <Badge
                variant={
                  selectedGate.status === "completed"
                    ? "default"
                    : selectedGate.status === "current"
                      ? "secondary"
                      : selectedGate.status === "available"
                        ? "outline"
                        : "secondary"
                }
              >
                {selectedGate.status.toUpperCase()}
              </Badge>
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Gate Requirements</h4>
              <div className="space-y-2">
                {selectedGate.requirements.map((req) => (
                  <div
                    key={req.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      req.status === "passed" && "bg-[var(--status-live)]/5 border-[var(--status-live)]/20",
                      req.status === "failed" && "bg-[var(--status-error)]/5 border-[var(--status-error)]/20",
                      req.status === "pending" && "bg-[var(--status-warning)]/5 border-[var(--status-warning)]/20",
                      req.status === "skipped" && "bg-muted/30 border-border/30",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "size-5 rounded-full flex items-center justify-center",
                          req.status === "passed" && "bg-[var(--status-live)] text-white",
                          req.status === "failed" && "bg-[var(--status-error)] text-white",
                          req.status === "pending" && "bg-[var(--status-warning)] text-white",
                          req.status === "skipped" && "bg-muted text-muted-foreground",
                        )}
                      >
                        {req.status === "passed" && <CheckCircle2 className="size-3" />}
                        {req.status === "failed" && <XCircle className="size-3" />}
                        {req.status === "pending" && <Clock className="size-3" />}
                        {req.status === "skipped" && <span className="text-xs">-</span>}
                      </div>
                      <div>
                        <div className="text-sm font-medium flex items-center gap-2">
                          {req.label}
                          {req.mandatory && (
                            <Badge variant="outline" className="text-xs px-1">
                              Required
                            </Badge>
                          )}
                        </div>
                        {req.detail && <div className="text-xs text-muted-foreground">{req.detail}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Config Changes Diff */}
            {selectedGate.status === "available" && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Config Changes (Staging → Production)</h4>
                <div className="rounded-md border bg-muted/20 p-3 space-y-2 text-sm font-mono">
                  {[
                    {
                      param: "min_funding_rate",
                      current: "0.0001",
                      proposed: "0.00015",
                    },
                    {
                      param: "health_factor_min",
                      current: "1.5",
                      proposed: "1.3",
                    },
                    {
                      param: "max_slippage_bps",
                      current: "50",
                      proposed: "35",
                    },
                  ].map((change) => (
                    <div key={change.param} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{change.param}</span>
                      <div className="flex items-center gap-2">
                        <span className="line-through text-muted-foreground">{change.current}</span>
                        <ArrowRight className="size-3" />
                        <span className="text-[var(--status-warning)] font-medium">{change.proposed}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">3 parameters changed, 9 unchanged</p>
              </div>
            )}

            {/* Risk Acknowledgment */}
            {selectedGate.status === "available" && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/20">
                <AlertTriangle className="size-5 text-[var(--status-warning)] shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Promotion Acknowledgment</p>
                  <p className="text-xs text-muted-foreground">
                    Promoting to {selectedGate.label} will enable {selectedGate.description.toLowerCase()}. This action
                    requires appropriate authorization and cannot be undone automatically.
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={acknowledgedRisks}
                      onCheckedChange={(checked) => setAcknowledgedRisks(checked === true)}
                    />
                    <span className="text-sm">I understand the risks and have appropriate authorization</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No selection state */}
        {!selectedGate && (
          <div className="text-center py-8 text-muted-foreground">
            <Unlock className="size-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select an environment stage to view requirements</p>
            {nextGate && (
              <Button variant="link" size="sm" onClick={() => setSelectedStage(nextGate.stage)} className="mt-2">
                View next stage: {nextGate.label}
              </Button>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {selectedGate?.status === "available" && (
            <Button onClick={handlePromote} disabled={!canPromote || isPromoting} className="gap-2">
              {isPromoting ? (
                <>
                  <Spinner className="size-4" />
                  Promoting...
                </>
              ) : (
                <>
                  <ArrowRight className="size-4" />
                  Promote to {selectedGate.label}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
