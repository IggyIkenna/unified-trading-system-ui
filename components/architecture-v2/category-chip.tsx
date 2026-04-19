import { Badge } from "@/components/ui/badge";
import type { VenueCategoryV2 } from "@/lib/architecture-v2";
import { cn } from "@/lib/utils";

interface CategoryChipProps {
  category: VenueCategoryV2;
  className?: string;
}

const CATEGORY_STYLES: Readonly<Record<VenueCategoryV2, string>> = {
  CEFI: "border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400",
  DEFI: "border-transparent bg-violet-500/15 text-violet-600 dark:text-violet-400",
  TRADFI: "border-transparent bg-slate-500/15 text-slate-700 dark:text-slate-300",
  SPORTS: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  PREDICTION: "border-transparent bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

const CATEGORY_LABEL: Readonly<Record<VenueCategoryV2, string>> = {
  CEFI: "CeFi",
  DEFI: "DeFi",
  TRADFI: "TradFi",
  SPORTS: "Sports",
  PREDICTION: "Prediction",
};

export function CategoryChip({ category, className }: CategoryChipProps) {
  return (
    <Badge
      data-testid={`category-chip-${category}`}
      className={cn(CATEGORY_STYLES[category], "font-mono text-[0.65rem]", className)}
    >
      {CATEGORY_LABEL[category]}
    </Badge>
  );
}
