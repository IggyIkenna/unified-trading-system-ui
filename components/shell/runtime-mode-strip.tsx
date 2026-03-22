"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Circle, AlertTriangle } from "lucide-react"

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

export function RuntimeModeStrip() {
  const [apiStatus, setApiStatus] = React.useState<ApiStatus>("offline")
  const [degradedReason, setDegradedReason] = React.useState<string | null>(null)
  const [showDebug, setShowDebug] = React.useState(false)
  const [readinessJson, setReadinessJson] = React.useState<unknown>(null)

  const env = (process.env.NEXT_PUBLIC_APP_ENV?.toUpperCase() || "DEV") as EnvBadge
  const integrationProfile = process.env.NEXT_PUBLIC_UI_INTEGRATION || "slim"
  const debugRuntime = process.env.NEXT_PUBLIC_DEBUG_RUNTIME === "true"

  React.useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/health", { signal: AbortSignal.timeout(3000) })
        const data = await res.json()
        setReadinessJson(data)

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
    <>
      <div className="flex items-center gap-2 px-4 py-0.5 text-[10px] border-b border-border/30 bg-background/50">
        {/* Environment badge */}
        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4", envColors[env])}>
          {env}
        </Badge>

        {/* Integration profile */}
        <span className="text-muted-foreground">
          {integrationProfile}
        </span>

        <div className="w-px h-3 bg-border/50" />

        {/* API status */}
        <span className={cn("flex items-center gap-1", statusColors[apiStatus])}>
          <Circle className={cn("size-1.5 fill-current", apiStatus === "reachable" && "animate-pulse")} />
          {apiStatus === "reachable" && "API Reachable"}
          {apiStatus === "degraded" && `Degraded${degradedReason ? `: ${degradedReason}` : ""}`}
          {apiStatus === "offline" && "API Offline"}
        </span>

        {/* Debug link */}
        {debugRuntime && (
          <button
            onClick={() => setShowDebug(o => !o)}
            className="text-muted-foreground hover:text-foreground underline ml-auto"
          >
            debug
          </button>
        )}
      </div>

      {/* Blocking banner when API offline */}
      {apiStatus === "offline" && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-red-950/50 border-b border-red-500/20 text-red-300 text-xs">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>
            unified-trading-api not reachable. Start it with{" "}
            <code className="bg-red-900/50 px-1 rounded text-[10px]">
              bash unified-trading-pm/scripts/dev/dev-start.sh --all --mode mock
            </code>
          </span>
        </div>
      )}

      {/* Debug drawer */}
      {showDebug && readinessJson && (
        <div className="px-4 py-2 bg-card/50 border-b border-border/30 max-h-48 overflow-auto">
          <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap">
            {JSON.stringify(readinessJson, null, 2)}
          </pre>
        </div>
      )}
    </>
  )
}
