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
import { Separator } from "@/components/ui/separator"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  TrendingUp,
  Search,
  Bookmark,
  Share2,
  ExternalLink,
  Flame,
  X,
  ChevronRight,
  Clock,
  BarChart3,
  ArrowLeft,
} from "lucide-react"

// ---------- Types ----------

type MarketCategory =
  | "trending"
  | "breaking"
  | "politics"
  | "sports"
  | "crypto"
  | "finance"
  | "geopolitics"
  | "tech"
  | "culture"
  | "economy"
  | "weather"
  | "elections"
  | "esports"

type MarketVenue = "polymarket" | "kalshi"
type MarketType = "binary" | "multi"
type SortOption = "trending" | "newest" | "highest_volume" | "closing_soon"

interface MarketOutcome {
  name: string
  probability: number
  yesPrice: number
  noPrice: number
}

interface PredictionMarket {
  id: string
  question: string
  category: MarketCategory
  venue: MarketVenue
  type: MarketType
  outcomes: MarketOutcome[]
  volume: number
  volumeLabel: string
  resolutionDate: string | null
  isLive: boolean
  isTrending: boolean
}

// ---------- Constants ----------

const CATEGORIES: { value: MarketCategory; label: string; icon?: string }[] = [
  { value: "trending", label: "Trending", icon: "fire" },
  { value: "breaking", label: "Breaking" },
  { value: "politics", label: "Politics" },
  { value: "sports", label: "Sports" },
  { value: "crypto", label: "Crypto" },
  { value: "finance", label: "Finance" },
  { value: "geopolitics", label: "Geopolitics" },
  { value: "tech", label: "Tech" },
  { value: "culture", label: "Culture" },
  { value: "economy", label: "Economy" },
  { value: "weather", label: "Weather" },
  { value: "elections", label: "Elections" },
  { value: "esports", label: "Esports" },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "highest_volume", label: "Highest Volume" },
  { value: "closing_soon", label: "Closing Soon" },
]

// ---------- Mock Data ----------

