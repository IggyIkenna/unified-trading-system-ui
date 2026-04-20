"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ErrorBoundary } from "@/components/shared/error-boundary";
import { cn } from "@/lib/utils";

/**
 * IM Funds service layout — Row-2 navigation for the fund-administration
 * surface. Five entries mirror the REST shape of fund-administration-service:
 * overview / subscriptions / redemptions / allocations / history.
 *
 * No entitlement gate is wired at the layout level — per-action gating
 * (e.g. the Rebalance button) happens on the allocations page via
 * `useIsOpsUser()` (see `lib/auth/ops-user.ts`). Layout-level gating would
 * require a new `fund-administration` entitlement in the auth config which
 * is out of scope for Phase 3 of the plan.
 */

interface ImFundsTab {
  label: string;
  href: string;
  exact?: boolean;
}

const IM_FUNDS_TABS: ImFundsTab[] = [
  { label: "Overview", href: "/services/im/funds", exact: true },
  { label: "Subscriptions", href: "/services/im/funds/subscriptions" },
  { label: "Redemptions", href: "/services/im/funds/redemptions" },
  { label: "Allocations", href: "/services/im/funds/allocations" },
  { label: "History", href: "/services/im/funds/history" },
];

function isTabActive(pathname: string, tab: ImFundsTab): boolean {
  if (tab.exact) return pathname === tab.href;
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

export default function ImFundsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";

  return (
    <>
      <div
        className="border-b border-border bg-card/30"
        data-testid="im-funds-tabs-root"
      >
        <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6">
          <nav
            className="flex gap-1 pt-3 pb-0 -mb-px overflow-x-auto [-webkit-overflow-scrolling:touch] scrollbar-none"
            aria-label="IM Funds sections"
          >
            {IM_FUNDS_TABS.map((tab) => {
              const active = isTabActive(pathname, tab);
              return (
                <div
                  key={tab.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-2 whitespace-nowrap",
                    "gap-0.5 border-b-2 transition-colors",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                  )}
                >
                  <Link
                    href={tab.href}
                    className="flex min-w-0 flex-1 items-center text-sm font-medium"
                    data-testid={`im-funds-tab-${tab.label.toLowerCase()}`}
                  >
                    {tab.label}
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>
      </div>
      <ErrorBoundary>{children}</ErrorBoundary>
    </>
  );
}
