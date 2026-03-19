"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Settings,
  Beaker,
  Rocket,
  Play,
  MonitorCheck,
  FileSearch,
  Scale,
} from "lucide-react"

export type LifecyclePhase =
  | "design"
  | "simulate"
  | "promote"
  | "run"
  | "monitor"
  | "explain"
  | "reconcile"

interface PhaseConfig {
  id: LifecyclePhase
  label: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  actions?: string[] // Actions available in this phase
}

// Lifecycle phases map to strategy development flow:
// Design -> Simulate -> Promote -> Run -> Monitor -> Explain -> Reconcile
const phases: PhaseConfig[] = [
  { 
    id: "design", 
    label: "Design", 
    description: "Define strategy configs, risk limits, and venue connections",
    href: "/config",
    icon: Settings,
    shortcut: "1",
    actions: ["Edit config", "Set risk limits", "Connect venues"],
  },
  { 
    id: "simulate", 
    label: "Simulate", 
    description: "Backtest strategy variants with historical data",
    href: "/strategies",
    icon: Beaker,
    shortcut: "2",
    actions: ["Run backtest", "Compare variants", "Analyze metrics"],
  },
  { 
    id: "promote", 
    label: "Promote", 
    description: "Promote winning variants to paper or live",
    href: "/strategies",
    icon: Rocket,
    shortcut: "3",
    actions: ["Deploy paper", "Deploy live", "Review gates"],
  },
  { 
    id: "run", 
    label: "Run", 
    description: "Live execution with real-time monitoring",
    href: "/",
    icon: Play,
    shortcut: "4",
    actions: ["Monitor fills", "View positions", "Adjust params"],
  },
  { 
    id: "monitor", 
    label: "Monitor", 
    description: "Real-time alerts, system health, and P&L overview",
    href: "/overview",
    icon: MonitorCheck,
    shortcut: "5",
    actions: ["View alerts", "Check health", "P&L overview"],
  },
  { 
    id: "explain", 
    label: "Explain", 
    description: "P&L attribution and performance analysis",
    href: "/markets",
    icon: FileSearch,
    shortcut: "6",
    actions: ["P&L waterfall", "Factor breakdown", "Client reports"],
  },
  { 
    id: "reconcile", 
    label: "Reconcile", 
    description: "Manual trading, order entry, and position reconciliation",
    href: "/trading",
    icon: Scale,
    shortcut: "7",
    actions: ["Manual trade", "View breaks", "Position recon"],
  },
]

interface LifecycleRailProps {
  activePhase?: LifecyclePhase
  className?: string
  onPhaseChange?: (phase: LifecyclePhase) => void
}

export function LifecycleRail({ activePhase = "run", className, onPhaseChange }: LifecycleRailProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "flex items-center justify-center gap-1 py-2 px-4 border-b border-border bg-[#0a0a0b]/50",
          className
        )}
      >
        {phases.map((phase, index) => {
          const isActive = phase.id === activePhase
          const isPast = phases.findIndex((p) => p.id === activePhase) > index
          const Icon = phase.icon

          return (
            <React.Fragment key={phase.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={phase.href}
                    onClick={() => onPhaseChange?.(phase.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 ease-out group",
                      isActive
                        ? "text-primary bg-primary/10"
                        : isPast
                        ? "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/20"
                    )}
                  >
                    <span
                      className={cn(
                        "flex items-center justify-center size-5 rounded transition-colors",
                        isActive
                          ? "text-primary"
                          : isPast
                          ? "text-muted-foreground group-hover:text-foreground"
                          : "text-muted-foreground/50 group-hover:text-muted-foreground"
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span>{phase.label}</span>
                    {phase.shortcut && (
                      <span className="hidden lg:inline text-[10px] text-muted-foreground/50 font-mono ml-1">
                        {phase.shortcut}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent 
                  side="bottom" 
                  className="max-w-[240px] p-3 bg-popover text-popover-foreground border border-border"
                >
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">{phase.label}</p>
                    <p className="text-xs text-muted-foreground">{phase.description}</p>
                    {phase.actions && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {phase.actions.map((action) => (
                          <span
                            key={action}
                            className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded"
                          >
                            {action}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
              {index < phases.length - 1 && (
                <div
                  className={cn(
                    "w-4 h-px transition-colors",
                    isPast ? "bg-muted-foreground/40" : "bg-border"
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

// Export phases config for use in other components
export { phases as LIFECYCLE_PHASES }
export type { PhaseConfig }
