"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDownRight, ArrowUpRight, Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { tradeHistory } from "./audit-dashboard-data";

export function TradesPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Trade History</h1>
          <p className="text-xs text-muted-foreground">Complete record of all executed trades</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Trade ID</th>
                <th className="px-4 py-2 text-left font-medium">Strategy</th>
                <th className="px-4 py-2 text-center font-medium">Side</th>
                <th className="px-4 py-2 text-left font-medium">Instrument</th>
                <th className="px-4 py-2 text-right font-medium">Qty</th>
                <th className="px-4 py-2 text-right font-medium">Price</th>
                <th className="px-4 py-2 text-center font-medium">Venue</th>
                <th className="px-4 py-2 text-right font-medium">P&L</th>
                <th className="px-4 py-2 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {tradeHistory.map((trade) => (
                <tr key={trade.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer">
                  <td className="px-4 py-3 font-mono">{trade.id}</td>
                  <td className="px-4 py-3">{trade.strategy}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={
                        trade.side === "BUY" || trade.side === "SUPPLY" || trade.side === "BET"
                          ? "default"
                          : "secondary"
                      }
                      className="text-[9px]"
                    >
                      {trade.side}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{trade.instrument}</td>
                  <td className="px-4 py-3 text-right font-mono">{trade.qty}</td>
                  <td className="px-4 py-3 text-right font-mono">{trade.price}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[9px]">
                      {trade.venue}
                    </Badge>
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-mono",
                      trade.pnl.startsWith("+") ? "text-positive" : trade.pnl.startsWith("-") ? "text-negative" : "",
                    )}
                  >
                    {trade.pnl}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{trade.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
