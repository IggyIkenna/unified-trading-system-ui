"use client"

import * as React from "react"
import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ServiceHealth {
  name: string
  status: "healthy" | "degraded" | "down"
  label: string
}

const MOCK_HEALTH: ServiceHealth[] = [
  { name: "execution-service", status: "healthy", label: "Execution" },
  { name: "strategy-service", status: "healthy", label: "Strategy" },
  { name: "risk-service", status: "healthy", label: "Risk" },
  { name: "market-data", status: "healthy", label: "Market Data" },
  { name: "features-delta-1", status: "degraded", label: "Features Δ1" },
  { name: "ml-inference", status: "healthy", label: "ML Inference" },
  { name: "pnl-attribution", status: "healthy", label: "P&L" },
  { name: "alerting", status: "healthy", label: "Alerting" },
  { name: "recon-service", status: "healthy", label: "Reconciliation" },
  { name: "instruments", status: "healthy", label: "Instruments" },
]

const STATUS_COLORS = {
  healthy: "bg-emerald-500",
  degraded: "bg-yellow-500 animate-pulse",
  down: "bg-red-500 animate-pulse",
}

export function HealthBar() {
  const healthy = MOCK_HEALTH.filter((s) => s.status === "healthy").length
  const degraded = MOCK_HEALTH.filter((s) => s.status === "degraded").length
  const down = MOCK_HEALTH.filter((s) => s.status === "down").length

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-4 py-2">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        System
      </span>
      <TooltipProvider delayDuration={0}>
        <div className="flex items-center gap-1">
          {MOCK_HEALTH.map((service) => (
            <Tooltip key={service.name}>
              <TooltipTrigger asChild>
                <Link href="/services/observe/health" className="block">
                  <div className={cn("size-2 rounded-full", STATUS_COLORS[service.status])} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <span className="font-medium">{service.label}</span>
                <span className={cn(
                  "ml-2",
                  service.status === "healthy" ? "text-emerald-400" :
                  service.status === "degraded" ? "text-yellow-400" : "text-red-400"
                )}>
                  {service.status}
                </span>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
      <span className="text-[10px] text-muted-foreground">
        {healthy}/{MOCK_HEALTH.length}
        {degraded > 0 && <span className="text-yellow-400 ml-1">({degraded} degraded)</span>}
        {down > 0 && <span className="text-red-400 ml-1">({down} down)</span>}
      </span>
    </div>
  )
}
