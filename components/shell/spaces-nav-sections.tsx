"use client";

import { PLATFORM_MARKETING_NAV_LABEL } from "@/components/shell/nav-copy";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

function GatedSectionLabel({ title }: { title: string }) {
  const { user, loading } = useAuth();
  const showSignInHint = !loading && !user;

  if (!showSignInHint) {
    return <DropdownMenuLabel className="text-xs text-muted-foreground">{title}</DropdownMenuLabel>;
  }

  return (
    <DropdownMenuLabel
      aria-label={`${title}, sign-in required`}
      className="flex cursor-default flex-col gap-1 px-2 py-2 font-normal"
    >
      <span className="flex items-start gap-1.5 text-xs font-medium leading-snug text-muted-foreground">
        <Lock
          className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-500"
          aria-hidden
        />
        <span className="min-w-0 text-foreground/85">{title}</span>
      </span>
      <span className="pl-[calc(0.5rem+0.875rem)] text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
        Sign-in required
      </span>
    </DropdownMenuLabel>
  );
}

function GatedMenuItem({ href, children }: { href: string; children: ReactNode }) {
  const { user, loading } = useAuth();
  const locked = !loading && !user;

  return (
    <DropdownMenuItem asChild className={cn(locked && "pr-2")}>
      <Link
        href={href}
        title={locked ? "Sign-in required" : undefined}
        className={cn(
          "relative flex w-full cursor-default items-center gap-2",
          locked && "pr-7 text-muted-foreground",
        )}
      >
        <span className="min-w-0 flex-1">{children}</span>
        {locked ? (
          <Lock
            className="pointer-events-none absolute right-0 top-1/2 size-3.5 -translate-y-1/2 shrink-0 text-amber-600 dark:text-amber-500"
            aria-hidden
          />
        ) : null}
      </Link>
    </DropdownMenuItem>
  );
}

/** Shared Spaces menu destinations for public marketing, briefings/docs, and signed-in tools. */
export function SpacesNavSections() {
  return (
    <>
      <DropdownMenuLabel className="text-xs text-muted-foreground">Overview</DropdownMenuLabel>
      <DropdownMenuItem asChild>
        <Link href="/">Home</Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/investment-management">Investment Management</Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/platform">{PLATFORM_MARKETING_NAV_LABEL}</Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/regulatory">Regulatory</Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <GatedSectionLabel title="Research & Documentation" />
      <GatedMenuItem href="/briefings">Briefings Hub</GatedMenuItem>
      <GatedMenuItem href="/docs">Developer Documentation</GatedMenuItem>
      <DropdownMenuSeparator />
      <GatedSectionLabel title="Client Access" />
      <GatedMenuItem href="/investor-relations">Investor Relations</GatedMenuItem>
      {/*
       * G1.1 intentional static link — the IM Strategy Catalogue is
       * phase-agnostic (it is a catalogue of strategies across research /
       * paper / live), not a phase-forked surface. DO NOT rewrite this via
       * `usePhaseBinding`; catalogue pages are independent of trading phase.
       */}
      <GatedMenuItem href="/services/research/strategy/catalog">Strategy Catalogue (IM)</GatedMenuItem>
      <GatedMenuItem href="/dashboard">Trading & Analytics</GatedMenuItem>
    </>
  );
}
