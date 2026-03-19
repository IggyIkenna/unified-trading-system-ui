"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LineChart,
  Search,
  Plus,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Cpu,
  Sparkles,
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Filter,
  Download,
  Settings2,
} from "lucide-react"

// Mock backtests
const mockBacktests = [
  {
    id: "bt_1",
    name: "BTC Momentum v3",
    asset: "Crypto CeFi",
    status: "completed",
    sharpe: 2.34,
    returns: 47.2,
    drawdown: -12.4,
    trades: 342,
    created: "2 hours ago",
    duration: "4m 23s",
  },
  {
    id: "bt_2",
    name: "DeFi Basis Carry",
    asset: "DeFi",
    status: "running",
    sharpe: null,
    returns: null,
    drawdown: null,
    trades: null,
    created: "5 min ago",
    progress: 67,
  },
  {
    id: "bt_3",
    name: "NFL Value Betting",
    asset: "Sports",
    status: "completed",
    sharpe: 1.87,
    returns: 23.1,
    drawdown: -8.2,
    trades: 156,
    created: "Yesterday",
    duration: "2m 12s",
  },
  {
    id: "bt_4",
    name: "ETH Options Vol Surface",
    asset: "Crypto CeFi",
    status: "failed",
    sharpe: null,
    returns: null,
    drawdown: null,
    trades: null,
    created: "Yesterday",
    error: "Insufficient data for date range",
  },
  {
    id: "bt_5",
    name: "CME Futures Mean Revert",
    asset: "TradFi",
    status: "completed",
    sharpe: 1.52,
    returns: 18.7,
    drawdown: -6.3,
    trades: 89,
    created: "3 days ago",
    duration: "1m 45s",
  },
]

// Strategy templates
const strategyTemplates = [
  { id: "momentum", name: "Momentum", description: "Trend-following across timeframes", assets: ["TradFi", "Crypto", "Sports"] },
  { id: "mean-revert", name: "Mean Reversion", description: "Fade extremes, collect spread", assets: ["TradFi", "Crypto"] },
  { id: "arbitrage", name: "Arbitrage", description: "Cross-venue price discrepancies", assets: ["Crypto", "Sports"] },
  { id: "basis", name: "Basis Trade", description: "Long spot, short perp", assets: ["Crypto", "DeFi"] },
  { id: "volatility", name: "Volatility", description: "Vol surface strategies", assets: ["TradFi", "Crypto"] },
  { id: "kelly", name: "Kelly Criterion", description: "Optimal position sizing", assets: ["Sports"] },
]

// AI chat messages
const mockChatHistory = [
  { role: "assistant", content: "Hi! I can help you design and configure backtests. What strategy would you like to explore?" },
]

