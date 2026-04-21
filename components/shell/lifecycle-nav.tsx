"use client";

/**
 * Lifecycle Navigation Shell
 *
 * The strategic destination navigation - not an optional alternate mode.
 * Organizes the platform around lifecycle stages:
 * Acquire -> Build -> Promote -> Run -> Observe -> Manage -> Report
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useExecutionMode } from "@/lib/execution-mode-context";
import {
  buildLifecycleNav,
  domainLanes,
  getRouteMapping,
  type LifecycleStage,
  lifecycleStages,
} from "@/lib/lifecycle-mapping";
import { personaLifecycleShape } from "@/lib/auth/persona-lifecycle-shape";
import { type Phase } from "@/lib/phase/types";
import { phaseForPath, usePhaseFromRoute } from "@/lib/phase/use-phase-from-route";
import { cn } from "@/lib/utils";
import {
  ArrowUpCircle,
  Building2,
  ChevronDown,
  Database,
  Eye,
  FileText,
  LayoutDashboard,
  Lock,
  LogOut,
  Moon,
  Play,
  Radio,
  Search,
  Settings2,
  Sun,
  User,
  Wrench,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { ApiStatusIndicator } from "./api-status-indicator";
import { NotificationBell } from "./notification-bell";

// Icon mapping for lifecycle stages
const stageIcons: Record<LifecycleStage, React.ComponentType<{ className?: string }>> = {
  acquire: Database,
  build: Wrench,
  promote: ArrowUpCircle,
  run: Play,
  execute: Zap,
  observe: Eye,
  manage: Settings2,
  report: FileText,
};

interface LifecycleNavProps {
  orgName?: string;
  orgId?: string;
  userName?: string;
  userRole?: string;
  className?: string;
}

export function LifecycleNav({
  orgName = "Odum Internal",
  orgId = "odum-internal",
  userName = "Trader",
  userRole = "internal-trader",
  className,
}: LifecycleNavProps) {
  const pathname = usePathname() || "";
  // G1.1 phase unification: single source of truth for phase context. Drives
  // both the entitlement gate below (no more `path.startsWith("/services/...")`
  // branching on the render side) and the `data-phase` Playwright hook.
  const phase: Phase = usePhaseFromRoute();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const { user, hasEntitlement, isAdmin, isInternal, logout: doLogout } = useAuth();
  const { mode: execMode, setMode } = useExecutionMode();
  const { theme, setTheme } = useTheme();

  // Build navigation from lifecycle mapping, filter by entitlements
  const allNavItems = buildLifecycleNav(true);

  // Admin-only routes — hidden from internal traders
  const adminOnlyRoutes = ["/admin", "/ops", "/devops", "/config", "/approvals"];
  // Internal-only routes — visible to internal traders AND admins, hidden from clients
  const internalRoutes = ["/services/manage"];

  // Check if an item is accessible (unlocked) for the current user.
  //
  // G1.1: research/trading/execution branching is derived through
  // `phaseForPath()` — same-system-principle sub-claims (b)-(e) require that
  // the shell not reason about "trading" vs "research" as forked trees; it
  // reasons about `phase` as an attribute of the destination route. The
  // entitlement gates stay identical; only the derivation changes.
  const isItemAccessible = (path: string): boolean => {
    // Promote hub spans strategy + ml lanes — requires either full entitlement
    if (path === "/services/promote" || path.startsWith("/services/promote/"))
      return hasEntitlement("strategy-full") || hasEntitlement("ml-full");
    if (adminOnlyRoutes.some((r) => path === r || path.startsWith(r + "/"))) return isAdmin();
    if (internalRoutes.some((r) => path === r || path.startsWith(r + "/"))) return isInternal();
    if (path.startsWith("/services/reports")) return hasEntitlement("reporting");
    const itemPhase = phaseForPath(path);
    if (itemPhase === "research") return hasEntitlement("strategy-full") || hasEntitlement("ml-full");
    if (itemPhase === "live" || itemPhase === "paper")
      return hasEntitlement("execution-basic") || hasEntitlement("execution-full");
    return true;
  };

  // Phase 11: per-persona lifecycle shape — stages marked "hidden" are removed
  // from nav entirely; "locked" stages render as padlocked; "visible" as
  // normal. Codex SSOT:
  // unified-trading-pm/codex/09-strategy/architecture-v2/dart-tab-structure.md
  const shape = personaLifecycleShape(user);

  // Build nav items — keep locked items visible (except ops), mark them as locked
  const navItems = allNavItems
    .filter((nav) => shape[nav.stage] !== "hidden")
    .map((nav) => ({
      ...nav,
      items: nav.items
        .filter((item) => {
          const isAdminRoute = adminOnlyRoutes.some((r) => item.path === r || item.path.startsWith(r + "/"));
          const isInternalRoute = internalRoutes.some((r) => item.path === r || item.path.startsWith(r + "/"));
          if (isAdminRoute) return isAdmin();
          if (isInternalRoute) return isInternal();
          return true;
        })
        .map((item) => ({
          ...item,
          // Locked if persona-lifecycle-shape says the whole stage is locked,
          // OR the individual item fails the entitlement gate.
          locked: shape[nav.stage] === "locked" || !isItemAccessible(item.path),
        })),
    }))
    .filter((nav) => nav.items.length > 0);

  // Get current route mapping
  const currentMapping = getRouteMapping(pathname);
  const currentStage = currentMapping?.primaryStage;

  // Keyboard shortcut for search
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <nav
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 overflow-x-auto border-b border-border bg-card/95 px-3 py-1.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/90",
        className,
      )}
      data-testid="phase-root"
      data-phase={phase}
    >
      {/* Left: Logo + Lifecycle stages */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group mr-1 shrink-0">
          <img
            src="/images/odum-logo.png"
            alt="Odum Research"
            className="size-6 transition-transform group-hover:scale-110"
          />
          <span className="font-semibold text-sm hidden xl:inline">Odum</span>
        </Link>

        {/* Lifecycle stage navigation */}
        <div className="flex items-center overflow-x-auto [-webkit-overflow-scrolling:touch] scrollbar-none">
          {navItems.map((nav, idx) => {
            const Icon = stageIcons[nav.stage];
            const isActive = currentStage === nav.stage;
            const stageInfo = lifecycleStages[nav.stage];
            const allLocked = nav.items.length > 0 && nav.items.every((item) => item.locked);
            const primaryItem = nav.items.find((item) => !item.locked) ?? nav.items[0];
            // Promote stage: primary link goes to the hub (only reached when !allLocked)
            const primaryHref = nav.stage === "promote" ? "/services/promote" : (primaryItem?.path ?? "/dashboard");

            return (
              <React.Fragment key={nav.stage}>
                <DropdownMenu>
                  <div
                    className={cn(
                      "flex items-center rounded-md border border-transparent transition-all duration-150",
                      !allLocked && isActive && "border-primary/20 bg-primary/10 text-primary",
                      !allLocked &&
                        !isActive &&
                        "hover:border-border hover:bg-muted text-muted-foreground hover:text-foreground",
                      allLocked && "text-muted-foreground/40",
                    )}
                  >
                    {allLocked ? (
                      <span
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium cursor-not-allowed"
                        aria-disabled
                      >
                        <Icon className="size-3.5 shrink-0" />
                        <span className="hidden lg:inline">{nav.label}</span>
                        <Lock className="size-3 opacity-40 hidden sm:block" />
                      </span>
                    ) : (
                      <Link
                        href={primaryHref}
                        className={cn(
                          "flex items-center gap-1.5 pl-2.5 pr-1 py-1.5 rounded-l-md text-xs font-medium",
                          isActive ? "text-primary" : "",
                        )}
                      >
                        <Icon className="size-3.5 shrink-0" />
                        <span className="hidden lg:inline">{nav.label}</span>
                      </Link>
                    )}
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "flex items-center pr-2 py-1.5 rounded-r-md text-xs shrink-0",
                          allLocked ? "cursor-not-allowed opacity-40" : "hover:bg-muted/80",
                        )}
                        aria-label={`${nav.label} destinations`}
                        disabled={allLocked}
                      >
                        {allLocked ? (
                          <Lock className="size-3 opacity-40 hidden sm:block" />
                        ) : (
                          <ChevronDown className="size-3 opacity-50 hidden sm:block" />
                        )}
                      </button>
                    </DropdownMenuTrigger>
                  </div>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Icon className={cn("size-4", stageInfo.color)} />
                      <div>
                        <div className="font-medium">{nav.label}</div>
                        <div className="text-xs text-muted-foreground font-normal">{stageInfo.description}</div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {nav.items.map((item) => {
                      const itemActive = pathname === item.path || pathname.startsWith(item.path + "/");
                      if (item.locked) {
                        // Locked item — visible but not clickable, with upgrade hint
                        return (
                          <DropdownMenuItem key={item.path} asChild>
                            <Link
                              href={`/services/${item.path.split("/services/")[1]?.split("/")[0] || "overview"}`}
                              className="flex items-center justify-between opacity-50 cursor-not-allowed"
                              title="Not part of your subscription — upgrade to access"
                            >
                              <span>{item.label}</span>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                                Upgrade
                              </Badge>
                            </Link>
                          </DropdownMenuItem>
                        );
                      }
                      return (
                        <DropdownMenuItem key={item.path} asChild>
                          <Link
                            href={item.path}
                            className={cn(
                              "flex items-center justify-between",
                              itemActive && "bg-primary/10 text-primary",
                            )}
                          >
                            <span>{item.label}</span>
                            <div className="flex items-center gap-1">
                              {item.lanes.slice(0, 2).map((lane) => (
                                <span
                                  key={lane}
                                  className={cn(
                                    "text-[9px] px-1 py-0.5 rounded",
                                    domainLanes[lane].color,
                                    "bg-current/10",
                                  )}
                                  style={{
                                    color: `var(--${lane}-color, currentColor)`,
                                  }}
                                >
                                  {domainLanes[lane].label}
                                </span>
                              ))}
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Subtle connector between stages */}
                {idx < navItems.length - 1 && <div className="w-2 h-px bg-border mx-0.5 hidden lg:block" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Centre: 3-way mode selector — only shown inside DART context.
          Live/Paper/Batch governs execution mode for DART surfaces; it's
          irrelevant on /dashboard and non-DART services (Manage / Reports)
          where no trading is happening. */}
      {(pathname.startsWith("/services/trading") || pathname.startsWith("/services/dart")) && (
      <div className="hidden sm:flex flex-1 items-center justify-center">
        <div className="flex items-center rounded-full border border-border/60 bg-muted/30 p-0.5">
          <button
            onClick={() => setMode("live")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
              execMode === "live"
                ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                : "text-muted-foreground/60 hover:text-muted-foreground",
            )}
          >
            {execMode === "live" && <Radio className="size-3 animate-pulse" />}
            Live
          </button>
          <button
            onClick={() => setMode("paper")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
              execMode === "paper"
                ? "border border-amber-500/40 bg-amber-500/15 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                : "text-muted-foreground/60 hover:text-muted-foreground",
            )}
          >
            {execMode === "paper" && <Radio className="size-3 animate-pulse" />}
            Paper
          </button>
          <button
            onClick={() => setMode("batch")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
              execMode === "batch"
                ? "border border-blue-500/40 bg-blue-500/15 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                : "text-muted-foreground/60 hover:text-muted-foreground",
            )}
          >
            {execMode === "batch" && <Radio className="size-3 animate-pulse" />}
            Batch
          </button>
        </div>
      </div>
      )}
      {/* Spacer when the mode selector is hidden, so left + right nav blocks
          stay balanced on dashboard / non-DART routes. */}
      {!(pathname.startsWith("/services/trading") || pathname.startsWith("/services/dart")) && (
        <div className="hidden sm:flex flex-1" />
      )}

      {/* Right: Dashboard, Search, Notifications, Org, User */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
            pathname === "/dashboard" || pathname === "/dashboard/"
              ? "bg-primary/10 text-primary border border-primary/25"
              : "text-muted-foreground hover:text-foreground bg-secondary/60 hover:bg-secondary",
          )}
        >
          <LayoutDashboard className="size-3.5 shrink-0" />
          <span className="hidden md:inline">Dashboard</span>
        </Link>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground text-xs"
        >
          <Search className="size-3.5" />
          <span className="hidden lg:inline">Search</span>
          <kbd className="hidden lg:flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px]">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        {/* API / env status indicator */}
        <ApiStatusIndicator />

        <div className="w-px h-5 bg-border hidden sm:block" />

        {/* Notifications — real alert count + dropdown */}
        <NotificationBell />

        {/* Org display */}
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs pointer-events-none hidden sm:flex">
          <Building2 className="size-3.5" />
          <span className="hidden lg:inline max-w-24 truncate">{orgName}</span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold text-xs"
            >
              {userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userRole}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings2 className="mr-2 size-4" />
              Settings
            </DropdownMenuItem>
            {isAdmin() && (
              <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="mr-2 size-4" /> : <Moon className="mr-2 size-4" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                void (async () => {
                  await doLogout();
                  window.location.href = "/login";
                })();
              }}
            >
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

// Legacy nav fallback - redirects to old nav during transition
export function LegacyNavFallback() {
  return (
    <div className="px-4 py-1 bg-amber-500/10 border-b border-amber-500/30 text-amber-500 text-xs text-center">
      Using legacy navigation.{" "}
      <Link href="/settings" className="underline">
        Switch to lifecycle nav
      </Link>
    </div>
  );
}
