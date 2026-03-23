"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Circle } from "lucide-react"

type EnvBadge = "DEV" | "STAGING" | "PROD"
type ApiStatus = "reachable" | "degraded" | "offline"

const envColors: Record<EnvBadge, string> = {
  DEV: "border-violet-500/30 text-violet-400 bg-violet-500/10",
  STAGING: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  PROD: "border-emerald-500/20 text-emerald-400/60 bg-emerald-500/5",
}

const statusColors: Record<ApiStatus, string> = {
  reachable: "text-emerald-400",
  degraded: "text-amber-400",
  offline: "text-red-400",
}

const statusLabels: Record<ApiStatus, string> = {
  reachable: "API",
  degraded: "Degraded",
  offline: "Offline",
}

export function ApiStatusIndicator() {
  const [apiStatus, setApiStatus] = React.useState<ApiStatus>("offline")
  const [degradedReason, setDegradedReason] = React.useState<string | null>(null)

  const env = (process.env.NEXT_PUBLIC_APP_ENV?.toUpperCase() || "DEV") as EnvBadge

  React.useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/health", { signal: AbortSignal.timeout(3000) })
        const data = await res.json()
        if (data?.status === "ok" || data?.status === "healthy" || res.ok) {
          if (data?.degraded_reasons?.length > 0) {
            setApiStatus("degraded")
            setDegradedReason(data.degraded_reasons[0])
          } else if (data?.upstream_checks?.some((c: { status: string }) => c.status !== "ok")) {
            setApiStatus("degraded")
            const failed = data.upstream_checks.find((c: { status: string }) => c.status !== "ok")
            setDegradedReason(failed?.name || "upstream check failed")
          } else {
            setApiStatus("reachable")
            setDegradedReason(null)
          }
        } else {
          setApiStatus("degraded")
          setDegradedReason("unhealthy response")
        }
      } catch {
        setApiStatus("offline")
        setDegradedReason(null)
      }
    }
    poll()
    const interval = setInterval(poll, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-1.5">
      <Badge
        variant="outline"
        className={cn("text-[9px] px-1.5 py-0 h-4 font-mono", envColors[env])}
      >
        {env}
      </Badge>

      <span
        className={cn("flex items-center gap-1 text-[10px]", statusColors[apiStatus])}
        title={
          apiStatus === "degraded" && degradedReason
            ? `Degraded: ${degradedReason}`
            : apiStatus === "offline"
              ? "API not reachable"
              : "API reachable"
        }
      >
        <Circle
          className={cn(
            "size-1.5 fill-current",
            apiStatus === "reachable" && "animate-pulse",
          )}
        />
        <span className="hidden sm:inline">{statusLabels[apiStatus]}</span>
      </span>
    </div>
  )
}
