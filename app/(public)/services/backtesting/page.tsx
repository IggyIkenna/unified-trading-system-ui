import { redirect } from "next/navigation";

/**
 * /services/backtesting is a legacy route — "Research & Build" was
 * retired as a separate commercial path on 2026-04-22. Research,
 * backtest, and strategy promotion all sit inside DART now. Keeping
 * this route alive as a 307 redirect so inbound links still land.
 */
export default function LegacyServicesBacktestingRedirect(): never {
  redirect("/platform");
}
