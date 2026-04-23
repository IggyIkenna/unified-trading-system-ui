"use client";

import { isMockDataMode } from "@/lib/runtime/data-mode";

/**
 * Fixed-position badge showing the current runtime data mode.
 * Prevents mode confusion — always visible which data source is active.
 * Hidden in production (NEXT_PUBLIC_MOCK_API is always "false" there).
 */
export function RuntimeModeBadge() {
  const isMock = isMockDataMode();
  const authProvider = process.env.NEXT_PUBLIC_AUTH_PROVIDER ?? "firebase";

  // In production with real auth + real data, hide the badge entirely
  if (!isMock && authProvider === "firebase") return null;

  return (
    <div
      data-testid="runtime-mode-badge"
      className={`fixed bottom-3 left-3 z-50 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-lg border backdrop-blur-sm ${
        isMock
          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
          : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      }`}
    >
      <span
        className={`inline-block size-1.5 rounded-full ${
          isMock ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
        }`}
      />
      {isMock ? "Mock Data" : "Live Data"}
      {authProvider === "demo" && !isMock && (
        <span className="ml-1 opacity-60">| Demo Auth</span>
      )}
    </div>
  );
}
