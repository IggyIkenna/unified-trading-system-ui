import { Badge } from "@/components/ui/badge";
import type { RollMode } from "@/lib/architecture-v2";
import { cn } from "@/lib/utils";

interface RollModeBadgeProps {
  rollMode: RollMode;
  className?: string;
}

const ROLL_MODE_LABEL: Readonly<Record<RollMode, string>> = {
  rolling: "Rolling",
  fixed: "Fixed",
  both: "Rolling + fixed",
  "n/a": "No roll",
};

const ROLL_MODE_STYLES: Readonly<Record<RollMode, string>> = {
  rolling:
    "border-transparent bg-teal-500/15 text-teal-600 dark:text-teal-400",
  fixed:
    "border-transparent bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  both:
    "border-transparent bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400",
  "n/a": "border-transparent bg-muted text-muted-foreground",
};

export function RollModeBadge({ rollMode, className }: RollModeBadgeProps) {
  return (
    <Badge
      data-testid={`roll-mode-badge-${rollMode}`}
      title={`Dated-future roll: ${ROLL_MODE_LABEL[rollMode]}`}
      className={cn(ROLL_MODE_STYLES[rollMode], "text-[0.65rem]", className)}
    >
      {ROLL_MODE_LABEL[rollMode]}
    </Badge>
  );
}
