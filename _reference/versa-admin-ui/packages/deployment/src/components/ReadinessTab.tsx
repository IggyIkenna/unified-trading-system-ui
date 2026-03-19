import { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  MinusCircle,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Calendar,
  RefreshCw,
  Terminal,
  Info,
  Search,
} from "lucide-react";
import { useServiceChecklist } from "../hooks/useServices";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import type { ChecklistItem, ChecklistCategory } from "../types";

interface ReadinessTabProps {
  serviceName: string;
}

export function ReadinessTab({ serviceName }: ReadinessTabProps) {
  const { checklist, loading, error, refetch } =
    useServiceChecklist(serviceName);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent-cyan)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-3 text-[var(--color-accent-red)]">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!checklist) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-[var(--color-text-muted)]">
            <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Checklist Available</p>
            <p className="text-sm mt-2">
              No production readiness checklist found for {serviceName}.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getReadinessColor = (percent: number) => {
    if (percent >= 90) return "var(--color-accent-green)";
    if (percent >= 70) return "var(--color-accent-cyan)";
    if (percent >= 50) return "var(--color-accent-amber)";
    return "var(--color-accent-red)";
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl font-mono flex items-center gap-2">
                Production Readiness
                <button
                  onClick={() => refetch()}
                  className="p-1 hover:bg-[var(--color-bg-tertiary)] rounded"
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4 text-[var(--color-text-muted)]" />
                </button>
              </CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Last updated: {checklist.last_updated}
              </CardDescription>
            </div>
            <div className="text-right">
              <div
                className="text-3xl font-bold font-mono"
                style={{
                  color: getReadinessColor(checklist.readiness_percent),
                }}
              >
                {checklist.readiness_percent}%
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">
                {checklist.not_applicable_items > 0 ? (
                  <>
                    {checklist.completed_items} of{" "}
                    {checklist.total_items - checklist.not_applicable_items}{" "}
                    applicable items
                  </>
                ) : (
                  <>
                    {checklist.completed_items}/{checklist.total_items} items
                    complete
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Overall progress bar */}
          <div className="space-y-2">
            <div className="h-3 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${checklist.readiness_percent}%`,
                  backgroundColor: getReadinessColor(
                    checklist.readiness_percent,
                  ),
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-[var(--color-accent-green)]" />
                  {checklist.completed_items} done
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[var(--color-accent-amber)]" />
                  {checklist.partial_items} partial
                </span>
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-[var(--color-text-muted)]" />
                  {checklist.pending_items} pending
                </span>
              </div>
              {checklist.not_applicable_items > 0 && (
                <span className="flex items-center gap-1">
                  <MinusCircle className="h-3 w-3" />
                  {checklist.not_applicable_items} n/a
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocking Items */}
      {checklist.blocking_items.length > 0 && (
        <Card className="border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.05)]">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-[var(--color-accent-red)]" />
              <CardTitle className="text-sm text-[var(--color-accent-red)]">
                Blocking Issues ({checklist.blocking_items.length})
              </CardTitle>
            </div>
            <CardDescription>
              These items must be resolved before deployment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checklist.blocking_items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)]"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-[var(--color-accent-red)] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm text-[var(--color-text-primary)]">
                        {item.description}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-1">
                        {item.category} • {item.id}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-[var(--color-text-secondary)] mt-2">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories */}
      <div className="space-y-2">
        {checklist.categories.map((category) => (
          <CategoryCard
            key={category.name}
            category={category}
            expanded={expandedCategories.has(category.name)}
            onToggle={() => toggleCategory(category.name)}
          />
        ))}
      </div>

      {/* Special Validation - instruments-service venue coverage check */}
      {serviceName === "instruments-service" && <VenueCoverageCard />}
    </div>
  );
}

interface CategoryCardProps {
  category: ChecklistCategory;
  expanded: boolean;
  onToggle: () => void;
}

function CategoryCard({ category, expanded, onToggle }: CategoryCardProps) {
  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "var(--color-accent-green)";
    if (percent >= 70) return "var(--color-accent-cyan)";
    if (percent >= 50) return "var(--color-accent-amber)";
    return "var(--color-accent-red)";
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-[var(--color-bg-secondary)] transition-colors py-3"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
            ) : (
              <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
            )}
            <div>
              <CardTitle className="text-sm font-medium">
                {category.display_name}
              </CardTitle>
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {category.completed_items}/{category.total_items} items
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-24 h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${category.percent}%`,
                  backgroundColor: getProgressColor(category.percent),
                }}
              />
            </div>
            <span
              className="text-sm font-mono font-medium w-12 text-right"
              style={{ color: getProgressColor(category.percent) }}
            >
              {category.percent}%
            </span>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-4">
          <div className="space-y-1 mt-2">
            {category.items.map((item) => (
              <ChecklistItemRow key={item.id} item={item} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface ChecklistItemRowProps {
  item: ChecklistItem;
}

function ChecklistItemRow({ item }: ChecklistItemRowProps) {
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (item.status) {
      case "done":
        return (
          <CheckCircle2 className="h-4 w-4 text-[var(--color-accent-green)]" />
        );
      case "partial":
        return <Clock className="h-4 w-4 text-[var(--color-accent-amber)]" />;
      case "pending":
        return (
          <AlertCircle className="h-4 w-4 text-[var(--color-text-muted)]" />
        );
      case "n/a":
        return (
          <MinusCircle className="h-4 w-4 text-[var(--color-text-muted)]" />
        );
      default:
        return (
          <AlertCircle className="h-4 w-4 text-[var(--color-text-muted)]" />
        );
    }
  };

  const getStatusBadge = () => {
    switch (item.status) {
      case "done":
        return <Badge variant="success">Done</Badge>;
      case "partial":
        return <Badge variant="warning">Partial</Badge>;
      case "pending":
        return <Badge variant="default">Pending</Badge>;
      case "n/a":
        return <Badge variant="outline">N/A</Badge>;
      default:
        return <Badge variant="default">{item.status}</Badge>;
    }
  };

  const hasDetails = item.notes || item.verified_date;

  return (
    <div
      className={cn(
        "rounded-lg border border-transparent transition-colors",
        hasDetails &&
          "cursor-pointer hover:border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-tertiary)]",
        item.blocking &&
          item.status !== "done" &&
          "border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.05)]",
      )}
      onClick={() => hasDetails && setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3 p-2">
        <div className="mt-0.5">{getStatusIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "text-sm",
                item.status === "done"
                  ? "text-[var(--color-text-secondary)]"
                  : "text-[var(--color-text-primary)]",
              )}
            >
              {item.description}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {item.blocking && item.status !== "done" && (
                <Badge variant="error">Blocking</Badge>
              )}
              {getStatusBadge()}
            </div>
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5 font-mono">
            {item.id}
          </div>
        </div>
      </div>

      {expanded && hasDetails && (
        <div className="px-2 pb-2 pt-0 ml-7">
          <div className="p-2 rounded bg-[var(--color-bg-tertiary)] text-xs space-y-1">
            {item.notes && (
              <div className="text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-text-muted)]">Notes: </span>
                {item.notes}
              </div>
            )}
            {item.verified_date && (
              <div className="text-[var(--color-text-muted)]">
                Verified: {item.verified_date}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Special validation card for instruments-service venue coverage check.
 *
 * This is a CLI-only feature because it operates differently from normal sharding:
 * - Normal deployments are sharded by date (one shard per day)
 * - Venue coverage check reads parquet files to verify ALL expected venues are present
 * - Cannot be parallelized via normal sharding (would duplicate reads)
 */
function VenueCoverageCard() {
  const [copied, setCopied] = useState(false);
  const cliCommand =
    "python -m unified_trading_deployment.cli data-status -s instruments-service --start-date 2026-01-01 --end-date 2026-01-31 --check-venues";

  const copyCommand = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-[rgba(96,165,250,0.3)] bg-[rgba(96,165,250,0.05)]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-[var(--color-accent-cyan)]" />
          <CardTitle className="text-sm text-[var(--color-accent-cyan)]">
            Venue Coverage Validation
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            CLI Only
          </Badge>
        </div>
        <CardDescription>
          Verify each parquet file contains data for all expected venues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Why CLI only explanation */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
          <Info className="h-4 w-4 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
          <div className="text-xs text-[var(--color-text-secondary)]">
            <p className="font-medium text-[var(--color-text-primary)] mb-1">
              Why is this CLI-only?
            </p>
            <p>
              While deployments now shard by{" "}
              <span className="font-mono">category × venue × date</span> (one
              shard per venue+date), venue coverage validation reads the{" "}
              <span className="font-mono">venue</span> column from parquet files
              to verify all expected venues are present within each file. This
              validates file <em>content</em>, not just file existence.
            </p>
            <p className="mt-2">
              This catches API adapter failures (rate limits, auth errors, empty
              responses) where a venue's API returned no data—issues that file
              existence checks would miss.
            </p>
          </div>
        </div>

        {/* CLI Command */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="h-4 w-4 text-[var(--color-text-muted)]" />
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              Run this command to check venue coverage:
            </span>
          </div>
          <div
            className="p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] font-mono text-xs cursor-pointer hover:border-[var(--color-accent-cyan)] transition-colors relative group"
            onClick={copyCommand}
          >
            <code className="text-[var(--color-text-secondary)] break-all">
              {cliCommand}
            </code>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-[var(--color-accent-cyan)]">
                {copied ? "Copied!" : "Click to copy"}
              </span>
            </div>
          </div>
        </div>

        {/* What it checks */}
        <div className="text-xs text-[var(--color-text-muted)]">
          <span className="font-medium">What it checks:</span>
          <ul className="mt-1 space-y-1 ml-4 list-disc">
            <li>
              For each date, reads only the{" "}
              <code className="font-mono">venue</code> column (efficient)
            </li>
            <li>
              Compares found venues against expected venues from{" "}
              <code className="font-mono">expected_start_dates.yaml</code>
            </li>
            <li>
              Only expects venues that should exist on that date (respects venue
              launch dates)
            </li>
            <li>Parallel checking with 16 threads for fast scanning</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
