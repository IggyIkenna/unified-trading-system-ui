import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Newspaper } from "lucide-react"

export default function NewsPage() {
  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Newspaper className="size-5 text-cyan-400" />
        <h1 className="text-xl font-semibold">News</h1>
        <Badge variant="outline" className="text-xs">Coming Soon</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Market News & Events</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Aggregated news feed filtered by relevance to active strategies and positions — crypto, macro, sports events, regulatory announcements.</p>
          <p>Will display: real-time news stream with sentiment scoring, event impact alerts, correlation to portfolio exposure, scheduled event calendar.</p>
        </CardContent>
      </Card>
    </main>
  )
}
