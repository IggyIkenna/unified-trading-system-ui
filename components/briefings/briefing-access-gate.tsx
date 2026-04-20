"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isBriefingSessionActive, setBriefingSessionActive } from "@/lib/briefings/session";
import { Lock } from "lucide-react";
import * as React from "react";

const REQUIRED_CODE = process.env.NEXT_PUBLIC_BRIEFING_ACCESS_CODE ?? "";

/**
 * Optional invite gate for `/briefings/*`.
 * When `NEXT_PUBLIC_BRIEFING_ACCESS_CODE` is empty, the hub is open (still uses its own session key if you later add progressive unlock).
 */
export function BriefingAccessGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = React.useState(!REQUIRED_CODE);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!REQUIRED_CODE) return;
    if (isBriefingSessionActive()) setUnlocked(true);
  }, []);

  if (!REQUIRED_CODE || unlocked) {
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
          if (code.trim() === REQUIRED_CODE) {
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
    </div>
  );
}
