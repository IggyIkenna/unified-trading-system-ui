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
          Pick the side that fits. The questions are different for each, so you only see what matters for you.
        </p>
      </header>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex h-full flex-col rounded-lg border border-border/80 bg-card/40 p-7 text-left md:p-8">
          <h2 className="text-lg font-semibold md:text-xl">Allocator</h2>
          <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
            I want Odum to manage capital for me
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            Odum runs the strategy end to end. You set the constraints (mandate size, eligible venues, leverage cap,
            structure, reporting cadence); we do the research, execution, and day-to-day management. About five minutes.
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
          <h2 className="text-lg font-semibold md:text-xl">Builder</h2>
          <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
            I run my own strategy and want Odum to provide some or all of the infrastructure
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            Anywhere from just our signals (you trade them yourself), to signals plus execution, post-trade, and
            treasury, to a full build: data, research, infrastructure, and the route to launch and trade. The questions
            cover your strategy, the evidence behind it, and which parts you want from us. About twenty minutes.
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
