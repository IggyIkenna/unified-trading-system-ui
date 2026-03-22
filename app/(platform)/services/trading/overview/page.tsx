"use client"

import * as React from "react"
import { useGlobalScope } from "@/lib/stores/global-scope-store"
import { OrderBookWithDepth, OrderBook, DepthChart, generateMockOrderBook } from "@/components/trading/order-book"
import { CandlestickChart } from "@/components/trading/candlestick-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  Maximize2,
  Radio,
  Database,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  STRATEGIES,
  ACCOUNTS,
  getFilteredStrategies,
  getAccountsForClient,
  type FilterContext,
  type TradingAccount,
} from "@/lib/trading-data"
import { CLIENTS, ORGANIZATIONS } from "@/lib/trading-data"
import { useTickers } from "@/hooks/api/use-market-data"
import { usePositions } from "@/hooks/api/use-positions"
import { useAlerts } from "@/hooks/api/use-alerts"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// Strategy to instrument mapping - loaded from API where available
const strategyInstruments: Record<string, string> = {
  "CEFI_BTC_PERP_FUND_EVT_TICK": "BTC-PERP",
  "CEFI_ETH_PERP_FUND_EVT_TICK": "ETH-PERP",
  "CEFI_SOL_PERP_FUND_EVT_TICK": "SOL/USDT",
  "CEFI_BTC_OPT_MM_EVT_TICK": "BTC/USD",
  "CEFI_ETH_OPT_MM_EVT_TICK": "ETH/USDT",
  "CEFI_BTC_ML_DIR_HUF_4H": "BTC/USDT",
  "CEFI_ETH_ML_DIR_HUF_4H": "ETH/USDT",
  "CEFI_SOL_MOM_HUF_4H": "SOL/USDT",
  "DEFI_AAVE_YIELD_EVT_BLK": "ETH/USDT",
  "DEFI_UNI_LP_EVT_BLK": "ETH/USDT",
}

// Default instruments fallback
const DEFAULT_INSTRUMENTS = [
  { symbol: "BTC/USDT", name: "Bitcoin", venue: "Binance", midPrice: 67234.50, change: 2.4 },
  { symbol: "ETH/USDT", name: "Ethereum", venue: "Binance", midPrice: 3456.78, change: 1.8 },
  { symbol: "SOL/USDT", name: "Solana", venue: "Binance", midPrice: 156.42, change: 4.2 },
  { symbol: "BTC-PERP", name: "Bitcoin Perp", venue: "Hyperliquid", midPrice: 67245.00, change: 2.5 },
  { symbol: "ETH-PERP", name: "Ethereum Perp", venue: "Hyperliquid", midPrice: 3458.50, change: 1.9 },
  { symbol: "BTC/USD", name: "Bitcoin", venue: "Deribit", midPrice: 67250.00, change: 2.3 },
]

// Generate candlestick data for different timeframes - v2.0
// Uses Unix timestamps (seconds) for lightweight-charts compatibility
const generateCandleData = (basePrice: number, timeframe: string) => {
  const points = timeframe === "1m" ? 60 : timeframe === "5m" ? 48 : timeframe === "15m" ? 32 : 24
  const volatility = basePrice * 0.002
  
  // Use seeded random for consistent SSR/client rendering
  let seed = basePrice * 1000
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  
  // Calculate seconds per candle based on timeframe
  const secondsPerCandle = timeframe === "1m" ? 60 : 
                           timeframe === "5m" ? 300 : 
                           timeframe === "15m" ? 900 : 3600
  
  // Use a fixed base timestamp for consistent SSR/client rendering (Mar 18, 2026 12:00 UTC)
  const baseTimestamp = 1774008000 // Unix timestamp in seconds
  
  return Array.from({ length: points }, (_, i) => {
    const open = basePrice + (seededRandom() - 0.5) * volatility * 2
    const close = open + (seededRandom() - 0.5) * volatility * 2
    const high = Math.max(open, close) + seededRandom() * volatility
    const low = Math.min(open, close) - seededRandom() * volatility
    const volume = seededRandom() * 100 + 20
    
    // Generate Unix timestamp in seconds for lightweight-charts
    const timestamp = baseTimestamp - (points - i - 1) * secondsPerCandle
    
    return {
      time: timestamp,
      open,
      close,
      high,
      low,
      volume,
      isUp: close >= open,
    }
  })
}

