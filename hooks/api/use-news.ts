import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch } from "@/lib/api/fetch"

export type NewsSeverity = "breaking" | "high" | "medium" | "low"

export interface NewsItem {
  id: string
  title: string
  source: string
  timestamp: string
  severity: NewsSeverity
  instruments: string[]
  summary: string
}

const SEED_NEWS: NewsItem[] = [
  {
    id: "n-1",
    title: "SEC Approves Spot Bitcoin ETF Options Trading",
    source: "Reuters",
    timestamp: "2026-03-22T09:12:00Z",
    severity: "breaking",
    instruments: ["BTC-USD", "BTC-USDT"],
    summary: "The SEC has approved options trading on spot Bitcoin ETFs, opening the door for institutional hedging strategies and increased liquidity.",
  },
  {
    id: "n-2",
    title: "Federal Reserve Holds Rates Steady at 4.25%",
    source: "Bloomberg",
    timestamp: "2026-03-22T08:45:00Z",
    severity: "high",
    instruments: ["SPY", "QQQ", "TLT"],
    summary: "The Fed maintained its benchmark rate, citing persistent services inflation. Dot plot signals one cut in H2 2026.",
  },
  {
    id: "n-3",
    title: "Ethereum Pectra Upgrade Scheduled for April 15",
    source: "CoinDesk",
    timestamp: "2026-03-22T07:30:00Z",
    severity: "high",
    instruments: ["ETH-USD", "ETH-USDT"],
    summary: "Core developers confirmed the Pectra upgrade date. EIP-7702 introduces account abstraction natively, expected to reduce L2 gas costs by 40%.",
  },
  {
    id: "n-4",
    title: "Aave V4 Governance Proposal Passes with 98% Approval",
    source: "CoinDesk",
    timestamp: "2026-03-22T06:15:00Z",
    severity: "medium",
    instruments: ["AAVE-USD"],
    summary: "The Aave community voted to implement unified liquidity layers across all supported chains, consolidating fragmented pools.",
  },
  {
    id: "n-5",
    title: "US CPI Comes in at 2.8% YoY, Below Expectations",
    source: "Bloomberg",
    timestamp: "2026-03-22T05:00:00Z",
    severity: "high",
    instruments: ["SPY", "DXY", "GLD"],
    summary: "March CPI print of 2.8% was below the 3.0% consensus. Core CPI at 3.1% also beat expectations, fueling rate-cut optimism.",
  },
  {
    id: "n-6",
    title: "Binance Announces Delisting of 5 Low-Volume Pairs",
    source: "The Block",
    timestamp: "2026-03-22T04:30:00Z",
    severity: "medium",
    instruments: ["LOOM-USDT", "KEY-USDT"],
    summary: "Binance will delist LOOM/USDT, KEY/USDT, and 3 other pairs effective April 1 due to insufficient liquidity.",
  },
  {
    id: "n-7",
    title: "World Cup 2026 Group Stage Draw Completed",
    source: "ESPN",
    timestamp: "2026-03-21T22:00:00Z",
    severity: "medium",
    instruments: ["FIFA-WC-GROUP-A", "FIFA-WC-GROUP-B"],
    summary: "48 teams drawn into 12 groups. USA, Mexico, and Canada placed in separate groups as co-hosts. Betting markets adjust outright odds.",
  },
  {
    id: "n-8",
    title: "Uniswap V4 Hooks See $2B in TVL Within First Week",
    source: "DeFi Llama",
    timestamp: "2026-03-21T20:15:00Z",
    severity: "medium",
    instruments: ["UNI-USD", "ETH-USD"],
    summary: "Custom hook contracts on Uniswap V4 attracted $2B TVL, with concentrated liquidity management hooks leading adoption.",
  },
  {
    id: "n-9",
    title: "Japan BOJ Raises Rates to 0.75%, Yen Strengthens",
    source: "Reuters",
    timestamp: "2026-03-21T18:30:00Z",
    severity: "high",
    instruments: ["USD-JPY", "NKD"],
    summary: "Bank of Japan raised rates by 25bps citing wage growth. USD/JPY dropped 2% to 138.50, pressuring carry trades.",
  },
  {
    id: "n-10",
    title: "MicroStrategy Adds 12,000 BTC to Treasury Holdings",
    source: "Bloomberg",
    timestamp: "2026-03-21T16:00:00Z",
    severity: "medium",
    instruments: ["BTC-USD", "MSTR"],
    summary: "MicroStrategy purchased an additional 12,000 BTC at an average price of $87,500, bringing total holdings to 520,000 BTC.",
  },
  {
    id: "n-11",
    title: "Champions League Quarter-Final Draw: Liverpool vs Real Madrid",
    source: "ESPN",
    timestamp: "2026-03-21T14:00:00Z",
    severity: "low",
    instruments: ["UCL-QF-1"],
    summary: "Marquee matchup sees Liverpool face Real Madrid. Betting markets price Liverpool slight favorites at 1.85.",
  },
  {
    id: "n-12",
    title: "Solana Validator Outage Causes 45-Minute Block Halt",
    source: "The Block",
    timestamp: "2026-03-21T11:20:00Z",
    severity: "high",
    instruments: ["SOL-USD", "SOL-USDT"],
    summary: "A consensus bug caused Solana mainnet to halt for 45 minutes. Validators coordinated restart; SOL dropped 8% before recovering.",
  },
  {
    id: "n-13",
    title: "EU MiCA Regulations Take Full Effect for Stablecoins",
    source: "Reuters",
    timestamp: "2026-03-21T09:00:00Z",
    severity: "medium",
    instruments: ["USDT-EUR", "USDC-EUR"],
    summary: "Full MiCA enforcement begins for stablecoin issuers in the EU. Tether applies for e-money license; Circle already compliant.",
  },
  {
    id: "n-14",
    title: "Goldman Sachs Launches Crypto Prime Brokerage",
    source: "Bloomberg",
    timestamp: "2026-03-21T07:45:00Z",
    severity: "medium",
    instruments: ["BTC-USD", "ETH-USD"],
    summary: "Goldman Sachs Digital Assets division begins offering custody, lending, and execution services for institutional crypto clients.",
  },
  {
    id: "n-15",
    title: "IPL 2026 Season Opens with Record Viewership Projections",
    source: "ESPN",
    timestamp: "2026-03-21T05:30:00Z",
    severity: "low",
    instruments: ["IPL-MATCH-1"],
    summary: "BCCI reports 800M projected viewers for IPL opener. Sports betting volumes expected to surge 35% over last season.",
  },
]

export function useNewsFeed() {
  const { user, token } = useAuth()

  return useQuery<NewsItem[]>({
    queryKey: ["news-feed", user?.id],
    queryFn: async () => {
      const data = await apiFetch("/api/news/feed", token)
      const items = (data as Record<string, unknown>)?.data ?? data
      if (Array.isArray(items) && items.length > 0) {
        return items as NewsItem[]
      }
      return SEED_NEWS
    },
    enabled: !!user,
    placeholderData: SEED_NEWS,
    retry: false,
  })
}
