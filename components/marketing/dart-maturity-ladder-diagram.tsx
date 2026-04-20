// Source: codex/09-strategy/architecture-v2/README.md (maturity ladder)
//         codex/14-playbooks/experience/dart-briefing.md (Full Pipeline)
//
// DART Full Pipeline maturity ladder — briefing /briefings/dart-full.
// Static inline SVG + Tailwind. No animation, no third-party libs.
//
// Shows the 8-stage maturity ladder a strategy slot traverses from
// CODE_NOT_WRITTEN through LIVE_ALLOCATED, with a vertical fence between
// CODE_AUDITED and BACKTESTED marking the earliest externally-visible stage,
// and a second fence between PAPER_TRADING_VALIDATED and LIVE_TINY marking
// the first allocation of real capital.
//
// Row above the ladder: "Research phase" — any stage ≥ BACKTESTED can be
// re-run in research over a new regime window.
// Row below the ladder: "Automated watchdog — ops only demote on incident".

import * as React from "react";

interface Stage {
  readonly label: string;
  readonly description: string;
  readonly tone: "internal" | "external" | "paper" | "live";
}

const STAGES: readonly Stage[] = [
  {
    label: "CODE_NOT_WRITTEN",
    description: "archetype placeholder",
    tone: "internal",
  },
  {
    label: "CODE_WRITTEN",
    description: "code exists, unaudited",
    tone: "internal",
  },
  {
    label: "CODE_AUDITED",
    description: "reviewed against archetype contract",
    tone: "internal",
  },
  {
    label: "BACKTESTED",
    description: "cleared historical window",
    tone: "external",
  },
  {
    label: "PAPER_TRADING",
    description: "promoted to paper on live data",
    tone: "paper",
  },
  {
    label: "PAPER_VALIDATED",
    description: "14-day shadow-policy gate",
    tone: "paper",
  },
  {
    label: "LIVE_TINY",
    description: "first real allocation",
    tone: "live",
  },
  {
    label: "LIVE_ALLOCATED",
    description: "full allocation",
    tone: "live",
  },
];

const TONE_CLASSES: Readonly<Record<Stage["tone"], string>> = {
  internal:
    "fill-zinc-50 stroke-zinc-400 dark:fill-zinc-900 dark:stroke-zinc-600",
  external:
    "fill-sky-50 stroke-sky-400/70 dark:fill-sky-950/40 dark:stroke-sky-500/70",
  paper:
    "fill-violet-50 stroke-violet-400/70 dark:fill-violet-950/40 dark:stroke-violet-500/70",
  live:
    "fill-emerald-50 stroke-emerald-400/70 dark:fill-emerald-950/40 dark:stroke-emerald-500/70",
};

const TONE_TEXT: Readonly<Record<Stage["tone"], string>> = {
  internal: "fill-zinc-700 dark:fill-zinc-300",
  external: "fill-sky-900 dark:fill-sky-200",
  paper: "fill-violet-900 dark:fill-violet-200",
  live: "fill-emerald-900 dark:fill-emerald-200",
};

const TONE_SUBTEXT: Readonly<Record<Stage["tone"], string>> = {
  internal: "fill-zinc-500 dark:fill-zinc-500",
  external: "fill-sky-700 dark:fill-sky-400",
  paper: "fill-violet-700 dark:fill-violet-400",
  live: "fill-emerald-700 dark:fill-emerald-400",
};

