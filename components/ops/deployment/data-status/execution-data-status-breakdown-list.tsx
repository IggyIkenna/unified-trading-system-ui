"use client";

import type { ReactNode } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BreakdownItem } from "@/components/ops/deployment/data-status/execution-data-status-types";
import {
  getCompletionBadgeClass,
  getCompletionColor,
} from "@/components/ops/deployment/data-status/execution-data-status-utils";
import { formatPercent } from "@/lib/utils/formatters";

interface ExecutionDataStatusBreakdownListProps {
  breakdown: Record<string, BreakdownItem>;
  labelKey: string;
  icon: ReactNode;
  expandedBreakdowns: Set<string>;
  toggleBreakdown: (key: string) => void;
}

export function ExecutionDataStatusBreakdownList({
  breakdown,
  labelKey,
  icon,
  expandedBreakdowns,
  toggleBreakdown,
}: ExecutionDataStatusBreakdownListProps) {
  return (
    <div className="space-y-2">
      {Object.entries(breakdown).map(([name, item]) => {
        const key = `${labelKey}-${name}`;
        const isExpanded = expandedBreakdowns.has(key);
        const isComplete = item.completion_pct >= 100;

        return (
          <div key={name} className="border border-[var(--color-border-subtle)] rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              onClick={() => toggleBreakdown(key)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--color-bg-secondary)] transition-colors h-auto"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                )}
                {icon}
                <span className="font-medium font-mono">{name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-text-muted)]">
                  {item.with_results} / {item.total}
                </span>
                {!isComplete && item.missing_count > 0 && (
                  <Badge variant="outline" className="status-error">
                    {item.missing_count} missing
                  </Badge>
                )}
                <Badge variant="outline" className={getCompletionBadgeClass(item.completion_pct)}>
                  {formatPercent(item.completion_pct, 0)}
                </Badge>
                <div className="w-20 h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${item.completion_pct}%`,
                      backgroundColor: getCompletionColor(item.completion_pct),
                    }}
                  />
                </div>
              </div>
            </Button>

            {isExpanded && item.missing_samples.length > 0 && (
              <div className="bg-[var(--color-bg-secondary)] px-4 py-3">
                <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                  Missing configs (sample of {Math.min(5, item.missing_count)}):
                </p>
                <div className="space-y-1">
                  {item.missing_samples.map((path, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs font-mono bg-[var(--color-bg-tertiary)] px-2 py-1 rounded"
                    >
                      <XCircle className="h-3 w-3 text-[var(--color-accent-red)] shrink-0" />
                      <span className="truncate" title={path}>
                        {path}
                      </span>
                    </div>
                  ))}
                  {item.missing_count > 5 && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-2">... and {item.missing_count - 5} more</p>
                  )}
                </div>
              </div>
            )}

            {isExpanded && item.missing_samples.length === 0 && (
              <div className="bg-[var(--color-bg-secondary)] px-4 py-6 text-center">
                <CheckCircle2 className="h-6 w-6 text-[var(--color-accent-green)] mx-auto mb-2" />
                <p className="text-sm text-[var(--color-text-muted)]">All configs have results</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
