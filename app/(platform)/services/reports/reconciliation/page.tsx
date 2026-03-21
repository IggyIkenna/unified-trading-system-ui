import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Scale } from "lucide-react"

export default function ReconciliationPage() {
  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Scale className="size-5 text-amber-400" />
        <h1 className="text-xl font-semibold">Reconciliation</h1>
        <Badge variant="outline" className="text-xs">Coming Soon</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Position & P&L Reconciliation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Automated reconciliation between internal position/P&L records and venue-reported data — position breaks, P&L discrepancies, fee mismatches.</p>
          <p>Will display: reconciliation dashboard with break counts by venue, auto-resolution status, manual review queue, historical break trends.</p>
        </CardContent>
      </Card>
    </main>
  )
}
