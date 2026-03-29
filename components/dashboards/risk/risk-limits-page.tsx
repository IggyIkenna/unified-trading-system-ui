"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { riskLimits } from "./risk-data";
import { formatCurrency } from "./risk-utils";
import { formatPercent } from "@/lib/utils/formatters";

export function LimitsPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Risk Limits</h1>
          <p className="text-xs text-muted-foreground">Limit configuration and monitoring</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-6">
            {riskLimits.map((limit) => {
              const utilization =
                limit.unit === "%" || limit.unit === "x"
                  ? (limit.current / limit.limit) * 100
                  : (limit.current / limit.limit) * 100;
              return (
                <div key={limit.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{limit.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono">
                        {limit.unit === "$" ? formatCurrency(limit.current) : `${limit.current}${limit.unit || ""}`}
                        {" / "}
                        {limit.unit === "$" ? formatCurrency(limit.limit) : `${limit.limit}${limit.unit || ""}`}
                      </span>
                      <span className={cn("text-sm", utilization > 80 ? "text-warning" : "text-muted-foreground")}>
                        ({formatPercent(utilization, 0)})
                      </span>
                      {limit.status === "ok" ? (
                        <CheckCircle className="h-4 w-4 text-positive" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </div>
                  <Progress
                    value={utilization}
                    className={cn(
                      "h-2",
                      utilization > 80 && "[&>div]:bg-warning",
                      utilization > 95 && "[&>div]:bg-destructive",
                    )}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
