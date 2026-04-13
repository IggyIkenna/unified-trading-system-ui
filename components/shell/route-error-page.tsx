"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export interface RouteErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Primary escape link (default: dashboard) */
  homeHref?: string;
  homeLabel?: string;
}

/**
 * Shared UI for Next.js `error.tsx` route boundaries — design tokens only, no stack traces.
 */
export function RouteErrorPage({
  error,
  reset,
  homeHref = "/dashboard",
  homeLabel = "Go to dashboard",
}: RouteErrorPageProps) {
  React.useEffect(() => {
    console.error("[route-error]", error?.message, error?.digest ?? "");
  }, [error]);

  const rawMessage = error?.message;
  const safeMessage =
    typeof rawMessage === "string" && rawMessage.length > 0 && rawMessage.length < 500
      ? rawMessage
      : "An unexpected error occurred.";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangle className="text-destructive size-10" aria-hidden />
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground max-w-md text-sm">{safeMessage}</p>
      {error?.digest ? <p className="text-muted-foreground/70 font-mono text-xs">Reference: {error.digest}</p> : null}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href={homeHref}>{homeLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
