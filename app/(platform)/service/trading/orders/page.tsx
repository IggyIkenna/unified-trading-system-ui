import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown } from "lucide-react"

export default function OrdersPage() {
  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <ArrowUpDown className="size-5 text-emerald-400" />
        <h1 className="text-xl font-semibold">Orders</h1>
        <Badge variant="outline" className="text-xs">Coming Soon</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Order Management</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Live and historical order book across all venues and strategies — open orders, filled orders, cancelled orders, partial fills.</p>
          <p>Will display: order blotter with real-time status updates, order routing details, fill analysis, order modification history, algo execution progress.</p>
        </CardContent>
      </Card>
    </main>
  )
}
