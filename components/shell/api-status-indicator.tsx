"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";
import { getEnvLabel } from "@/lib/runtime/environment";
import { isMockDataMode } from "@/lib/runtime/data-mode";

type EnvBadge = "DEV" | "STAGING" | "PROD";
type ApiStatus = "reachable" | "degraded" | "offline" | "mock";

const envColors: Record<EnvBadge, string> = {
  DEV: "border-violet-500/30 text-violet-400 bg-violet-500/10",
  STAGING: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  PROD: "border-emerald-500/20 text-emerald-400/60 bg-emerald-500/5",
};

const statusColors: Record<ApiStatus, string> = {
  reachable: "text-emerald-400",
  degraded: "text-amber-400",
  offline: "text-red-400",
  mock: "text-amber-400/70",
};

const statusLabels: Record<ApiStatus, string> = {
  reachable: "API",
  degraded: "Degraded",
  offline: "Offline",
  mock: "Mock",
};

export function ApiStatusIndicator() {
  const [apiStatus, setApiStatus] = React.useState<ApiStatus>("offline");
  const [degradedReason, setDegradedReason] = React.useState<string | null>(null);

  // Derived from hostname at runtime — always correct, never stale build-time var
  const env = getEnvLabel() as EnvBadge;
  const isMock = isMockDataMode();

  React.useEffect(() => {
    // Mock mode = intentional standalone UI, no backend expected. Never "offline".
    if (isMock) {
      setApiStatus("mock");
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch("/api/health", {
          signal: AbortSignal.timeout(3000),
        });
        const data = await res.json();
        if (data?.status === "ok" || data?.status === "healthy" || res.ok) {
          if (data?.degraded_reasons?.length > 0) {
            setApiStatus("degraded");
            setDegradedReason(data.degraded_reasons[0]);
          } else if (data?.upstream_checks?.some((c: { status: string }) => c.status !== "ok")) {
            setApiStatus("degraded");
            const failed = data.upstream_checks.find((c: { status: string }) => c.status !== "ok");
            setDegradedReason(failed?.name ?? "upstream check failed");
          } else {
            setApiStatus("reachable");
            setDegradedReason(null);
          }
        } else {
          setApiStatus("degraded");
          setDegradedReason("unhealthy response");
        }
      } catch {
        setApiStatus("offline");
        setDegradedReason(null);
      }
    };

    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [isMock]);

  const statusTitle =
    apiStatus === "degraded" && degradedReason
      ? `Degraded: ${degradedReason}`
      : apiStatus === "offline"
        ? "Backend API not reachable"
        : apiStatus === "mock"
          ? "Running on mock data: no backend connection"
          : "API reachable";

  return (
    <div className="flex items-center gap-1.5" data-testid="api-status-indicator">
      <Badge
        variant="outline"
        data-testid="env-badge"
        data-env={env}
        className={cn("text-[9px] px-1.5 py-0 h-4 font-mono", envColors[env])}
      >
        {env}
      </Badge>

      <span
        className={cn("flex items-center gap-1 text-[10px]", statusColors[apiStatus])}
        title={statusTitle}
        data-testid="api-status-dot"
        data-status={apiStatus}
      >
        <Circle className={cn("size-1.5 fill-current", apiStatus === "reachable" && "animate-pulse")} />
        <span className="hidden sm:inline">{statusLabels[apiStatus]}</span>
      </span>
    </div>
  );
}
