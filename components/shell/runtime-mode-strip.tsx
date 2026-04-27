"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import { getDeploymentEnv } from "@/lib/runtime/environment";
import { WidgetScroll } from "@/components/shared/widget-scroll";

type ApiStatus = "reachable" | "degraded" | "offline";

export function RuntimeModeStrip() {
  const [apiStatus, setApiStatus] = React.useState<ApiStatus>("offline");
  const [showDebug, setShowDebug] = React.useState(false);
  const [readinessJson, setReadinessJson] = React.useState<unknown>(null);

  const debugRuntime = process.env.NEXT_PUBLIC_DEBUG_RUNTIME === "true";
  const isDev = getDeploymentEnv() === "dev";

  React.useEffect(() => {
    // Mock mode = intentional standalone UI, no backend. Never show "offline".
    if (isMockDataMode()) {
      setApiStatus("reachable");
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch("/api/health", {
          signal: AbortSignal.timeout(3000),
        });
        const data = await res.json();
        setReadinessJson(data);

        if (data?.status === "ok" || data?.status === "healthy" || res.ok) {
          if (
            data?.degraded_reasons?.length > 0 ||
            data?.upstream_checks?.some((c: { status: string }) => c.status !== "ok")
          ) {
            setApiStatus("degraded");
          } else {
            setApiStatus("reachable");
          }
        } else {
          setApiStatus("degraded");
        }
      } catch {
        setApiStatus("offline");
      }
    };

    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Backend unreachable banner — only appears in real mode (not mock) */}
      {apiStatus === "offline" && (
        <div
          className="flex items-center gap-2 px-4 py-1.5 bg-red-950/50 border-b border-red-500/20 text-red-300 text-xs"
          data-testid="backend-unreachable-banner"
          role="alert"
        >
          <AlertTriangle className="size-3.5 shrink-0" />
          {isDev ? (
            <span>
              Backend API not reachable. Start it with{" "}
              <code className="bg-red-900/50 px-1 rounded text-[10px]">
                bash unified-trading-pm/scripts/dev/dev-start.sh --all --mode mock
              </code>
            </span>
          ) : (
            <span>
              Backend API unreachable: live data unavailable. Please try again shortly or{" "}
              <a href="/contact" className="underline underline-offset-2 hover:text-red-100">
                contact support
              </a>
              .
            </span>
          )}
          {debugRuntime && (
            <button
              onClick={() => setShowDebug((o) => !o)}
              className="text-red-400 hover:text-red-200 underline ml-auto shrink-0"
            >
              debug
            </button>
          )}
        </div>
      )}

      {/* Debug drawer */}
      {showDebug && readinessJson && (
        <WidgetScroll
          axes="both"
          className="bg-card/50 border-b border-border/30 max-h-48"
          viewportClassName="px-4 py-2"
        >
          <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap">
            {JSON.stringify(readinessJson, null, 2)}
          </pre>
        </WidgetScroll>
      )}
    </>
  );
}
