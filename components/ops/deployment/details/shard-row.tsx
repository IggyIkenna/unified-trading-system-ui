"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ShardEvent } from "@/lib/types/deployment";
import { cn } from "@/lib/utils";
import { CheckCircle2, CheckSquare, Clock, FileText, RotateCcw, Square, StopCircle, XCircle } from "lucide-react";
import type { ShardDetail } from "./deployment-details-types";

interface ShardRowProps {
  shard: ShardDetail;
  selected?: boolean;
  onSelect?: () => void;
  onCancel?: () => void;
  onViewLogs?: () => void;
  cancelling?: boolean;
  classification?: string;
  vmEvents?: ShardEvent[];
}

const CLASSIFICATION_STYLES: Record<string, { color: string; bg: string }> = {
  VERIFIED: {
    color: "var(--color-class-verified)",
    bg: "var(--color-class-verified-bg)",
  },
  EXPECTED_SKIP: {
    color: "var(--color-class-expected-skip)",
    bg: "var(--color-class-expected-skip-bg)",
  },
  DATA_STALE: {
    color: "var(--color-class-data-stale)",
    bg: "var(--color-class-data-stale-bg)",
  },
  DATA_MISSING: {
    color: "var(--color-class-data-missing)",
    bg: "var(--color-class-data-missing-bg)",
  },
  UNVERIFIED: {
    color: "var(--color-class-unverified)",
    bg: "var(--color-class-unverified-bg)",
  },
  COMPLETED_WITH_ERRORS: {
    color: "var(--color-class-error)",
    bg: "var(--color-class-error-bg)",
  },
  COMPLETED_WITH_WARNINGS: {
    color: "var(--color-class-warning)",
    bg: "var(--color-class-warning-bg)",
  },
  INFRA_FAILURE: {
    color: "var(--color-class-warning)",
    bg: "var(--color-class-warning-bg)",
  },
  TIMEOUT_FAILURE: {
    color: "var(--color-class-warning)",
    bg: "var(--color-class-warning-bg)",
  },
  CODE_FAILURE: {
    color: "var(--color-class-error)",
    bg: "var(--color-class-error-bg)",
  },
  VM_DIED: {
    color: "var(--color-class-error)",
    bg: "var(--color-class-error-bg)",
  },
  NEVER_RAN: {
    color: "var(--color-class-unverified)",
    bg: "var(--color-class-unverified-bg)",
  },
  CANCELLED: {
    color: "var(--color-class-unverified)",
    bg: "var(--color-class-unverified-bg)",
  },
  STILL_RUNNING: {
    color: "var(--color-class-expected-skip)",
    bg: "var(--color-class-expected-skip-bg)",
  },
};

const VM_EVENT_BADGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  VM_PREEMPTED: {
    label: "Preempted",
    color: "var(--color-accent-amber)",
    bg: "var(--color-event-amber-bg)",
  },
  CONTAINER_OOM: {
    label: "OOM",
    color: "var(--color-accent-red)",
    bg: "var(--color-event-red-bg)",
  },
  VM_QUOTA_EXHAUSTED: {
    label: "Quota",
    color: "var(--color-accent-amber)",
    bg: "var(--color-event-amber-bg)",
  },
  VM_ZONE_UNAVAILABLE: {
    label: "Zone N/A",
    color: "var(--color-accent-amber)",
    bg: "var(--color-event-amber-bg)",
  },
  CLOUD_RUN_REVISION_FAILED: {
    label: "Rev Failed",
    color: "var(--color-accent-red)",
    bg: "var(--color-event-red-bg)",
  },
  VM_TIMEOUT: {
    label: "Timeout",
    color: "var(--color-accent-amber)",
    bg: "var(--color-event-amber-bg)",
  },
  VM_DELETED: {
    label: "VM Deleted",
    color: "var(--color-text-muted)",
    bg: "var(--color-event-gray-bg)",
  },
};

