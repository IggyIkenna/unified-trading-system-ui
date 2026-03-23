"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import {
  Trophy,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  BarChart3,
  AlertTriangle,
  ArrowLeftRight,
  Radio,
  Brain,
  ChevronDown,
  ChevronUp,
  Shield,
  Pause,
  Info,
} from "lucide-react"

// ---------- Types ----------

type MatchStatus = "pre_game" | "live" | "first_half" | "halftime" | "second_half" | "suspended" | "full_time"

interface Fixture {
  id: string
  league: string
  home: string
  away: string
  date: string
  kickoff: string
  phase: "PRE_GAME" | "HALFTIME" | "LIVE" | "FULL_TIME"
  score: string | null
  minute: number | null
}

interface OddsLine {
  outcome: string
  decimal: number
  impliedProb: number
  movement: "UP" | "DOWN" | "STABLE"
}

interface ExchangeOdds {
  outcome: string
  backPrice: number
  backSize: number
  layPrice: number
  laySize: number
}

interface ArbOpportunity {
  fixture: string
  venue1: string
  venue2: string
  outcome1: string
  outcome2: string
  odds1: number
  odds2: number
  arbPct: number
}

// ---------- Constants ----------

const KELLY_BANKROLL = 100_000
const KELLY_HALF_FRACTION = 0.5
const KELLY_MAX_STAKE_PCT = 0.05
const KELLY_MAX_STAKE = KELLY_BANKROLL * KELLY_MAX_STAKE_PCT
const KELLY_DRAWDOWN_LIMIT = 0.20
const KELLY_EDGE_THRESHOLD = 0.02

const MATCH_PHASE_OPTIONS: { value: MatchStatus; label: string }[] = [
  { value: "pre_game", label: "Pre-game" },
  { value: "first_half", label: "First Half" },
  { value: "halftime", label: "Halftime" },
  { value: "second_half", label: "Second Half" },
  { value: "suspended", label: "Suspended" },
  { value: "full_time", label: "Full Time" },
]

const SUSPENSION_REASONS: Record<string, string> = {
  goal: "Goal scored — odds recalculating",
  var: "VAR review in progress",
  red_card: "Red card event detected",
  injury: "Serious injury — play stopped",
}

// ---------- Mock Data ----------

const LEAGUES = ["EPL", "La Liga", "NBA", "NFL", "MLB", "ATP Tennis"] as const

const MOCK_FIXTURES: Fixture[] = [
  { id: "fix-001", league: "EPL", home: "Arsenal", away: "Chelsea", date: "2026-03-23", kickoff: "15:00", phase: "PRE_GAME", score: null, minute: null },
  { id: "fix-002", league: "EPL", home: "Man City", away: "Liverpool", date: "2026-03-23", kickoff: "17:30", phase: "LIVE", score: "1-1", minute: 67 },
  { id: "fix-003", league: "EPL", home: "Tottenham", away: "Man United", date: "2026-03-23", kickoff: "20:00", phase: "PRE_GAME", score: null, minute: null },
  { id: "fix-004", league: "La Liga", home: "Barcelona", away: "Real Madrid", date: "2026-03-23", kickoff: "21:00", phase: "PRE_GAME", score: null, minute: null },
  { id: "fix-005", league: "NBA", home: "Lakers", away: "Celtics", date: "2026-03-23", kickoff: "01:30", phase: "HALFTIME", score: "52-48", minute: null },
  { id: "fix-006", league: "EPL", home: "Newcastle", away: "Aston Villa", date: "2026-03-23", kickoff: "15:00", phase: "PRE_GAME", score: null, minute: null },
]

