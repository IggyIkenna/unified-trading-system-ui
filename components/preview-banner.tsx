"use client";

import { X } from "lucide-react";
import * as React from "react";

/**
 * Preview banner — shown across the entire site to signal that the platform
 * is mid-migration. Dismissible per session (localStorage).
 *
 * Deployed to odum-research.co.uk while the unified trading infrastructure
 * is being built out. The business is 4 years old but this is a new platform.
 */

const DISMISS_KEY = "preview-banner-dismissed";

export function PreviewBanner() {
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === "1") {
      setDismissed(true);
    }
  }, []);

  if (dismissed) return null;

  return (
    <div className="relative bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-center">
      <p className="text-xs text-amber-200/90 font-medium">
        <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold uppercase tracking-wider mr-2">
          Preview
        </span>
        Platform preview — some sections use sample data. Not all features are live yet.
      </p>
      <button
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, "1");
          setDismissed(true);
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-300/50 hover:text-amber-300 transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
