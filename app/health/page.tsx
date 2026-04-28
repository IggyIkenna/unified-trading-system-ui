"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/spinner";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Globe,
  RefreshCw,
  Server,
  Shield,
  Terminal,
  XCircle,
} from "lucide-react";
import * as React from "react";

type Status = "checking" | "ok" | "degraded" | "down" | "skipped";

interface HealthCheck {
  name: string;
  description: string;
  group: string;
  status: Status;
  latencyMs: number | null;
  detail: string | null;
  required: boolean;
}

type DetectedTier = 0 | 1 | 2;

const STATUS_ICON: Record<Status, React.ReactNode> = {
  checking: <Spinner className="size-4 text-muted-foreground" />,
  ok: <CheckCircle2 className="size-4 text-emerald-500" />,
  degraded: <AlertTriangle className="size-4 text-amber-500" />,
  down: <XCircle className="size-4 text-red-500" />,
  skipped: <span className="size-4 rounded-full border border-muted-foreground/30 inline-block" />,
};

const STATUS_COLOR: Record<Status, string> = {
  checking: "border-muted",
  ok: "border-emerald-500/20 bg-emerald-500/5",
  degraded: "border-amber-500/20 bg-amber-500/5",
  down: "border-red-500/20 bg-red-500/5",
  skipped: "border-muted bg-muted/5",
};

const GROUP_ICONS: Record<string, React.ReactNode> = {
  "API Gateways": <Server className="size-4" />,
  "API Domains": <Database className="size-4" />,
  "Auth & Security": <Shield className="size-4" />,
  WebSocket: <Globe className="size-4" />,
};

const TIER_DESCRIPTIONS: Record<DetectedTier, { label: string; description: string }> = {
  0: {
    label: "Tier 0: UI Only",
    description: "No API gateway detected. UI running with in-browser mock store.",
  },
  1: {
    label: "Tier 1: UI + API Gateways",
    description: "API gateway serving mock data via MockStateStore. No downstream service fleet.",
  },
  2: {
    label: "Tier 2: Full Fleet",
    description: "API gateway + downstream services. Full engine parity with production topology.",
  },
};

const TIER_COLORS: Record<DetectedTier, string> = {
  0: "border-slate-500/30 text-slate-400",
  1: "border-emerald-500/30 text-emerald-400",
  2: "border-cyan-500/30 text-cyan-400",
};

// Startup hint per service — tells user how to fix it at their current tier
function getStartupHint(checkName: string, detectedTier: DetectedTier): string {
  const tierCmd = `bash scripts/dev-tiers.sh --tier ${Math.max(detectedTier, 1)}`;

  switch (checkName) {
    case "unified-trading-api":
      return `Start all gateways: ${tierCmd}\nOr standalone: cd unified-trading-api && CLOUD_MOCK_MODE=true CLOUD_PROVIDER=local .venv/bin/python -m uvicorn "unified_trading_api.main:create_app" --factory --port 8030`;
    case "auth-api":
      return `Start all gateways: ${tierCmd}\nOr standalone: cd auth-api && CLOUD_MOCK_MODE=true CLOUD_PROVIDER=local .venv/bin/python -m uvicorn auth_api.app:app --port 8200`;
    case "client-reporting-api":
      return `Start all gateways: ${tierCmd}\nOr standalone: cd client-reporting-api && CLOUD_MOCK_MODE=true CLOUD_PROVIDER=local .venv/bin/python -m uvicorn client_reporting_api.api.main:app --port 8014`;
    default:
      if (checkName.startsWith("GET /")) {
        return "This endpoint is served by unified-trading-api. If the API gateway is running, this domain may not be seeded: try POST /admin/reset.";
      }
      return `Start with: ${tierCmd}`;
  }
}

async function checkEndpoint(
  url: string,
  timeoutMs: number = 5000,
): Promise<{
  ok: boolean;
  latencyMs: number;
  detail: string | null;
  data?: Record<string, unknown>;
}> {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const latencyMs = Math.round(performance.now() - start);

    if (!res.ok) {
      return { ok: false, latencyMs, detail: `HTTP ${res.status}` };
    }

    try {
      const body = await res.json();
      return { ok: true, latencyMs, detail: null, data: body };
    } catch {
      return { ok: true, latencyMs, detail: "non-JSON response" };
    }
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : "unknown error";
    if (message.includes("abort")) {
      return { ok: false, latencyMs, detail: `timeout (${timeoutMs}ms)` };
    }
    return { ok: false, latencyMs, detail: message };
  }
}

