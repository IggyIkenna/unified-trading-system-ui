"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACCESS_CODE_REQUIRED, accessCodeMatches } from "@/lib/briefings/access-code";
import { isBriefingSessionActive, setBriefingSessionActive } from "@/lib/briefings/session";
import { readConsent } from "@/components/marketing/cookie-consent-banner";
import { contactHrefFromPath } from "@/lib/marketing/contact-link";
import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

/**
 * Optional invite gate for `/briefings/*` and `/docs`.
 * When no codes are configured, the space is open (still uses its own session
 * key if progressive unlock is added later).
 *
 * Accepts either the global `NEXT_PUBLIC_BRIEFING_ACCESS_CODE` or any configured
 * per-path code. A single session unlocks all light-auth routes — per-path
 * scoping is a rotation convenience, not an isolation boundary.
 */
export function BriefingAccessGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = React.useState(!ACCESS_CODE_REQUIRED);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");
  const [cookieDeclined, setCookieDeclined] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    if (!ACCESS_CODE_REQUIRED) return;
    if (isBriefingSessionActive()) setUnlocked(true);
    setCookieDeclined(readConsent() === "declined");
  }, []);

  if (!ACCESS_CODE_REQUIRED || unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-16">
      <Lock className="size-10 text-muted-foreground mb-4" aria-hidden />
      <h1 className="text-xl font-semibold mb-2">Briefings</h1>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-2">
        Enter the access code you were given. This session is stored separately from platform sign-in.
      </p>
      <p className="text-xs text-muted-foreground text-center max-w-md mb-6" data-testid="briefing-gate-email-hint">
        Already filled out the questionnaire on another device? Check your email for the access code from{" "}
        <span className="font-medium text-foreground">hello@mail.odum-research.com</span>: paste it below and
        you&apos;re in.
      </p>
      {cookieDeclined ? (
        <div
          role="alert"
          data-testid="briefing-gate-cookie-warning"
          className="mb-4 max-w-sm rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
        >
          You declined cookies, so this session won&apos;t persist across page reloads: you&apos;ll need to re-enter the
          code each time. To stay signed in, accept cookies via the banner at the bottom of the page.
        </div>
      ) : null}
      <form
        className="flex w-full max-w-sm flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (accessCodeMatches(code)) {
            setBriefingSessionActive();
            setUnlocked(true);
            setError("");
          } else {
            setError("Code does not match.");
          }
        }}
      >
        <Input
          type="password"
          autoComplete="one-time-code"
          placeholder="Access code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <Button type="submit">Continue</Button>
      </form>
      <p className="text-xs text-muted-foreground text-center max-w-md mt-6">
        Don&apos;t have a code?{" "}
        <Link href="/questionnaire" className="text-primary hover:underline" data-testid="gate-request-access-link">
          Request one →
        </Link>{" "}
        : fill out a short questionnaire and we&apos;ll email you a code plus a calendar link to book a call. Or{" "}
        <Link href={contactHrefFromPath(pathname, "request-access")} className="text-primary hover:underline">
          contact us
        </Link>{" "}
        directly.
      </p>
    </div>
  );
}
