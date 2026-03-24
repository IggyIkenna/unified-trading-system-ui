"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const STAGES = [
  "Acquire",
  "Build",
  "Promote",
  "Run",
  "Observe",
  "Manage",
  "Report",
] as const;
type Stage = (typeof STAGES)[number];

const LANES = [
  {
    id: "data",
    label: "Data",
    sub: "Feeds, normalisation, entitlements",
    color: "sky",
  },
  {
    id: "ml",
    label: "ML",
    sub: "Features, models, signals, inference",
    color: "violet",
  },
  {
    id: "strategy",
    label: "Strategy",
    sub: "Research, simulation, decision logic",
    color: "amber",
  },
  {
    id: "execution",
    label: "Execution",
    sub: "Algos, routing, transaction cost",
    color: "emerald",
  },
  {
    id: "capital",
    label: "Capital",
    sub: "Mandates, allocations, oversight",
    color: "rose",
  },
  {
    id: "compliance",
    label: "Compliance",
    sub: "Audit trail, regulatory controls",
    color: "slate",
  },
] as const;
type Lane = (typeof LANES)[number]["id"];

// Intensity per cell: 0 = minimal, 1 = supporting, 2 = active, 3 = primary
const INTENSITY: Record<Lane, number[]> = {
  data: [3, 3, 1, 1, 3, 1, 1],
  ml: [1, 3, 3, 3, 3, 1, 1],
  strategy: [1, 3, 3, 3, 3, 1, 1],
  execution: [1, 1, 3, 3, 3, 1, 1],
  capital: [0, 0, 1, 1, 1, 3, 3],
  compliance: [0, 1, 2, 2, 2, 2, 3],
};

// Descriptions for each intersection
const DESCRIPTIONS: Record<string, string> = {
  "data-Acquire":
    "Ingest market data from 128 venues across crypto, TradFi, DeFi, sports, and prediction markets.",
  "data-Build":
    "Normalise and store data in a unified schema. Build historical datasets for backtesting.",
  "data-Promote":
    "Validate data quality and freshness before strategies go live.",
  "data-Run":
    "Stream real-time data feeds to execution and monitoring systems.",
  "data-Observe":
    "Monitor data pipeline health, coverage gaps, and SLA compliance.",
  "data-Manage":
    "Manage data subscriptions, access tiers, and client entitlements.",
  "data-Report": "Generate data quality reports and usage analytics.",

  "ml-Acquire": "Collect features from data pipelines for model training.",
  "ml-Build":
    "Train ML models — direction prediction, volatility, regime detection, momentum.",
  "ml-Promote":
    "Validate models with champion/challenger testing before deployment.",
  "ml-Run": "Run inference in real-time to generate trading signals.",
  "ml-Observe": "Monitor model accuracy, drift, and prediction latency.",
  "ml-Manage": "Manage model versions, feature sets, and training schedules.",
  "ml-Report":
    "Report on model performance, feature importance, and signal quality.",

  "strategy-Acquire":
    "Access market data and features to inform strategy design.",
  "strategy-Build":
    "Design strategies, configure signal-to-trade parameters, set risk limits.",
  "strategy-Promote":
    "Backtest strategies, compare variants, promote winners to paper trading.",
  "strategy-Run":
    "Execute strategies live across venues with real-time position management.",
  "strategy-Observe":
    "Monitor strategy P&L, risk exposure, and execution quality.",
  "strategy-Manage":
    "Manage strategy configurations, versioning, and deployment schedules.",
  "strategy-Report":
    "Attribute P&L by factor, compare backtest vs live results.",

  "execution-Acquire":
    "Connect to venue APIs and establish trading connectivity.",
  "execution-Build": "Configure execution algorithms (TWAP, VWAP, IS, SOR).",
  "execution-Promote":
    "Test execution quality in paper mode before live deployment.",
  "execution-Run":
    "Same code runs backtest and live. Route orders, manage fills, track slippage. Monitor T+1 diffs between simulation and reality.",
  "execution-Observe":
    "Monitor fill rates, latency, venue health, and circuit breakers.",
  "execution-Manage":
    "Manage venue credentials, execution limits, and algorithm parameters.",
  "execution-Report":
    "Generate TCA reports, execution quality analytics, and cost attribution.",

  "capital-Acquire": "Onboard client capital and set up custody arrangements.",
  "capital-Build":
    "Define investment mandates, risk guidelines, and benchmark targets.",
  "capital-Promote": "Review capital allocation proposals before deployment.",
  "capital-Run": "Allocate capital across strategies and venues in real-time.",
  "capital-Observe":
    "Monitor portfolio exposure, margin utilisation, and cash balances.",
  "capital-Manage":
    "Manage client subscriptions, fee schedules, and billing cycles.",
  "capital-Report":
    "Generate NAV reports, settlement statements, and investor letters.",

  "compliance-Acquire":
    "Establish regulatory framework and client due diligence.",
  "compliance-Build":
    "Configure compliance rules, position limits, and reporting templates.",
  "compliance-Promote":
    "Validate regulatory compliance before strategy promotion.",
  "compliance-Run":
    "Enforce best execution, pre-trade checks, and position limits.",
  "compliance-Observe":
    "Monitor for regulatory breaches, unusual activity, and audit triggers.",
  "compliance-Manage":
    "Manage compliance rules, regulatory submissions, and evidence collection.",
  "compliance-Report":
    "Generate MiFID II reports, FCA submissions, and audit evidence packs.",
};

const COLOR_MAP: Record<
  string,
  { bg: string; glow: string; dim: string; text: string; rail: string }
