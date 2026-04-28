"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DemoPlanToggle } from "@/components/demo/DemoPlanToggle";
import { Lock } from "lucide-react";

const SECTION_COPY: Record<string, { title: string; bullets: string[] }> = {
  research: {
    title: "Research & ML: DART Full only",
    bullets: [
      "Backtest strategies against historical data",
      "Train and tune ML signal generators",
      "Customise strategy parameters and feature sets",
      "Run paper-trading experiments before promoting to live",
    ],
  },
  promote: {
    title: "Promote to Live: DART Full only",
    bullets: [
      "Promote a paper-tested strategy to the live execution mesh",
      "Set allocation limits and risk parameters",
      "Monitor the first-live-run checklist",
      "Rollback controls for rapid de-allocation",
    ],
  },
};

const DEFAULT_COPY = {
  title: "DART Full: upgrade required",
  bullets: [
    "Full access to Research, ML training and strategy customisation",
    "Promote to live workflow and allocation controls",
    "Advanced backtesting and feature engineering pipeline",
  ],
};

export default function DartLockedPage() {
  const params = useSearchParams();
  const from = params.get("from") ?? "";
  const copy = SECTION_COPY[from] ?? DEFAULT_COPY;

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex size-10 items-center justify-center rounded-full bg-amber-100">
          <Lock className="size-5 text-amber-600" />
        </div>
        <h1 className="text-xl font-semibold">{copy.title}</h1>
      </div>

      <p className="text-muted-foreground mb-4">
        This section is available on the <strong>DART Full</strong> plan. It includes:
      </p>

      <ul className="mb-8 space-y-2 text-sm">
        {copy.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-0.5 text-amber-500">›</span>
            {b}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link href={`/contact?service=dart-full&action=upgrade`}>Upgrade to DART Full</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/services/strategy-catalogue?tab=explore">Browse strategy universe</Link>
        </Button>
        {/* In demo mode, show the tier toggle so prospects can preview Full inline */}
        <DemoPlanToggle />
      </div>
    </main>
  );
}
