"use client";

import { LockedItemDialog, type LockedAccessType } from "@/components/shell/locked-item-dialog";
import { PLATFORM_MARKETING_NAV_LABEL } from "@/components/shell/nav-copy";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useBriefingSession } from "@/lib/briefings/session";
import { Lock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const RESEARCH_DOCS_SECTION = "Research & Documentation";
const CLIENT_ACCESS_SECTION = "Client Access";

function GatedSectionLabel({
  title,
  hint,
  locked,
}: {
  title: string;
  hint: string;
  locked: boolean;
}) {
  if (!locked) {
    return <DropdownMenuLabel className="text-xs text-muted-foreground">{title}</DropdownMenuLabel>;
  }

  return (
    <DropdownMenuLabel
      aria-label={`${title}, ${hint}`}
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
        {hint}
      </span>
    </DropdownMenuLabel>
  );
}

function GatedMenuItem({
  href,
  label,
  sectionTitle,
  accessType,
  children,
}: {
  href: string;
  label: string;
  sectionTitle: string;
  accessType: LockedAccessType;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const briefingSessionActive = useBriefingSession();
  // Code-gated items honour the cached light-auth session — one unlock
  // persists across briefings + docs for the same browser.
  const sessionSatisfied = accessType === "code" && briefingSessionActive;
  const locked = !loading && !user && !sessionSatisfied;

  if (locked) {
    return (
      <LockedItemDialog
        href={href}
        label={label}
        sectionTitle={sectionTitle}
        accessType={accessType}
      >
        {children}
      </LockedItemDialog>
    );
  }

  return (
    <DropdownMenuItem asChild>
      <Link
        href={href}
        className="relative flex w-full cursor-default items-center gap-2"
      >
        <span className="min-w-0 flex-1">{children}</span>
      </Link>
    </DropdownMenuItem>
  );
}

/** Shared Spaces menu destinations for public marketing, briefings/docs, and signed-in tools. */
export function SpacesNavSections() {
  const { user, loading } = useAuth();
  const briefingSessionActive = useBriefingSession();
  const signedOut = !loading && !user;
  const researchDocsLocked = signedOut && !briefingSessionActive;
  const clientAccessLocked = signedOut;
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
        <Link href="/signals">Odum Signals</Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/regulatory">Regulatory</Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <GatedSectionLabel
        title={RESEARCH_DOCS_SECTION}
        hint="Access code required"
        locked={researchDocsLocked}
      />
      <GatedMenuItem
        href="/briefings"
        label="Briefings Hub"
        sectionTitle={RESEARCH_DOCS_SECTION}
        accessType="code"
      >
        Briefings Hub
      </GatedMenuItem>
      <GatedMenuItem
        href="/docs"
        label="Developer Documentation"
        sectionTitle={RESEARCH_DOCS_SECTION}
        accessType="code"
      >
        Developer Documentation
      </GatedMenuItem>
      <DropdownMenuSeparator />
      {/*
       * Client Access — signed-in surfaces. Per
       * `codex/14-playbooks/cross-cutting/visibility-slicing.md`, which items a
       * user actually *sees content in* after clicking through is driven by the
       * `visible(user, item)` filter (role × entitlements × lock-state × maturity).
       * In demo mode the sign-in email picks the persona (see
       * `lib/auth/personas.ts`); an IM client lands in Client Reporting, a DART
       * client lands in the DART surface, an Odum investor lands in IR.
       * The dropdown shows the full set of destinations; per-page entitlement
       * enforcement hides content the persona cannot see.
       *
       * Client Reporting is the pb3a (Reg Umbrella) + pb3b (IM) shared surface —
       * same code, same screens, narrative-framing differs — see
       * `codex/14-playbooks/cross-cutting/client-reporting.md`.
       */}
      <GatedSectionLabel
        title={CLIENT_ACCESS_SECTION}
        hint="Sign-in required"
        locked={clientAccessLocked}
      />
      <GatedMenuItem
        href="/services/reports/overview"
        label="Client Reporting"
        sectionTitle={CLIENT_ACCESS_SECTION}
        accessType="signin"
      >
        Client Reporting
      </GatedMenuItem>
      <GatedMenuItem
        href="/dashboard"
        label="DART — Research, Trading, Execution"
        sectionTitle={CLIENT_ACCESS_SECTION}
        accessType="signin"
      >
        DART — Research, Trading, Execution
      </GatedMenuItem>
      <GatedMenuItem
        href="/services/signals/dashboard"
        label="Odum Signals — Counterparty Dashboard"
        sectionTitle={CLIENT_ACCESS_SECTION}
        accessType="signin"
      >
        Odum Signals — Counterparty Dashboard
      </GatedMenuItem>
      {/*
       * G1.1 intentional static link — the IM Strategy Catalogue is
       * phase-agnostic (it is a catalogue of strategies across research /
       * paper / live), not a phase-forked surface. DO NOT rewrite this via
       * `usePhaseBinding`; catalogue pages are independent of trading phase.
       */}
      <GatedMenuItem
        href="/services/im/funds"
        label="Funds (IM)"
        sectionTitle={CLIENT_ACCESS_SECTION}
        accessType="signin"
      >
        Funds (IM)
      </GatedMenuItem>
      <GatedMenuItem
        href="/services/research/strategy/catalog"
        label="Strategy Catalogue (IM)"
        sectionTitle={CLIENT_ACCESS_SECTION}
        accessType="signin"
      >
        Strategy Catalogue (IM)
      </GatedMenuItem>
      <GatedMenuItem
        href="/investor-relations"
        label="Investor Relations"
        sectionTitle={CLIENT_ACCESS_SECTION}
        accessType="signin"
      >
        Investor Relations
      </GatedMenuItem>
    </>
  );
}
