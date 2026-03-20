"use client"

// Global Navigation Bar - v9.0.0 - Fixed imports
import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Activity,
  BarChart3,
  LineChart,
  Settings,
  Cpu,
  FileText,
  Search,
  Bell,
  ChevronDown,
  Zap,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Shield,
  Cloud,
  Command as CommandIcon,
  User as UserIcon,
  LogOut as LogOutIcon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

// Navigation items
const mainNavItems = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Trading", href: "/trading", icon: TrendingUp },
  { label: "Strategies", href: "/strategies", icon: LineChart },
  { label: "Markets", href: "/markets", icon: BarChart3 },
  { label: "Ops", href: "/ops", icon: Shield },
  { label: "Config", href: "/config", icon: Settings },
  { label: "ML", href: "/ml/overview", icon: Cpu },
  { label: "Strategy Lab", href: "/strategy-platform/overview", icon: LineChart },
  { label: "Execution", href: "/execution/overview", icon: Zap },
  { label: "Reports", href: "/reports", icon: FileText },
]

const roleViews = [
  { label: "Trader", value: "trader", icon: TrendingUp },
  { label: "Quant", value: "quant", icon: LineChart },
  { label: "Risk", value: "risk", icon: Shield },
  { label: "Ops", value: "ops", icon: Settings },
  { label: "Exec", value: "exec", icon: BarChart3 },
]

export interface GlobalNavBarProps {
  activeView?: string
  onViewChange?: (view: string) => void
  userName?: string
  className?: string
  activeSurface?: string
  currentRole?: string
}

export function GlobalNavBar({
  activeView = "trader",
  onViewChange,
  userName = "John Doe",
  className,
}: GlobalNavBarProps) {
  const [open, setOpen] = React.useState(false)
  const [currentPath, setCurrentPath] = React.useState("")

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname)
    }
  }, [])

  // Keyboard shortcut for search
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const currentRole = roleViews.find((r) => r.value === activeView) || roleViews[0]

  return (
    <>
      <nav
        className={cn(
          "flex items-center justify-between px-4 py-2 bg-card border-b border-border",
          className
        )}
      >
        {/* Left side - Logo and navigation */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Zap className="size-5 text-primary transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-semibold text-sm hidden lg:inline">Unified Trading Platform</span>
          </Link>

          {/* Status indicators */}
          <div className="hidden md:flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
              <Activity className="size-2.5" />
              Live
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-1">
              <Cloud className="size-2.5" />
              As-Of
            </Badge>
          </div>

          {/* Main navigation */}
          <div className="flex items-center gap-1">
            {mainNavItems.map((item) => {
              const isActive = currentPath === item.href || currentPath.startsWith(item.href + "/")
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ease-out",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Right side - Search, notifications, role, profile */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-3 py-1 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-all duration-150 ease-out text-xs"
          >
            <Search className="size-3.5" />
            <span>Search</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <CommandIcon className="size-3" />K
            </kbd>
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-border" />

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative size-8">
            <Bell className="size-4" />
            <span className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
              3
            </span>
          </Button>

          {/* Role switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <currentRole.icon className="size-3.5" />
                <span className="hidden sm:inline">{currentRole.label}</span>
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Switch View</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {roleViews.map((role) => (
                <DropdownMenuItem
                  key={role.value}
                  onClick={() => onViewChange?.(role.value)}
                  className={cn(
                    "text-xs gap-2",
                    activeView === role.value && "bg-primary/10 text-primary"
                  )}
                >
                  <role.icon className="size-3.5" />
                  {role.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                {userName.split(" ").map((n) => n[0]).join("")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">john@trading.co</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOutIcon className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Command palette */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search strategies, clients, assets..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {mainNavItems.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  setOpen(false)
                  window.location.href = item.href
                }}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => setOpen(false)}>
              <TrendingUp className="mr-2 h-4 w-4" />
              New Trade
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <LineChart className="mr-2 h-4 w-4" />
              View P&L
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <Shield className="mr-2 h-4 w-4" />
              Risk Dashboard
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
