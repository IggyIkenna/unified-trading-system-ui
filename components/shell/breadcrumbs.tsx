"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { getRouteMapping } from "@/lib/lifecycle-mapping";
import {
  getTradingIntermediateBreadcrumbItems,
  getTradingNavLeafLabel,
} from "@/lib/config/services/trading-nav-paths.config";
import { GlobalScopeFilters } from "@/components/platform/global-scope-filters";
import { PageHelp } from "@/components/platform/page-help";

export function Breadcrumbs() {
  const pathname = usePathname() || "";

  // Don't show on dashboard or top-level routes
  if (
    !pathname.startsWith("/services/") &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/config") &&
    !pathname.startsWith("/devops") &&
    !pathname.startsWith("/ops") &&
    !pathname.startsWith("/internal") &&
    !pathname.startsWith("/investor")
  )
    return null;

  const mapping = getRouteMapping(pathname);
  const normalizedPath = pathname.replace(/\/$/, "") || "/";

  const isInvestorRelations = pathname.startsWith("/investor-relations");

  // Build crumbs from URL segments: /services/data/coverage -> ["data", "coverage"]
  const segments = pathname.replace("/services/", "").split("/").filter(Boolean);
  const serviceName = segments[0];
  const pageName = segments.length > 1 ? segments[segments.length - 1] : null;

  /** e.g. `/services/trading/sports/accumulators` → Services > Trading > Sports > Accumulators */
  const isTradingDeepBreadcrumb = serviceName === "trading" && segments.length > 2;
  const tradingIntermediateCrumbs = isTradingDeepBreadcrumb
    ? getTradingIntermediateBreadcrumbItems(normalizedPath)
    : [];

  /** Research → ML has sub-tabs; keep hub crumb before Training / Analysis / Registry. */
  const ML_HUB_PATH = "/services/research/ml";
  const isResearchMlNested = segments[0] === "research" && segments[1] === "ml" && segments.length >= 3;
  const mlHubLabel = getRouteMapping(ML_HUB_PATH)?.label ?? "ML Models & Training";

  const serviceLabels: Record<string, string> = {
    data: "Data",
    research: "Research",
    execution: "Execution",
    trading: "Trading",
    observe: "Observe",
    manage: "Manage",
    reports: "Reports",
  };

  const formatLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ");

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center justify-between flex-wrap gap-y-1.5 gap-x-2 px-4 py-1.5 text-xs text-muted-foreground bg-card/50 border-b border-border"
    >
      <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
        <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1 shrink-0">
          <Home className="size-3" />
          <span className="hidden sm:inline">Services</span>
        </Link>
        {serviceName && (
          <>
            <ChevronRight className="size-3" />
            <Link
              href={isInvestorRelations ? "/investor-relations" : `/services/${serviceName}/overview`}
              className="hover:text-foreground transition-colors"
            >
              {serviceLabels[serviceName] ?? formatLabel(serviceName)}
            </Link>
          </>
        )}
        {isResearchMlNested && (
          <>
            <ChevronRight className="size-3" />
            <Link href={ML_HUB_PATH} className="hover:text-foreground transition-colors">
              {mlHubLabel}
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-medium truncate max-w-[12rem]">
              {mapping?.label || formatLabel(segments[segments.length - 1] ?? "")}
            </span>
          </>
        )}
        {isTradingDeepBreadcrumb && (
          <>
            {tradingIntermediateCrumbs.map((item) => (
              <span key={item.href} className="contents">
                <ChevronRight className="size-3" />
                <Link href={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              </span>
            ))}
            <ChevronRight className="size-3" />
            <span className="text-foreground font-medium">{getTradingNavLeafLabel(normalizedPath)}</span>
          </>
        )}
        {!isResearchMlNested &&
          !isTradingDeepBreadcrumb &&
          pageName &&
          pageName !== "overview" &&
          pageName !== serviceName && (
            <>
              <ChevronRight className="size-3" />
              <span className="text-foreground font-medium">{mapping?.label || formatLabel(pageName)}</span>
            </>
          )}
        <PageHelp pathname={pathname} />
      </div>
      <GlobalScopeFilters />
    </nav>
  );
}
