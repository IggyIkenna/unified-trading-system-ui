import type { Metadata } from "next";
import { MarketingStaticFromFile } from "@/components/marketing/marketing-static-from-file";

export const metadata: Metadata = {
  title: "Signals — Odum Research",
  description:
    "Odum strategy signals delivered to authenticated counterparty endpoints. You execute on your own infrastructure; we do not see your positions, fills, or P&L.",
};

export default function MarketingSignalsPage() {
  return <MarketingStaticFromFile file="signals.html" />;
}
