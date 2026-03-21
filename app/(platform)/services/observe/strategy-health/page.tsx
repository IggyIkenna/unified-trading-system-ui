import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HeartPulse } from "lucide-react"

export default function StrategyHealthPage() {
  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <HeartPulse className="size-5 text-emerald-400" />
        <h1 className="text-xl font-semibold">Strategy Health</h1>
        <Badge variant="outline" className="text-xs">Coming Soon</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Strategy Health Monitor</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Continuous health monitoring for all live strategies — Sharpe ratio drift, drawdown tracking, execution quality degradation, model staleness.</p>
          <p>Will display: per-strategy health scorecard, rolling Sharpe/drawdown charts, signal decay indicators, backtest-vs-live drift alerts, auto-pause recommendations.</p>
        </CardContent>
      </Card>
    </main>
  )
}
