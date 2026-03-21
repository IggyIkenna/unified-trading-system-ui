import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Receipt } from "lucide-react"

export default function SettlementPage() {
  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Receipt className="size-5 text-slate-400" />
        <h1 className="text-xl font-semibold">Settlement</h1>
        <Badge variant="outline" className="text-xs">Coming Soon</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Settlement Reports</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Trade settlement tracking and reporting — T+0/T+1/T+2 settlement status, failed settlements, margin settlements, funding payments.</p>
          <p>Will display: settlement dashboard by venue, pending vs completed settlements, settlement breaks, fee reconciliation, funding rate history.</p>
        </CardContent>
      </Card>
    </main>
  )
}
