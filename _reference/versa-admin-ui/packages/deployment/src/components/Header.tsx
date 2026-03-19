import { useState } from "react";
import {
  Activity,
  Server,
  AlertCircle,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useHealth } from "../hooks/useHealth";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import * as api from "../api/client";

export function Header() {
  const { health, isHealthy, error } = useHealth();
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleClearCache = async () => {
    setClearingCache(true);
    setCacheCleared(false);
    try {
      await api.clearCache();
      setCacheCleared(true);
      // Reset the "cleared" indicator after 3 seconds
      setTimeout(() => setCacheCleared(false), 3000);
    } catch (err) {
      console.error("Failed to clear cache:", err);
    } finally {
      setClearingCache(false);
    }
  };

  return (
    <header className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent-cyan)]/10 border border-[var(--color-accent-cyan)]/30">
            <Server className="h-5 w-5 text-[var(--color-accent-cyan)]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)] tracking-tight">
              Unified Trading Deployment
            </h1>
            <p className="text-xs text-[var(--color-text-tertiary)] font-mono">
              deployment monitoring & orchestration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Clear Cache Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearCache}
            disabled={clearingCache}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            title="Clear all caches - forces fresh data on next request"
          >
            {clearingCache ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : cacheCleared ? (
              <CheckCircle2 className="h-4 w-4 mr-1 text-[var(--color-accent-green)]" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1" />
            )}
            {cacheCleared ? "Cleared!" : "Clear Cache"}
          </Button>

          {/* API Status */}
          <div className="flex items-center gap-2">
            {isHealthy ? (
              <>
                <Activity className="h-4 w-4 text-[var(--color-accent-green)] animate-pulse" />
                <span className="text-sm text-[var(--color-text-secondary)]">
                  API
                </span>
                <Badge variant="success">Connected</Badge>
              </>
            ) : error ? (
              <>
                <AlertCircle className="h-4 w-4 text-[var(--color-accent-red)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">
                  API
                </span>
                <Badge variant="error">Disconnected</Badge>
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 text-[var(--color-text-tertiary)] animate-pulse" />
                <span className="text-sm text-[var(--color-text-secondary)]">
                  API
                </span>
                <Badge variant="pending">Checking...</Badge>
              </>
            )}
          </div>

          {/* Cloud Provider Indicator */}
          {health && (
            <Badge
              variant="outline"
              className="text-xs font-mono"
              title="Active cloud provider"
              style={{
                color: "#22d3ee",
                borderColor: "rgba(34,211,238,0.4)",
              }}
            >
              GCP
            </Badge>
          )}

          {/* GCS FUSE Status */}
          {health?.gcs_fuse && (
            <div
              className="flex items-center gap-1"
              title={health.gcs_fuse.reason}
            >
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  color: health.gcs_fuse.active
                    ? "var(--color-accent-green)"
                    : "var(--color-accent-red)",
                }}
              >
                {health.gcs_fuse.active ? "GCS Fuse" : "GCS API"}
              </Badge>
            </div>
          )}

          {/* Version */}
          {health && (
            <span className="text-xs font-mono text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-2 py-1 rounded">
              v{health.version}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
