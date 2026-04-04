"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Download, GitBranch, RefreshCw, Shield, User } from "lucide-react";
import { configChanges } from "./audit-dashboard-data";

export function ChangesPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Configuration Changes</h1>
          <p className="text-xs text-muted-foreground">System and strategy configuration history</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          {configChanges.map((change) => (
            <div
              key={change.id}
              className="flex items-start gap-4 pb-4 border-b border-border/50 last:border-0 last:pb-0"
            >
              <div className="p-2 rounded bg-amber-400/10">
                <GitBranch className="h-4 w-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{change.id}</span>
                  <Badge variant="outline" className="text-[9px]">
                    {change.category}
                  </Badge>
                </div>
                <p className="text-sm mt-1">{change.change}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{change.user}</span>
                  <span>·</span>
                  <Clock className="h-3 w-3" />
                  <span>{change.timestamp}</span>
                  {change.approved && (
                    <>
                      <span>·</span>
                      <CheckCircle className="h-3 w-3 text-positive" />
                      <span className="text-positive">Approved</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
