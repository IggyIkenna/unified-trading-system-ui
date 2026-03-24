"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface WsReconnectBannerProps {
  isConnected: boolean;
  isReconnecting?: boolean;
}

function WsReconnectBanner({
  isConnected,
  isReconnecting = false,
}: WsReconnectBannerProps) {
  const show = !isConnected;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-amber-900/90 px-4 py-2 text-sm text-amber-200 transition-transform duration-300",
        show ? "translate-y-0" : "-translate-y-full",
      )}
    >
      {isReconnecting && <Loader2 className="size-4 animate-spin" />}
      <span>Connection lost — reconnecting...</span>
    </div>
  );
}

export { WsReconnectBanner, type WsReconnectBannerProps };
