import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"

export default function ETLLogsPage() {
  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <FileText className="size-5 text-slate-400" />
        <h1 className="text-xl font-semibold">ETL Logs</h1>
        <Badge variant="outline" className="text-xs">Coming Soon</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">ETL Pipeline Logs</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Structured log viewer for all data acquisition and ETL pipeline runs — download jobs, transformation steps, validation results.</p>
          <p>Will display: filterable log stream, pipeline run timeline, success/failure rates by job type, data quality validation results.</p>
        </CardContent>
      </Card>
    </main>
  )
}
