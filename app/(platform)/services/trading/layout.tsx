"use client";

import { EntitlementGate, hasAnyEntitlement } from "@/components/platform/entitlement-gate";
import { LiveAsOfToggle } from "@/components/platform/live-asof-toggle";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { TRADING_TABS } from "@/components/shell/service-tabs";
import { TradingVerticalNav } from "@/components/shell/trading-vertical-nav";
import { Card, CardContent } from "@/components/ui/card";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import "@/components/widgets/register-all";
import { WorkspaceToolbar } from "@/components/widgets/workspace-toolbar";
import { useAlertsSummary } from "@/hooks/api/use-alerts";
import { useNewsFeed, type NewsSeverity } from "@/hooks/api/use-news";
import { useOrders } from "@/hooks/api/use-orders";
import { usePositionsSummary } from "@/hooks/api/use-positions";
import { useServiceHealth } from "@/hooks/api/use-service-status";
import { useAuth } from "@/hooks/use-auth";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { useWorkspaceSync } from "@/lib/stores/workspace-sync";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Newspaper,
  PanelRightClose,
  PanelRightOpen,
  Server,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";

const SEVERITY_DOT: Record<NewsSeverity, string> = {
  breaking: "bg-rose-500",
  high: "bg-amber-400",
  medium: "bg-blue-400",
  low: "bg-muted-foreground/50",
};

