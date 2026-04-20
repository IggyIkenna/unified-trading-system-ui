"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { accessCodeMatches } from "@/lib/briefings/access-code";
import { setBriefingSessionActive } from "@/lib/briefings/session";
import { cn } from "@/lib/utils";
import { CalendarDays, KeyRound, Lock, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import type { ReactNode } from "react";

export type LockedAccessType = "code" | "signin";

interface LockedItemDialogProps {
  href: string;
  label: string;
  sectionTitle: string;
  accessType: LockedAccessType;
  children: ReactNode;
}

/**
 * Dropdown menu item rendered for signed-out users. Instead of navigating, the
 * click opens a dialog explaining how to unlock the space:
 * - `code`  → inline access-code input (shared light-auth session)
 * - `signin` → sign-in CTA that carries the target as a redirect param
 * Both variants also surface "Contact us" and "Book a call" fallbacks.
 */
export function LockedItemDialog({
  href,
  label,
  sectionTitle,
  accessType,
  children,
}: LockedItemDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");
  const router = useRouter();
  const signInHref = `/login?redirect=${encodeURIComponent(href)}`;
  const hint =
    accessType === "code"
      ? "Enter access code or contact us"
      : "Sign in or contact us";

  const handleCodeSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (accessCodeMatches(code)) {
      setBriefingSessionActive();
      setOpen(false);
      router.push(href);
    } else {
      setError("Code does not match.");
    }
  };

  return (
    <>
      <DropdownMenuItem
        aria-label={`${label} — ${hint}`}
        title={hint}
        data-testid="locked-item-trigger"
        className="pr-2"
        onSelect={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
      >
        <span
          className={cn(
            "relative flex w-full cursor-default items-center gap-2 pr-7 text-muted-foreground",
          )}
        >
          <span className="min-w-0 flex-1">{children}</span>
          <Lock
            className="pointer-events-none absolute right-0 top-1/2 size-3.5 -translate-y-1/2 shrink-0 text-amber-600 dark:text-amber-500"
            aria-hidden
          />
        </span>
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="size-4 text-amber-600 dark:text-amber-500" aria-hidden />
              {label}
            </DialogTitle>
            <DialogDescription>
              {sectionTitle} is access-restricted. Here&apos;s how to get in.
            </DialogDescription>
          </DialogHeader>

          {accessType === "code" ? (
            <form className="flex flex-col gap-3" onSubmit={handleCodeSubmit}>
              <label className="flex items-center gap-2 text-sm font-medium">
                <KeyRound className="size-4 text-muted-foreground" aria-hidden />
                Enter access code
              </label>
              <Input
                type="password"
                autoComplete="one-time-code"
                placeholder="Access code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError("");
                }}
                data-testid="locked-item-code-input"
              />
              {error ? (
                <p className="text-xs text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" data-testid="locked-item-code-submit">
                Continue
              </Button>
            </form>
          ) : (
            <Button asChild data-testid="locked-item-signin">
              <Link href={signInHref}>
                <LogIn className="size-4" aria-hidden />
                Sign in to continue
              </Link>
            </Button>
          )}

          <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" aria-hidden />
            <span>or request access</span>
            <span className="h-px flex-1 bg-border" aria-hidden />
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" data-testid="locked-item-contact">
              <Link href="/contact">
                <Mail className="size-4" aria-hidden />
                Contact us to request access
              </Link>
            </Button>
            <Button asChild variant="outline" data-testid="locked-item-demo">
              <Link href="/demo">
                <CalendarDays className="size-4" aria-hidden />
                Book a 45-minute call
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