const MOCK_FIXED_ODDS: Record<string, OddsLine[]> = {
  "fix-001": [
    { outcome: "Home (Arsenal)", decimal: 1.65, impliedProb: 60.6, movement: "DOWN" },
    { outcome: "Draw", decimal: 3.80, impliedProb: 26.3, movement: "STABLE" },
    { outcome: "Away (Chelsea)", decimal: 5.50, impliedProb: 18.2, movement: "UP" },
  ],
  "fix-002": [
    { outcome: "Home (Man City)", decimal: 2.10, impliedProb: 47.6, movement: "UP" },
    { outcome: "Draw", decimal: 3.40, impliedProb: 29.4, movement: "DOWN" },
    { outcome: "Away (Liverpool)", decimal: 3.50, impliedProb: 28.6, movement: "STABLE" },
  ],
  "fix-003": [
    { outcome: "Home (Tottenham)", decimal: 2.40, impliedProb: 41.7, movement: "STABLE" },
    { outcome: "Draw", decimal: 3.40, impliedProb: 29.4, movement: "STABLE" },
    { outcome: "Away (Man United)", decimal: 3.00, impliedProb: 33.3, movement: "DOWN" },
  ],
}

const MOCK_EXCHANGE_ODDS: Record<string, ExchangeOdds[]> = {
  "fix-001": [
    { outcome: "Arsenal", backPrice: 1.66, backSize: 12400, layPrice: 1.68, laySize: 8900 },
    { outcome: "Draw", backPrice: 3.75, backSize: 5600, layPrice: 3.85, laySize: 3200 },
    { outcome: "Chelsea", backPrice: 5.40, backSize: 3800, layPrice: 5.60, laySize: 2100 },
  ],
  "fix-002": [
    { outcome: "Man City", backPrice: 2.08, backSize: 18500, layPrice: 2.12, laySize: 14200 },
    { outcome: "Draw", backPrice: 3.35, backSize: 7800, layPrice: 3.45, laySize: 5100 },
    { outcome: "Liverpool", backPrice: 3.45, backSize: 9200, layPrice: 3.55, laySize: 6800 },
  ],
}

const MOCK_PREDICTION_MARKETS = [
  { outcome: "YES", price: 0.62, volume: 245000 },
  { outcome: "NO", price: 0.38, volume: 198000 },
]

const MOCK_ARBS: ArbOpportunity[] = [
  {
    fixture: "Arsenal vs Chelsea",
    venue1: "Pinnacle",
    venue2: "Betfair",
    outcome1: "Arsenal Win",
    outcome2: "Chelsea Win + Draw",
    odds1: 1.65,
    odds2: 2.20,
    arbPct: 2.3,
  },
  {
    fixture: "Man City vs Liverpool",
    venue1: "Bet365",
    venue2: "Betfair",
    outcome1: "Man City Win",
    outcome2: "Liverpool Win + Draw",
    odds1: 2.15,
    odds2: 1.98,
    arbPct: 1.1,
  },
]

const MOCK_STRATEGIES = [
  { id: "SPORTS_EPL_ML_V3", name: "EPL ML v3 (xG + form)", confidence: 0.72 },
  { id: "SPORTS_NBA_ELO_V2", name: "NBA ELO v2 (adjusted)", confidence: 0.68 },
  { id: "SPORTS_TENNIS_SERVE_V1", name: "Tennis Serve Model v1", confidence: 0.81 },
]

// ---------- Helpers ----------

function kellyFraction(decimalOdds: number, estimatedProb: number): number {
  const b = decimalOdds - 1
  const q = 1 - estimatedProb
  const kelly = (b * estimatedProb - q) / b
  return Math.max(0, kelly)
}

function computeKellySizing(
  decimalOdds: number,
  modelProb: number,
): { fraction: number; suggestedStake: number; edge: number; edgeMeetsThreshold: boolean } {
  const impliedProb = 1 / decimalOdds
  const edge = modelProb - impliedProb
  const fullKelly = kellyFraction(decimalOdds, modelProb)
  const fraction = fullKelly * KELLY_HALF_FRACTION
  const suggestedStake = Math.min(
    fraction * KELLY_BANKROLL * (edge / decimalOdds),
    KELLY_MAX_STAKE,
  )
  return {
    fraction,
    suggestedStake: Math.max(0, suggestedStake),
    edge,
    edgeMeetsThreshold: edge >= KELLY_EDGE_THRESHOLD,
  }
}

function applyLiveOddsFactor(odds: number, isLive: boolean): number {
  if (!isLive) return odds
  // Small random-ish factor for live odds (deterministic based on odds value)
  const factor = 1 + ((Math.sin(odds * 7.3) * 0.04) + 0.02)
  return parseFloat((odds * factor).toFixed(2))
}