const MOCK_MARKETS: PredictionMarket[] = [
  // Politics
  {
    id: "pm-001",
    question: "Will Trump visit China by June 30?",
    category: "politics",
    venue: "polymarket",
    type: "multi",
    outcomes: [
      { name: "By June 30", probability: 70, yesPrice: 0.70, noPrice: 0.30 },
      { name: "By May 31", probability: 56, yesPrice: 0.56, noPrice: 0.44 },
    ],
    volume: 35_000_000,
    volumeLabel: "$35M Vol.",
    resolutionDate: "2026-06-30",
    isLive: false,
    isTrending: true,
  },
  {
    id: "pm-002",
    question: "Fed rate hike in 2026?",
    category: "politics",
    venue: "kalshi",
    type: "binary",
    outcomes: [
      { name: "Yes", probability: 24, yesPrice: 0.24, noPrice: 0.76 },
    ],
    volume: 12_500_000,
    volumeLabel: "$12.5M Vol.",
    resolutionDate: "2026-12-31",
    isLive: false,
    isTrending: true,
  },
  {
    id: "pm-003",
    question: "Italy Judicial Reform Referendum passes?",
    category: "politics",
    venue: "polymarket",
    type: "binary",
    outcomes: [
      { name: "Yes", probability: 40, yesPrice: 0.40, noPrice: 0.60 },
    ],
    volume: 4_200_000,
    volumeLabel: "$4.2M Vol.",
    resolutionDate: "2026-09-30",
    isLive: false,
    isTrending: false,
  },
  {
    id: "pm-004",
    question: "Will China invade Taiwan by end of 2026?",
    category: "politics",
    venue: "polymarket",
    type: "binary",
    outcomes: [
      { name: "Yes", probability: 11, yesPrice: 0.11, noPrice: 0.89 },
    ],
    volume: 28_000_000,
    volumeLabel: "$28M Vol.",
    resolutionDate: "2026-12-31",
    isLive: false,
    isTrending: true,
  },
  {
    id: "pm-005",
    question: "Slovenian Parliamentary Election Winner",
    category: "politics",
    venue: "polymarket",
    type: "multi",
    outcomes: [
      { name: "Freedom Movement (GS)", probability: 99, yesPrice: 0.99, noPrice: 0.01 },
      { name: "Slovenian Democratic Party (SDS)", probability: 1, yesPrice: 0.01, noPrice: 0.99 },
    ],
    volume: 1_800_000,
    volumeLabel: "$1.8M Vol.",
    resolutionDate: "2026-06-01",
    isLive: false,
    isTrending: false,
  },
  // Crypto
  {
    id: "pm-006",
    question: "BTC above $100K by June 2026?",
    category: "crypto",
    venue: "polymarket",
    type: "binary",
    outcomes: [
      { name: "Yes", probability: 72, yesPrice: 0.72, noPrice: 0.28 },
    ],
    volume: 48_000_000,
    volumeLabel: "$48M Vol.",
    resolutionDate: "2026-06-30",
    isLive: false,
    isTrending: true,
  },
  {
    id: "pm-007",
    question: "ETH flips BTC market cap by 2027?",
    category: "crypto",
    venue: "kalshi",
    type: "binary",
    outcomes: [
      { name: "Yes", probability: 8, yesPrice: 0.08, noPrice: 0.92 },
    ],
    volume: 6_300_000,
    volumeLabel: "$6.3M Vol.",
    resolutionDate: "2027-01-01",
    isLive: false,
    isTrending: false,
  },
  {
    id: "pm-008",
    question: "Solana ETF approved in 2026?",
    category: "crypto",
    venue: "polymarket",
    type: "binary",
    outcomes: [
      { name: "Yes", probability: 45, yesPrice: 0.45, noPrice: 0.55 },
    ],
    volume: 22_000_000,
    volumeLabel: "$22M Vol.",
    resolutionDate: "2026-12-31",
    isLive: false,
    isTrending: true,
  },
  // Sports
  {
    id: "pm-009",
    question: "Lakers vs Pistons",
    category: "sports",
    venue: "polymarket",
    type: "multi",
    outcomes: [
      { name: "Lakers", probability: 54, yesPrice: 0.54, noPrice: 0.46 },
      { name: "Pistons", probability: 47, yesPrice: 0.47, noPrice: 0.53 },
    ],
    volume: 2_100_000,
    volumeLabel: "$2.1M Vol.",
    resolutionDate: "2026-03-25",
    isLive: true,
    isTrending: true,
  },
  {
    id: "pm-010",
    question: "Thunder vs 76ers",
    category: "sports",
    venue: "polymarket",
    type: "multi",
    outcomes: [
      { name: "Thunder", probability: 90, yesPrice: 0.90, noPrice: 0.10 },
      { name: "76ers", probability: 11, yesPrice: 0.11, noPrice: 0.89 },
    ],
    volume: 1_500_000,
    volumeLabel: "$1.5M Vol.",
    resolutionDate: "2026-03-24",
    isLive: true,
    isTrending: false,
  },
  {
    id: "pm-011",
    question: "Arsenal to win EPL 2025/26?",
    category: "sports",
    venue: "polymarket",
    type: "binary",
    outcomes: [
      { name: "Yes", probability: 62, yesPrice: 0.62, noPrice: 0.38 },
    ],
    volume: 15_000_000,
    volumeLabel: "$15M Vol.",
    resolutionDate: "2026-05-25",
    isLive: false,
    isTrending: true,
  },
  // Geopolitics
  {
    id: "pm-012",
    question: "Kharg Island no longer under Iranian control by April 30?",
    category: "geopolitics",
    venue: "polymarket",
    type: "binary",
    outcomes: [
      { name: "Yes", probability: 28, yesPrice: 0.28, noPrice: 0.72 },
    ],
    volume: 8_700_000,
    volumeLabel: "$8.7M Vol.",
    resolutionDate: "2026-04-30",
    isLive: false,
    isTrending: true,
  },
  {
    id: "pm-013",
    question: "Will the US confirm aliens exist by Dec 31?",
    category: "geopolitics",
    venue: "polymarket",
    type: "multi",
    outcomes: [
      { name: "By Dec 31", probability: 17, yesPrice: 0.17, noPrice: 0.83 },
      { name: "By Mar 31", probability: 1, yesPrice: 0.01, noPrice: 0.99 },
    ],
    volume: 19_000_000,
    volumeLabel: "$19M Vol.",
    resolutionDate: "2026-12-31",
    isLive: false,
    isTrending: true,
  },
  {
    id: "pm-014",
    question: "Strait of Hormuz traffic returns to normal by end of April?",
    category: "geopolitics",
    venue: "polymarket",
    type: "binary",
    outcomes: [
      { name: "Yes", probability: 39, yesPrice: 0.39, noPrice: 0.61 },
    ],
    volume: 5_400_000,
    volumeLabel: "$5.4M Vol.",
    resolutionDate: "2026-04-30",
    isLive: false,
    isTrending: false,
  },
  // Finance
  {
    id: "pm-015",
    question: "S&P 500 above 6000 by Dec 2026?",
    category: "finance",
    venue: "kalshi",
    type: "binary",
    outcomes: [
      { name: "Yes", probability: 58, yesPrice: 0.58, noPrice: 0.42 },
    ],
    volume: 31_000_000,
    volumeLabel: "$31M Vol.",
    resolutionDate: "2026-12-31",
    isLive: false,
    isTrending: true,
  },
  {
    id: "pm-016",
    question: "US enters recession in 2026?",
    category: "finance",
    venue: "kalshi",
    type: "binary",
    outcomes: [
      { name: "Yes", probability: 31, yesPrice: 0.31, noPrice: 0.69 },
    ],
    volume: 18_000_000,
    volumeLabel: "$18M Vol.",
    resolutionDate: "2026-12-31",
    isLive: false,
    isTrending: true,
  },
  {
    id: "pm-017",
    question: "Fed cuts rates before July 2026?",
    category: "finance",
    venue: "kalshi",
    type: "binary",
    outcomes: [
      { name: "Yes", probability: 67, yesPrice: 0.67, noPrice: 0.33 },
    ],
    volume: 25_000_000,
    volumeLabel: "$25M Vol.",
    resolutionDate: "2026-07-01",
    isLive: false,
    isTrending: true,
  },
  // Esports
  {
    id: "pm-018",
    question: "CS2: Team Spirit vs FURIA — Game 1",
    category: "esports",
    venue: "polymarket",
    type: "multi",
    outcomes: [
      { name: "Team Spirit", probability: 63, yesPrice: 0.63, noPrice: 0.37 },
      { name: "FURIA", probability: 38, yesPrice: 0.38, noPrice: 0.62 },
    ],
    volume: 1_000_000,
    volumeLabel: "$1M Vol.",
    resolutionDate: "2026-03-24",
    isLive: true,
    isTrending: false,
  },
  {
    id: "pm-019",
    question: "Dota 2: PARIVISION vs BetBoom — Game 2",
    category: "esports",
    venue: "polymarket",
    type: "multi",
    outcomes: [
      { name: "PARIVISION", probability: 55, yesPrice: 0.55, noPrice: 0.45 },
      { name: "BetBoom", probability: 46, yesPrice: 0.46, noPrice: 0.54 },
    ],
    volume: 445_000,
    volumeLabel: "$445K Vol.",
    resolutionDate: "2026-03-24",
    isLive: true,
    isTrending: false,
  },
  // Additional trending
  {
    id: "pm-020",
    question: "Will Apple release a foldable iPhone in 2026?",
    category: "tech",
    venue: "kalshi",
    type: "binary",
    outcomes: [
      { name: "Yes", probability: 18, yesPrice: 0.18, noPrice: 0.82 },
    ],
    volume: 3_200_000,
    volumeLabel: "$3.2M Vol.",
    resolutionDate: "2026-12-31",
    isLive: false,
    isTrending: false,
  },
  {
    id: "pm-021",
    question: "Oscar Best Picture 2027 winner from streaming platform?",
    category: "culture",
    venue: "polymarket",
    type: "binary",
    outcomes: [
      { name: "Yes", probability: 41, yesPrice: 0.41, noPrice: 0.59 },
    ],
    volume: 2_800_000,
    volumeLabel: "$2.8M Vol.",
    resolutionDate: "2027-03-01",
    isLive: false,
    isTrending: false,
  },
  {
    id: "pm-022",
    question: "Category 5 hurricane hits US mainland in 2026?",
    category: "weather",
    venue: "kalshi",
    type: "binary",
    outcomes: [
      { name: "Yes", probability: 23, yesPrice: 0.23, noPrice: 0.77 },
    ],
    volume: 7_800_000,
    volumeLabel: "$7.8M Vol.",
    resolutionDate: "2026-11-30",
    isLive: false,
    isTrending: false,
  },
]

