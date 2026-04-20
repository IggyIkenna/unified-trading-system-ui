// Source: codex/14-playbooks/experience/dart-briefing.md
//
// DART paths overview — briefing /briefings/platform.
// Static inline SVG + Tailwind. No animation, no third-party libs.
//
// Shows the two DART paths side-by-side so a reader sees where they sit,
// where Odum sits, and where the venue sits — before reading any section.
//
//   Your firm   |   Odum (shared stack)   |   Venues (your keys)
//   Signals-In  :  instructions → exec → fills → reporting
//   Full        :  research → promote → paper → live → reporting
//
// A footer band points at the sibling paths (IM, Regulatory, Signals-Out)
// so the orientation is complete in one look.

import Link from "next/link";
import * as React from "react";

export function DartPathsOverviewDiagram(): React.JSX.Element {
  return (
    <figure
      className="mb-8 overflow-hidden rounded-lg border border-border bg-card/40 p-6"
      data-testid="dart-paths-overview-diagram"
      aria-labelledby="dart-paths-diagram-title"
    >
      <figcaption
        id="dart-paths-diagram-title"
        className="mb-4 text-sm font-semibold text-foreground"
      >
        DART — where you sit, where Odum sits, where we meet
      </figcaption>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 960 520"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby="dart-paths-svg-title dart-paths-svg-desc"
          className="mx-auto block h-auto w-full min-w-[640px] max-w-[960px]"
        >
          <title id="dart-paths-svg-title">
            DART commercial paths overview
          </title>
          <desc id="dart-paths-svg-desc">
            Two DART paths run on one shared stack. Signals-In flows
            client-generated instructions through Odum execution to the
            client&apos;s venues. Full Pipeline additionally uses Odum&apos;s
            research and promote layer on the same components. Investment
            Management, Regulatory Umbrella, and Odum Signals-Out sit alongside
            as sibling commercial paths.
          </desc>

          <defs>
            <marker
              id="dart-paths-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                className="fill-neutral-500 dark:fill-neutral-400"
              />
            </marker>
            <marker
              id="dart-paths-arrow-back"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                className="fill-neutral-400/80 dark:fill-neutral-500/80"
              />
            </marker>
          </defs>

          {/* Column headers */}
          <text
            x="130"
            y="30"
            textAnchor="middle"
            className="fill-zinc-600 text-[11px] font-semibold uppercase tracking-wide dark:fill-zinc-400"
          >
            Your firm
          </text>
          <text
            x="480"
            y="30"
            textAnchor="middle"
            className="fill-zinc-600 text-[11px] font-semibold uppercase tracking-wide dark:fill-zinc-400"
          >
            Odum — shared stack
          </text>
          <text
            x="830"
            y="30"
            textAnchor="middle"
            className="fill-zinc-600 text-[11px] font-semibold uppercase tracking-wide dark:fill-zinc-400"
          >
            Your venues — scoped Odum keys
          </text>

          {/* Column dividers (subtle guide lines) */}
          <line
            x1="260"
            y1="50"
            x2="260"
            y2="370"
            strokeDasharray="3 4"
            className="stroke-neutral-300 dark:stroke-neutral-700"
            strokeWidth={1}
          />
          <line
            x1="700"
            y1="50"
            x2="700"
            y2="370"
            strokeDasharray="3 4"
            className="stroke-neutral-300 dark:stroke-neutral-700"
            strokeWidth={1}
          />

          {/* ===== Row 1: Signals-In path ===== */}
          <g>
            <rect
              x="30"
              y="70"
              width="200"
              height="80"
              rx="8"
              className="fill-sky-50 stroke-sky-400/70 dark:fill-sky-950/40 dark:stroke-sky-500/70"
              strokeWidth={1.5}
            />
            <text
              x="130"
              y="96"
              textAnchor="middle"
              className="fill-sky-900 text-[13px] font-semibold dark:fill-sky-200"
            >
              Your signal generator
            </text>
            <text
              x="130"
              y="114"
              textAnchor="middle"
              className="fill-sky-700 text-[11px] dark:fill-sky-400"
            >
              models, features, regime
            </text>
            <text
              x="130"
              y="130"
              textAnchor="middle"
              className="fill-sky-700 text-[11px] italic dark:fill-sky-400"
            >
              stays on your side
            </text>
          </g>

          <g>
            <rect
              x="290"
              y="70"
              width="380"
              height="80"
              rx="8"
              className="fill-violet-50 stroke-violet-400/70 dark:fill-violet-950/40 dark:stroke-violet-500/70"
              strokeWidth={1.5}
            />
            <text
              x="480"
              y="96"
              textAnchor="middle"
              className="fill-violet-900 text-[13px] font-semibold dark:fill-violet-200"
            >
              Execution · risk · allocation · reporting
            </text>
            <text
              x="480"
              y="116"
              textAnchor="middle"
              className="fill-violet-700 text-[11px] dark:fill-violet-400"
            >
              instruction schema · 8 fields · idempotent
            </text>
            <text
              x="480"
              y="132"
              textAnchor="middle"
              className="fill-violet-700 text-[11px] italic dark:fill-violet-400"
            >
              same components Odum uses internally
            </text>
          </g>

          <g>
            <rect
              x="730"
              y="70"
              width="200"
              height="80"
              rx="8"
              className="fill-amber-50 stroke-amber-400/70 dark:fill-amber-950/30 dark:stroke-amber-500/70"
              strokeWidth={1.5}
            />
            <text
              x="830"
              y="96"
              textAnchor="middle"
              className="fill-amber-900 text-[13px] font-semibold dark:fill-amber-200"
            >
              Your venue accounts
            </text>
            <text
              x="830"
              y="114"
              textAnchor="middle"
              className="fill-amber-800 text-[11px] dark:fill-amber-300"
            >
              scoped execute + read keys
            </text>
            <text
              x="830"
              y="130"
              textAnchor="middle"
              className="fill-amber-800 text-[11px] italic dark:fill-amber-300"
            >
              custody stays with you
            </text>
          </g>

          {/* Signals-In forward arrows */}
          <g>
            <line
              x1="230"
              y1="102"
              x2="290"
              y2="102"
              strokeWidth={1.5}
              markerEnd="url(#dart-paths-arrow)"
              className="stroke-neutral-500 dark:stroke-neutral-400"
            />
            <text
              x="260"
              y="94"
              textAnchor="middle"
              className="fill-neutral-600 text-[10px] font-medium dark:fill-neutral-300"
            >
              instructions
            </text>
          </g>
          <g>
            <line
              x1="670"
              y1="102"
              x2="730"
              y2="102"
              strokeWidth={1.5}
              markerEnd="url(#dart-paths-arrow)"
              className="stroke-neutral-500 dark:stroke-neutral-400"
            />
            <text
              x="700"
              y="94"
              textAnchor="middle"
              className="fill-neutral-600 text-[10px] font-medium dark:fill-neutral-300"
            >
              orders
            </text>
          </g>
          {/* Return flows (reporting back to client) */}
          <g>
            <line
              x1="730"
              y1="124"
              x2="670"
              y2="124"
              strokeWidth={1.25}
              markerEnd="url(#dart-paths-arrow-back)"
              className="stroke-neutral-400/80 dark:stroke-neutral-500/80"
            />
            <line
              x1="290"
              y1="124"
              x2="230"
              y2="124"
              strokeWidth={1.25}
              markerEnd="url(#dart-paths-arrow-back)"
              className="stroke-neutral-400/80 dark:stroke-neutral-500/80"
            />
            <text
              x="260"
              y="140"
              textAnchor="middle"
              className="fill-neutral-500 text-[9.5px] dark:fill-neutral-400"
            >
              fills · P&amp;L · reconciliation
            </text>
          </g>

          {/* Row label (Signals-In) */}
          <text
            x="30"
            y="62"
            className="fill-sky-700 text-[11px] font-semibold dark:fill-sky-400"
          >
            DART Signals-In
          </text>

          {/* ===== Row 2: Full Pipeline path ===== */}
          <g>
            <rect
              x="30"
              y="220"
              width="200"
              height="80"
              rx="8"
              className="fill-emerald-50 stroke-emerald-400/70 dark:fill-emerald-950/40 dark:stroke-emerald-500/70"
              strokeWidth={1.5}
            />
            <text
              x="130"
              y="246"
              textAnchor="middle"
              className="fill-emerald-900 text-[13px] font-semibold dark:fill-emerald-200"
            >
              Your researchers
            </text>
            <text
              x="130"
              y="264"
              textAnchor="middle"
              className="fill-emerald-700 text-[11px] dark:fill-emerald-400"
            >
              author on Odum data
            </text>
            <text
              x="130"
              y="280"
              textAnchor="middle"
              className="fill-emerald-700 text-[11px] italic dark:fill-emerald-400"
            >
              strategy slot per row
            </text>
          </g>

          <g>
            <rect
              x="290"
              y="220"
              width="380"
              height="80"
              rx="8"
              className="fill-violet-50 stroke-violet-400/70 dark:fill-violet-950/40 dark:stroke-violet-500/70"
              strokeWidth={1.5}
            />
            <text
              x="480"
              y="246"
              textAnchor="middle"
              className="fill-violet-900 text-[13px] font-semibold dark:fill-violet-200"
            >
              Research · Promote · Paper · Live
            </text>
            <text
              x="480"
              y="266"
              textAnchor="middle"
              className="fill-violet-700 text-[11px] dark:fill-violet-400"
            >
              8-stage maturity ladder · one catalogue
            </text>
            <text
              x="480"
              y="282"
              textAnchor="middle"
              className="fill-violet-700 text-[11px] italic dark:fill-violet-400"
            >
              batch = live · same components
            </text>
          </g>

          <g>
            <rect
              x="730"
              y="220"
              width="200"
              height="80"
              rx="8"
              className="fill-amber-50 stroke-amber-400/70 dark:fill-amber-950/30 dark:stroke-amber-500/70"
              strokeWidth={1.5}
            />
            <text
              x="830"
              y="246"
              textAnchor="middle"
              className="fill-amber-900 text-[13px] font-semibold dark:fill-amber-200"
            >
              Your venue accounts
            </text>
            <text
              x="830"
              y="264"
              textAnchor="middle"
              className="fill-amber-800 text-[11px] dark:fill-amber-300"
            >
              scoped execute + read keys
            </text>
            <text
              x="830"
              y="280"
              textAnchor="middle"
              className="fill-amber-800 text-[11px] italic dark:fill-amber-300"
            >
              same key model as Signals-In
            </text>
          </g>

          {/* Full Pipeline forward arrows */}
          <g>
            <line
              x1="230"
              y1="252"
              x2="290"
              y2="252"
              strokeWidth={1.5}
              markerEnd="url(#dart-paths-arrow)"
              className="stroke-neutral-500 dark:stroke-neutral-400"
            />
            <text
              x="260"
              y="244"
              textAnchor="middle"
              className="fill-neutral-600 text-[10px] font-medium dark:fill-neutral-300"
            >
              strategy code
            </text>
          </g>
          <g>
            <line
              x1="670"
              y1="252"
              x2="730"
              y2="252"
              strokeWidth={1.5}
              markerEnd="url(#dart-paths-arrow)"
              className="stroke-neutral-500 dark:stroke-neutral-400"
            />
            <text
              x="700"
              y="244"
              textAnchor="middle"
              className="fill-neutral-600 text-[10px] font-medium dark:fill-neutral-300"
            >
              orders
            </text>
          </g>
          <g>
            <line
              x1="730"
              y1="274"
              x2="670"
              y2="274"
              strokeWidth={1.25}
              markerEnd="url(#dart-paths-arrow-back)"
              className="stroke-neutral-400/80 dark:stroke-neutral-500/80"
            />
            <line
              x1="290"
              y1="274"
              x2="230"
              y2="274"
              strokeWidth={1.25}
              markerEnd="url(#dart-paths-arrow-back)"
              className="stroke-neutral-400/80 dark:stroke-neutral-500/80"
            />
            <text
              x="260"
              y="290"
              textAnchor="middle"
              className="fill-neutral-500 text-[9.5px] dark:fill-neutral-400"
            >
              backtests · fills · P&amp;L · audit
            </text>
          </g>

          <text
            x="30"
            y="212"
            className="fill-emerald-700 text-[11px] font-semibold dark:fill-emerald-400"
          >
            DART Full Pipeline
          </text>

          {/* ===== Sibling paths band ===== */}
          <rect
            x="30"
            y="340"
            width="900"
            height="150"
            rx="8"
            className="fill-zinc-50 stroke-zinc-300 dark:fill-zinc-900/60 dark:stroke-zinc-700"
            strokeWidth={1}
          />
          <text
            x="50"
            y="362"
            className="fill-zinc-700 text-[11px] font-semibold uppercase tracking-wide dark:fill-zinc-300"
          >
            Sibling commercial paths — same underlying stack, different boundary
          </text>

          {/* IM */}
          <g>
            <rect
              x="50"
              y="378"
              width="275"
              height="95"
              rx="6"
              className="fill-white stroke-zinc-300 dark:fill-zinc-950/60 dark:stroke-zinc-600"
              strokeWidth={1}
            />
            <text
              x="187"
              y="400"
              textAnchor="middle"
              className="fill-zinc-900 text-[12px] font-semibold dark:fill-zinc-100"
            >
              Investment Management
            </text>
            <text
              x="187"
              y="418"
              textAnchor="middle"
              className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400"
            >
              Odum allocates capital to Odum strategies
            </text>
            <text
              x="187"
              y="434"
              textAnchor="middle"
              className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400"
            >
              under Odum&apos;s FCA permissions.
            </text>
            <text
              x="187"
              y="456"
              textAnchor="middle"
              className="fill-zinc-500 text-[10px] italic dark:fill-zinc-500"
            >
              see /briefings/investment-management
            </text>
          </g>

          {/* Regulatory Umbrella */}
          <g>
            <rect
              x="342"
              y="378"
              width="275"
              height="95"
              rx="6"
              className="fill-white stroke-zinc-300 dark:fill-zinc-950/60 dark:stroke-zinc-600"
              strokeWidth={1}
            />
            <text
              x="480"
              y="400"
              textAnchor="middle"
              className="fill-zinc-900 text-[12px] font-semibold dark:fill-zinc-100"
            >
              Regulatory Umbrella
            </text>
            <text
              x="480"
              y="418"
              textAnchor="middle"
              className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400"
            >
              Your regulated activity runs under
            </text>
            <text
              x="480"
              y="434"
              textAnchor="middle"
              className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400"
            >
              Odum&apos;s FCA permissions.
            </text>
            <text
              x="480"
              y="456"
              textAnchor="middle"
              className="fill-zinc-500 text-[10px] italic dark:fill-zinc-500"
            >
              see /briefings/regulatory
            </text>
          </g>

          {/* Signals-Out */}
          <g>
            <rect
              x="635"
              y="378"
              width="275"
              height="95"
              rx="6"
              className="fill-white stroke-zinc-300 dark:fill-zinc-950/60 dark:stroke-zinc-600"
              strokeWidth={1}
            />
            <text
              x="772"
              y="400"
              textAnchor="middle"
              className="fill-zinc-900 text-[12px] font-semibold dark:fill-zinc-100"
            >
              Odum Signals-Out
            </text>
            <text
              x="772"
              y="418"
              textAnchor="middle"
              className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400"
            >
              Odum signals to a counterparty who
            </text>
            <text
              x="772"
              y="434"
              textAnchor="middle"
              className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400"
            >
              executes on their own stack.
            </text>
            <text
              x="772"
              y="456"
              textAnchor="middle"
              className="fill-zinc-500 text-[10px] italic dark:fill-zinc-500"
            >
              see /briefings/signals-out
            </text>
          </g>
        </svg>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        The system is one. The commercial path picks which surfaces you touch.
        Signals-In and Full Pipeline are the two paths inside DART;
        Investment Management, Regulatory Umbrella, and Odum Signals-Out are
        sibling commercial paths on the same underlying stack with different
        boundaries.
      </p>
    </figure>
  );
}
