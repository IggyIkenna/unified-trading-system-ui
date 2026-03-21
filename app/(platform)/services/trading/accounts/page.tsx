import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet } from "lucide-react"

export default function AccountsPage() {
  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Wallet className="size-5 text-violet-400" />
        <h1 className="text-xl font-semibold">Accounts</h1>
        <Badge variant="outline" className="text-xs">Coming Soon</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Account Management</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Trading account overview across all venues — balances, margin utilization, API key status, withdrawal/deposit history.</p>
          <p>Will display: per-venue account cards with available balance, margin used/available, API key health, account-strategy assignment matrix.</p>
        </CardContent>
      </Card>
    </main>
  )
}
