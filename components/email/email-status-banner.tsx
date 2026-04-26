import * as React from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { EmailDispatchOutcome } from "@/lib/email/email-result";
import { cn } from "@/lib/utils";

interface EmailStatusBannerProps {
  outcome: EmailDispatchOutcome | null;
  className?: string;
}

/**
 * Inline status banner for transactional email dispatch outcomes.
 *
 * Renders nothing when `outcome` is null (initial state). On `queued` shows
 * a green confirmation; on `client-error` / `server-error` shows an amber
 * warning with the server-provided message.
 *
 * Used on the public /contact form. Reusable for any surface that needs to
 * report email dispatch state.
 */
export function EmailStatusBanner({ outcome, className }: EmailStatusBannerProps) {
  if (outcome === null) return null;

  const isError = outcome.status === "client-error" || outcome.status === "server-error";

  return (
    <div
      role={isError ? "alert" : "status"}
      data-status={outcome.status}
      className={cn(
        "flex items-start gap-3 rounded-md border px-4 py-3 text-sm",
        isError
          ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
        className,
      )}
    >
      {isError ? (
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
      )}
      <p className="leading-snug">{outcome.message}</p>
    </div>
  );
}
