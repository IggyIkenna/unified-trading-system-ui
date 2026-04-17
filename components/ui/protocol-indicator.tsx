"use client";

import { useEffect, useState } from "react";
import { useProtocolStatus, type ProtocolKind } from "@/hooks/use-protocol-status";

// ---------------------------------------------------------------------------
// Config per protocol
// ---------------------------------------------------------------------------

interface ProtocolConfig {
  label: string;
  dotClass: string;
  borderClass: string;
  textClass: string;
  bgClass: string;
}

const PROTOCOL_STYLES: Record<ProtocolKind, ProtocolConfig> = {
  WS: {
    label: "WS Connected",
    dotClass: "bg-emerald-400",
    borderClass: "border-emerald-500/30",
    textClass: "text-emerald-300",
    bgClass: "bg-emerald-500/15",
  },
  SSE: {
    label: "SSE Streaming",
    dotClass: "bg-blue-400",
    borderClass: "border-blue-500/30",
    textClass: "text-blue-300",
    bgClass: "bg-blue-500/15",
  },
  REST: {
    label: "REST Polling",
    dotClass: "bg-amber-400",
    borderClass: "border-amber-500/30",
    textClass: "text-amber-300",
    bgClass: "bg-amber-500/15",
  },
  Mock: {
    label: "Mock",
    dotClass: "bg-gray-400",
    borderClass: "border-gray-500/30",
    textClass: "text-gray-300",
    bgClass: "bg-gray-500/15",
  },
};

const DISCONNECTED_STYLE: ProtocolConfig = {
  label: "Reconnecting...",
  dotClass: "bg-red-400 animate-pulse",
  borderClass: "border-red-500/30",
  textClass: "text-red-300",
  bgClass: "bg-red-500/15",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Small fixed-position badge showing the current data protocol and connection
 * state. Dev tool only — hidden in production unless NEXT_PUBLIC_DEV_TOOLS
 * is "true".
 *
 * Positioned bottom-right to avoid overlapping RuntimeModeBadge (bottom-left).
 *
 * Defers rendering until after hydration to avoid server/client mismatch
 * (connection registry is empty during SSR).
 */
function ProtocolBadge() {
  const { protocol, isConnected } = useProtocolStatus();
  const config = isConnected ? PROTOCOL_STYLES[protocol] : DISCONNECTED_STYLE;

  return (
    <div
      className={`fixed bottom-3 right-3 z-50 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-lg border backdrop-blur-sm ${config.bgClass} ${config.textClass} ${config.borderClass}`}
    >
      <span
        className={`inline-block size-1.5 rounded-full ${config.dotClass}`}
      />
      {config.label}
    </div>
  );
}

export function ProtocolIndicator() {
  const isDev =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEV_TOOLS === "true";

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return nothing on server AND first client render to avoid hydration mismatch.
  // useProtocolStatus reads browser-only state that doesn't exist during SSR.
  if (!isDev || !mounted) return null;

  return <ProtocolBadge />;
}