function getPhaseColor(phase: Fixture["phase"]): string {
  switch (phase) {
    case "LIVE": return "text-emerald-400"
    case "HALFTIME": return "text-amber-400"
    case "PRE_GAME": return "text-muted-foreground"
    case "FULL_TIME": return "text-muted-foreground"
  }
}

function getPhaseLabel(phase: Fixture["phase"], minute: number | null): string {
  switch (phase) {
    case "LIVE": return minute ? `Live ${minute}'` : "Live"
    case "HALFTIME": return "HT"
    case "PRE_GAME": return "Pre-game"
    case "FULL_TIME": return "FT"
  }
}

function matchStatusToFixturePhase(status: MatchStatus): Fixture["phase"] {
  switch (status) {
    case "pre_game": return "PRE_GAME"
    case "first_half": return "LIVE"
    case "live": return "LIVE"
    case "halftime": return "HALFTIME"
    case "second_half": return "LIVE"
    case "suspended": return "LIVE"
    case "full_time": return "FULL_TIME"
  }
}

function getMatchStatusLabel(status: MatchStatus): string {
  switch (status) {
    case "pre_game": return "PRE-GAME"
    case "first_half": return "1ST HALF"
    case "live": return "LIVE"
    case "halftime": return "HALFTIME"
    case "second_half": return "2ND HALF"
    case "suspended": return "SUSPENDED"
    case "full_time": return "FULL TIME"
  }
}

function isLivePhase(status: MatchStatus): boolean {
  return status === "live" || status === "first_half" || status === "second_half"
}

// ---------- Sub-components ----------