function useHealthChecks() {
  const [checks, setChecks] = React.useState<HealthCheck[]>([]);
  const [running, setRunning] = React.useState(false);
  const [lastRun, setLastRun] = React.useState<Date | null>(null);
  const [detectedTier, setDetectedTier] = React.useState<DetectedTier>(0);
  const [apiMeta, setApiMeta] = React.useState<Record<string, unknown> | null>(null);

  const runChecks = React.useCallback(async () => {
    setRunning(true);

    const definitions: Omit<HealthCheck, "status" | "latencyMs" | "detail">[] = [
      {
        name: "unified-trading-api",
        description: "Trading system gateway (port 8030)",
        group: "API Gateways",
        required: true,
      },
      {
        name: "auth-api",
        description: "SSO & token issuance (port 8200)",
        group: "Auth & Security",
        required: false,
      },
      {
        name: "client-reporting-api",
        description: "Client reports & invoicing (port 8014)",
        group: "API Gateways",
        required: false,
      },
      {
        name: "execution-results-api",
        description: "Execution results & backtests (port 8006)",
        group: "API Gateways",
        required: false,
      },
      {
        name: "deployment-api",
        description: "Deployment & infra management (port 8004)",
        group: "API Gateways",
        required: false,
      },
      {
        name: "config-api",
        description: "Onboarding & config (port 8005)",
        group: "API Gateways",
        required: false,
      },
      {
        name: "trading-analytics-api",
        description: "P&L attribution & settlements (port 8012)",
        group: "API Gateways",
        required: false,
      },
      {
        name: "batch-audit-api",
        description: "Batch jobs & audit trail (port 8013)",
        group: "API Gateways",
        required: false,
      },
      {
        name: "ml-training-api",
        description: "ML model training & registry (port 8011)",
        group: "API Gateways",
        required: false,
      },
      {
        name: "market-data-api",
        description: "Market data & candles (port 8007)",
        group: "API Gateways",
        required: false,
      },
      {
        name: "GET /positions/active",
        description: "Positions domain",
        group: "API Domains",
        required: true,
      },
      {
        name: "GET /execution/orders",
        description: "Execution domain",
        group: "API Domains",
        required: true,
      },
      {
        name: "GET /analytics/pnl",
        description: "Analytics domain",
        group: "API Domains",
        required: true,
      },
      {
        name: "GET /alerts/list",
        description: "Alerts domain",
        group: "API Domains",
        required: true,
      },
      {
        name: "GET /risk/limits",
        description: "Risk domain",
        group: "API Domains",
        required: true,
      },
      {
        name: "GET /instruments/list",
        description: "Instruments domain",
        group: "API Domains",
        required: true,
      },
      {
        name: "GET /ml/model-families",
        description: "ML domain",
        group: "API Domains",
        required: false,
      },
      {
        name: "GET /service-status/health",
        description: "Service status domain",
        group: "API Domains",
        required: false,
      },
      {
        name: "GET /users/organizations",
        description: "Users domain",
        group: "API Domains",
        required: false,
      },
      {
        name: "GET /market-data/candles",
        description: "Market data domain",
        group: "API Domains",
        required: false,
      },
      {
        name: "GET /reporting/reports",
        description: "Client reporting domain",
        group: "API Domains",
        required: false,
      },
      {
        name: "GET /auth/provisioning/health-checks",
        description: "User provisioning pipeline (auth-api)",
        group: "Auth & Security",
        required: false,
      },
      {
        name: "WebSocket /ws",
        description: "Real-time data channel",
        group: "WebSocket",
        required: false,
      },
    ];

    const initial: HealthCheck[] = definitions.map((d) => ({
      ...d,
      status: "checking",
      latencyMs: null,
      detail: null,
    }));
    setChecks(initial);
    const results = [...initial];

    // Check unified-trading-api health
    const apiHealth = await checkEndpoint("/api/health");
    const apiData = apiHealth.data as Record<string, unknown> | undefined;
    setApiMeta(apiData ?? null);

    if (apiHealth.ok && apiData) {
      const domains = (apiData.domains as string[]) ?? [];
      const version = (apiData.version as string) ?? "?";
      const mockMode = apiData.mock_mode as boolean;
      const uptime = Math.round((apiData.uptime_seconds as number) ?? 0);
      results[0] = {
        ...results[0],
        status: "ok",
        latencyMs: apiHealth.latencyMs,
        detail: `v${version} · ${mockMode ? "mock" : "live"} · ${domains.length} domains · uptime ${uptime}s`,
      };
    } else {
      results[0] = {
        ...results[0],
        status: "down",
        latencyMs: apiHealth.latencyMs,
        detail: apiHealth.detail,
      };
    }
    setChecks([...results]);

    // Detect tier
    let tier: DetectedTier = 0;
    if (apiHealth.ok) tier = 1;
    // TODO: detect T2 when LiveDomainService reports downstream service connectivity

    // If API down, skip everything else
    if (!apiHealth.ok) {
      setDetectedTier(0);
      for (let i = 1; i < results.length; i++) {
        results[i] = {
          ...results[i],
          status: "skipped",
          detail: "API gateway unreachable",
        };
      }
      setChecks([...results]);
      setRunning(false);
      setLastRun(new Date());
      return;
    }

    // Check auth-api
    const authCheck = await checkEndpoint("/api/auth/health");
    results[1] = {
      ...results[1],
      status: authCheck.ok ? "ok" : "down",
      latencyMs: authCheck.latencyMs,
      detail: authCheck.ok ? null : `${authCheck.detail}\n${getStartupHint("auth-api", tier)}`,
    };
    setChecks([...results]);

    // Check all remaining gateways in parallel (indices 2-9)
    const gatewayChecks = [
      { idx: 2, url: "/api/reporting/health", name: "client-reporting-api" },
      { idx: 3, url: "/api/execution/health", name: "execution-results-api" },
      { idx: 4, url: "/api/health", name: "deployment-api" },
      { idx: 5, url: "/api/config/health", name: "config-api" },
      { idx: 6, url: "/api/analytics/health", name: "trading-analytics-api" },
      { idx: 7, url: "/api/audit/health", name: "batch-audit-api" },
      { idx: 8, url: "/api/ml/health", name: "ml-training-api" },
      { idx: 9, url: "/api/market-data/health", name: "market-data-api" },
    ];
    const gwResults = await Promise.all(gatewayChecks.map((g) => checkEndpoint(g.url)));
    for (let i = 0; i < gwResults.length; i++) {
      const gw = gwResults[i];
      const g = gatewayChecks[i];
      results[g.idx] = {
        ...results[g.idx],
        status: gw.ok ? "ok" : "down",
        latencyMs: gw.latencyMs,
        detail: gw.ok ? null : `${gw.detail}\n${getStartupHint(g.name, tier)}`,
      };
    }
    setChecks([...results]);

    // Check domain endpoints in parallel (indices 10+)
    const gatewayCount = 10; // indices 0-9 are gateways
    const domainUrls = [
      "/api/positions/active",
      "/api/execution/orders",
      "/api/analytics/pnl",
      "/api/alerts/list",
      "/api/risk/limits",
      "/api/instruments/list",
      "/api/ml/model-families",
      "/api/service-status/health",
      "/api/users/organizations",
      "/api/market-data/candles?instrument=BTC-USDT&venue=binance&interval=1h&limit=1",
      "/api/reporting/reports",
      "/api/auth/provisioning/health-checks",
    ];

    const domainResults = await Promise.all(domainUrls.map((url) => checkEndpoint(url)));
    for (let i = 0; i < domainResults.length; i++) {
      const dr = domainResults[i];
      const idx = i + gatewayCount;
      results[idx] = {
        ...results[idx],
        status: dr.ok ? "ok" : "degraded",
        latencyMs: dr.latencyMs,
        detail: dr.ok ? null : (dr.detail ?? "endpoint returned error"),
      };
    }
    setChecks([...results]);

    // Check WebSocket
    const wsIdx = results.length - 1;
    try {
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${window.location.host}/api/ws`;
      const ws = new WebSocket(wsUrl);
      const wsResult = await new Promise<{
        ok: boolean;
        latencyMs: number;
        detail: string | null;
      }>((resolve) => {
        const start = performance.now();
        const timeout = setTimeout(() => {
          ws.close();
          resolve({
            ok: false,
            latencyMs: Math.round(performance.now() - start),
            detail: "timeout (5s)",
          });
        }, 5000);
        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve({
            ok: true,
            latencyMs: Math.round(performance.now() - start),
            detail: null,
          });
        };
        ws.onerror = () => {
          clearTimeout(timeout);
          resolve({
            ok: false,
            latencyMs: Math.round(performance.now() - start),
            detail: "connection refused",
          });
        };
      });
      results[wsIdx] = {
        ...results[wsIdx],
        status: wsResult.ok ? "ok" : "down",
        latencyMs: wsResult.latencyMs,
        detail: wsResult.detail,
      };
    } catch {
      results[wsIdx] = {
        ...results[wsIdx],
        status: "down",
        latencyMs: null,
        detail: "WebSocket not available",
      };
    }
    setChecks([...results]);

    setDetectedTier(tier);
    setRunning(false);
    setLastRun(new Date());
  }, []);

  React.useEffect(() => {
    runChecks();
  }, [runChecks]);

  return { checks, running, lastRun, runChecks, detectedTier, apiMeta };
}

export default function HealthPage() {
  const { checks, running, lastRun, runChecks, detectedTier, apiMeta } = useHealthChecks();

  const env = process.env.NEXT_PUBLIC_APP_ENV || "dev";
  const mockApi = isMockDataMode();
  const integration = process.env.NEXT_PUBLIC_UI_INTEGRATION || "slim";
  const isMockMode = apiMeta?.mock_mode === true || mockApi;

  const okCount = checks.filter((c) => c.status === "ok").length;
  const downCount = checks.filter((c) => c.status === "down" && c.required).length;
  const overallStatus = downCount > 0 ? "unhealthy" : okCount > 0 ? "healthy" : "checking";

  const groups = [...new Set(checks.map((c) => c.group))];

  const tierInfo = TIER_DESCRIPTIONS[detectedTier];

  return (
    <div className="min-h-screen bg-background p-6 max-w-4xl mx-auto">
      <PageHeader
        className="mb-6"
        title="System Health"
        description="Runtime connectivity for all connectors at the detected tier"
      >
        <div className="flex items-center gap-3">
          {lastRun && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {lastRun.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={runChecks} disabled={running}>
            <RefreshCw className={cn("size-3.5 mr-1.5", running && "animate-spin")} />
            {running ? "Checking..." : "Re-check"}
          </Button>
        </div>
      </PageHeader>

      {/* Detected Tier Banner */}
      <div className={cn("flex items-center gap-3 mb-4 p-4 rounded-lg border", TIER_COLORS[detectedTier])}>
        <Badge variant="outline" className={cn("text-sm font-bold px-3 py-1", TIER_COLORS[detectedTier])}>
          T{detectedTier}
        </Badge>
        <div>
          <p className="font-semibold text-sm">{tierInfo.label}</p>
          <p className="text-xs text-muted-foreground">{tierInfo.description}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge variant="outline" className="text-[10px]">
            {env.toUpperCase()}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {integration}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              isMockMode ? "border-amber-500/30 text-amber-400" : "border-emerald-500/30 text-emerald-400",
            )}
          >
            {isMockMode ? "MOCK" : "REAL"}
          </Badge>
        </div>
      </div>

      {/* Overall Status */}
      <div className="flex items-center gap-3 mb-6 p-3 rounded-lg border bg-card">
        <div
          className={cn(
            "size-3 rounded-full",
            overallStatus === "healthy" && "bg-emerald-500",
            overallStatus === "unhealthy" && "bg-red-500 animate-pulse",
            overallStatus === "checking" && "bg-muted-foreground animate-pulse",
          )}
        />
        <span className="font-semibold text-sm">
          {overallStatus === "healthy" &&
            `All required services operational (${okCount}/${checks.length} checks passed)`}
          {overallStatus === "unhealthy" && `${downCount} required service${downCount > 1 ? "s" : ""} down`}
          {overallStatus === "checking" && "Running checks..."}
        </span>
      </div>

      {/* Quick-start hint when gateway is down */}
      {detectedTier === 0 && !running && (
        <div className="mb-6 p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <Terminal className="size-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-300">No API gateway detected</p>
              <p className="text-xs text-muted-foreground mt-1">Start the full Tier 1 stack with one command:</p>
              <code className="block mt-2 text-[11px] bg-amber-900/30 px-3 py-2 rounded font-mono text-amber-200">
                cd unified-trading-system-ui && bash scripts/dev-tiers.sh --tier 1
              </code>
              <p className="text-[10px] text-muted-foreground mt-2">
                This starts unified-trading-api (8030) + auth-api (8200) + client-reporting-api (8014) + UI (3000)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Check groups */}
      {groups.map((group) => {
        const groupChecks = checks.filter((c) => c.group === group);
        return (
          <div key={group} className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              {GROUP_ICONS[group]}
              {group}
            </h2>
            <div className="space-y-2">
              {groupChecks.map((check) => (
                <div
                  key={check.name}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    STATUS_COLOR[check.status],
                  )}
                >
                  <div className="mt-0.5">{STATUS_ICON[check.status]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{check.name}</span>
                      {check.required && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                          required
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{check.description}</p>
                    {check.detail && (
                      <pre
                        className={cn(
                          "text-[11px] mt-1.5 whitespace-pre-wrap font-mono leading-relaxed",
                          check.status === "ok"
                            ? "text-emerald-400"
                            : check.status === "down"
                              ? "text-red-300"
                              : "text-amber-400",
                        )}
                      >
                        {check.detail}
                      </pre>
                    )}
                  </div>
                  {check.latencyMs !== null && (
                    <span
                      className={cn(
                        "text-xs tabular-nums shrink-0",
                        check.latencyMs < 100
                          ? "text-emerald-400"
                          : check.latencyMs < 500
                            ? "text-amber-400"
                            : "text-red-400",
                      )}
                    >
                      {check.latencyMs}ms
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Tier Reference */}
      <div className="mt-8 p-4 rounded-lg border border-border/50 bg-card/50 text-xs text-muted-foreground space-y-4">
        <div>
          <p className="font-medium mb-2 text-foreground">Local Tiers (dev machine)</p>
          <div className="space-y-1.5">
            <p>
              <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">bash scripts/dev-tiers.sh --tier 0</code>:
              UI-only. In-browser mock. No Python.
            </p>
            <p>
              <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">bash scripts/dev-tiers.sh --tier 1</code>: UI
              + API gateways. MockStateStore. Demo-ready.
            </p>
            <p>
              <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">bash scripts/dev-tiers.sh --tier 2</code>: UI
              + APIs + all service processes. Full engine parity.
            </p>
          </div>
        </div>
        <div>
          <p className="font-medium mb-2 text-foreground">Cloud Tiers (deployment-driven)</p>
          <div className="space-y-1.5">
            <p>
              <strong>T3</strong>: UI in cloud, API local. <strong>T4</strong>: UI + API in cloud. <strong>T5</strong> :
              Full cloud (mock). <strong>T6</strong>: Full cloud (real).
            </p>
            <p>
              Cloud tiers driven by Deployment UI or{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">deploy.py</code> scripts.
            </p>
          </div>
        </div>
        <div>
          <p className="font-medium mb-1 text-foreground">Other commands</p>
          <div className="space-y-1.5">
            <p>
              <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">bash scripts/dev-tiers.sh --stop</code>: Stop
              all processes.
            </p>
            <p>
              <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">bash scripts/dev-tiers.sh --status</code>:
              Show running processes and ports.
            </p>
            <p>
              Add <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">--real</code> to any tier for{" "}
              <code>CLOUD_MOCK_MODE=false</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
