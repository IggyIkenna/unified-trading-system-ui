import { useEffect, useState } from "react";

interface HealthData {
  cloud_provider?: string;
  mock_mode?: boolean;
}

const PROVIDER_CLASSES: Record<string, string> = {
  gcp: "badge-gcp",
  aws: "badge-aws",
  local: "badge-local",
};

/**
 * CloudModeBadge fetches the `/health` endpoint and renders a small
 * inline badge showing the cloud provider (GCP / AWS / LOCAL) and
 * an optional MOCK indicator when `mock_mode` is true.
 *
 * Place it in the `rightSlot` of `<AppHeader>`.
 */
export function CloudModeBadge() {
  const [data, setData] = useState<HealthData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchHealth() {
      try {
        const res = await fetch("/health");
        if (!res.ok) return;
        const json: HealthData = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // health endpoint not available — badge stays hidden
      }
    }

    fetchHealth();
    const interval = setInterval(fetchHealth, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!data?.cloud_provider) return null;

  const provider = data.cloud_provider.toUpperCase();
  const badgeClass =
    PROVIDER_CLASSES[data.cloud_provider.toLowerCase()] ??
    "badge-provider-default";
  const isMock = data.mock_mode === true;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`${badgeClass} inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold font-mono border`}
        title={`Cloud provider: ${provider}`}
      >
        {provider}
      </span>
      {isMock && (
        <span
          className="badge-warning inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold font-mono"
          title="Mock mode active — no live cloud calls"
        >
          MOCK
        </span>
      )}
    </div>
  );
}
