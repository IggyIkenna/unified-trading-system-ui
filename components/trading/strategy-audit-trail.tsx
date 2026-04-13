"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Activity,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  Ban,
} from "lucide-react";
import { formatPercent } from "@/lib/utils/formatters";
import { MOCK_DECISIONS, type DecisionType, type SignalSource } from "@/lib/mocks/fixtures/strategy-audit-decisions";

function getDecisionTypeConfig(type: DecisionType) {
  switch (type) {
    case "ENTRY":
      return {
        color: "var(--status-live)",
        icon: ArrowUpRight,
        label: "ENTRY",
      };
    case "EXIT":
      return {
        color: "var(--pnl-negative)",
        icon: ArrowDownRight,
        label: "EXIT",
      };
    case "HOLD":
      return { color: "#6b7280", icon: Shield, label: "HOLD" };
    case "REBALANCE":
      return { color: "#3b82f6", icon: Activity, label: "REBALANCE" };
    case "SKIP":
      return { color: "#6b7280", icon: Ban, label: "SKIP" };
  }
}

function getSignalSourceConfig(source: SignalSource) {
  switch (source) {
    case "ML_MODEL":
      return { color: "#a855f7", icon: Brain, label: "ML Model" };
    case "RULE_ENGINE":
      return { color: "#3b82f6", icon: Target, label: "Rule Engine" };
    case "MANUAL":
      return { color: "#6b7280", icon: Activity, label: "Manual" };
    case "RISK_OVERRIDE":
      return {
        color: "var(--status-warning)",
        icon: Shield,
        label: "Risk Override",
      };
  }
}

interface StrategyAuditTrailProps {
  strategyId?: string;
  className?: string;
}

export function StrategyAuditTrail({ strategyId, className }: StrategyAuditTrailProps) {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set(["dec-001"]));

  const filteredDecisions = strategyId ? MOCK_DECISIONS.filter((d) => d.strategyId === strategyId) : MOCK_DECISIONS;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="size-4" />
          Strategy Decision Audit Trail
          <Badge variant="secondary" className="ml-auto text-xs">
            {filteredDecisions.length} decisions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {filteredDecisions.map((decision) => {
              const decisionConfig = getDecisionTypeConfig(decision.decisionType);
              const sourceConfig = getSignalSourceConfig(decision.signalSource);
              const DecisionIcon = decisionConfig.icon;
              const SourceIcon = sourceConfig.icon;
              const isExpanded = expandedIds.has(decision.id);

              return (
                <Collapsible key={decision.id} open={isExpanded}>
                  <div
                    className={cn(
                      "rounded-lg border transition-all",
                      isExpanded ? "border-border bg-secondary/20" : "border-border/50",
                    )}
                  >
                    {/* Summary Row */}
                    <CollapsibleTrigger asChild>
                      <button
                        onClick={() => toggleExpand(decision.id)}
                        className="w-full p-3 flex items-center gap-3 text-left hover:bg-secondary/30 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-4 text-muted-foreground" />
                        )}

                        <span className="font-mono text-xs text-muted-foreground w-16">{decision.timestamp}</span>

                        <div
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                          style={{ color: decisionConfig.color }}
                        >
                          <DecisionIcon className="size-3" />
                          {decisionConfig.label}
                        </div>

                        <span className="text-sm font-medium truncate max-w-[140px]">{decision.strategyName}</span>

                        <div className="flex items-center gap-1 text-xs" style={{ color: sourceConfig.color }}>
                          <SourceIcon className="size-3" />
                          {sourceConfig.label}
                        </div>

                        <span className="text-xs text-muted-foreground">
                          conf: {formatPercent(decision.confidence * 100, 0)}
                        </span>

                        {decision.executed ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] gap-1 text-[var(--status-live)] border-[var(--status-live)]"
                          >
                            <Zap className="size-2.5" />
                            Executed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Not Executed
                          </Badge>
                        )}
                      </button>
                    </CollapsibleTrigger>

                    {/* Expanded Details */}
                    <CollapsibleContent>
                      <div className="px-3 pb-3 pt-0 border-t border-border/50 mt-1 space-y-3">
                        {/* Input Features */}
                        <div>
                          <h5 className="text-xs font-medium text-muted-foreground mb-1.5">Input Features</h5>
                          <div className="grid grid-cols-4 gap-2">
                            {decision.inputFeatures.map((f) => (
                              <div key={f.name} className="px-2 py-1 rounded bg-secondary/50 text-xs">
                                <span className="text-muted-foreground">{f.name}:</span>{" "}
                                <span className="font-mono">{f.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Trade Details */}
                        {decision.instrument && (
                          <div>
                            <h5 className="text-xs font-medium text-muted-foreground mb-1.5">Trade Details</h5>
                            <div className="flex items-center gap-4 text-xs">
                              <span>
                                <span className="text-muted-foreground">Instrument:</span>{" "}
                                <span className="font-mono">{decision.instrument}</span>
                              </span>
                              {decision.side && (
                                <span
                                  className={
                                    decision.side === "BUY" ? "text-[var(--status-live)]" : "text-[var(--pnl-negative)]"
                                  }
                                >
                                  {decision.side}
                                </span>
                              )}
                              {decision.size && (
                                <span>
                                  <span className="text-muted-foreground">Size:</span>{" "}
                                  <span className="font-mono">${decision.size.toLocaleString()}</span>
                                </span>
                              )}
                              {decision.entryPrice && (
                                <span>
                                  <span className="text-muted-foreground">Price:</span>{" "}
                                  <span className="font-mono">{decision.entryPrice}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Risk Checks */}
                        <div>
                          <h5 className="text-xs font-medium text-muted-foreground mb-1.5">Risk Checks</h5>
                          <div className="flex flex-wrap gap-2">
                            {decision.riskChecks.map((check, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  "flex items-center gap-1.5 px-2 py-1 rounded text-xs",
                                  check.passed
                                    ? "bg-[var(--status-live)]/10 text-[var(--status-live)]"
                                    : "bg-[var(--status-error)]/10 text-[var(--status-error)]",
                                )}
                              >
                                {check.passed ? "✓" : "✗"} {check.name}
                                <span className="text-muted-foreground">({check.details})</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Execution Details */}
                        {decision.executed && decision.executionId && (
                          <div>
                            <h5 className="text-xs font-medium text-muted-foreground mb-1.5">Execution</h5>
                            <div className="flex items-center gap-4 text-xs">
                              <span>
                                <span className="text-muted-foreground">ID:</span>{" "}
                                <span className="font-mono">{decision.executionId}</span>
                              </span>
                              {decision.executionPrice && (
                                <span>
                                  <span className="text-muted-foreground">Fill:</span>{" "}
                                  <span className="font-mono">{decision.executionPrice}</span>
                                </span>
                              )}
                              {decision.slippage !== undefined && (
                                <span
                                  className={
                                    decision.slippage <= 0 ? "text-[var(--status-live)]" : "text-[var(--pnl-negative)]"
                                  }
                                >
                                  Slippage: {formatPercent(decision.slippage * 100, 3)}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Override Info */}
                        {decision.overrideReason && (
                          <div className="px-2 py-1.5 rounded bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/30 text-xs">
                            <span className="text-[var(--status-warning)] font-medium">Override:</span>{" "}
                            {decision.overrideReason}
                            {decision.overrideBy && (
                              <span className="text-muted-foreground"> by {decision.overrideBy}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