// ---------- Helper Functions ----------

function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`
  return `$${vol}`
}

function getPrimaryProbability(market: PredictionMarket): number {
  if (market.type === "binary") return market.outcomes[0].probability
  return Math.max(...market.outcomes.map((o) => o.probability))
}

function getVenueBadgeClasses(venue: MarketVenue): string {
  return venue === "polymarket"
    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
    : "bg-purple-500/20 text-purple-400 border-purple-500/30"
}

function getVenueLabel(venue: MarketVenue): string {
  return venue === "polymarket" ? "Polymarket" : "Kalshi"
}

// ---------- Sub-components ----------

function CategoryPills({
  active,
  onSelect,
}: {
  active: MarketCategory
  onSelect: (cat: MarketCategory) => void
}) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant={active === cat.value ? "default" : "outline"}
            size="sm"
            className={cn(
              "text-xs h-8 shrink-0 rounded-full",
              active === cat.value && "bg-primary text-primary-foreground"
            )}
            onClick={() => onSelect(cat.value)}
          >
            {cat.value === "trending" && (
              <Flame className="size-3 mr-1" />
            )}
            {cat.label}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

function LiveDot() {
  return (
    <span className="relative flex size-2">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex size-2 rounded-full bg-red-500" />
    </span>
  )
}

function ProbabilityBadge({ probability }: { probability: number }) {
  const color =
    probability >= 70
      ? "text-emerald-400"
      : probability >= 40
        ? "text-yellow-400"
        : "text-red-400"

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={cn("text-3xl font-bold tabular-nums", color)}>
        {probability}%
      </span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
        chance
      </span>
    </div>
  )
}

function YesNoButtons({
  yesPrice,
  noPrice,
  size = "sm",
  onYes,
  onNo,
}: {
  yesPrice: number
  noPrice: number
  size?: "sm" | "default"
  onYes?: () => void
  onNo?: () => void
}) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size={size}
        className={cn(
          "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300",
          size === "sm" ? "text-xs h-7 px-2.5" : "text-sm"
        )}
        onClick={onYes}
      >
        Yes {(yesPrice * 100).toFixed(0)}c
      </Button>
      <Button
        variant="outline"
        size={size}
        className={cn(
          "border-red-500/40 text-red-400 hover:bg-red-500/20 hover:text-red-300",
          size === "sm" ? "text-xs h-7 px-2.5" : "text-sm"
        )}
        onClick={onNo}
      >
        No {(noPrice * 100).toFixed(0)}c
      </Button>
    </div>
  )
}

function BinaryMarketCard({
  market,
  onSelect,
}: {
  market: PredictionMarket
  onSelect: (id: string) => void
}) {
  const outcome = market.outcomes[0]
  return (
    <Card
      className="bg-card hover:bg-muted/50 transition-colors cursor-pointer border-border/50"
      onClick={() => onSelect(market.id)}
    >
      <CardHeader className="pb-2 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn("text-[10px] shrink-0", getVenueBadgeClasses(market.venue))}
            >
              {getVenueLabel(market.venue)}
            </Badge>
            {market.isLive && (
              <Badge variant="outline" className="text-[10px] border-red-500/40 text-red-400 flex items-center gap-1">
                <LiveDot />
                LIVE
              </Badge>
            )}
            {market.isTrending && (
              <Badge variant="outline" className="text-[10px] border-orange-500/40 text-orange-400">
                <TrendingUp className="size-2.5 mr-0.5" />
                Trending
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="size-7" onClick={(e) => e.stopPropagation()}>
              <Bookmark className="size-3.5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7" onClick={(e) => e.stopPropagation()}>
              <Share2 className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>
        <CardTitle className="text-sm font-semibold leading-snug line-clamp-2">
          {market.question}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <ProbabilityBadge probability={outcome.probability} />
          <YesNoButtons
            yesPrice={outcome.yesPrice}
            noPrice={outcome.noPrice}
            onYes={() => {}}
            onNo={() => {}}
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <BarChart3 className="size-3" />
            {market.volumeLabel}
          </span>
          {market.resolutionDate && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {market.resolutionDate}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function MultiOutcomeMarketCard({
  market,
  onSelect,
}: {
  market: PredictionMarket
  onSelect: (id: string) => void
}) {
  return (
    <Card
      className="bg-card hover:bg-muted/50 transition-colors cursor-pointer border-border/50"
      onClick={() => onSelect(market.id)}
    >
      <CardHeader className="pb-2 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn("text-[10px] shrink-0", getVenueBadgeClasses(market.venue))}
            >
              {getVenueLabel(market.venue)}
            </Badge>
            {market.isLive && (
              <Badge variant="outline" className="text-[10px] border-red-500/40 text-red-400 flex items-center gap-1">
                <LiveDot />
                LIVE
              </Badge>
            )}
            {market.isTrending && (
              <Badge variant="outline" className="text-[10px] border-orange-500/40 text-orange-400">
                <TrendingUp className="size-2.5 mr-0.5" />
                Trending
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="size-7" onClick={(e) => e.stopPropagation()}>
              <Bookmark className="size-3.5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7" onClick={(e) => e.stopPropagation()}>
              <Share2 className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>
        <CardTitle className="text-sm font-semibold leading-snug line-clamp-2">
          {market.question}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {market.outcomes.map((outcome) => {
          const barColor =
            outcome.probability >= 70
              ? "bg-emerald-500/30"
              : outcome.probability >= 40
                ? "bg-yellow-500/30"
                : "bg-red-500/30"
          const textColor =
            outcome.probability >= 70
              ? "text-emerald-400"
              : outcome.probability >= 40
                ? "text-yellow-400"
                : "text-red-400"

          return (
            <div key={outcome.name} className="relative">
              {/* Background probability bar */}
              <div
                className={cn("absolute inset-0 rounded-md", barColor)}
                style={{ width: `${outcome.probability}%` }}
              />
              <div className="relative flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium truncate">{outcome.name}</span>
                  <span className={cn("text-xs font-bold tabular-nums", textColor)}>
                    {outcome.probability}%
                  </span>
                </div>
                <YesNoButtons
                  yesPrice={outcome.yesPrice}
                  noPrice={outcome.noPrice}
                  onYes={(e) => { (e as unknown as React.MouseEvent)?.stopPropagation?.() }}
                  onNo={(e) => { (e as unknown as React.MouseEvent)?.stopPropagation?.() }}
                />
              </div>
            </div>
          )
        })}
        <Separator />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <BarChart3 className="size-3" />
            {market.volumeLabel}
          </span>
          {market.resolutionDate && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {market.resolutionDate}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function MarketDetailPanel({
  market,
  onClose,
}: {
  market: PredictionMarket
  onClose: () => void
}) {
  const [stakeAmount, setStakeAmount] = React.useState("")
  const [selectedSide, setSelectedSide] = React.useState<"yes" | "no">("yes")
  const [selectedOutcomeIdx, setSelectedOutcomeIdx] = React.useState(0)

  const selectedOutcome = market.outcomes[selectedOutcomeIdx]
  const price = selectedSide === "yes" ? selectedOutcome.yesPrice : selectedOutcome.noPrice
  const stakeNum = parseFloat(stakeAmount) || 0
  const potentialReturn = stakeNum > 0 ? stakeNum / price : 0
  const potentialProfit = potentialReturn - stakeNum

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-7 -ml-2 mb-1"
              onClick={onClose}
            >
              <ArrowLeft className="size-3 mr-1" />
              Back to markets
            </Button>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn("text-[10px]", getVenueBadgeClasses(market.venue))}
              >
                {getVenueLabel(market.venue)}
              </Badge>
              {market.isLive && (
                <Badge variant="outline" className="text-[10px] border-red-500/40 text-red-400 flex items-center gap-1">
                  <LiveDot />
                  LIVE
                </Badge>
              )}
            </div>
            <CardTitle className="text-base font-semibold leading-snug">
              {market.question}
            </CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price History Placeholder */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-6 flex items-center justify-center">
          <div className="text-center space-y-2">
            <TrendingUp className="size-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Price History</p>
            <p className="text-xs text-muted-foreground/60">
              Chart will display historical price movement
            </p>
          </div>
        </div>

        {/* Outcomes */}
        {market.type === "multi" && (
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Select outcome</label>
            <div className="grid gap-1.5">
              {market.outcomes.map((outcome, idx) => (
                <Button
                  key={outcome.name}
                  variant={selectedOutcomeIdx === idx ? "default" : "outline"}
                  size="sm"
                  className="justify-between text-xs h-9"
                  onClick={() => setSelectedOutcomeIdx(idx)}
                >
                  <span>{outcome.name}</span>
                  <span className="font-bold tabular-nums">{outcome.probability}%</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Order Book Summary */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Order book</label>
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/50 p-3">
            <div className="text-center space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">YES shares</p>
              <p className="text-lg font-bold text-emerald-400 tabular-nums">
                {(selectedOutcome.yesPrice * 100).toFixed(0)}c
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatVolume(market.volume * selectedOutcome.yesPrice)} matched
              </p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">NO shares</p>
              <p className="text-lg font-bold text-red-400 tabular-nums">
                {(selectedOutcome.noPrice * 100).toFixed(0)}c
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatVolume(market.volume * selectedOutcome.noPrice)} matched
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Trade panel */}
        <div className="space-y-3">
          <label className="text-xs text-muted-foreground">Trade</label>

          {/* YES/NO toggle */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={selectedSide === "yes" ? "default" : "outline"}
              size="sm"
              className={cn(
                "text-sm",
                selectedSide === "yes" && "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
              onClick={() => setSelectedSide("yes")}
            >
              Buy YES
            </Button>
            <Button
              variant={selectedSide === "no" ? "default" : "outline"}
              size="sm"
              className={cn(
                "text-sm",
                selectedSide === "no" && "bg-red-600 hover:bg-red-700 text-white"
              )}
              onClick={() => setSelectedSide("no")}
            >
              Buy NO
            </Button>
          </div>

          {/* Stake input */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Stake amount ($)</label>
            <Input
              type="number"
              placeholder="0.00"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="h-9"
            />
            <div className="flex gap-1.5">
              {[10, 50, 100, 500].map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2 flex-1"
                  onClick={() => setStakeAmount(amt.toString())}
                >
                  ${amt}
                </Button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {stakeNum > 0 && (
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Avg price</span>
                <span className="tabular-nums">{(price * 100).toFixed(1)}c</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Shares</span>
                <span className="tabular-nums">{potentialReturn.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Potential return</span>
                <span className="tabular-nums font-medium text-emerald-400">
                  ${potentialReturn.toFixed(2)} (+${potentialProfit.toFixed(2)})
                </span>
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            className={cn(
              "w-full",
              selectedSide === "yes"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            )}
            disabled={stakeNum <= 0}
          >
            {selectedSide === "yes" ? "Buy YES" : "Buy NO"} — {selectedOutcome.name}
          </Button>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2">
          <span className="flex items-center gap-1">
            <BarChart3 className="size-3" />
            {market.volumeLabel}
          </span>
          {market.resolutionDate && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              Resolves {market.resolutionDate}
            </span>
          )}
          <Button variant="ghost" size="sm" className="text-[11px] h-6 px-1.5 text-muted-foreground" onClick={() => {}}>
            <ExternalLink className="size-3 mr-1" />
            View on {getVenueLabel(market.venue)}
          </Button>
        </div>

        {/* Related markets */}
        <div className="space-y-2 pt-2">
          <p className="text-xs text-muted-foreground font-medium">Related markets</p>
          {MOCK_MARKETS.filter(
            (m) => m.category === market.category && m.id !== market.id
          )
            .slice(0, 3)
            .map((related) => (
              <div
                key={related.id}
                className="flex items-center justify-between rounded-md border border-border/30 px-3 py-2 hover:bg-muted/30 cursor-pointer text-xs"
              >
                <span className="truncate mr-2">{related.question}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold tabular-nums">
                    {getPrimaryProbability(related)}%
                  </span>
                  <ChevronRight className="size-3 text-muted-foreground" />
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Main Component ----------

export function PredictionMarketsPanel() {
  const [activeCategory, setActiveCategory] = React.useState<MarketCategory>("trending")
  const [venueFilter, setVenueFilter] = React.useState<"all" | MarketVenue>("all")
  const [sortBy, setSortBy] = React.useState<SortOption>("trending")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedMarketId, setSelectedMarketId] = React.useState<string | null>(null)

  // Filter markets
  const filteredMarkets = React.useMemo(() => {
    let markets = [...MOCK_MARKETS]

    // Category filter
    if (activeCategory === "trending") {
      markets = markets.filter((m) => m.isTrending)
    } else if (activeCategory === "breaking") {
      markets = markets.filter((m) => m.isLive || m.isTrending)
    } else {
      markets = markets.filter((m) => m.category === activeCategory)
    }

    // Venue filter
    if (venueFilter !== "all") {
      markets = markets.filter((m) => m.venue === venueFilter)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      markets = markets.filter((m) =>
        m.question.toLowerCase().includes(query) ||
        m.outcomes.some((o) => o.name.toLowerCase().includes(query))
      )
    }

    // Sort
    switch (sortBy) {
      case "trending":
        markets.sort((a, b) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0) || b.volume - a.volume)
        break
      case "newest":
        markets.sort((a, b) => (b.resolutionDate ?? "").localeCompare(a.resolutionDate ?? ""))
        break
      case "highest_volume":
        markets.sort((a, b) => b.volume - a.volume)
        break
      case "closing_soon":
        markets.sort((a, b) => (a.resolutionDate ?? "9999").localeCompare(b.resolutionDate ?? "9999"))
        break
    }

    return markets
  }, [activeCategory, venueFilter, searchQuery, sortBy])

  const selectedMarket = selectedMarketId
    ? MOCK_MARKETS.find((m) => m.id === selectedMarketId) ?? null
    : null

  // If a market is selected, show detail view
  if (selectedMarket) {
    return (
      <div className="space-y-4">
        <MarketDetailPanel
          market={selectedMarket}
          onClose={() => setSelectedMarketId(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Category pills */}
      <CategoryPills active={activeCategory} onSelect={setActiveCategory} />

      {/* Secondary controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Venue filter (segmented buttons) */}
        <div className="flex rounded-lg border border-border/50 overflow-hidden shrink-0">
          {(["all", "polymarket", "kalshi"] as const).map((venue) => (
            <Button
              key={venue}
              variant="ghost"
              size="sm"
              className={cn(
                "text-xs h-8 rounded-none px-3 border-r border-border/50 last:border-r-0",
                venueFilter === venue && "bg-muted text-foreground"
              )}
              onClick={() => setVenueFilter(venue)}
            >
              {venue === "all" ? "All" : getVenueLabel(venue)}
            </Button>
          ))}
        </div>

        {/* Sort dropdown */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative flex-1 min-w-0 w-full sm:w-auto sm:ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs pl-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 size-6"
              onClick={() => setSearchQuery("")}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {filteredMarkets.length} market{filteredMarkets.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Market cards grid */}
      {filteredMarkets.length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="py-12 text-center">
            <Search className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No markets found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Try adjusting your filters or search query
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMarkets.map((market) =>
            market.type === "binary" ? (
              <BinaryMarketCard
                key={market.id}
                market={market}
                onSelect={setSelectedMarketId}
              />
            ) : (
              <MultiOutcomeMarketCard
                key={market.id}
                market={market}
                onSelect={setSelectedMarketId}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}
