"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { varMetrics } from "./risk-data";
import { formatCurrency } from "./risk-utils";

export function VaRPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Value at Risk (VaR)</h1>
          <p className="text-xs text-muted-foreground">Portfolio VaR analysis and decomposition</p>
        </div>
        <Select defaultValue="historical">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="VaR Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="historical">Historical VaR</SelectItem>
            <SelectItem value="parametric">Parametric VaR</SelectItem>
            <SelectItem value="montecarlo">Monte Carlo VaR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">VaR (95%)</div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(varMetrics.percentile95)}</div>
            <div className="text-xs text-muted-foreground mt-1">1-day horizon</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">VaR (99%)</div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(varMetrics.percentile99)}</div>
            <div className="text-xs text-muted-foreground mt-1">1-day horizon</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">VaR Limit</div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(varMetrics.limit)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {((varMetrics.current / varMetrics.limit) * 100).toFixed(0)}% utilized
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Historical Max</div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(varMetrics.historicalMax)}</div>
            <div className="text-xs text-muted-foreground mt-1">Peak VaR</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">VaR by Asset Class</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            VaR decomposition chart placeholder
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
