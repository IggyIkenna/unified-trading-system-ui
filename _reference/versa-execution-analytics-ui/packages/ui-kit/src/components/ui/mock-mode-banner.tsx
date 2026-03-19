import * as React from "react";
import { FlaskConical, X } from "lucide-react";

const STORAGE_KEY = "mock-mode-banner-dismissed";

interface MockModeBannerProps {
  /** Label shown after "MOCK MODE". Defaults to "using simulated data — no real backend connected" */
  label?: string;
  /** Whether to show the dismiss button. Defaults to true. */
  dismissible?: boolean;
}

/**
 * Softer warning banner shown at the top of the app when VITE_MOCK_API=true.
 * Dismissal persists across nav via sessionStorage.
 * Always render this conditionally: {MOCK_MODE && <MockModeBanner />}
 */
export function MockModeBanner({
  label = "using simulated data — no real backend connected",
  dismissible = true,
}: MockModeBannerProps) {
  const [dismissed, setDismissed] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(STORAGE_KEY) === "true";
  });

  const handleDismiss = React.useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem(STORAGE_KEY, "true");
  }, []);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      aria-label="Mock mode active"
      className="mock-mode-banner flex items-center justify-center gap-2 py-1.5 px-4 text-xs font-medium font-mono tracking-wide relative shrink-0 z-50"
    >
      <FlaskConical size={13} className="shrink-0" />
      <span>
        <strong className="font-bold mr-1.5">MOCK MODE</strong>
        {label}
      </span>
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss mock mode banner"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 flex items-center opacity-70 hover:opacity-100 text-[var(--color-warning)] bg-transparent border-none cursor-pointer"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
