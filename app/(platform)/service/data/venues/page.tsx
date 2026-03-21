import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity } from "lucide-react"

export default function VenueHealthPage() {
  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Activity className="size-5 text-emerald-400" />
        <h1 className="text-xl font-semibold">Venue Health</h1>
        <Badge variant="outline" className="text-xs">Coming Soon</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Venue Connectivity Health</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Real-time health monitoring for all connected venues — API latency, rate limit usage, websocket connection status, error rates.</p>
          <p>Will display: per-venue health cards with latency P50/P99, uptime %, reconnection history, rate limit headroom, circuit breaker status.</p>
        </CardContent>
      </Card>
    </main>
  )
}