export function ShardRow({
  shard,
  selected,
  onSelect,
  onCancel,
  onViewLogs,
  cancelling,
  classification,
  vmEvents,
}: ShardRowProps) {
  const getIcon = () => {
    switch (shard.status) {
      case "succeeded":
        return <CheckCircle2 className="h-4 w-4 text-[var(--color-accent-green)]" />;
      case "running":
        return <Spinner className="h-4 w-4 text-[var(--color-accent-cyan)]" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-[var(--color-accent-red)]" />;
      case "pending":
        return <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />;
      case "cancelled":
        return <StopCircle className="h-4 w-4 text-[var(--color-accent-amber)]" />;
      default:
        return <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />;
    }
  };

  // Get retry badge styling based on outcome
  const getRetryBadge = () => {
    if (!shard.retries || shard.retries === 0) return null;

    if (shard.status === "succeeded") {
      // Succeeded after retry - green
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-[var(--color-status-success-bg-tag)] text-[var(--color-accent-green)]">
          <RotateCcw className="h-3 w-3" />
          {shard.retries}→OK
        </span>
      );
    } else if (shard.status === "failed") {
      // Failed after retries - red
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-[var(--color-status-error-bg-tag)] text-[var(--color-accent-red)]">
          <RotateCcw className="h-3 w-3" />
          {shard.retries}→X
        </span>
      );
    } else {
      // Still retrying - yellow
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-[var(--color-status-warning-bg-tag)] text-[var(--color-accent-amber)]">
          <RotateCcw className="h-3 w-3" />
          retry {shard.retries}
        </span>
      );
    }
  };

  const isRunning = shard.status === "running";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 bg-[var(--color-bg-secondary)]",
        selected && "bg-[var(--color-status-running-bg)]",
      )}
    >
      {/* Selection checkbox - only for running shards */}
      {isRunning && onSelect && (
        <div
          className="shrink-0 cursor-pointer p-1 rounded hover:bg-[var(--color-bg-tertiary)]"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {selected ? (
            <CheckSquare className="h-4 w-4 text-[var(--color-accent-cyan)]" />
          ) : (
            <Square className="h-4 w-4 text-[var(--color-text-muted)]" />
          )}
        </div>
      )}

      {getIcon()}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono text-[var(--color-text-primary)] truncate">{shard.shard_id}</code>
          {getRetryBadge()}
          {shard.args?.includes("--force") && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--color-status-purple-bg-tag)] text-[var(--color-accent-purple)]">
              --force
            </span>
          )}
          {classification && (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                color: CLASSIFICATION_STYLES[classification]?.color ?? "var(--color-class-unverified)",
                backgroundColor: CLASSIFICATION_STYLES[classification]?.bg ?? "var(--color-class-unverified-bg)",
              }}
            >
              {classification.replace(/_/g, " ")}
            </span>
          )}
          {/* VM event badges — derived from event timeline */}
          {vmEvents &&
            vmEvents.length > 0 &&
            Array.from(new Set(vmEvents.map((e) => e.event_type).filter((t) => t in VM_EVENT_BADGE_CONFIG))).map(
              (eventType) => {
                const cfg = VM_EVENT_BADGE_CONFIG[eventType];
                return cfg ? (
                  <span
                    key={eventType}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ color: cfg.color, backgroundColor: cfg.bg }}
                    title={eventType}
                  >
                    {cfg.label}
                  </span>
                ) : null;
              },
            )}
        </div>
        {/* CLI args (compact, hover for full) */}
        {shard.args && shard.args.length > 0 && (
          <p
            className="text-[10px] text-[var(--color-text-muted)] mt-0.5 truncate max-w-[500px] font-mono cursor-help"
            title={shard.args.join(" ")}
          >
            {shard.args.join(" ")}
          </p>
        )}
        {shard.error_message && (
          <p className="text-xs text-[var(--color-accent-red)] mt-1 truncate">{shard.error_message}</p>
        )}
      </div>

      {/* View logs button */}
      {onViewLogs && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onViewLogs();
          }}
          title="View shard logs"
        >
          <FileText className="h-3 w-3 text-[var(--color-text-muted)] hover:text-[var(--color-accent-cyan)]" />
        </Button>
      )}

      {/* Individual cancel button - only for running shards */}
      {isRunning && onCancel && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          disabled={cancelling}
          title="Cancel this shard"
        >
          {cancelling ? (
            <Spinner size="sm" className="h-3 w-3" />
          ) : (
            <StopCircle className="h-3 w-3 text-[var(--color-accent-red)]" />
          )}
        </Button>
      )}
    </div>
  );
}