function TradingSidebar() {
  const { hasEntitlement, isAdmin, isInternal } = useAuth();
  const canSeeInternalData = isAdmin() || isInternal() || hasAnyEntitlement(["execution-basic"], hasEntitlement);

  const { data: positionsSummary } = usePositionsSummary();
  const { data: alertsSummary } = useAlertsSummary();
  const { data: healthData } = useServiceHealth();
  const { data: ordersData } = useOrders();
  const { data: newsItems } = useNewsFeed();

  if (!canSeeInternalData) {
    return (
      <div className="h-full p-3 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Lock className="size-5 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground">Upgrade to view trading data</p>
        </div>
      </div>
    );
  }

  const ps = positionsSummary as Record<string, unknown> | undefined;
  const als = alertsSummary as Record<string, unknown> | undefined;
  const health = healthData as Record<string, unknown> | undefined;
  const ordersRaw = ordersData as unknown;
  const orders = Array.isArray(ordersRaw)
    ? ordersRaw
    : (((ordersRaw as Record<string, unknown>)?.orders ?? []) as Array<Record<string, unknown>>);

  const fmt = (v: unknown) => {
    const n = Number(v) || 0;
    if (Math.abs(n) >= 1e6) return `$${formatNumber(n / 1e6, 1)}M`;
    if (Math.abs(n) >= 1e3) return `$${formatNumber(n / 1e3, 0)}K`;
    return `$${formatNumber(n, 0)}`;
  };

  const services = (health?.services ?? []) as Array<Record<string, unknown>>;
  const healthyCount = services.filter((s) => s.status === "live" || s.status === "healthy").length;

  return (
    <div className="h-full space-y-3 p-3 overflow-y-auto">
      {/* Positions */}
      <Link href="/services/trading/positions">
        <Card className="hover:border-white/20 transition-colors cursor-pointer">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Activity className="size-3" /> Positions
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground text-[10px]">Open</div>
                <div className="font-mono font-medium">{Number(ps?.totalPositions) || 0}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-[10px]">Exposure</div>
                <div className="font-mono font-medium">{fmt(ps?.totalExposure)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-[10px]">Unrealised P&L</div>
                <div
                  className={cn(
                    "font-mono font-medium",
                    Number(ps?.totalUnrealizedPnl) >= 0 ? "text-emerald-400" : "text-rose-400",
                  )}
                >
                  {fmt(ps?.totalUnrealizedPnl)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-[10px]">Margin</div>
                <div className="font-mono font-medium">{fmt(ps?.totalMargin)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Alerts */}
      <Link href="/services/trading/alerts">
        <Card className="hover:border-white/20 transition-colors cursor-pointer">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <AlertTriangle className="size-3" /> Alerts
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground text-[10px]">Critical</div>
                <div className="font-mono font-medium text-rose-400">{Number(als?.critical) || 0}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-[10px]">Warning</div>
                <div className="font-mono font-medium text-amber-400">{Number(als?.warning) || 0}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-[10px]">Total</div>
                <div className="font-mono font-medium">{Number(als?.total) || 0}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-[10px]">Unacked</div>
                <div className="font-mono font-medium">{Number(als?.unacknowledged) || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Recent Fills */}
      <Link href="/services/trading/orders">
        <Card className="hover:border-white/20 transition-colors cursor-pointer">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <TrendingUp className="size-3" /> Recent Fills
            </div>
            <div className="space-y-1">
              {(orders as Array<Record<string, unknown>>).slice(0, 3).map((o, i) => (
                <div key={String(o.order_id ?? i)} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1">
                    {String(o.side) === "BUY" ? (
                      <ArrowUpRight className="size-2.5 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="size-2.5 text-rose-400" />
                    )}
                    <span className="font-mono">{String(o.instrument ?? "")}</span>
                  </div>
                  <span
                    className={cn("font-mono", String(o.status) === "FILLED" ? "text-emerald-400" : "text-amber-400")}
                  >
                    {String(o.status ?? "")}
                  </span>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="text-[10px] text-muted-foreground text-center py-2">No recent fills</div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* System Health */}
      <Link href="/services/observe/health">
        <Card className="hover:border-white/20 transition-colors cursor-pointer">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Server className="size-3" /> System Health
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground text-[10px]">Services</div>
                <div className="font-mono font-medium">{services.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-[10px]">Healthy</div>
                <div className="font-mono font-medium text-emerald-400">
                  {healthyCount}/{services.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Account Balances */}
      <Link href="/services/trading/accounts">
        <Card className="hover:border-white/20 transition-colors cursor-pointer">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Wallet className="size-3" /> Accounts
            </div>
            <div className="text-xs">
              <div className="text-muted-foreground text-[10px]">Total Balance</div>
              <div className="font-mono font-medium">{fmt(ps?.totalExposure ? Number(ps.totalExposure) * 1.8 : 0)}</div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* News */}
      <Link href="/services/trading/markets">
        <Card className="hover:border-white/20 transition-colors cursor-pointer">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Newspaper className="size-3" /> News
            </div>
            <div className="space-y-2">
              {(newsItems ?? []).slice(0, 4).map((item) => (
                <div key={item.id} className="flex gap-2 items-start">
                  <span className={cn("mt-1.5 size-1.5 rounded-full shrink-0", SEVERITY_DOT[item.severity])} />
                  <div className="min-w-0">
                    <div className="text-[10px] leading-snug line-clamp-2 text-foreground/80">{item.title}</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">{item.source}</div>
                  </div>
                </div>
              ))}
              {(newsItems ?? []).length === 0 && (
                <div className="text-[10px] text-muted-foreground text-center py-1">No news</div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

/** Standalone sub-pages that render their own layout (no widget grid toolbar). */
const STANDALONE_PAGES = new Set([
  "/services/trading/sports/bet",
  "/services/trading/sports/accumulators",
  "/services/trading/options/combos",
  "/services/trading/options/pricing",
  "/services/trading/predictions/aggregators",
  "/services/trading/defi/staking",
  "/services/trading/strategies/model-portfolios",
  "/services/trading/strategies/basis-trade",
]);

function useWidgetTab(): string | null {
  const pathname = usePathname();
  // Standalone pages opt out of the widget toolbar
  if (STANDALONE_PAGES.has(pathname)) return null;
  // Custom panels: /trading/custom/<panelId> → tab = "custom-<panelId>"
  const customMatch = pathname.match(/\/trading\/custom\/([^/]+)/);
  if (customMatch?.[1]) return `custom-${customMatch[1]}`;
  const match = pathname.match(/\/trading\/([^/]+)/);
  return match?.[1] ?? null;
}

export default function TradingServiceLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { scope, setMode } = useGlobalScope();
  const quickViewRef = useRef<ImperativePanelHandle>(null);
  const [quickViewCollapsed, setQuickViewCollapsed] = useState(false);
  const widgetTab = useWidgetTab();

  // Sync workspace layouts with Firestore (no-op if Firebase not configured)
  useWorkspaceSync();

  return (
    <div className="flex flex-col h-full">
      {/* Stage dots removed per UX review — traders don't need novice navigation */}
      {/* Main area: vertical nav + resizable content/quick-view */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <TradingVerticalNav tabs={TRADING_TABS} entitlements={user?.entitlements} bottomSlot={<LiveAsOfToggle />} />

        <ResizablePanelGroup direction="horizontal" autoSaveId="trading-layout-v2" className="flex-1 min-w-0">
          {/* Page content */}
          <ResizablePanel defaultSize={82} minSize={50}>
            <div id="widget-fullscreen-boundary" className="h-full flex flex-col overflow-hidden relative">
              {widgetTab && <WorkspaceToolbar tab={widgetTab} />}
              <div className="flex-1 overflow-auto">
                <EntitlementGate entitlement="execution-basic" serviceName="Trading">
                  <ErrorBoundary>{children}</ErrorBoundary>
                </EntitlementGate>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Quick-view sidebar */}
          <ResizablePanel
            ref={quickViewRef}
            defaultSize={18}
            collapsedSize={2}
            minSize={2}
            maxSize={35}
            collapsible
            onCollapse={() => setQuickViewCollapsed(true)}
            onExpand={() => setQuickViewCollapsed(false)}
          >
            <div className="flex flex-col h-full border-l border-border bg-card/30">
              {/* Header — always visible, mirrors the left nav header */}
              <div
                className={cn(
                  "flex items-center border-b border-border px-2 py-1.5",
                  quickViewCollapsed ? "justify-center" : "justify-between",
                )}
              >
                {!quickViewCollapsed && (
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 pl-1 select-none">
                    Quick View
                  </span>
                )}
                <button
                  onClick={() => {
                    if (quickViewCollapsed) {
                      quickViewRef.current?.expand();
                    } else {
                      quickViewRef.current?.collapse();
                    }
                  }}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title={quickViewCollapsed ? "Expand Quick View" : "Collapse Quick View"}
                  aria-label={quickViewCollapsed ? "Expand Quick View" : "Collapse Quick View"}
                >
                  {quickViewCollapsed ? <PanelRightOpen className="size-4" /> : <PanelRightClose className="size-4" />}
                </button>
              </div>
              {/* Content — hidden when collapsed */}
              {!quickViewCollapsed && <TradingSidebar />}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
