"use client"

/**
 * Mock mode banner for deployment UI.
 * TODO: wire to actual mock mode detection from env/config.
 */

const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_API === "true";

export function MockModeBanner() {
  if (!MOCK_MODE) return null;
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-4 py-2 text-center font-mono">
      MOCK MODE - Using simulated data
    </div>
  );
}