function MatchStatusBar({ matchStatus }: { matchStatus: MatchStatus }) {
  if (matchStatus === "pre_game" || matchStatus === "full_time") return null

  if (matchStatus === "suspended") {
    return (
      <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 animate-pulse">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-red-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-red-400">MARKET SUSPENDED</p>
            <p className="text-[10px] text-red-300/80">
              Goal/VAR/Red Card event detected. Quoting paused.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (matchStatus === "halftime") {
    return (
      <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <Pause className="size-4 text-amber-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-400">HALFTIME</p>
            <p className="text-[10px] text-amber-300/80">
              Markets reopening in 12:30
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Live phases (first_half, second_half, live)
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <span className="relative flex size-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
      </span>
      <span className="text-[10px] font-bold text-emerald-400 uppercase">
        {getMatchStatusLabel(matchStatus)}
      </span>
    </div>
  )
}

function HalftimeTransitionAlert({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Alert className="border-amber-500/50 bg-amber-500/10">
      <AlertTriangle className="size-4 text-amber-400" />
      <AlertTitle className="text-amber-400 text-xs font-bold">
        First Half Complete
      </AlertTitle>
      <AlertDescription className="text-[11px] text-amber-300/80">
        Review positions before second half markets open. Odds will be
        recalculated based on first-half performance.
        <Button
          variant="outline"
          size="sm"
          className="mt-2 h-6 text-[10px] border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
          onClick={onDismiss}
        >
          Acknowledged
        </Button>
      </AlertDescription>
    </Alert>
  )
}

function PhaseGateIndicator({ matchStatus }: { matchStatus: MatchStatus }) {
  const phaseLabel = matchStatus === "pre_game"
    ? "Pre-game"
    : isLivePhase(matchStatus)
      ? "In-play"
      : matchStatus === "halftime"
        ? "Halftime (paused)"
        : "Post-match"

  const phaseColor = matchStatus === "pre_game"
    ? "text-muted-foreground border-muted"
    : isLivePhase(matchStatus)
      ? "text-emerald-400 border-emerald-500/50"
      : matchStatus === "halftime"
        ? "text-amber-400 border-amber-500/50"
        : "text-muted-foreground border-muted"

  return (
    <div className={cn("flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded border", phaseColor)}>
      <Shield className="size-3" />
      Phase Gate: {phaseLabel}
    </div>
  )
}

function KellySizingPanel({
  decimalOdds,
  modelConfidence,
}: {
  decimalOdds: number
  modelConfidence: number
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const sizing = computeKellySizing(decimalOdds, modelConfidence)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-2 rounded-lg border border-violet-500/30 bg-violet-500/5 text-xs hover:bg-violet-500/10 transition-colors">
          <div className="flex items-center gap-1.5">
            <Brain className="size-3 text-violet-400" />
            <span className="font-medium text-violet-300">Kelly Criterion Sizing</span>
          </div>
          <div className="flex items-center gap-1.5">
            {sizing.edgeMeetsThreshold && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 text-emerald-400 border-emerald-500/50">
                Edge OK
              </Badge>
            )}
            {isOpen ? <ChevronUp className="size-3 text-violet-400" /> : <ChevronDown className="size-3 text-violet-400" />}
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1.5 p-2.5 rounded-lg border border-violet-500/20 bg-violet-500/5 space-y-1.5">
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            <span className="text-muted-foreground">Kelly Fraction</span>
            <span className="font-mono text-right text-violet-300">
              {KELLY_HALF_FRACTION} (half-Kelly)
            </span>

            <span className="text-muted-foreground">Model Edge</span>
            <span className={cn(
              "font-mono text-right",
              sizing.edgeMeetsThreshold ? "text-emerald-400" : "text-rose-400",
            )}>
              {(sizing.edge * 100).toFixed(2)}%
              {!sizing.edgeMeetsThreshold && " (below 2% min)"}
            </span>

            <span className="text-muted-foreground">Suggested Stake</span>
            <span className="font-mono text-right text-violet-300">
              ${sizing.suggestedStake.toFixed(0)}
            </span>

            <span className="text-muted-foreground">Max Stake (5%)</span>
            <span className="font-mono text-right text-muted-foreground">
              ${KELLY_MAX_STAKE.toLocaleString()}
            </span>

            <span className="text-muted-foreground">Bankroll</span>
            <span className="font-mono text-right text-muted-foreground">
              ${KELLY_BANKROLL.toLocaleString()}
            </span>

            <span className="text-muted-foreground">Drawdown Limit</span>
            <span className="font-mono text-right text-muted-foreground">
              {(KELLY_DRAWDOWN_LIMIT * 100).toFixed(0)}%
            </span>

            <span className="text-muted-foreground">Edge Threshold</span>
            <span className="font-mono text-right text-muted-foreground">
              {(KELLY_EDGE_THRESHOLD * 100).toFixed(0)}% minimum
            </span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function BackLayLadder({
  fixtureId,
  matchStatus,
  linkedStrategy,
}: {
  fixtureId: string
  matchStatus: MatchStatus
  linkedStrategy: string
}) {
  const exchangeOdds = MOCK_EXCHANGE_ODDS[fixtureId] ?? MOCK_EXCHANGE_ODDS["fix-001"] ?? []
  const [selectedOutcome, setSelectedOutcome] = React.useState<string | null>(null)
  const [selectedSide, setSelectedSide] = React.useState<"BACK" | "LAY">("BACK")
  const [stake, setStake] = React.useState("")

  const isLive = isLivePhase(matchStatus)
  const isSuspended = matchStatus === "suspended"
  const strategy = MOCK_STRATEGIES.find((s) => s.id === linkedStrategy)

  const stakeNum = parseFloat(stake) || 0
  const selectedLine = exchangeOdds.find((o) => o.outcome === selectedOutcome)
  const rawOdds = selectedLine
    ? (selectedSide === "BACK" ? selectedLine.backPrice : selectedLine.layPrice)
    : 0
  const odds = applyLiveOddsFactor(rawOdds, isLive)
  const potentialReturn = stakeNum * odds
  const potentialProfit = potentialReturn - stakeNum
  const liability = selectedSide === "LAY" ? stakeNum * (odds - 1) : 0

  return (
    <div className="space-y-3">
      {/* Ladder */}
      <div className="space-y-1">
        <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-0.5 text-[10px] text-muted-foreground px-1">
          <span>Outcome</span>
          <span className="text-center text-sky-400">Back</span>
          <span className="text-center text-sky-400">Size</span>
          <span className="text-center text-rose-400">Lay</span>
          <span className="text-center text-rose-400">Size</span>
        </div>
        {exchangeOdds.map((line) => (
          <div
            key={line.outcome}
            className={cn(
              "grid grid-cols-[1fr_80px_80px_80px_80px] gap-0.5 items-center rounded hover:bg-muted/20",
              selectedOutcome === line.outcome && "bg-muted/30"
            )}
          >
            <span className="text-xs font-medium px-1 truncate">{line.outcome}</span>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 text-xs font-mono bg-sky-500/10 hover:bg-sky-500/20",
                selectedOutcome === line.outcome && selectedSide === "BACK" && "ring-1 ring-sky-500"
              )}
              disabled={isSuspended}
              onClick={() => { setSelectedOutcome(line.outcome); setSelectedSide("BACK") }}
            >
              {applyLiveOddsFactor(line.backPrice, isLive).toFixed(2)}
            </Button>
            <span className="text-[10px] font-mono text-center text-muted-foreground">
              {(line.backSize / 1000).toFixed(1)}k
            </span>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 text-xs font-mono bg-rose-500/10 hover:bg-rose-500/20",
                selectedOutcome === line.outcome && selectedSide === "LAY" && "ring-1 ring-rose-500"
              )}
              disabled={isSuspended}
              onClick={() => { setSelectedOutcome(line.outcome); setSelectedSide("LAY") }}
            >
              {applyLiveOddsFactor(line.layPrice, isLive).toFixed(2)}
            </Button>
            <span className="text-[10px] font-mono text-center text-muted-foreground">
              {(line.laySize / 1000).toFixed(1)}k
            </span>
          </div>
        ))}
      </div>

      {/* Bet entry */}
      {selectedOutcome && (
        <div className="p-3 rounded-lg border space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={selectedSide === "BACK" ? "default" : "destructive"} className="text-[10px]">
              {selectedSide}
            </Badge>
            <span className="text-xs font-medium">{selectedOutcome}</span>
            <span className="text-xs font-mono text-muted-foreground">@ {odds.toFixed(2)}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground">Stake</label>
              {strategy && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 text-violet-400 border-violet-500/50 gap-0.5">
                  <Info className="size-2.5" />
                  Kelly 1/2
                </Badge>
              )}
            </div>
            <Input
              type="number"
              placeholder="0.00"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              className="font-mono"
              disabled={isSuspended}
            />
          </div>

          {/* Kelly Sizing Panel */}
          {strategy && odds > 0 && (
            <KellySizingPanel
              decimalOdds={odds}
              modelConfidence={strategy.confidence}
            />
          )}

          <div className="grid grid-cols-2 gap-1 text-xs">
            <span className="text-muted-foreground">{selectedSide === "BACK" ? "Potential Return" : "Liability"}</span>
            <span className="font-mono text-right">
              {selectedSide === "BACK"
                ? `$${potentialReturn.toFixed(2)}`
                : `$${liability.toFixed(2)}`}
            </span>
            <span className="text-muted-foreground">Profit</span>
            <span className="font-mono text-emerald-400 text-right">
              {stakeNum > 0 ? `$${potentialProfit.toFixed(2)}` : "--"}
            </span>
          </div>

          <Button className="w-full h-8 text-xs" disabled={stakeNum <= 0 || isSuspended}>
            {isSuspended ? "Market Suspended" : "Place Bet"}
          </Button>
        </div>
      )}
    </div>
  )
}

