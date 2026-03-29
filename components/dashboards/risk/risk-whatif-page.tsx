"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { varMetrics } from "./risk-data";
import { formatCurrency } from "./risk-utils";
import { formatPercent } from "@/lib/utils/formatters";

export function WhatIfPage() {
  const [btcMove, setBtcMove] = React.useState([0]);
  const [ethMove, setEthMove] = React.useState([0]);
  const [volMove, setVolMove] = React.useState([0]);

  const estimatedImpact = (btcMove[0] * 1200000 + ethMove[0] * 850000 + volMove[0] * 89000) / 100;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">What-If Analysis</h1>
          <p className="text-xs text-muted-foreground">Interactive scenario modeling</p>
        </div>
        <Button size="sm">
          <Calculator className="h-3.5 w-3.5 mr-1.5" />
          Calculate
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Scenario Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">BTC Price Move</label>
                <span className="text-sm font-mono">
                  {btcMove[0] > 0 ? "+" : ""}
                  {btcMove[0]}%
                </span>
              </div>
              <Slider value={btcMove} onValueChange={setBtcMove} min={-50} max={50} step={1} className="w-full" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">ETH Price Move</label>
                <span className="text-sm font-mono">
                  {ethMove[0] > 0 ? "+" : ""}
                  {ethMove[0]}%
                </span>
              </div>
              <Slider value={ethMove} onValueChange={setEthMove} min={-50} max={50} step={1} className="w-full" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Implied Vol Move</label>
                <span className="text-sm font-mono">
                  {volMove[0] > 0 ? "+" : ""}
                  {volMove[0]}%
                </span>
              </div>
              <Slider value={volMove} onValueChange={setVolMove} min={-50} max={100} step={5} className="w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Estimated Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">Portfolio P&L Impact</div>
                <div
                  className={cn("text-3xl font-bold mt-1", estimatedImpact >= 0 ? "text-positive" : "text-negative")}
                >
                  {estimatedImpact >= 0 ? "+" : ""}
                  {formatCurrency(estimatedImpact)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">New VaR (95%)</div>
                  <div className="text-lg font-bold mt-1">
                    {formatCurrency(varMetrics.percentile95 + Math.abs(estimatedImpact) * 0.1)}
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Drawdown Impact</div>
                  <div
                    className={cn("text-lg font-bold mt-1", estimatedImpact < 0 ? "text-negative" : "text-positive")}
                  >
                    {estimatedImpact >= 0 ? "+" : ""}
                    {formatPercent((estimatedImpact / 24500000) * 100, 2)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
