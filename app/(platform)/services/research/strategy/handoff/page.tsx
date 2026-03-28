"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Send,
  CheckCircle2,
  Circle,
  ArrowRight,
  Shield,
  ClipboardCheck,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types & Data
// ---------------------------------------------------------------------------

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "backtest-sharpe",
    label: "Backtest Sharpe > 1.5",
    description: "Strategy must exceed minimum Sharpe ratio threshold in walk-forward backtest",
    defaultChecked: true,
  },
  {
    id: "walk-forward",
    label: "Walk-forward validation passed",
    description: "Out-of-sample walk-forward test confirms in-sample results are not overfit",
    defaultChecked: true,
  },
  {
    id: "drawdown-limits",
    label: "Drawdown within limits",
    description: "Maximum drawdown does not exceed -15% risk limit over full backtest period",
    defaultChecked: true,
  },
  {
    id: "risk-committee",
    label: "Risk committee approval",
    description: "Risk committee has reviewed the strategy profile and signed off on risk parameters",
    defaultChecked: false,
  },
  {
    id: "capital-allocation",
    label: "Capital allocation assigned",
    description: "Fund manager has assigned capital allocation and position limits for this strategy",
    defaultChecked: false,
  },
  {
    id: "execution-venue",
    label: "Execution venue confirmed",
    description: "Primary and failover execution venues are configured and connectivity verified",
    defaultChecked: false,
  },
  {
    id: "monitoring-alerts",
    label: "Monitoring alerts configured",
    description: "PnL, drawdown, exposure, and latency alerting rules are active in the alert system",
    defaultChecked: false,
  },
  {
    id: "go-live-date",
    label: "Go-live date scheduled",
    description: "Deployment date agreed with operations, with pre-live shadow trading window defined",
    defaultChecked: false,
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StrategyHandoffPage() {
  const [checked, setChecked] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const item of CHECKLIST_ITEMS) {
      initial[item.id] = item.defaultChecked;
    }
    return initial;
  });

  const completedCount = Object.values(checked).filter(Boolean).length;
  const totalCount = CHECKLIST_ITEMS.length;
  const allComplete = completedCount === totalCount;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  function toggleItem(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-[900px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Send className="size-6" />
              Strategy Handoff to Execution
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Complete all checklist items before submitting for promotion review
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              allComplete
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
            }
          >
            {completedCount} / {totalCount} complete
          </Badge>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Handoff Progress</span>
              <span className="font-mono text-muted-foreground">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-3" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-emerald-400" />
                {completedCount} completed
              </span>
              <span className="flex items-center gap-1">
                <Circle className="size-3" />
                {totalCount - completedCount} remaining
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="size-4" />
              Promotion Checklist
            </CardTitle>
            <CardDescription>
              Each item must be verified before the strategy can go live
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {CHECKLIST_ITEMS.map((item, idx) => {
                const isChecked = checked[item.id] ?? false;
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                      isChecked
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-border/50 hover:border-border"
                    }`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="pt-0.5">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">
                          {idx + 1}.
                        </span>
                        <span
                          className={`font-medium text-sm ${
                            isChecked ? "text-emerald-400" : "text-foreground"
                          }`}
                        >
                          {item.label}
                        </span>
                        {isChecked ? (
                          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="size-4 text-muted-foreground/40 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 ml-5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            size="lg"
            className="flex-1 gap-2"
            disabled={!allComplete}
          >
            <Shield className="size-4" />
            Submit for Review
          </Button>
          <Link href="/services/trading/overview">
            <Button variant="outline" size="lg" className="gap-2">
              Go to Execution
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>

        {!allComplete && (
          <p className="text-xs text-muted-foreground text-center">
            Complete all {totalCount} checklist items to enable submission.{" "}
            {totalCount - completedCount} item{totalCount - completedCount !== 1 ? "s" : ""} remaining.
          </p>
        )}
      </div>
    </div>
  );
}
