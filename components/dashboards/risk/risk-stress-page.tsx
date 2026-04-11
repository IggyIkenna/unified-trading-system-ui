"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { stressScenarios } from "./risk-data";
import { formatCurrency } from "./risk-utils";

export function StressTestsPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Stress Tests</h1>
          <p className="text-xs text-muted-foreground">Portfolio impact under various stress scenarios</p>
        </div>
        <Button size="sm">
          <Zap className="h-3.5 w-3.5 mr-1.5" />
          Run All Tests
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Scenario</th>
                <th className="px-4 py-3 text-right font-medium">P&L Impact</th>
                <th className="px-4 py-3 text-right font-medium">Drawdown</th>
                <th className="px-4 py-3 text-center font-medium">Probability</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {stressScenarios.map((scenario) => (
                <tr key={scenario.scenario} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{scenario.scenario}</td>
                  <td className="px-4 py-3 text-right font-mono text-negative">{formatCurrency(scenario.impact)}</td>
                  <td className="px-4 py-3 text-right font-mono text-negative">-{scenario.portfolioDrawdown}%</td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        scenario.probability === "Very Low" && "border-positive/50 text-positive",
                        scenario.probability === "Low" && "border-muted-foreground",
                        scenario.probability === "Medium" && "border-warning/50 text-warning",
                      )}
                    >
                      {scenario.probability}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {scenario.status === "pass" ? (
                      <CheckCircle className="h-4 w-4 text-positive inline" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning inline" />
                    )}
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
