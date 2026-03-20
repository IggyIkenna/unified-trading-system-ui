"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Database,
  LineChart,
  Layers,
  Zap,
  Briefcase,
  Shield,
  Sparkles,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  CreditCard,
  HelpCircle,
  Plus,
  ArrowUpRight,
  Calendar,
  Clock,
} from "lucide-react"

// Service config
const serviceConfig = {
  data: { name: "Data Provision", icon: Database, color: "text-sky-400", bgColor: "bg-sky-400/10", href: "/portal/data" },
  backtesting: { name: "Backtesting", icon: LineChart, color: "text-violet-400", bgColor: "bg-violet-400/10", href: "/portal/backtesting" },
  whitelabel: { name: "White-Label", icon: Layers, color: "text-amber-400", bgColor: "bg-amber-400/10", href: "/portal/whitelabel" },
  execution: { name: "Execution", icon: Zap, color: "text-emerald-400", bgColor: "bg-emerald-400/10", href: "/portal/execution" },
  investment: { name: "Investment", icon: Briefcase, color: "text-rose-400", bgColor: "bg-rose-400/10", href: "/portal/investment" },
  regulatory: { name: "Regulatory", icon: Shield, color: "text-slate-400", bgColor: "bg-slate-400/10", href: "/portal/regulatory" },
}

// Mock data
const mockActivity = [
  { id: 1, type: "backtest", message: "Backtest 'BTC Momentum v3' completed", time: "2 min ago", status: "success" },
  { id: 2, type: "data", message: "API usage: 847,293 calls this month", time: "1 hour ago", status: "info" },
  { id: 3, type: "report", message: "Monthly performance report ready", time: "Yesterday", status: "info" },
  { id: 4, type: "execution", message: "Order executed: BTC-PERP 2.5 contracts", time: "Yesterday", status: "success" },
  { id: 5, type: "alert", message: "Strategy 'DeFi Basis' hit stop loss", time: "2 days ago", status: "warning" },
]

const mockPerformance = {
  mtd: 4.2,
  ytd: 18.7,
  sharpe: 2.1,
  drawdown: -3.4,
}

export default function ClientDashboard() {
  const router = useRouter()
  const [user, setUser] = React.useState<{
    email: string
    org: string
    services: string[]
  } | null>(null)

  React.useEffect(() => {
    const stored = localStorage.getItem("portal_user")
    if (stored) {
      setUser(JSON.parse(stored))
    } else {
      router.push("/login")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("portal_user")
    router.push("/portal")
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const activeServices = user.services.map((s) => serviceConfig[s as keyof typeof serviceConfig]).filter(Boolean)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/portal" className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="size-4 text-primary-foreground" />
              </div>
              <span className="font-semibold hidden sm:inline">Odum Research</span>
            </Link>
            <Badge variant="outline" className="text-xs">{user.org}</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-4" />
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                3
              </span>
            </Button>
            <Button variant="ghost" size="icon">
              <HelpCircle className="size-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    {user.org.charAt(0)}
                  </div>
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.org}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard className="mr-2 size-4" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="mr-2 size-4" />
                  Documents
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6 md:px-6 md:py-8">
        {/* Welcome */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user.org}</h1>
            <p className="text-muted-foreground">Here's your portfolio overview</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileText className="mr-2 size-4" />
              Reports
            </Button>
            <Button size="sm">
              <Plus className="mr-2 size-4" />
              New Backtest
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">MTD Return</div>
                <TrendingUp className="size-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-500">+{mockPerformance.mtd}%</div>
              <div className="mt-1 text-xs text-muted-foreground">vs benchmark +2.1%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">YTD Return</div>
                <TrendingUp className="size-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-500">+{mockPerformance.ytd}%</div>
              <div className="mt-1 text-xs text-muted-foreground">vs benchmark +12.3%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                <Activity className="size-4 text-sky-500" />
              </div>
              <div className="mt-2 text-2xl font-bold">{mockPerformance.sharpe}</div>
              <div className="mt-1 text-xs text-muted-foreground">Rolling 12 months</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Max Drawdown</div>
                <TrendingDown className="size-4 text-rose-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-rose-500">{mockPerformance.drawdown}%</div>
              <div className="mt-1 text-xs text-muted-foreground">Peak to trough</div>
            </CardContent>
          </Card>
        </div>

        {/* Active Services */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Your Services</h2>
          <p className="text-sm text-muted-foreground">Quick access to your subscribed services</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {activeServices.map((service) => {
              const Icon = service.icon
              return (
                <Link key={service.name} href={service.href}>
                  <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex size-10 items-center justify-center rounded-lg", service.bgColor)}>
                          <Icon className={cn("size-5", service.color)} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{service.name}</div>
                          <div className="text-xs text-muted-foreground">Active</div>
                        </div>
                        <ArrowUpRight className="size-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
            
            {/* Add Service Card */}
            <Link href="/portal">
              <Card className="border-dashed transition-all hover:border-primary/50 cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                      <Plus className="size-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-muted-foreground">Add Service</div>
                      <div className="text-xs text-muted-foreground">Explore more</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Activity & Reports */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest updates across your services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className={cn(
                      "mt-0.5 size-2 rounded-full",
                      item.status === "success" && "bg-emerald-500",
                      item.status === "warning" && "bg-amber-500",
                      item.status === "info" && "bg-sky-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">{item.message}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" />
                        {item.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4" size="sm">
                View All Activity
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming</CardTitle>
              <CardDescription>Scheduled reports and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Monthly Performance Report</div>
                    <div className="text-xs text-muted-foreground">Scheduled for Mar 31, 2026</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Quarterly Compliance Review</div>
                    <div className="text-xs text-muted-foreground">Scheduled for Mar 31, 2026</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Invoice Due</div>
                    <div className="text-xs text-muted-foreground">April 1, 2026 - $4,299.00</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