export default function TradingPage() {
  const { scope: context } = useGlobalScope()
  const { data: tickersData } = useTickers()
  const { data: positionsData } = usePositions()
  const { data: alertsData } = useAlerts()

  // Extract API data - instruments from tickers
  const tickersRaw: any[] = (tickersData as any)?.data ?? (tickersData as any)?.tickers ?? []
  const instruments = tickersRaw.length > 0
    ? tickersRaw.map((t: any) => ({
        symbol: t.symbol ?? "",
        name: t.name ?? t.symbol ?? "",
        venue: t.venue ?? "",
        midPrice: t.midPrice ?? t.price ?? 0,
        change: t.change ?? t.changePct ?? 0,
      }))
    : DEFAULT_INSTRUMENTS

  const [selectedInstrument, setSelectedInstrument] = React.useState(instruments[0])
  const [selectedAccount, setSelectedAccount] = React.useState<TradingAccount | null>(null)
  const [orderType, setOrderType] = React.useState<"limit" | "market">("limit")
  const [orderSide, setOrderSide] = React.useState<"buy" | "sell">("buy")
  const [orderPrice, setOrderPrice] = React.useState("")
  const [orderSize, setOrderSize] = React.useState("")
  const [timeframe, setTimeframe] = React.useState("5m")
  const [chartType, setChartType] = React.useState<"candles" | "line" | "depth">("candles")
  const [tradesTab, setTradesTab] = React.useState<"market" | "own">("market")
  
  // Own trades (user's fills)
  const [ownTrades, setOwnTrades] = React.useState<Array<{
    id: string
    time: string
    side: "buy" | "sell"
    price: number
    size: number
    status: "filled" | "partial" | "pending"
  }>>([])
  
  // Live price state for animation
  const [livePrice, setLivePrice] = React.useState(selectedInstrument.midPrice)
  const [priceChange, setPriceChange] = React.useState(selectedInstrument.change)
  
  // Reset price when instrument changes
  React.useEffect(() => {
    setLivePrice(selectedInstrument.midPrice)
    setPriceChange(selectedInstrument.change)
  }, [selectedInstrument])
  
  // Get available accounts based on selected client
  const availableAccounts = React.useMemo(() => {
    if (context.clientIds.length === 1) {
      return getAccountsForClient(context.clientIds[0])
    }
    return ACCOUNTS
  }, [context.clientIds])
  
  // Check if trading context is complete
  const isContextComplete = React.useMemo(() => {
    return context.organizationIds.length > 0 && 
           context.clientIds.length > 0 && 
           selectedAccount !== null
  }, [context.organizationIds, context.clientIds, selectedAccount])
  
  // Animated recent trades - initialize empty to avoid hydration mismatch
  const [recentTrades, setRecentTrades] = React.useState<Array<{
    id: string
    time: string
    side: "buy" | "sell"
    price: number
    size: number
  }>>([])
  
  // Hydration-safe flag
  const [isClient, setIsClient] = React.useState(false)
  
  // Initialize trades on client only to avoid hydration mismatch
  React.useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Generate trades for the selected instrument
  React.useEffect(() => {
    if (!isClient) return
    
    // Generate realistic price variation based on instrument
    const priceVariation = selectedInstrument.midPrice * 0.0005 // 0.05% variation
    
    const newTrades = Array.from({ length: 12 }, (_, i) => {
      const now = new Date()
      now.setSeconds(now.getSeconds() - i * 2)
      const side = Math.random() > 0.5 ? "buy" : "sell"
      const price = selectedInstrument.midPrice + (Math.random() - 0.5) * priceVariation * 2
      const size = Math.random() * 0.5 + 0.01
      return {
        id: `trade-${Date.now()}-${i}`,
        time: now.toLocaleTimeString("en-US", { hour12: false, timeZone: "UTC" }),
        side: side as "buy" | "sell",
        price,
        size,
      }
    })
    setRecentTrades(newTrades)
  }, [isClient, selectedInstrument])
  
  // Build filter context
  const filterContext: FilterContext = React.useMemo(() => ({
    organizationIds: context.organizationIds,
    clientIds: context.clientIds,
    strategyIds: context.strategyIds,
    mode: context.mode,
    date: new Date().toISOString().split("T")[0],
  }), [context])
  
  // Get filtered strategies
  const filteredStrategies = React.useMemo(() => 
    getFilteredStrategies(filterContext), 
    [filterContext]
  )
  
  // When strategy filter changes, update instrument
  React.useEffect(() => {
    if (context.strategyIds.length === 1) {
      const strategyId = context.strategyIds[0]
      const mappedSymbol = strategyInstruments[strategyId]
      if (mappedSymbol) {
        const instrument = instruments.find(i => i.symbol === mappedSymbol)
        if (instrument) {
          setSelectedInstrument(instrument)
          setLivePrice(instrument.midPrice)
          setPriceChange(instrument.change)
        }
      }
    }
  }, [context.strategyIds])
  
  // Tick counter for order book and depth chart updates
  const [tickCount, setTickCount] = React.useState(0)
  
  // Animate price updates and increment tick
  // Brownian motion with slight upward drift (trending market)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLivePrice((prev: number) => {
        // Random component (volatility)
        const volatility = (Math.random() - 0.5) * selectedInstrument.midPrice * 0.0002
        // Drift component (slight upward trend ~0.001% per tick)
        const drift = selectedInstrument.midPrice * 0.00001
        return prev + volatility + drift
      })
      setTickCount(prev => prev + 1)
    }, 500)
    return () => clearInterval(interval)
  }, [selectedInstrument.midPrice])
  
  // Animate recent trades - use ref to avoid stale closure
  const livePriceRef = React.useRef(livePrice)
  React.useEffect(() => {
    livePriceRef.current = livePrice
  }, [livePrice])
  
  React.useEffect(() => {
    if (!isClient) return
    
    const interval = setInterval(() => {
      const currentPrice = livePriceRef.current
      setRecentTrades(prev => {
        const now = new Date()
        const side = Math.random() > 0.5 ? "buy" : "sell"
        // Use realistic price variation based on instrument price
        const priceVariation = currentPrice * 0.0002 // 0.02% tick
        const price = currentPrice + (Math.random() - 0.5) * priceVariation * 2
        const size = Math.random() * 0.5 + 0.01
        const newTrade = {
          id: Date.now().toString(),
          time: now.toLocaleTimeString("en-US", { hour12: false, timeZone: "UTC" }),
          side: side as "buy" | "sell",
          price,
          size,
        }
        return [newTrade, ...prev.slice(0, 11)]
      })
    }, 1200) // Slightly faster updates
    return () => clearInterval(interval)
  }, [isClient])
  
  // Generate order book for selected instrument with live price - updates on each tick
  const { bids, asks } = React.useMemo(() => 
    generateMockOrderBook(selectedInstrument.symbol, livePrice, tickCount),
    [selectedInstrument.symbol, livePrice, tickCount]
  )
  
  // Generate candle data - update last candle with live price
  const candleData = React.useMemo(() => {
    const data = generateCandleData(selectedInstrument.midPrice, timeframe)
    // Update the last candle to reflect live price movement
    if (data.length > 0 && isClient) {
      const lastCandle = data[data.length - 1]
      const variation = (tickCount % 10) * 0.0001 * livePrice
      lastCandle.close = livePrice + (Math.sin(tickCount * 0.5) * variation)
      lastCandle.high = Math.max(lastCandle.high, lastCandle.close)
      lastCandle.low = Math.min(lastCandle.low, lastCandle.close)
      lastCandle.isUp = lastCandle.close >= lastCandle.open
    }
    return data
  }, [selectedInstrument.midPrice, timeframe, tickCount, livePrice, isClient])
  
  const spread = asks[0]?.price - bids[0]?.price || 0
  const spreadBps = (spread / livePrice) * 10000
  
  // Calculate order total
  const orderTotal = React.useMemo(() => {
    const price = parseFloat(orderPrice) || livePrice
    const size = parseFloat(orderSize) || 0
    return price * size
  }, [orderPrice, orderSize, livePrice])
  
  // Handle order submission
  const handleSubmitOrder = () => {
    const size = parseFloat(orderSize)
    if (!size || size <= 0 || !isContextComplete) return
    
    const price = orderType === "market" 
      ? livePrice + (orderSide === "buy" ? 0.5 : -0.5)
      : parseFloat(orderPrice) || livePrice
    
    const now = new Date()
    const newTrade = {
      id: `user-${Date.now()}`,
      time: now.toLocaleTimeString("en-US", { hour12: false, timeZone: "UTC" }),
      side: orderSide,
      price,
      size,
      status: "filled" as const,
    }
    
    // Add to own trades
    setOwnTrades(prev => [newTrade, ...prev])
    // Also show in market trades
    setRecentTrades(prev => [{ ...newTrade, status: undefined } as typeof prev[0], ...prev.slice(0, 11)])
    setOrderSize("")
    setOrderPrice("")
    setTradesTab("own") // Switch to own trades tab to show the fill
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 p-4 space-y-4 overflow-auto">
        {/* Instrument & Account Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select 
              value={selectedInstrument.symbol} 
              onValueChange={(v) => setSelectedInstrument(instruments.find(i => i.symbol === v) || instruments[0])}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {instruments.map((inst) => (
                  <SelectItem key={inst.symbol} value={inst.symbol}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{inst.symbol}</span>
                      <span className="text-xs text-muted-foreground">{inst.venue}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Account Selector */}
            <Select 
              value={selectedAccount?.id || ""} 
              onValueChange={(v) => setSelectedAccount(availableAccounts.find(a => a.id === v) || null)}
            >
              <SelectTrigger className={cn(
                "w-[260px]",
                !selectedAccount && "border-amber-500/50 text-amber-500"
              )}>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {availableAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{acc.name}</span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1 capitalize">
                        {acc.marginType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{acc.venueAccountId}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono font-bold transition-all">
                ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <Badge variant="outline" className={cn(
                priceChange >= 0 ? "text-emerald-400 border-emerald-400/30" : "text-rose-400 border-rose-400/30"
              )}>
                {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(1)}%
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Live/Batch Mode Toggle */}
            <Badge variant="outline" className="text-xs">
              {context.mode === "live" ? (
                <span className="flex items-center gap-1">
                  <Radio className="size-2.5 animate-pulse text-emerald-400" />
                  Live
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Database className="size-2.5" />
                  Batch
                </span>
              )}
            </Badge>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm">
                <RefreshCw className="size-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="size-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Maximize2 className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Trading Grid */}
        <div className="grid grid-cols-4 gap-4">
          {/* Order Book */}
          <div className="col-span-1">
            <OrderBook
              symbol={selectedInstrument.symbol}
              bids={bids}
              asks={asks}
              lastPrice={livePrice}
              spread={spread}
              spreadBps={spreadBps}
              midPrice={livePrice}
              venue={selectedInstrument.venue}
            />
          </div>
          
          {/* Chart */}
          <div className="col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">Price Chart</CardTitle>
                    <div className="flex items-center gap-1 ml-4">
                      {["candles", "line", "depth"].map((type) => (
                        <Button 
                          key={type}
                          variant={chartType === type ? "secondary" : "ghost"} 
                          size="sm" 
                          className="h-6 px-2 text-xs capitalize"
                          onClick={() => setChartType(type as typeof chartType)}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {["1m", "5m", "15m", "1H", "4H", "1D"].map((tf) => (
                      <Button 
                        key={tf} 
                        variant={timeframe === tf ? "secondary" : "ghost"} 
                        size="sm" 
                        className="h-6 px-2 text-xs"
                        onClick={() => setTimeframe(tf)}
                      >
                        {tf}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Candlestick / Line / Depth Chart */}
                <div className="h-[300px]">
                  {chartType === "candles" ? (
                    <CandlestickChart 
                      data={candleData} 
                      height={300}
                    />
                  ) : chartType === "line" ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={candleData}>
                        <defs>
                          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          domain={["auto", "auto"]}
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                          tickFormatter={(v) => v.toLocaleString()}
                          width={70}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="close" 
                          stroke="var(--primary)" 
                          fill="url(#priceGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <DepthChart
                      bids={bids}
                      asks={asks}
                      midPrice={livePrice}
                      symbol={selectedInstrument.symbol}
                      height={300}
                    />
                  )}
                </div>
                
                {/* Volume Chart below - only show for line chart (candles have built-in volume) */}
                {chartType === "line" && (
                  <div className="h-[60px] mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={candleData}>
                        <XAxis dataKey="time" tick={false} axisLine={false} />
                        <YAxis hide />
                        <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
                          {candleData.map((entry, index) => (
                            <Cell 
                              key={`vol-${index}`}
                              fill={entry.isUp ? "var(--pnl-positive)" : "var(--pnl-negative)"}
                              opacity={0.5}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                {/* Trades Section - Below Chart */}
                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant={tradesTab === "market" ? "secondary" : "ghost"} 
                        size="sm" 
                        className="h-7 px-3 text-xs"
                        onClick={() => setTradesTab("market")}
                      >
                        Market Trades
                      </Button>
                      <Button 
                        variant={tradesTab === "own" ? "secondary" : "ghost"} 
                        size="sm" 
                        className="h-7 px-3 text-xs"
                        onClick={() => setTradesTab("own")}
                      >
                        Own Trades
                        {ownTrades.length > 0 && (
                          <Badge variant="outline" className="ml-1.5 h-4 px-1 text-[10px]">
                            {ownTrades.length}
                          </Badge>
                        )}
                      </Button>
                    </div>
                    <span className="text-[10px] text-muted-foreground">UTC</span>
                  </div>
                  
                  <div className="space-y-0.5 max-h-[120px] overflow-y-auto" suppressHydrationWarning>
                    {!isClient ? (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        Loading trades...
                      </div>
                    ) : tradesTab === "market" ? (
                      recentTrades.map((trade, i) => (
                        <div
                          key={trade.id}
                          className={cn(
                            "flex items-center justify-between py-1 text-xs font-mono transition-all duration-300",
                            i === 0 && "bg-muted/30 -mx-2 px-2 rounded"
                          )}
                          suppressHydrationWarning
                        >
                          <span className="text-muted-foreground w-16" suppressHydrationWarning>{trade.time}</span>
                          <span className={cn(
                            "w-24 text-right",
                            trade.side === "buy" ? "text-emerald-400" : "text-rose-400"
                          )} suppressHydrationWarning>
                            {trade.price.toFixed(2)}
                          </span>
                          <span className="w-16 text-right text-muted-foreground" suppressHydrationWarning>
                            {trade.size.toFixed(4)}
                          </span>
                        </div>
                      ))
                    ) : ownTrades.length > 0 ? (
                      ownTrades.map((trade, i) => (
                        <div
                          key={trade.id}
                          className={cn(
                            "flex items-center justify-between py-1 text-xs font-mono",
                            i === 0 && "bg-primary/10 -mx-2 px-2 rounded"
                          )}
                          suppressHydrationWarning
                        >
                          <span className="text-muted-foreground w-16" suppressHydrationWarning>{trade.time}</span>
                          <span className={cn(
                            "w-24 text-right font-medium",
                            trade.side === "buy" ? "text-emerald-400" : "text-rose-400"
                          )} suppressHydrationWarning>
                            {trade.price.toFixed(2)}
                          </span>
                          <span className="w-16 text-right" suppressHydrationWarning>{trade.size.toFixed(4)}</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "h-4 px-1 text-[9px]",
                              trade.status === "filled" && "text-emerald-400 border-emerald-400/30"
                            )}
                          >
                            {trade.status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        No trades yet. Place an order to see your fills here.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Order Entry + Recent Trades */}
          <div className="col-span-1 space-y-4">
            {/* Order Entry */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Order Entry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Buy/Sell Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={orderSide === "buy" ? "default" : "outline"}
                    className={cn(
                      "w-full",
                      orderSide === "buy" && "bg-emerald-600 hover:bg-emerald-700"
                    )}
                    onClick={() => setOrderSide("buy")}
                  >
                    <TrendingUp className="size-4 mr-2" />
                    Buy
                  </Button>
                  <Button
                    variant={orderSide === "sell" ? "default" : "outline"}
                    className={cn(
                      "w-full",
                      orderSide === "sell" && "bg-rose-600 hover:bg-rose-700"
                    )}
                    onClick={() => setOrderSide("sell")}
                  >
                    <TrendingDown className="size-4 mr-2" />
                    Sell
                  </Button>
                </div>
                
                {/* Order Type */}
                <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "limit" | "market")}>
                  <TabsList className="w-full">
                    <TabsTrigger value="limit" className="flex-1">Limit</TabsTrigger>
                    <TabsTrigger value="market" className="flex-1">Market</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {/* Price Input (Limit only) */}
                {orderType === "limit" && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Price (USD)</label>
                    <Input
                      type="number"
                      placeholder={livePrice.toFixed(2)}
                      value={orderPrice}
                      onChange={(e) => setOrderPrice(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                )}
                
                {/* Size Input */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Size ({selectedInstrument.symbol.split("/")[0]})</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={orderSize}
                    onChange={(e) => setOrderSize(e.target.value)}
                    className="font-mono"
                  />
                  <div className="flex items-center gap-1">
                    {[25, 50, 75, 100].map((pct) => (
                      <Button
                        key={pct}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] flex-1"
                        onClick={() => setOrderSize((0.01 * pct).toFixed(4))}
                      >
                        {pct}%
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Total */}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-mono font-medium">
                      ${orderTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                
                {/* Submit Button */}
                <Button
                  className={cn(
                    "w-full",
                    orderSide === "buy" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  )}
                  disabled={!orderSize || !isContextComplete}
                  onClick={handleSubmitOrder}
                >
                  {orderSide === "buy" ? "Buy" : "Sell"} {selectedInstrument.symbol.split("/")[0]}
                </Button>
                
                {!isContextComplete && (
                  <p className="text-[10px] text-amber-500 text-center">
                    Select Organization, Client, and Account to trade
                  </p>
                )}
                
                {/* Strategy Link */}
                {filteredStrategies.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <label className="text-xs text-muted-foreground">Link to Strategy</label>
                    <Select>
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue placeholder="Manual trade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual trade</SelectItem>
                        {filteredStrategies.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
            
          </div>
        </div>
      </main>
    </div>
  )
}