function FixedOddsPanel({
  fixtureId,
  matchStatus,
  linkedStrategy,
}: {
  fixtureId: string
  matchStatus: MatchStatus
  linkedStrategy: string
}) {
  const rawOdds = MOCK_FIXED_ODDS[fixtureId] ?? MOCK_FIXED_ODDS["fix-001"] ?? []
  const [selectedOutcome, setSelectedOutcome] = React.useState<string | null>(null)
  const [stake, setStake] = React.useState("")

  const isLive = isLivePhase(matchStatus)
  const isSuspended = matchStatus === "suspended"
  const strategy = MOCK_STRATEGIES.find((s) => s.id === linkedStrategy)

  const odds = rawOdds.map((line) => ({
    ...line,
    decimal: applyLiveOddsFactor(line.decimal, isLive),
  }))

  const stakeNum = parseFloat(stake) || 0
  const selectedLine = odds.find((o) => o.outcome === selectedOutcome)
  const decimalOdds = selectedLine?.decimal ?? 0
  const potentialReturn = stakeNum * decimalOdds
  const estimatedProb = selectedLine ? selectedLine.impliedProb / 100 : 0
  const kelly = selectedLine ? kellyFraction(decimalOdds, estimatedProb * 1.05) : 0
  const kellySuggestion = kelly * 10000 // Assume $10k bankroll

  return (
    <div className="space-y-3">
      {/* Odds grid */}
      <div className="space-y-1">
        {odds.map((line) => (
          <button
            key={line.outcome}
            className={cn(
              "w-full flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors",
              selectedOutcome === line.outcome
                ? "border-sky-500/50 bg-sky-500/10"
                : "hover:bg-muted/20",
              isSuspended && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !isSuspended && setSelectedOutcome(line.outcome)}
            disabled={isSuspended}
          >
            <span className="font-medium">{line.outcome}</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground">
                {line.impliedProb.toFixed(1)}%
              </span>
              <span className="font-mono font-bold text-sm">{line.decimal.toFixed(2)}</span>
              {line.movement === "UP" && <TrendingUp className="size-3 text-emerald-400" />}
              {line.movement === "DOWN" && <TrendingDown className="size-3 text-rose-400" />}
            </div>
          </button>
        ))}
      </div>

      {/* Bet entry */}
      {selectedOutcome && (
        <div className="p-3 rounded-lg border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">{selectedOutcome}</span>
            <span className="font-mono text-sm font-bold">{decimalOdds.toFixed(2)}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground">Stake</label>
              {strategy && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 text-violet-400 border-violet-500/50 gap-0.5">
                  <Info className="size-2.5" />
                  Kelly 1/2
                </Badge>
              )}
            </div>
            <Input
              type="number"
              placeholder="0.00"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              className="font-mono"
              disabled={isSuspended}
            />
          </div>

          {/* Kelly Sizing Panel */}
          {strategy && decimalOdds > 0 && (
            <KellySizingPanel
              decimalOdds={decimalOdds}
              modelConfidence={strategy.confidence}
            />
          )}

          {kelly > 0 && !strategy && (
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
              <Brain className="size-3" />
              Kelly suggests: ${kellySuggestion.toFixed(0)} ({(kelly * 100).toFixed(1)}% of bankroll)
            </div>
          )}
          <div className="grid grid-cols-2 gap-1 text-xs">
            <span className="text-muted-foreground">Potential Return</span>
            <span className="font-mono text-right">${potentialReturn.toFixed(2)}</span>
            <span className="text-muted-foreground">Profit</span>
            <span className="font-mono text-emerald-400 text-right">
              {stakeNum > 0 ? `$${(potentialReturn - stakeNum).toFixed(2)}` : "--"}
            </span>
          </div>
          <Button className="w-full h-8 text-xs" disabled={stakeNum <= 0 || isSuspended}>
            {isSuspended ? "Market Suspended" : "Place Bet"}
          </Button>
        </div>
      )}
    </div>
  )
}

