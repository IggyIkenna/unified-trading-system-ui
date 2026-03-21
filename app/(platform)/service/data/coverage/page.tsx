import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database } from "lucide-react"

export default function CoverageMatrixPage() {
  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Database className="size-5 text-sky-400" />
        <h1 className="text-xl font-semibold">Coverage Matrix</h1>
        <Badge variant="outline" className="text-xs">Coming Soon</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Data Coverage Matrix</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Instrument-by-venue coverage matrix showing data availability across all 5 asset classes (CeFi, DeFi, TradFi, Sports, Prediction Markets) and 100+ venues.</p>
          <p>Will display: coverage percentage per venue, data freshness heatmap, historical coverage trends, gap analysis by asset class.</p>
        </CardContent>
      </Card>
    </main>
  )
}
