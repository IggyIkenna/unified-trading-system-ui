import { useState } from "react";
import { FlaskConical, X } from "lucide-react";
import { MOCK_MODE } from "../lib/mock-api";

export function MockModeBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (!MOCK_MODE || dismissed) return null;

  return (
    <div
      role="alert"
      aria-label="Mock mode active"
      className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium shrink-0 relative"
      style={{
        background: "rgba(251, 191, 36, 0.12)",
        borderBottom: "1px solid rgba(251, 191, 36, 0.4)",
        color: "#fbbf24",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.02em",
      }}
    >
      <FlaskConical size={12} className="shrink-0" />
      <span>
        <strong className="font-bold mr-1.5">MOCK MODE</strong>
        using simulated data — no real backend connected
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss mock mode banner"
        className="absolute right-3 opacity-70 hover:opacity-100"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#fbbf24",
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
}
