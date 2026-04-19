import { Badge } from "@/components/ui/badge";
import type { LockState } from "@/lib/architecture-v2";
import { LOCK_STATE_LABEL } from "@/lib/architecture-v2";
import { cn } from "@/lib/utils";

interface LockStateBadgeProps {
  state: LockState;
  clientId?: string | null;
  reservingBusinessUnitId?: string | null;
  className?: string;
  /** Shown when the lock is time-bounded (ISO 8601). */
  expiresAtUtc?: string | null;
}

const LOCK_STATE_STYLES: Readonly<Record<LockState, string>> = {
  PUBLIC:
    "border-transparent bg-green-500/15 text-green-500 dark:bg-green-500/20",
  INVESTMENT_MANAGEMENT_RESERVED:
    "border-transparent bg-blue-500/15 text-blue-500 dark:bg-blue-500/20",
  CLIENT_EXCLUSIVE:
    "border-transparent bg-amber-500/20 text-amber-600 dark:text-amber-400",
  RETIRED:
    "border-transparent bg-muted text-muted-foreground line-through",
};

export function LockStateBadge({
  state,
  clientId,
  reservingBusinessUnitId,
  className,
  expiresAtUtc,
}: LockStateBadgeProps) {
  const tooltipParts: string[] = [LOCK_STATE_LABEL[state]];
  if (state === "CLIENT_EXCLUSIVE" && clientId) {
    tooltipParts.push(`bound to ${clientId}`);
  }
  if (state === "INVESTMENT_MANAGEMENT_RESERVED" && reservingBusinessUnitId) {
    tooltipParts.push(`reserved by ${reservingBusinessUnitId}`);
  }
  if (expiresAtUtc) {
    tooltipParts.push(`expires ${expiresAtUtc}`);
  }

  return (
    <Badge
      data-testid={`lock-state-badge-${state}`}
      title={tooltipParts.join(" — ")}
      className={cn(LOCK_STATE_STYLES[state], className)}
    >
      {LOCK_STATE_LABEL[state]}
      {state === "CLIENT_EXCLUSIVE" && clientId ? ` · ${clientId}` : null}
    </Badge>
  );
}
