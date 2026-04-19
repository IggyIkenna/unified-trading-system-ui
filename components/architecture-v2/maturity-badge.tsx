import { Badge } from "@/components/ui/badge";
import type { StrategyMaturity } from "@/lib/architecture-v2";
import { MATURITY_LABEL } from "@/lib/architecture-v2";
import { cn } from "@/lib/utils";

interface MaturityBadgeProps {
  maturity: StrategyMaturity;
  className?: string;
}

/**
 * Colour convention: dim grey for placeholders (not-yet-external), warm
 * amber for paper/early-live (evaluating), green for LIVE_ALLOCATED
 * (production-grade).
 */
const MATURITY_STYLES: Readonly<Record<StrategyMaturity, string>> = {
  CODE_NOT_WRITTEN:
    "border-dashed border-muted-foreground/40 bg-transparent text-muted-foreground",
  CODE_WRITTEN:
    "border-transparent bg-muted text-muted-foreground",
  CODE_AUDITED:
    "border-transparent bg-slate-500/15 text-slate-600 dark:text-slate-300",
  BACKTESTED:
    "border-transparent bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  PAPER_TRADING:
    "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
  PAPER_TRADING_VALIDATED:
    "border-transparent bg-orange-500/15 text-orange-600 dark:text-orange-400",
  LIVE_TINY:
    "border-transparent bg-lime-500/15 text-lime-600 dark:text-lime-400",
  LIVE_ALLOCATED:
    "border-transparent bg-green-500/20 text-green-600 dark:text-green-400",
};

export function MaturityBadge({ maturity, className }: MaturityBadgeProps) {
  return (
    <Badge
      data-testid={`maturity-badge-${maturity}`}
      title={`Maturity: ${MATURITY_LABEL[maturity]}`}
      className={cn(MATURITY_STYLES[maturity], "font-normal", className)}
    >
      {MATURITY_LABEL[maturity]}
    </Badge>
  );
}
