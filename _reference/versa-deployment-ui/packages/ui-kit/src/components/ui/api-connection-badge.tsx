import { useEffect, useRef, useState } from "react";

type ConnectionState = "connected" | "disconnected" | "checking" | "mock";

interface ApiConnectionBadgeProps {
  /** Full URL to the API health endpoint, e.g. import.meta.env.VITE_API_URL + "/health" */
  healthUrl: string;
  /** Poll interval in ms (default: 30000) */
  pollInterval?: number;
}

const STATE_CONFIG: Record<
  ConnectionState,
  { dotClass: string; badgeClass: string; label: string; pulse: boolean }
> = {
  connected: {
    dotClass: "status-dot-success",
    badgeClass: "badge-success",
    label: "API connected",
    pulse: false,
  },
  disconnected: {
    dotClass: "status-dot-error",
    badgeClass: "badge-error",
    label: "API disconnected",
    pulse: false,
  },
  checking: {
    dotClass: "status-dot-pending",
    badgeClass: "badge-pending",
    label: "Checking API...",
    pulse: true,
  },
  mock: {
    dotClass: "status-dot-running",
    badgeClass: "badge-running",
    label: "Mock mode",
    pulse: false,
  },
};

/**
 * ApiConnectionBadge polls the backend `/health` endpoint and renders
 * a small dot + label showing whether the API is reachable.
 *
 * In mock mode (`VITE_MOCK_API=true`), it shows a purple "MOCK" badge
 * without making any network requests.
 *
 * Place it in the `rightSlot` of `<AppHeader>`, next to `<CloudModeBadge>`.
 */
export function ApiConnectionBadge({
  healthUrl,
  pollInterval = 30_000,
}: ApiConnectionBadgeProps) {
  const isMockMode =
    typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_MOCK_API === "true";

  const [state, setState] = useState<ConnectionState>(
    isMockMode ? "mock" : "checking",
  );
  const [version, setVersion] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (isMockMode) return;

    async function checkHealth() {
      try {
        const res = await fetch(healthUrl, {
          signal: AbortSignal.timeout(5000),
        });
        if (!mountedRef.current) return;
        if (res.ok) {
          const data: { status?: string; version?: string } = await res.json();
          setState("connected");
          setVersion(data.version ?? null);
        } else {
          setState("disconnected");
          setVersion(null);
        }
      } catch {
        if (mountedRef.current) {
          setState("disconnected");
          setVersion(null);
        }
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, pollInterval);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [healthUrl, pollInterval, isMockMode]);

  const cfg = STATE_CONFIG[state];
  const title = version ? `${cfg.label} (v${version})` : cfg.label;

  if (state === "mock") {
    return (
      <span
        className={`${cfg.badgeClass} inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold font-mono border`}
        title={title}
      >
        MOCK
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5" title={title}>
      <span
        className={`${cfg.dotClass} inline-block w-1.5 h-1.5 rounded-full shrink-0${cfg.pulse ? " animate-pulse" : ""}`}
      />
      <span className={`${cfg.badgeClass} text-[10px] font-mono`}>API</span>
    </span>
  );
}
