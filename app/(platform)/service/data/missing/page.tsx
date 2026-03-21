import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

export default function MissingDataPage() {
  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="size-5 text-amber-400" />
        <h1 className="text-xl font-semibold">Missing Data</h1>
        <Badge variant="outline" className="text-xs">Coming Soon</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Missing Data Tracker</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Real-time tracking of missing data points across all ETL pipelines — stale feeds, failed downloads, gap detection.</p>
          <p>Will display: missing data alerts by venue/instrument, gap duration timelines, auto-backfill status, SLA breach tracking.</p>
        </CardContent>
      </Card>
    </main>
  )
}
