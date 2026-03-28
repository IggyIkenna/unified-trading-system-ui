"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { features } from "./quant-data";

export function FeaturesPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Feature Store</h1>
          <p className="text-xs text-muted-foreground">Feature catalog and freshness monitoring</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Feature</th>
                <th className="px-4 py-3 text-center font-medium">Category</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Freshness</th>
                <th className="px-4 py-3 text-right font-medium">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => (
                <tr key={feature.name} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{feature.name}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[10px]">
                      {feature.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {feature.status === "live" ? (
                      <CheckCircle className="h-4 w-4 text-positive inline" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning inline" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{feature.freshness}</td>
                  <td className="px-4 py-3 text-right font-mono">{feature.coverage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
