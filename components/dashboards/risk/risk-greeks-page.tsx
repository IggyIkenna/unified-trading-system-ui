"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { greeksData } from "./risk-data";
import { formatCurrency } from "./risk-utils";

export function GreeksPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Portfolio Greeks</h1>
          <p className="text-xs text-muted-foreground">Detailed Greek analysis by asset and strategy</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export
        </Button>
      </div>

      {/* Portfolio Level Greeks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {[
              {
                label: "Delta (Δ)",
                value: greeksData.portfolio.delta,
                description: "Directional exposure",
              },
              {
                label: "Gamma (Γ)",
                value: greeksData.portfolio.gamma,
                description: "Delta sensitivity",
              },
              {
                label: "Vega (ν)",
                value: greeksData.portfolio.vega,
                description: "Volatility exposure",
              },
              {
                label: "Theta (Θ)",
                value: greeksData.portfolio.theta,
                description: "Time decay",
              },
              {
                label: "Rho (ρ)",
                value: greeksData.portfolio.rho,
                description: "Rate sensitivity",
              },
            ].map((greek) => (
              <div key={greek.label} className="p-4 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">{greek.label}</div>
                <div className={cn("text-xl font-bold mt-1", greek.value < 0 ? "text-negative" : "")}>
                  {formatCurrency(greek.value)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{greek.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Greeks by Asset */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Greeks by Asset</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Asset</th>
                <th className="px-4 py-2 text-right font-medium">Delta (Δ)</th>
                <th className="px-4 py-2 text-right font-medium">Gamma (Γ)</th>
                <th className="px-4 py-2 text-right font-medium">Vega (ν)</th>
                <th className="px-4 py-2 text-right font-medium">Theta (Θ)</th>
                <th className="px-4 py-2 text-right font-medium">Rho (ρ)</th>
              </tr>
            </thead>
            <tbody>
              {greeksData.byAsset.map((row) => (
                <tr key={row.asset} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{row.asset}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(row.delta)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(row.gamma)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(row.vega)}</td>
                  <td className="px-4 py-3 text-right font-mono text-negative">{formatCurrency(row.theta)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(row.rho)}</td>
                </tr>
              ))}
              <tr className="bg-muted/50 font-medium">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(greeksData.portfolio.delta)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(greeksData.portfolio.gamma)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(greeksData.portfolio.vega)}</td>
                <td className="px-4 py-3 text-right font-mono text-negative">
                  {formatCurrency(greeksData.portfolio.theta)}
                </td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(greeksData.portfolio.rho)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
