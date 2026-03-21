import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield } from "lucide-react"

export default function RegulatoryPage() {
  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Shield className="size-5 text-rose-400" />
        <h1 className="text-xl font-semibold">Regulatory</h1>
        <Badge variant="outline" className="text-xs">Coming Soon</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Regulatory Reports</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Regulatory reporting and compliance — FCA reports, transaction reporting, best execution analysis, suspicious activity monitoring.</p>
          <p>Will display: report generation dashboard, compliance calendar, EMIR/MiFID II submission status, best execution metrics, SAR tracking.</p>
        </CardContent>
      </Card>
    </main>
  )
}