function PredictionPanel({ matchStatus }: { matchStatus: MatchStatus }) {
  const [side, setSide] = React.useState<"YES" | "NO">("YES")
  const [stake, setStake] = React.useState("")
  const stakeNum = parseFloat(stake) || 0
  const market = MOCK_PREDICTION_MARKETS.find((m) => m.outcome === side) ?? MOCK_PREDICTION_MARKETS[0]
  const shares = stakeNum > 0 ? stakeNum / market.price : 0
  const maxPayout = shares * 1.00
  const profit = maxPayout - stakeNum
  const isSuspended = matchStatus === "suspended"

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        &quot;Arsenal to win the EPL 2025/26?&quot;
      </div>

      <div className="grid grid-cols-2 gap-2">
        {MOCK_PREDICTION_MARKETS.map((m) => (
          <button
            key={m.outcome}
            className={cn(
              "p-3 rounded-lg border text-center transition-colors",
              side === m.outcome
                ? m.outcome === "YES"
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : "border-rose-500/50 bg-rose-500/10"
                : "hover:bg-muted/20",
              isSuspended && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !isSuspended && setSide(m.outcome as "YES" | "NO")}
            disabled={isSuspended}
          >
            <p className={cn(
              "text-sm font-bold",
              m.outcome === "YES" ? "text-emerald-400" : "text-rose-400"
            )}>
              {m.outcome}
            </p>
            <p className="text-lg font-mono font-bold">${m.price.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">
              Vol: ${(m.volume / 1000).toFixed(0)}k
            </p>
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Stake (USD)</label>
        <Input
          type="number"
          placeholder="0.00"
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          className="font-mono"
          disabled={isSuspended}
        />
      </div>

      <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Shares</span>
          <span className="font-mono">{shares.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Max Payout (if {side})</span>
          <span className="font-mono">${maxPayout.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Profit</span>
          <span className="font-mono text-emerald-400">{stakeNum > 0 ? `$${profit.toFixed(2)}` : "--"}</span>
        </div>
      </div>

      <Button className="w-full h-8 text-xs" disabled={stakeNum <= 0 || isSuspended}>
        {isSuspended ? "Market Suspended" : `Buy ${side} Shares`}
      </Button>
    </div>
  )
}

// ---------- Main Component ----------

interface SportsBetSlipProps {
  className?: string
}

export function SportsBetSlip({ className }: SportsBetSlipProps) {
  const [selectedLeague, setSelectedLeague] = React.useState<string>("EPL")
  const [selectedFixture, setSelectedFixture] = React.useState<string>("fix-001")
  const [linkedStrategy, setLinkedStrategy] = React.useState<string>("none")
  const [matchStatus, setMatchStatus] = React.useState<MatchStatus>("pre_game")
  const [showHalftimeAlert, setShowHalftimeAlert] = React.useState(false)
  const prevMatchStatus = React.useRef<MatchStatus>(matchStatus)

  // Detect halftime transition to show alert
  React.useEffect(() => {
    if (matchStatus === "halftime" && prevMatchStatus.current !== "halftime") {
      setShowHalftimeAlert(true)
    }
    prevMatchStatus.current = matchStatus
  }, [matchStatus])

  const filteredFixtures = MOCK_FIXTURES.filter((f) => f.league === selectedLeague)
  const baseFixture = MOCK_FIXTURES.find((f) => f.id === selectedFixture) ?? MOCK_FIXTURES[0]

  // Override fixture phase based on match status selector
  const fixture: Fixture = {
    ...baseFixture,
    phase: matchStatusToFixturePhase(matchStatus),
    score: isLivePhase(matchStatus) || matchStatus === "halftime" || matchStatus === "suspended"
      ? (baseFixture.score ?? "0-0")
      : matchStatus === "full_time"
        ? (baseFixture.score ?? "2-1")
        : null,
    minute: matchStatus === "first_half" ? 32
      : matchStatus === "second_half" ? 67
      : matchStatus === "suspended" ? 71
      : matchStatus === "live" ? (baseFixture.minute ?? 45)
      : null,
  }

  const isSuspended = matchStatus === "suspended"

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="size-4" />
            Sports / Prediction Bet Slip
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <PhaseGateIndicator matchStatus={matchStatus} />
            {(isLivePhase(matchStatus) || matchStatus === "suspended") && (
              <Badge
                variant="default"
                className={cn(
                  "text-[10px] gap-1",
                  isSuspended
                    ? "bg-red-600 animate-pulse"
                    : "bg-emerald-600 animate-pulse"
                )}
              >
                {isSuspended ? (
                  <>
                    <AlertTriangle className="size-2.5" />
                    SUSPENDED
                  </>
                ) : (
                  <>
                    <Radio className="size-2.5" />
                    LIVE
                  </>
                )}
              </Badge>
            )}
            {matchStatus === "halftime" && (
              <Badge variant="default" className="text-[10px] bg-amber-600 gap-1">
                <Pause className="size-2.5" />
                HT
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Match Status Bar */}
        <MatchStatusBar matchStatus={matchStatus} />

        {/* Halftime Transition Alert */}
        {showHalftimeAlert && matchStatus === "halftime" && (
          <HalftimeTransitionAlert onDismiss={() => setShowHalftimeAlert(false)} />
        )}

        {/* Match Phase Selector (demo) */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="size-3" />
            Match Phase (demo)
          </label>
          <Select value={matchStatus} onValueChange={(v) => setMatchStatus(v as MatchStatus)}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATCH_PHASE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* League + Fixture selectors */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">League</label>
            <Select value={selectedLeague} onValueChange={(v) => {
              setSelectedLeague(v)
              const first = MOCK_FIXTURES.find((f) => f.league === v)
              if (first) setSelectedFixture(first.id)
            }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAGUES.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Fixture</label>
            <Select value={selectedFixture} onValueChange={setSelectedFixture}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {filteredFixtures.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.home} vs {f.away}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Fixture header */}
        <div className="p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-sm font-bold">{fixture.home}</p>
            </div>
            <div className="text-center px-4">
              {fixture.score ? (
                <p className="text-lg font-mono font-bold">{fixture.score}</p>
              ) : (
                <p className="text-xs text-muted-foreground">vs</p>
              )}
              <p className={cn("text-[10px]", getPhaseColor(fixture.phase))}>
                {getPhaseLabel(fixture.phase, fixture.minute)}
              </p>
            </div>
            <div className="text-center flex-1">
              <p className="text-sm font-bold">{fixture.away}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
            <Clock className="size-3" />
            {fixture.date} {fixture.kickoff}
          </div>
        </div>

        {/* Strategy link */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Brain className="size-3" />
            Linked ML Model
          </label>
          <Select value={linkedStrategy} onValueChange={setLinkedStrategy}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (manual)</SelectItem>
              {MOCK_STRATEGIES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({(s.confidence * 100).toFixed(0)}%)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bet type tabs */}
        <Tabs defaultValue="exchange">
          <TabsList className="w-full grid grid-cols-3 h-8">
            <TabsTrigger value="exchange" className="text-xs gap-1">
              <ArrowLeftRight className="size-3" />
              Back/Lay
            </TabsTrigger>
            <TabsTrigger value="fixed" className="text-xs gap-1">
              <Target className="size-3" />
              Fixed Odds
            </TabsTrigger>
            <TabsTrigger value="prediction" className="text-xs gap-1">
              <BarChart3 className="size-3" />
              Prediction
            </TabsTrigger>
          </TabsList>

          <div className="mt-3">
            <TabsContent value="exchange" className="mt-0">
              <BackLayLadder
                fixtureId={selectedFixture}
                matchStatus={matchStatus}
                linkedStrategy={linkedStrategy}
              />
            </TabsContent>
            <TabsContent value="fixed" className="mt-0">
              <FixedOddsPanel
                fixtureId={selectedFixture}
                matchStatus={matchStatus}
                linkedStrategy={linkedStrategy}
              />
            </TabsContent>
            <TabsContent value="prediction" className="mt-0">
              <PredictionPanel matchStatus={matchStatus} />
            </TabsContent>
          </div>
        </Tabs>

        <Separator />

        {/* Arb Detector */}
        <div className="space-y-2">
          <p className="text-xs font-medium flex items-center gap-1.5">
            <Zap className="size-3.5 text-amber-400" />
            Arb Opportunities
          </p>
          {MOCK_ARBS.length === 0 ? (
            <p className="text-xs text-muted-foreground">No arbitrage detected</p>
          ) : (
            <div className="space-y-1.5">
              {MOCK_ARBS.map((arb, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{arb.fixture}</span>
                    <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/50">
                      {arb.arbPct.toFixed(1)}% arb
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-[9px] px-1 py-0">{arb.venue1}</Badge>
                      <span className="text-muted-foreground">{arb.outcome1}</span>
                      <span className="font-mono font-medium">{arb.odds1.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-[9px] px-1 py-0">{arb.venue2}</Badge>
                      <span className="text-muted-foreground">{arb.outcome2}</span>
                      <span className="font-mono font-medium">{arb.odds2.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full h-6 text-[10px]">
                    Build Arb Bundle
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