export function DartMaturityLadderDiagram(): React.JSX.Element {
  const STAGE_WIDTH = 128;
  const STAGE_HEIGHT = 70;
  const STAGE_GAP = 8;
  const LEFT_PAD = 24;
  const LADDER_Y = 170;

  const externalFenceX =
    LEFT_PAD + 3 * (STAGE_WIDTH + STAGE_GAP) - STAGE_GAP / 2 - 1;
  const liveFenceX =
    LEFT_PAD + 6 * (STAGE_WIDTH + STAGE_GAP) - STAGE_GAP / 2 - 1;

  const totalWidth = LEFT_PAD + 8 * (STAGE_WIDTH + STAGE_GAP) + LEFT_PAD;

  return (
    <figure
      className="mb-8 overflow-hidden rounded-lg border border-border bg-card/40 p-6"
      data-testid="dart-maturity-ladder-diagram"
      aria-labelledby="dart-ladder-diagram-title"
    >
      <figcaption
        id="dart-ladder-diagram-title"
        className="mb-4 text-sm font-semibold text-foreground"
      >
        8-stage maturity ladder — one slot, one path to live
      </figcaption>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${totalWidth} 340`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby="dart-ladder-svg-title dart-ladder-svg-desc"
          className="mx-auto block h-auto w-full min-w-[720px]"
          style={{ maxWidth: `${totalWidth}px` }}
        >
          <title id="dart-ladder-svg-title">
            DART strategy maturity ladder
          </title>
          <desc id="dart-ladder-svg-desc">
            A strategy slot moves through eight stages: CODE_NOT_WRITTEN,
            CODE_WRITTEN, CODE_AUDITED (internal only), then BACKTESTED,
            PAPER_TRADING, PAPER_VALIDATED (externally visible, no real
            capital), then LIVE_TINY and LIVE_ALLOCATED (real capital). The
            external-visibility fence sits between CODE_AUDITED and
            BACKTESTED. The real-capital fence sits between PAPER_VALIDATED
            and LIVE_TINY. Progression is automated by watchdog policies; ops
            only demote on incident.
          </desc>

          <defs>
            <marker
              id="dart-ladder-arrow"
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
          </defs>

          {/* Band labels above: research-phase band */}
          <text
            x={LEFT_PAD}
            y={40}
            className="fill-zinc-700 text-[11px] font-semibold uppercase tracking-wide dark:fill-zinc-300"
          >
            Research phase — any promoted slot can be re-run over a new regime window
          </text>
          <line
            x1={LEFT_PAD + 3 * (STAGE_WIDTH + STAGE_GAP)}
            y1={60}
            x2={LEFT_PAD + 8 * (STAGE_WIDTH + STAGE_GAP) - STAGE_GAP}
            y2={60}
            strokeWidth={1.25}
            strokeDasharray="4 4"
            className="stroke-sky-400/70 dark:stroke-sky-500/70"
          />
          <line
            x1={LEFT_PAD + 3 * (STAGE_WIDTH + STAGE_GAP)}
            y1={60}
            x2={LEFT_PAD + 3 * (STAGE_WIDTH + STAGE_GAP)}
            y2={72}
            strokeWidth={1.25}
            className="stroke-sky-400/70 dark:stroke-sky-500/70"
          />
          <line
            x1={LEFT_PAD + 8 * (STAGE_WIDTH + STAGE_GAP) - STAGE_GAP}
            y1={60}
            x2={LEFT_PAD + 8 * (STAGE_WIDTH + STAGE_GAP) - STAGE_GAP}
            y2={72}
            strokeWidth={1.25}
            className="stroke-sky-400/70 dark:stroke-sky-500/70"
          />

          {/* Internal band label above CODE_* stages */}
          <text
            x={LEFT_PAD}
            y={88}
            className="fill-zinc-500 text-[10px] italic dark:fill-zinc-500"
          >
            internal-only (not visible to external clients)
          </text>
          <line
            x1={LEFT_PAD}
            y1={100}
            x2={LEFT_PAD + 3 * (STAGE_WIDTH + STAGE_GAP) - STAGE_GAP}
            y2={100}
            strokeWidth={1}
            strokeDasharray="3 3"
            className="stroke-zinc-400 dark:stroke-zinc-600"
          />

          {/* Stage boxes */}
          {STAGES.map((stage, index) => {
            const x = LEFT_PAD + index * (STAGE_WIDTH + STAGE_GAP);
            return (
              <g key={stage.label}>
                <rect
                  x={x}
                  y={LADDER_Y}
                  width={STAGE_WIDTH}
                  height={STAGE_HEIGHT}
                  rx={6}
                  strokeWidth={1.25}
                  className={TONE_CLASSES[stage.tone]}
                />
                <text
                  x={x + STAGE_WIDTH / 2}
                  y={LADDER_Y + 26}
                  textAnchor="middle"
                  className={`${TONE_TEXT[stage.tone]} text-[10.5px] font-semibold`}
                >
                  {stage.label}
                </text>
                <text
                  x={x + STAGE_WIDTH / 2}
                  y={LADDER_Y + 44}
                  textAnchor="middle"
                  className={`${TONE_SUBTEXT[stage.tone]} text-[9.5px]`}
                >
                  {stage.description}
                </text>
                <text
                  x={x + STAGE_WIDTH / 2}
                  y={LADDER_Y + 58}
                  textAnchor="middle"
                  className={`${TONE_SUBTEXT[stage.tone]} text-[9.5px]`}
                >
                  {`stage ${index + 1}/8`}
                </text>
                {/* Forward arrow between stages */}
                {index < STAGES.length - 1 && (
                  <line
                    x1={x + STAGE_WIDTH}
                    y1={LADDER_Y + STAGE_HEIGHT / 2}
                    x2={x + STAGE_WIDTH + STAGE_GAP}
                    y2={LADDER_Y + STAGE_HEIGHT / 2}
                    strokeWidth={1.25}
                    markerEnd="url(#dart-ladder-arrow)"
                    className="stroke-neutral-500 dark:stroke-neutral-400"
                  />
                )}
              </g>
            );
          })}

          {/* External-visibility fence */}
          <line
            x1={externalFenceX}
            y1={LADDER_Y - 20}
            x2={externalFenceX}
            y2={LADDER_Y + STAGE_HEIGHT + 30}
            strokeWidth={1.5}
            strokeDasharray="2 3"
            className="stroke-sky-500/80 dark:stroke-sky-400/80"
          />
          <text
            x={externalFenceX - 4}
            y={LADDER_Y + STAGE_HEIGHT + 46}
            textAnchor="end"
            className="fill-sky-700 text-[10px] font-semibold dark:fill-sky-400"
          >
            ← internal only
          </text>
          <text
            x={externalFenceX + 4}
            y={LADDER_Y + STAGE_HEIGHT + 46}
            textAnchor="start"
            className="fill-sky-700 text-[10px] font-semibold dark:fill-sky-400"
          >
            external visibility begins →
          </text>

          {/* Real-capital fence */}
          <line
            x1={liveFenceX}
            y1={LADDER_Y - 20}
            x2={liveFenceX}
            y2={LADDER_Y + STAGE_HEIGHT + 30}
            strokeWidth={1.5}
            strokeDasharray="2 3"
            className="stroke-emerald-500/80 dark:stroke-emerald-400/80"
          />
          <text
            x={liveFenceX - 4}
            y={LADDER_Y + STAGE_HEIGHT + 66}
            textAnchor="end"
            className="fill-emerald-700 text-[10px] font-semibold dark:fill-emerald-400"
          >
            ← paper only
          </text>
          <text
            x={liveFenceX + 4}
            y={LADDER_Y + STAGE_HEIGHT + 66}
            textAnchor="start"
            className="fill-emerald-700 text-[10px] font-semibold dark:fill-emerald-400"
          >
            real capital →
          </text>

          {/* Watchdog band label */}
          <text
            x={LEFT_PAD}
            y={LADDER_Y + STAGE_HEIGHT + 92}
            className="fill-zinc-700 text-[11px] font-semibold uppercase tracking-wide dark:fill-zinc-300"
          >
            Automated watchdog — 14-day paper gate · first non-zero allocation · ops only demote on incident
          </text>
        </svg>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Research, paper, and live are phase views of one catalogue.
        A live-allocated slot can be pulled back into research phase for a
        re-run over a new regime window; a research candidate promotes
        through paper to live on the same components. Every transition emits
        a lifecycle event into your audit trail.
      </p>
    </figure>
  );
}