export default function BacktestingPage() {
  const [chatInput, setChatInput] = React.useState("")
  const [chatMessages, setChatMessages] = React.useState(mockChatHistory)
  const [isTyping, setIsTyping] = React.useState(false)

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return
    
    const userMessage = { role: "user", content: chatInput }
    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setIsTyping(true)

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    const aiResponse = {
      role: "assistant",
      content: `I'll help you create a backtest for that. Based on your description, I recommend using a ${
        chatInput.toLowerCase().includes("btc") ? "BTC Momentum" : "Mean Reversion"
      } strategy. Would you like me to configure the parameters, or do you want to customize them?`,
    }
    setChatMessages((prev) => [...prev, aiResponse])
    setIsTyping(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center gap-4 px-4 md:px-6">
          <Link href="/portal/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-400/10">
              <LineChart className="size-4 text-violet-400" />
            </div>
            <span className="font-semibold">Backtesting</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings2 className="mr-2 size-4" />
              Settings
            </Button>
            <Button size="sm">
              <Plus className="mr-2 size-4" />
              New Backtest
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 md:px-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Backtests</span>
                <Activity className="size-4 text-violet-400" />
              </div>
              <div className="mt-2 text-2xl font-bold">47</div>
              <div className="mt-1 text-xs text-muted-foreground">12 this month</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Sharpe</span>
                <TrendingUp className="size-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold">1.87</div>
              <div className="mt-1 text-xs text-muted-foreground">Across all strategies</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Compute Used</span>
                <Cpu className="size-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-bold">23.4h</div>
              <Progress value={47} className="mt-2 h-1" />
              <div className="mt-1 text-xs text-muted-foreground">of 50h monthly limit</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Running</span>
                <Loader2 className="size-4 text-sky-400 animate-spin" />
              </div>
              <div className="mt-2 text-2xl font-bold">1</div>
              <div className="mt-1 text-xs text-muted-foreground">DeFi Basis Carry (67%)</div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Backtests List */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="all">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="running">Running</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-9 w-48" />
                  </div>
                </div>
              </div>

              <TabsContent value="all" className="mt-0">
                <Card>
                  <CardContent className="pt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Asset</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Sharpe</TableHead>
                          <TableHead className="text-right">Return</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockBacktests.map((bt) => (
                          <TableRow key={bt.id}>
                            <TableCell>
                              <div className="font-medium">{bt.name}</div>
                              <div className="text-xs text-muted-foreground">{bt.created}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{bt.asset}</Badge>
                            </TableCell>
                            <TableCell>
                              {bt.status === "completed" && (
                                <div className="flex items-center gap-1.5 text-emerald-500">
                                  <CheckCircle2 className="size-4" />
                                  <span className="text-xs">Completed</span>
                                </div>
                              )}
                              {bt.status === "running" && (
                                <div className="flex items-center gap-1.5 text-sky-500">
                                  <Loader2 className="size-4 animate-spin" />
                                  <span className="text-xs">{bt.progress}%</span>
                                </div>
                              )}
                              {bt.status === "failed" && (
                                <div className="flex items-center gap-1.5 text-destructive">
                                  <XCircle className="size-4" />
                                  <span className="text-xs">Failed</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {bt.sharpe != null ? bt.sharpe.toFixed(2) : "-"}
                            </TableCell>
                            <TableCell className={cn(
                              "text-right font-mono",
                              bt.returns != null && bt.returns > 0 && "text-emerald-500",
                              bt.returns != null && bt.returns < 0 && "text-rose-500"
                            )}>
                              {bt.returns != null ? `${bt.returns > 0 ? "+" : ""}${bt.returns}%` : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {bt.status === "completed" && (
                                  <>
                                    <Button variant="ghost" size="icon" className="size-8">
                                      <Download className="size-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="size-8">
                                      <RotateCcw className="size-4" />
                                    </Button>
                                  </>
                                )}
                                {bt.status === "running" && (
                                  <Button variant="ghost" size="icon" className="size-8">
                                    <Pause className="size-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* AI Assistant */}
          <div className="lg:col-span-1">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                    <Sparkles className="size-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">AI Strategy Assistant</CardTitle>
                    <CardDescription className="text-xs">Describe your strategy in natural language</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-4 space-y-4">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" && "flex-row-reverse"
                    )}
                  >
                    <div className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      msg.role === "assistant" ? "bg-violet-500/10" : "bg-primary"
                    )}>
                      {msg.role === "assistant" ? (
                        <Sparkles className="size-4 text-violet-500" />
                      ) : (
                        <span className="text-xs text-primary-foreground">You</span>
                      )}
                    </div>
                    <div className={cn(
                      "rounded-lg px-3 py-2 text-sm max-w-[80%]",
                      msg.role === "assistant" ? "bg-muted" : "bg-primary text-primary-foreground"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                      <Sparkles className="size-4 text-violet-500" />
                    </div>
                    <div className="rounded-lg px-3 py-2 text-sm bg-muted">
                      <Loader2 className="size-4 animate-spin" />
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Describe a strategy..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button size="icon" onClick={handleSendMessage}>
                    <Send className="size-4" />
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {["BTC momentum", "DeFi yield", "Sports arb"].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs h-6"
                      onClick={() => setChatInput(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Strategy Templates */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Strategy Templates</h2>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {strategyTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:border-violet-400/50 transition-colors">
                <CardContent className="pt-4 pb-4">
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.assets.map((asset) => (
                      <Badge key={asset} variant="secondary" className="text-[10px]">{asset}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
