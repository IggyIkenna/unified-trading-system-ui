import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

type HealthStatus = "healthy" | "degraded" | "down" | "checking";

interface DependencyHealth {
  name: string;
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
}

interface HealthResponse {
  status: string;
  service?: string;
  cloud_provider?: string;
  mock_mode?: boolean;
  data_freshness?: {
    last_processed_date?: string;
    stale?: boolean;
    domain?: string;
  };
  dependencies?: DependencyHealth[];
  version?: string;
}

export interface HealthStatusBarProps {
  /** Full URL to the API health endpoint */
  healthUrl: string;
  /** Poll interval in ms (default: 30000) */
  pollInterval?: number;
  /** Service display name (default: derived from health response) */
  serviceName?: string;
  className?: string;
}

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  HealthStatus,
  { color: string; bgColor: string; borderColor: string; label: string }
> = {
  healthy: {
    color: "var(--color-success)",
    bgColor: "var(--color-success-dim)",
    borderColor: "rgba(74, 222, 128, 0.3)",
    label: "Healthy",
  },
  degraded: {
    color: "var(--color-warning)",
    bgColor: "var(--color-warning-dim)",
    borderColor: "rgba(251, 191, 36, 0.3)",
    label: "Degraded",
  },
  down: {
    color: "var(--color-error)",
    bgColor: "var(--color-error-dim)",
    borderColor: "rgba(248, 113, 113, 0.3)",
    label: "Down",
  },
  checking: {
    color: "var(--color-pending)",
    bgColor: "var(--color-pending-dim)",
    borderColor: "rgba(148, 163, 184, 0.3)",
    label: "Checking...",
  },
};

function resolveOverallStatus(responseStatus: string): HealthStatus {
  const s = responseStatus.toLowerCase();
  if (s === "ok" || s === "healthy" || s === "ready") return "healthy";
  if (s === "degraded" || s === "partial") return "degraded";
  return "down";
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── Component ──────────────────────────────────────────────────────────────────

export function HealthStatusBar({
  healthUrl,
  pollInterval = 30_000,
  serviceName,
  className,
}: HealthStatusBarProps) {
  const isMockMode =
    typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_MOCK_API === "true";

  const [status, setStatus] = useState<HealthStatus>(
    isMockMode ? "healthy" : "checking",
  );
  const [healthData, setHealthData] = useState<HealthResponse | null>(
    isMockMode
      ? {
          status: "ok",
          service: serviceName ?? "mock-service",
          mock_mode: true,
          data_freshness: {
            last_processed_date: new Date().toISOString().slice(0, 10),
            stale: false,
          },
          dependencies: [
            { name: "database", status: "healthy", latencyMs: 2 },
            { name: "cache", status: "healthy", latencyMs: 1 },
            { name: "event-bus", status: "healthy", latencyMs: 3 },
          ],
        }
      : null,
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(
    isMockMode ? new Date() : null,
  );
  const [expanded, setExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mountedRef = useRef(true);

  const checkHealth = useCallback(async () => {
    if (isMockMode) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(healthUrl, {
        signal: AbortSignal.timeout(5000),
      });
      if (!mountedRef.current) return;
      if (res.ok) {
        const data: HealthResponse = await res.json();
        setHealthData(data);
        setStatus(resolveOverallStatus(data.status));
        setLastUpdated(new Date());
      } else {
        setStatus("down");
        setHealthData(null);
        setLastUpdated(new Date());
      }
    } catch {
      if (mountedRef.current) {
        setStatus("down");
        setHealthData(null);
        setLastUpdated(new Date());
      }
    } finally {
      if (mountedRef.current) setIsRefreshing(false);
    }
  }, [healthUrl, isMockMode]);

  useEffect(() => {
    mountedRef.current = true;
    if (isMockMode) return;
    checkHealth();
    const interval = setInterval(checkHealth, pollInterval);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [checkHealth, pollInterval, isMockMode]);

  const cfg = STATUS_CONFIG[status];
  const displayName = serviceName ?? healthData?.service ?? "Service";

  return (
    <div
      className={cn(className)}
      style={{
        borderRadius: "var(--radius-md)",
        border: `1px solid ${cfg.borderColor}`,
        backgroundColor: cfg.bgColor,
        overflow: "hidden",
      }}
    >
      {/* Top bar — always visible */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          gap: 8,
          cursor: "pointer",
        }}
        onClick={() => setExpanded((prev) => !prev)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${displayName} health status: ${cfg.label}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Color dot */}
          <span
            data-testid="health-dot"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: cfg.color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: cfg.color,
            }}
          >
            {displayName}
          </span>
          <span
            style={{
              fontSize: 11,
              color: cfg.color,
              opacity: 0.8,
              fontFamily: "var(--font-mono)",
            }}
          >
            {cfg.label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {lastUpdated && (
            <span
              style={{
                fontSize: 10,
                color: "var(--color-text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {formatTimestamp(lastUpdated)}
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              checkHealth();
            }}
            aria-label="Refresh health status"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 2,
              display: "flex",
              alignItems: "center",
              color: "var(--color-text-tertiary)",
            }}
          >
            <RefreshCw
              size={12}
              className={isRefreshing ? "animate-spin" : ""}
            />
          </button>
          {expanded ? (
            <ChevronUp size={14} style={{ color: "var(--color-text-muted)" }} />
          ) : (
            <ChevronDown
              size={14}
              style={{ color: "var(--color-text-muted)" }}
            />
          )}
        </div>
      </div>

      {/* Expandable detail panel */}
      {expanded && healthData && (
        <div
          style={{
            borderTop: `1px solid ${cfg.borderColor}`,
            padding: "8px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {/* Data freshness */}
          {healthData.data_freshness && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--color-text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  minWidth: 80,
                }}
              >
                Data freshness
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  color: healthData.data_freshness.stale
                    ? "var(--color-warning)"
                    : "var(--color-text-secondary)",
                }}
              >
                {healthData.data_freshness.last_processed_date ?? "unknown"}
                {healthData.data_freshness.stale && " (stale)"}
              </span>
            </div>
          )}

          {/* Per-dependency rows */}
          {healthData.dependencies && healthData.dependencies.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginTop: 2,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--color-text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Dependencies
              </span>
              {healthData.dependencies.map((dep) => {
                const depCfg = STATUS_CONFIG[dep.status];
                return (
                  <div
                    key={dep.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      paddingLeft: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: depCfg.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-secondary)",
                        minWidth: 80,
                      }}
                    >
                      {dep.name}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--font-mono)",
                        color: depCfg.color,
                      }}
                    >
                      {depCfg.label}
                    </span>
                    {dep.latencyMs !== undefined && (
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "var(--font-mono)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {dep.latencyMs}ms
                      </span>
                    )}
                    {dep.message && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--color-text-muted)",
                          fontStyle: "italic",
                        }}
                      >
                        {dep.message}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Cloud provider / mock mode info */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 2,
              flexWrap: "wrap",
            }}
          >
            {healthData.cloud_provider && (
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-text-muted)",
                }}
              >
                provider: {healthData.cloud_provider}
              </span>
            )}
            {healthData.mock_mode !== undefined && (
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  color: healthData.mock_mode
                    ? "var(--color-warning)"
                    : "var(--color-text-muted)",
                }}
              >
                mock: {healthData.mock_mode ? "true" : "false"}
              </span>
            )}
            {healthData.version && (
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-text-muted)",
                }}
              >
                v{healthData.version}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
