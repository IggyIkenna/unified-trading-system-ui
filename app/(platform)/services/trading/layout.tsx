"use client";

import { ErrorBoundary } from "@/components/shared/error-boundary";
import "@/components/widgets/register-all";
import { AllWidgetProviders } from "@/components/widgets/all-widget-providers";

/**
 * /services/trading/* layout — minimal shell for the surviving deep-link
 * surfaces only. The full cockpit lives at /services/workspace; everything
 * shell-level (scope bar, terminal mode tabs, sidebar, widget toolbar) is
 * the workspace's job.
 *
 * Surviving routes:
 *   - /services/trading/strategies/[id]   (strategy detail deep link)
 *   - /services/trading/strategies/[id]/versions
 *   - /services/trading/custom/[id]       (user-defined custom panel)
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §15 + §22: per-strategy
 * detail surfaces and user-customisable panels are explicitly preserved
 * outside the cockpit grid.
 *
 * Phase 9 wave 2 collapsed the asset-group + single-purpose trading pages
 * into the workspace cockpit. This layout used to render the trading
 * sidebar / scope bar / terminal mode tabs; that now lives at
 * /services/workspace and the redirects in next.config.mjs route users
 * there.
 */
export default function TradingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AllWidgetProviders>
        <div className="h-full min-h-0 overflow-hidden">{children}</div>
      </AllWidgetProviders>
    </ErrorBoundary>
  );
}
