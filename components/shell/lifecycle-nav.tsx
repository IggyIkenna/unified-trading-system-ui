"use client";

/**
 * Lifecycle Navigation Shell
 *
 * The strategic destination navigation - not an optional alternate mode.
 * Organizes the platform around lifecycle stages:
 * Acquire -> Build -> Promote -> Run -> Observe -> Manage -> Report
 */

import { ApiStatusIndicator } from "./api-status-indicator";
import { NotificationBell } from "./notification-bell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import {
  buildLifecycleNav,
  domainLanes,
  getRouteMapping,
  type LifecycleStage,
  lifecycleStages,
} from "@/lib/lifecycle-mapping";
import { cn } from "@/lib/utils";
import {
  ArrowUpCircle,
  Bell,
  Building2,
  Check,
  ChevronDown,
  Database,
  Eye,
  FileText,
  Lock,
  LogOut,
  Play,
  Search,
  Settings2,
  User,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

// Icon mapping for lifecycle stages
const stageIcons: Record<
  LifecycleStage,
  React.ComponentType<{ className?: string }>
> = {
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
  const [searchOpen, setSearchOpen] = React.useState(false);
  const {
    user,
    hasEntitlement,
    isAdmin,
    isInternal,
    logout: doLogout,
  } = useAuth();

  // Build navigation from lifecycle mapping, filter by entitlements
  const allNavItems = buildLifecycleNav(true);

  // Admin-only routes — hidden from internal traders
  const adminOnlyRoutes = ["/admin", "/ops", "/devops", "/config", "/approvals"];
  // Internal-only routes — visible to internal traders AND admins, hidden from clients
  const internalRoutes = ["/services/manage"];

  // Check if an item is accessible (unlocked) for the current user
  const isItemAccessible = (path: string): boolean => {
    if (adminOnlyRoutes.some((r) => path === r || path.startsWith(r + "/")))
      return isAdmin();
    if (internalRoutes.some((r) => path === r || path.startsWith(r + "/")))
      return isInternal();
    if (path.startsWith("/services/research"))
      return hasEntitlement("strategy-full") || hasEntitlement("ml-full");
    if (
      path.startsWith("/services/trading") ||
      path.startsWith("/services/execution")
    )
      return (
        hasEntitlement("execution-basic") || hasEntitlement("execution-full")
      );
    if (path.startsWith("/services/reports"))
      return hasEntitlement("reporting");
    return true;
  };

  // Stages hidden from nav — execution folded into Trading, observe folded into Trading tabs
  const hiddenStages = new Set(["execute", "observe"]);

  // Build nav items — keep locked items visible (except ops), mark them as locked
  const navItems = allNavItems
    .filter((nav) => !hiddenStages.has(nav.stage))
    .map((nav) => ({
      ...nav,
      items: nav.items
        .filter((item) => {
          const isAdminRoute = adminOnlyRoutes.some(
            (r) => item.path === r || item.path.startsWith(r + "/"),
          );
          const isInternalRoute = internalRoutes.some(
            (r) => item.path === r || item.path.startsWith(r + "/"),
          );
          if (isAdminRoute) return isAdmin();
          if (isInternalRoute) return isInternal();
          return true;
        })
        .map((item) => ({
          ...item,
          locked: !isItemAccessible(item.path),
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
        "sticky top-0 z-40 flex shrink-0 items-center justify-between gap-2 overflow-x-auto border-b border-border bg-card/95 px-3 py-1.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/90",
        className,
      )}
    >
      {/* Left: Logo + Lifecycle stages */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group mr-2">
          <img
            src="/images/odum-logo.png"
            alt="Odum Research"
            className="size-6 transition-transform group-hover:scale-110"
          />
          <span className="font-semibold text-sm hidden xl:inline">Odum</span>
        </Link>

        {/* Lifecycle stage navigation */}
        <div className="flex items-center">
          {navItems.map((nav, idx) => {
            const Icon = stageIcons[nav.stage];
            const isActive = currentStage === nav.stage;
            const stageInfo = lifecycleStages[nav.stage];
            const allLocked =
              nav.items.length > 0 && nav.items.every((item) => item.locked);

            return (
              <React.Fragment key={nav.stage}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                        allLocked
                          ? "text-muted-foreground/40 cursor-not-allowed"
                          : isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      <Icon className="size-3.5" />
                      <span className="hidden lg:inline">{nav.label}</span>
                      {allLocked ? (
                        <Lock className="size-3 opacity-40 hidden sm:block" />
                      ) : (
                        <ChevronDown className="size-3 opacity-50 hidden sm:block" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Icon className={cn("size-4", stageInfo.color)} />
                      <div>
                        <div className="font-medium">{nav.label}</div>
                        <div className="text-xs text-muted-foreground font-normal">
                          {stageInfo.description}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {nav.items.map((item) => {
                      const itemActive =
                        pathname === item.path ||
                        pathname.startsWith(item.path + "/");
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
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 h-4"
                              >
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
                {idx < navItems.length - 1 && (
                  <div className="w-2 h-px bg-border mx-0.5 hidden lg:block" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: Search, Notifications, Org, User */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground text-xs"
        >
          <Search className="size-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px]">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        {/* API / env status indicator */}
        <ApiStatusIndicator />

        <div className="w-px h-5 bg-border" />

        {/* Notifications — real alert count + dropdown */}
        <NotificationBell />

        {/* Org display */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs pointer-events-none"
        >
          <Building2 className="size-3.5" />
          <span className="hidden sm:inline max-w-24 truncate">{orgName}</span>
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
