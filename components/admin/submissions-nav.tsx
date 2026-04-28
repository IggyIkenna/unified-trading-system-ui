"use client";

/**
 * SubmissionsNav — sub-navigation strip rendered at the top of both
 * `/admin/questionnaires` and `/admin/strategy-evaluations`.
 *
 * Both admin pages query different Firestore collections (light
 * `questionnaires` vs depth `strategy_evaluations`) but they live in the
 * same prospect-funnel — admins want to see both result sets without
 * remembering two URLs. This strip puts them side by side with the
 * current tab highlighted.
 *
 * Order matches the funnel order (light intake -> depth DDQ).
 */

import Link from "next/link";
import { cn } from "@/lib/utils";

export type SubmissionsTab = "questionnaires" | "strategy-evaluations";

const TABS: { key: SubmissionsTab; label: string; href: string; description: string }[] = [
  {
    key: "questionnaires",
    label: "Light questionnaire",
    href: "/admin/questionnaires",
    description: "Brief intake: service family, asset groups, structure, contact",
  },
  {
    key: "strategy-evaluations",
    label: "Strategy evaluation",
    href: "/admin/strategy-evaluations",
    description: "Full DDQ: methodology, performance, structure, file uploads",
  },
];

export function SubmissionsNav({ active }: { active: SubmissionsTab }) {
  return (
    <nav
      data-testid="submissions-nav"
      aria-label="Prospect submissions navigation"
      className="mb-6 flex flex-wrap items-stretch gap-2 border-b border-border/60 pb-3"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 min-w-[200px] flex-col rounded-md border px-3 py-2 transition-colors",
              isActive
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border/60 bg-card/30 text-muted-foreground hover:border-border hover:bg-card/60 hover:text-foreground",
            )}
          >
            <span className="text-sm font-semibold">{tab.label}</span>
            <span className="mt-0.5 text-xs leading-snug">{tab.description}</span>
          </Link>
        );
      })}
    </nav>
  );
}
