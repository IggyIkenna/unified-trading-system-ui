"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { resetDemo } from "@/lib/reset-demo"
import { useGlobalScope } from "@/lib/stores/global-scope-store"
import {
  Database, Wrench, ArrowUpCircle, Play, Zap, Eye, Settings2, FileText,
  RotateCcw, ToggleLeft, LayoutDashboard,
} from "lucide-react"

const SERVICE_ITEMS = [
  { label: "Command Center", href: "/dashboard", icon: LayoutDashboard },
  { label: "Data Pipeline", href: "/services/data/overview", icon: Database },
  { label: "Research Hub", href: "/services/research/overview", icon: Wrench },
  { label: "Strategy Candidates", href: "/services/research/strategy/candidates", icon: ArrowUpCircle },
  { label: "Trading Terminal", href: "/services/trading/overview", icon: Play },
  { label: "Execution Analytics", href: "/services/execution/overview", icon: Zap },
  { label: "Risk Dashboard", href: "/services/trading/risk", icon: Eye },
  { label: "Alerts", href: "/services/trading/alerts", icon: Eye },
  { label: "System Health", href: "/services/observe/health", icon: Eye },
  { label: "Client Management", href: "/services/manage/clients", icon: Settings2 },
  { label: "P&L Reports", href: "/services/reports/overview", icon: FileText },
  { label: "Executive Dashboard", href: "/services/reports/executive", icon: FileText },
  { label: "ML Models", href: "/services/research/ml", icon: Wrench },
  { label: "Backtests", href: "/services/research/strategy/backtests", icon: Wrench },
  { label: "Positions", href: "/services/trading/positions", icon: Play },
  { label: "Orders", href: "/services/trading/orders", icon: Play },
  { label: "Venues", href: "/services/execution/venues", icon: Zap },
  { label: "TCA", href: "/services/execution/tca", icon: Zap },
  { label: "Settlement", href: "/services/reports/settlement", icon: FileText },
  { label: "Reconciliation", href: "/services/reports/reconciliation", icon: FileText },
]

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const { setMode } = useGlobalScope()

  const navigate = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search services, strategies, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          {SERVICE_ITEMS.map(item => (
            <CommandItem key={item.href} onSelect={() => navigate(item.href)}>
              <item.icon className="size-4 mr-2 text-muted-foreground" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => { onOpenChange(false); setMode("live") }}>
            <ToggleLeft className="size-4 mr-2 text-emerald-400" />
            Switch to Live Mode
          </CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); setMode("batch") }}>
            <ToggleLeft className="size-4 mr-2 text-amber-400" />
            Switch to Batch Mode
          </CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); resetDemo() }}>
            <RotateCcw className="size-4 mr-2 text-red-400" />
            Reset Demo
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
