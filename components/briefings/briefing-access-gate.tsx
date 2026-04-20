"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACCESS_CODE_REQUIRED, accessCodeMatches } from "@/lib/briefings/access-code";
import { isBriefingSessionActive, setBriefingSessionActive } from "@/lib/briefings/session";
import { Lock } from "lucide-react";
import Link from "next/link";
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

  React.useEffect(() => {
    if (!ACCESS_CODE_REQUIRED) return;
    if (isBriefingSessionActive()) setUnlocked(true);
  }, []);

  if (!ACCESS_CODE_REQUIRED || unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-16">
      <Lock className="size-10 text-muted-foreground mb-4" aria-hidden />
      <h1 className="text-xl font-semibold mb-2">Briefings</h1>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
        Enter the access code you were given. This session is stored separately from platform sign-in.
      </p>
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
        <Link href="/contact" className="text-primary hover:underline">
          Contact us
        </Link>{" "}
        to request one.
      </p>
    </div>
  );
}
