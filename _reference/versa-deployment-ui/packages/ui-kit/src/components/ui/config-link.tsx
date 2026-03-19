import { Settings } from "lucide-react";
import { cn } from "../../lib/utils";

// ── ConfigLink ──────────────────────────────────────────────────────────────
// A subtle gear-icon link that navigates to an onboarding-ui configuration page.
// Used by consumer UIs (strategy, health-monitor, deployment) to provide
// quick access to relevant config pages in the onboarding portal.

/** Default onboarding-ui dev URL (from ui-api-mapping.json port 5173). */
const DEFAULT_ONBOARDING_URL = "http://localhost:5173";

export interface ConfigLinkProps {
  /** Label shown next to the gear icon. Defaults to "Configure". */
  label?: string;
  /** Path on the onboarding UI (e.g. "/strategy-manifest", "/risk"). */
  path: string;
  /** Base URL for the onboarding UI. Defaults to localhost:5173. */
  onboardingBaseUrl?: string;
  /** Extra className for the outer element. */
  className?: string;
}

/**
 * ConfigLink renders a small, subtle gear-icon link that opens the
 * corresponding onboarding-ui configuration page in the same tab.
 */
export function ConfigLink({
  label = "Configure",
  path,
  onboardingBaseUrl = DEFAULT_ONBOARDING_URL,
  className,
}: ConfigLinkProps) {
  const href = `${onboardingBaseUrl}${path}`;

  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-mono",
        "text-[var(--color-text-muted)] hover:text-[var(--color-accent-cyan)]",
        "transition-colors",
        className,
      )}
      title={`Open ${label} in Onboarding Portal`}
      data-testid="config-link"
    >
      <Settings size={11} />
      <span>{label}</span>
    </a>
  );
}
