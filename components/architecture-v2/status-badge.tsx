import { Badge } from "@/components/ui/badge";
import type { CoverageStatus } from "@/lib/architecture-v2";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: CoverageStatus;
  className?: string;
}

const STATUS_STYLES: Readonly<Record<CoverageStatus, string>> = {
  SUPPORTED:
    "border-transparent bg-green-500/15 text-green-600 dark:text-green-400",
  PARTIAL:
    "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
  BLOCKED:
    "border-transparent bg-red-500/15 text-red-600 dark:text-red-400",
  NOT_APPLICABLE:
    "border-transparent bg-muted text-muted-foreground",
};

const STATUS_LABEL: Readonly<Record<CoverageStatus, string>> = {
  SUPPORTED: "Supported",
  PARTIAL: "Partial",
  BLOCKED: "Blocked",
  NOT_APPLICABLE: "N/A",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      data-testid={`status-badge-${status}`}
      className={cn(STATUS_STYLES[status], className)}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}
