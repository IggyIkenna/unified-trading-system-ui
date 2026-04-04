"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { executionAlpha } from "./quant-data";

export function ResultsPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Execution Alpha</h1>
          <p className="text-xs text-muted-foreground">Signal vs execution performance analysis</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Strategy</th>
                <th className="px-4 py-3 text-right font-medium">Trades</th>
                <th className="px-4 py-3 text-right font-medium">Signal P&L</th>
                <th className="px-4 py-3 text-right font-medium">Executed P&L</th>
                <th className="px-4 py-3 text-right font-medium">Slippage</th>
                <th className="px-4 py-3 text-right font-medium">Exec Alpha</th>
              </tr>
            </thead>
            <tbody>
              {executionAlpha.map((row) => (
                <tr key={row.strategy} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{row.strategy}</td>
                  <td className="px-4 py-3 text-right font-mono">{row.trades.toLocaleString()}</td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-mono",
                      row.signal.startsWith("+") ? "text-positive" : "text-negative",
                    )}
                  >
                    {row.signal}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-mono",
                      row.executed.startsWith("+") ? "text-positive" : "text-negative",
                    )}
                  >
                    {row.executed}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-negative">{row.slippage}</td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-mono font-medium",
                      row.alpha.startsWith("+") ? "text-positive" : "text-negative",
                    )}
                  >
                    {row.alpha}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