> = {
  sky: {
    bg: "bg-sky-400",
    glow: "shadow-[0_0_12px_rgba(56,189,248,0.6)]",
    dim: "bg-sky-400/20",
    text: "text-sky-400",
    rail: "bg-sky-400",
  },
  violet: {
    bg: "bg-violet-400",
    glow: "shadow-[0_0_12px_rgba(167,139,250,0.6)]",
    dim: "bg-violet-400/20",
    text: "text-violet-400",
    rail: "bg-violet-400",
  },
  amber: {
    bg: "bg-amber-400",
    glow: "shadow-[0_0_12px_rgba(251,191,36,0.6)]",
    dim: "bg-amber-400/20",
    text: "text-amber-400",
    rail: "bg-amber-400",
  },
  emerald: {
    bg: "bg-emerald-400",
    glow: "shadow-[0_0_12px_rgba(52,211,153,0.6)]",
    dim: "bg-emerald-400/20",
    text: "text-emerald-400",
    rail: "bg-emerald-400",
  },
  rose: {
    bg: "bg-rose-400",
    glow: "shadow-[0_0_12px_rgba(251,113,133,0.6)]",
    dim: "bg-rose-400/20",
    text: "text-rose-400",
    rail: "bg-rose-400",
  },
  slate: {
    bg: "bg-slate-400",
    glow: "shadow-[0_0_12px_rgba(148,163,184,0.6)]",
    dim: "bg-slate-400/20",
    text: "text-slate-400",
    rail: "bg-slate-400",
  },
};

function getDotSize(intensity: number, isHovered: boolean): string {
  if (isHovered) return "size-5";
  switch (intensity) {
    case 3:
      return "size-3";
    case 2:
      return "size-2.5";
    case 1:
      return "size-1.5";
    default:
      return "size-1";
  }
}

function getDotOpacity(intensity: number): string {
  switch (intensity) {
    case 3:
      return "";
    case 2:
      return "opacity-80";
    case 1:
      return "opacity-30";
    default:
      return "opacity-15";
  }
}

export function PlatformArchitectureGrid() {
  const [hovered, setHovered] = React.useState<{
    lane: string;
    stage: string;
  } | null>(null);

  const tooltipText = hovered
    ? DESCRIPTIONS[`${hovered.lane}-${hovered.stage}`]
    : null;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Stage headers */}
      <div className="grid grid-cols-8 gap-2 mb-6 px-1">
        <div className="col-span-1" />
        {STAGES.map((stage) => (
          <div
            key={stage}
            className={cn(
              "text-center cursor-default transition-colors",
              hovered?.stage === stage ? "text-foreground" : "",
            )}
          >
            <span
              className={cn(
                "text-[10px] md:text-xs font-medium transition-all",
                hovered?.stage === stage
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground",
              )}
            >
              {stage}
            </span>
          </div>
        ))}
      </div>

      {/* Lane rows */}
      <div className="space-y-5">
        {LANES.map((lane) => {
          const colors = COLOR_MAP[lane.color];
          const intensities = INTENSITY[lane.id];

          return (
            <div key={lane.id} className="grid grid-cols-8 gap-2 items-center">
              {/* Lane label */}
              <div
                className={cn(
                  "flex flex-col cursor-default transition-opacity",
                  hovered && hovered.lane !== lane.id ? "opacity-40" : "",
                )}
              >
                <span className={cn("text-xs font-semibold", colors.text)}>
                  {lane.label}
                </span>
                <span className="text-[9px] text-muted-foreground hidden md:block">
                  {lane.sub}
                </span>
              </div>

              {/* Dots */}
              {STAGES.map((stage, si) => {
                const intensity = intensities[si];
                const isThis =
                  hovered?.lane === lane.id && hovered?.stage === stage;
                const isLaneHovered = hovered?.lane === lane.id;
                const isStageHovered = hovered?.stage === stage;

                return (
                  <div
                    key={stage}
                    className="flex items-center justify-center h-8 cursor-pointer relative"
                    onMouseEnter={() => setHovered({ lane: lane.id, stage })}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div
                      className={cn(
                        "rounded-full transition-all duration-300 ease-out",
                        colors.bg,
                        getDotSize(intensity, isThis),
                        getDotOpacity(intensity),
                        isThis && colors.glow,
                        isThis && "scale-100",
                        !isThis && isLaneHovered && "opacity-60",
                        !isThis && isStageHovered && "opacity-60",
                        hovered &&
                          !isThis &&
                          !isLaneHovered &&
                          !isStageHovered &&
                          "opacity-20",
                      )}
                    />

                    {/* Tooltip */}
                    {isThis && tooltipText && (
                      <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 pointer-events-none">
                        <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs leading-relaxed">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className={cn("font-semibold", colors.text)}>
                              {lane.label}
                            </span>
                            <span className="text-muted-foreground">×</span>
                            <span className="font-semibold text-foreground">
                              {stage}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{tooltipText}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Rail line */}
              <div className="col-span-8 -mt-3 grid grid-cols-8 gap-2 px-1">
                <div />
                {intensities.map((intensity, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-px transition-opacity duration-300",
                      colors.rail,
                      intensity >= 3
                        ? "opacity-60"
                        : intensity >= 2
                          ? "opacity-40"
                          : intensity >= 1
                            ? "opacity-20"
                            : "opacity-10",
                      hovered && hovered.lane !== lane.id && "opacity-10",
                    )}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center items-center gap-6 md:gap-10 mt-8 text-[10px] text-muted-foreground border-t border-border/50 pt-6">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.3)]" />
          <span>Primary</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-white/80" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-white/30" />
          <span>Supporting</span>
        </div>
        <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border/50">
          <span>Hover any intersection to see what happens there</span>
        </div>
      </div>
    </div>
  );
}
