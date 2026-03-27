import type { PnLComponent } from "@/lib/types/pnl";

export const DEFAULT_STRUCTURAL_PNL: PnLComponent[] = [
  { name: "Realized", value: 847200, percentage: 81.4, category: "structural" },
  { name: "Unrealized", value: 193400, percentage: 18.6, category: "structural" },
];

export const DEFAULT_RESIDUAL_PNL: PnLComponent = {
  name: "Residual",
  value: 7300,
  percentage: 0.7,
  category: "diagnostic",
};
