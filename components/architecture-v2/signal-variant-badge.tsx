import { Badge } from "@/components/ui/badge";
import type { SignalVariant } from "@/lib/architecture-v2";
import { cn } from "@/lib/utils";

interface SignalVariantBadgeProps {
  variant: SignalVariant;
  className?: string;
}

const SIGNAL_VARIANT_LABEL: Readonly<Record<SignalVariant, string>> = {
  price: "Price",
  funding_rate: "Funding",
  basis: "Basis",
  iv_dispersion: "IV disp.",
  vol_metric: "Vol",
  rate_spread: "Rate spread",
  liquidation_bonus: "Liq. bonus",
  odds: "Odds",
  event_surprise: "Event surprise",
  delta_as_expression: "Delta expr.",
  staking_yield: "Staking yield",
  zscore_reversion: "Z-score",
  momentum_ranking: "Momentum",
  spread_capture: "Spread capture",
};

export function SignalVariantBadge({
  variant,
  className,
}: SignalVariantBadgeProps) {
  return (
    <Badge
      variant="secondary"
      data-testid={`signal-variant-badge-${variant}`}
      className={cn("font-mono text-[0.65rem]", className)}
    >
      {SIGNAL_VARIANT_LABEL[variant]}
    </Badge>
  );
}
