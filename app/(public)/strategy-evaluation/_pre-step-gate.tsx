"use client";

/**
 * Pre-step gate — first surface a prospect sees on /strategy-evaluation.
 *
 * Branches the wizard into Path A (allocator) or Path B (builder/counterparty)
 * before any field-level data is collected, so the prospect sees only the
 * intake relevant to their commercial relationship.
 *
 * If the page resolves a `?path=allocator|builder` URL param, the gate is
 * skipped and the parent jumps straight to the matching wizard. The gate
 * still appears for direct-to-/strategy-evaluation traffic without a param.
 */

import * as React from "react";

interface PreStepGateProps {
  readonly onPickAllocator: () => void;
  readonly onPickBuilder: () => void;
}

export default function PreStepGate({ onPickAllocator, onPickBuilder }: PreStepGateProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <header className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Strategy Evaluation</p>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Which describes you best?</h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
          The intake form is shaped differently for allocators evaluating Odum-managed strategies versus builders
          running their own strategy on Odum infrastructure. Pick one to see only the questions that fit.
        </p>
      </header>
      {/* Cards are read-only panels (not buttons) so users can scan both
          options without an accidental click jumping them straight into
          a 20-minute DDQ. The explicit CTA at the bottom of each card is
          the only commit affordance. */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex h-full flex-col rounded-lg border border-border/80 bg-card/40 p-7 text-left md:p-8">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary/85">Path A</p>
          <h2 className="mt-2 text-lg font-semibold md:text-xl">Allocator</h2>
          <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
            I&rsquo;m allocating capital to Odum-managed strategies
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            Preference-shaped intake (~5 min): investor profile, risk appetite, venue + leverage constraints, capital
            scaling, structure preferences. We don&rsquo;t ask for methodology or track record &mdash; you&rsquo;re
            evaluating us, not the other way around.
          </p>
          <button
            type="button"
            onClick={onPickAllocator}
            className="mt-6 inline-flex w-fit items-center rounded-md border border-foreground/80 bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Continue as allocator &rarr;
          </button>
        </div>
        <div className="flex h-full flex-col rounded-lg border border-border/80 bg-card/40 p-7 text-left md:p-8">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary/85">Path B</p>
          <h2 className="mt-2 text-lg font-semibold md:text-xl">Builder / counterparty</h2>
          <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
            I&rsquo;m running my strategy on Odum infrastructure (DART)
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            Structured DDQ (~20 min): strategy shape, backtest evidence, risk + execution controls, fundraising posture.
            Includes a regulatory-wrapper sub-checkbox if Odum&rsquo;s regulatory cover applies. Signals-In, DART Full,
            and Odum-provided signals all share this path.
          </p>
          <button
            type="button"
            onClick={onPickBuilder}
            className="mt-6 inline-flex w-fit items-center rounded-md border border-foreground/80 bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Continue as builder &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
