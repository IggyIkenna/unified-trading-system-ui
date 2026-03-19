"use client"

/**
 * Lifecycle Navigation Shell
 * 
 * The strategic destination navigation - not an optional alternate mode.
 * Organizes the platform around lifecycle stages:
 * Acquire -> Build -> Promote -> Run -> Observe -> Manage -> Report
 */

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Database,
  Wrench,
  ArrowUpCircle,
  Play,
  Eye,
  Settings2,
  FileText,
  ChevronDown,
  Search,
  Bell,
  Zap,
  User,
  LogOut,
  Building2,
  Check,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  type LifecycleStage,
  type DomainLane,
  lifecycleStages,
  domainLanes,
  buildLifecycleNav,
  getRouteMapping,
} from "@/lib/lifecycle-mapping"

// Icon mapping for lifecycle stages
const stageIcons: Record<LifecycleStage, React.ComponentType<{ className?: string }>> = {
  acquire: Database,
  build: Wrench,
  promote: ArrowUpCircle,
  run: Play,
  observe: Eye,
  manage: Settings2,
  report: FileText,
}

interface LifecycleNavProps {
  orgName?: string
  orgId?: string
  userName?: string
  userRole?: string
  className?: string
}

export function LifecycleNav({
  orgName = "Odum Internal",
  orgId = "odum-internal",
  userName = "Trader",
  userRole = "internal-trader",
  className,
}: LifecycleNavProps) {
  const pathname = usePathname() || ""
  const [searchOpen, setSearchOpen] = React.useState(false)
  
  // Build navigation from lifecycle mapping
  const navItems = buildLifecycleNav(true)
  
  // Get current route mapping
  const currentMapping = getRouteMapping(pathname)
  const currentStage = currentMapping?.primaryStage
  
  // Keyboard shortcut for search
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen(o => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <nav className={cn("flex items-center justify-between px-4 py-2 bg-card border-b border-border", className)}>
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
            const Icon = stageIcons[nav.stage]
            const isActive = currentStage === nav.stage
            const stageInfo = lifecycleStages[nav.stage]
            
            return (
              <React.Fragment key={nav.stage}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="size-3.5" />
                      <span className="hidden lg:inline">{nav.label}</span>
                      <ChevronDown className="size-3 opacity-50" />
                    </button>
                  </DropdownMenuTrigger>
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
                      const itemActive = pathname === item.path || pathname.startsWith(item.path + "/")
                      return (
                        <DropdownMenuItem key={item.path} asChild>
                          <Link
                            href={item.path}
                            className={cn(
                              "flex items-center justify-between",
                              itemActive && "bg-primary/10 text-primary"
                            )}
                          >
                            <span>{item.label}</span>
                            <div className="flex items-center gap-1">
                              {item.lanes.slice(0, 2).map(lane => (
                                <span
                                  key={lane}
                                  className={cn(
                                    "text-[9px] px-1 py-0.5 rounded",
                                    domainLanes[lane].color,
                                    "bg-current/10"
                                  )}
                                  style={{ color: `var(--${lane}-color, currentColor)` }}
                                >
                                  {domainLanes[lane].label}
                                </span>
                              ))}
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Subtle connector between stages */}
                {idx < navItems.length - 1 && (
                  <div className="w-2 h-px bg-border mx-0.5 hidden lg:block" />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Right: Search, Notifications, Org, User */}
      <div className="flex items-center gap-2">
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

        <div className="w-px h-5 bg-border" />

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative size-8">
          <Bell className="size-4" />
          <span className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
            3
          </span>
        </Button>

        {/* Org switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Building2 className="size-3.5" />
              <span className="hidden sm:inline max-w-24 truncate">{orgName}</span>
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Organisation</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center justify-between">
              <span>Odum Internal</span>
              {orgId === "odum-internal" && <Check className="size-4 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center justify-between">
              <span>Demo Client</span>
              {orgId === "demo-client" && <Check className="size-4 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-muted-foreground">
              <span>Manage organisations...</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold text-xs">
              {userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
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
            <DropdownMenuItem className="text-destructive">
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}

// Lane indicator badge - shows which domain lanes current page belongs to
export function LaneIndicator({ lanes, className }: { lanes: DomainLane[]; className?: string }) {
  if (!lanes || lanes.length === 0) return null
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {lanes.map(lane => {
        const info = domainLanes[lane]
        return (
          <Badge
            key={lane}
            variant="outline"
            className={cn("text-[10px] px-1.5 py-0 h-5", info.color, "border-current/30 bg-current/5")}
          >
            {info.label}
          </Badge>
        )
      })}
    </div>
  )
}

// Legacy nav fallback - redirects to old nav during transition
export function LegacyNavFallback() {
  return (
    <div className="px-4 py-1 bg-amber-500/10 border-b border-amber-500/30 text-amber-500 text-xs text-center">
      Using legacy navigation. <Link href="/settings" className="underline">Switch to lifecycle nav</Link>
    </div>
  )
}
