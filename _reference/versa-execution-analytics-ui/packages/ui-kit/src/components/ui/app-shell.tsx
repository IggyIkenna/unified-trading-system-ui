import { FlaskConical } from "lucide-react";
import * as React from "react";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { ApiConnectionBadge } from "./api-connection-badge";
import { CloudModeBadge } from "./cloud-mode-badge";
import { ErrorBoundary } from "./error-boundary";
import { AppHeader } from "./header";
import { PageLayout } from "./page-layout";
import type { SidebarNavItem, SidebarNavSection } from "./sidebar-nav";
import { SidebarNav } from "./sidebar-nav";

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "34,211,238";
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

// ── Active route detection ──────────────────────────────────────────────────
// Determines which nav item is active based on current pathname.
// Supports multi-segment IDs (e.g. "audit/trail") by checking deepest match first.
function useActiveRoute(items: SidebarNavItem[], defaultRoute: string): string {
  const location = useLocation();
  const path = location.pathname.replace(/^\//, "");
  // Try longest prefix match so "audit/trail" wins over "audit"
  const ids = items.map((i) => i.id).sort((a, b) => b.length - a.length);
  return (
    ids.find((id) => path === id || path.startsWith(id + "/")) ??
    (path.split("/")[0] || defaultRoute.replace(/^\//, ""))
  );
}

function useActiveSectionRoute(
  sections: SidebarNavSection[],
  defaultRoute: string,
): string {
  const items = sections.flatMap((s) => s.items);
  return useActiveRoute(items, defaultRoute);
}

// ── Nav layout (sidebar with react-router) ──────────────────────────────────

interface SidebarShellProps {
  identity: IdentityProps;
  nav: SidebarNavItem[] | SidebarNavSection[];
  navGroupLabel?: string;
  sidebarWidth?: string;
  healthUrl?: string;
  headerExtra?: React.ReactNode;
  defaultRoute: string;
  children: React.ReactNode;
  /** When true, show MOCK MODE badge in header right slot */
  mockMode?: boolean;
}

function SidebarShell({
  identity,
  nav,
  navGroupLabel,
  healthUrl,
  headerExtra,
  defaultRoute,
  children,
  mockMode = false,
}: SidebarShellProps) {
  const navigate = useNavigate();
  const isSections =
    nav.length > 0 && "items" in (nav as SidebarNavSection[])[0];

  const flatItems = isSections
    ? (nav as SidebarNavSection[]).flatMap((s) => s.items)
    : (nav as SidebarNavItem[]);

  const activeId = isSections
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useActiveSectionRoute(nav as SidebarNavSection[], defaultRoute)
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useActiveRoute(flatItems, defaultRoute);

  const navEl = isSections ? (
    <SidebarNav
      sections={nav as SidebarNavSection[]}
      activeId={activeId}
      onSelect={(id) => navigate(`/${id}`)}
      header={
        navGroupLabel ? (
          <div className="px-4 pt-4 pb-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
              {navGroupLabel}
            </div>
          </div>
        ) : undefined
      }
    />
  ) : (
    <SidebarNav
      items={nav as SidebarNavItem[]}
      activeId={activeId}
      onSelect={(id) => navigate(`/${id}`)}
      header={
        navGroupLabel ? (
          <div className="px-4 pt-4 pb-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
              {navGroupLabel}
            </div>
          </div>
        ) : undefined
      }
    />
  );

  // Sidebar: app identity + nav + badges pinned at bottom
  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* App identity */}
      <div
        style={{
          flexShrink: 0,
          padding: "16px",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {identity.icon && (
            <div
              className={cn(
                "flex shrink-0 w-8 h-8 items-center justify-center rounded-lg",
                identity.iconColor ? "icon-box-custom" : "app-identity-icon",
              )}
              style={
                identity.iconColor
                  ? ({
                      "--icon-rgb": hexToRgb(identity.iconColor),
                      "--icon-color": identity.iconColor,
                    } as React.CSSProperties)
                  : undefined
              }
            >
              <span style={{ display: "flex", width: 16, height: 16 }}>
                {identity.icon}
              </span>
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {identity.appName}
            </div>
            {identity.appDescription && (
              <div
                style={{
                  fontSize: 10,
                  color: "var(--color-text-tertiary)",
                  fontFamily: "var(--font-mono)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginTop: 2,
                }}
              >
                {identity.appDescription}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav items — scrollable middle */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>{navEl}</div>

      {/* Badges pinned at bottom */}
      <div
        style={{
          flexShrink: 0,
          borderTop: "1px solid var(--color-border-default)",
          padding: "10px 12px",
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
        }}
      >
        {mockMode && (
          <span
            className="badge-warning inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold font-mono"
            title="Using simulated data — no real backend connected"
          >
            <FlaskConical size={10} />
            MOCK MODE
          </span>
        )}
        <CloudModeBadge />
        {healthUrl && <ApiConnectionBadge healthUrl={healthUrl} />}
        {headerExtra}
      </div>
    </div>
  );

  return <PageLayout sidebar={sidebarContent}>{children}</PageLayout>;
}

// ── Tab layout (no sidebar, top-tab navigation) ─────────────────────────────

interface TabLayoutProps {
  identity: IdentityProps;
  healthUrl?: string;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  mockMode?: boolean;
}

function TabShell({
  identity,
  healthUrl,
  headerExtra,
  children,
  mockMode = false,
}: TabLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg-primary)] overflow-hidden">
      <header className="shrink-0 h-14 min-h-[56px] border-b-2 border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] flex items-center px-6 z-20">
        <AppHeader
          appName={identity.appName}
          appDescription={identity.appDescription}
          icon={identity.icon}
          iconColor={identity.iconColor}
          version={identity.version}
          rightSlot={
            <>
              {headerExtra}
              {mockMode && (
                <span
                  className="badge-warning inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-bold font-mono"
                  title="Using simulated data — no real backend connected"
                >
                  <FlaskConical size={12} />
                  MOCK MODE
                </span>
              )}
              <CloudModeBadge />
              {healthUrl && <ApiConnectionBadge healthUrl={healthUrl} />}
            </>
          }
        />
      </header>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

// ── Public API ──────────────────────────────────────────────────────────────

interface IdentityProps {
  appName: string;
  appDescription?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  version?: string;
}

export interface AppShellProps extends IdentityProps {
  /**
   * Navigation items for the sidebar.
   * Pass SidebarNavItem[] for a flat list, or SidebarNavSection[] for grouped sections.
   * Omit entirely to use tab layout (no sidebar rendered).
   */
  nav?: SidebarNavItem[] | SidebarNavSection[];

  /** Default route to redirect to from "/". Only used with sidebar nav. */
  defaultRoute?: string;

  /** Small label rendered above the nav items (e.g. "Pipeline Ops"). */
  navGroupLabel?: string;

  /** Sidebar width class. Defaults to "w-64". */
  sidebarWidth?: string;

  /** Health endpoint URL for the ApiConnectionBadge. */
  healthUrl?: string;

  /**
   * Extra elements to render in the header's right slot, before CloudModeBadge and ApiConnectionBadge.
   * Use for app-specific status indicators (e.g. <StatusDot variant="running" />).
   */
  headerExtra?: React.ReactNode;

  /**
   * Auth wrapper — receives the app content and wraps it with auth providers.
   * Example:
   *   authWrapper={(children) => (
   *     <AuthProvider config={authConfig}>
   *       <RequireAuth>{children}</RequireAuth>
   *     </AuthProvider>
   *   )}
   * If omitted, no auth wrapping is applied (useful for dev/mock-only UIs).
   */
  authWrapper?: (children: React.ReactNode) => React.ReactNode;

  /**
   * Extra providers to wrap around the whole app (e.g. QueryClientProvider, Toaster).
   * These wrap outside BrowserRouter, inside ErrorBoundary.
   * Example:
   *   extraProviders={(children) => (
   *     <QueryClientProvider client={queryClient}>
   *       {children}
   *       <Toaster />
   *     </QueryClientProvider>
   *   )}
   */
  extraProviders?: (children: React.ReactNode) => React.ReactNode;

  /** Route tree — pass <Routes>...</Routes> */
  children: React.ReactNode;
}

/**
 * AppShell — the standard outer shell for every Unified Trading UI.
 *
 * Handles: ErrorBoundary, BrowserRouter, optional auth wrapper, MockModeBanner,
 * header (AppHeader + CloudModeBadge + ApiConnectionBadge), sidebar nav or tab layout.
 *
 * The consuming App.tsx only needs to declare identity props, nav items, routes,
 * and optionally an authWrapper. All wiring is centralised here.
 *
 * @example
 * export default function App() {
 *   return (
 *     <AppShell
 *       appName="Batch Audit"
 *       appDescription="pipeline job monitoring & audit"
 *       icon={<ClipboardCheck />}
 *       version="v0.1.0"
 *       nav={NAV_ITEMS}
 *       defaultRoute="/jobs"
 *       navGroupLabel="Pipeline Ops"
 *       healthUrl={import.meta.env.VITE_API_URL + "/health"}
 *       authWrapper={(c) => <AuthProvider config={cfg}><RequireAuth>{c}</RequireAuth></AuthProvider>}
 *     >
 *       <Routes>
 *         <Route path="/" element={<Navigate to="/jobs" replace />} />
 *         <Route path="/jobs" element={<BatchJobsPage />} />
 *       </Routes>
 *     </AppShell>
 *   );
 * }
 */
export function AppShell({
  appName,
  appDescription,
  icon,
  iconColor,
  version,
  nav,
  defaultRoute = "/",
  navGroupLabel,
  sidebarWidth = "w-72",
  healthUrl,
  headerExtra,
  authWrapper,
  extraProviders,
  children,
}: AppShellProps) {
  const MOCK_MODE = import.meta.env.VITE_MOCK_API === "true";

  const identity: IdentityProps = {
    appName,
    appDescription,
    icon,
    iconColor,
    version,
  };

  // The inner content: layout shell + routes (mode badge is in header top-right)
  // Children must be a full <Routes> tree from the app so Route/Routes use the same react-router-dom instance.
  const layoutContent = nav ? (
    <SidebarShell
      identity={identity}
      nav={nav}
      navGroupLabel={navGroupLabel}
      sidebarWidth={sidebarWidth}
      healthUrl={healthUrl}
      headerExtra={headerExtra}
      defaultRoute={defaultRoute}
      mockMode={MOCK_MODE}
    >
      {children}
    </SidebarShell>
  ) : (
    <TabShell
      identity={identity}
      healthUrl={healthUrl}
      headerExtra={headerExtra}
      mockMode={MOCK_MODE}
    >
      {children}
    </TabShell>
  );

  // Wrap with auth if provided
  const withAuth = authWrapper ? authWrapper(layoutContent) : layoutContent;

  // Always wrap with BrowserRouter — layout (SidebarShell) and RequireAuth both use useNavigate/useLocation
  const withRouter = <BrowserRouter>{withAuth}</BrowserRouter>;

  // Wrap with extra providers if provided
  const withProviders = extraProviders
    ? extraProviders(withRouter)
    : withRouter;

  return <ErrorBoundary>{withProviders}</ErrorBoundary>;
}
