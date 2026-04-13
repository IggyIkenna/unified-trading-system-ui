"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { limitBreaches } from "./risk-data";

export function BreachesPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Limit Breaches</h1>
          <p className="text-xs text-muted-foreground">Active and historical limit breaches</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({limitBreaches.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          <div className="space-y-3">
            {limitBreaches.map((breach) => (
              <Card key={breach.id} className={breach.severity === "high" ? "border-destructive/30" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          breach.severity === "high"
                            ? "bg-destructive/10"
                            : breach.severity === "medium"
                              ? "bg-warning/10"
                              : "bg-muted",
                        )}
                      >
                        <AlertTriangle
                          className={cn(
                            "h-4 w-4",
                            breach.severity === "high"
                              ? "text-destructive"
                              : breach.severity === "medium"
                                ? "text-warning"
                                : "text-muted-foreground",
                          )}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{breach.id}</span>
                          <span className="font-medium">{breach.type}</span>
                          <Badge
                            variant={
                              breach.severity === "high"
                                ? "destructive"
                                : breach.severity === "medium"
                                  ? "outline"
                                  : "secondary"
                            }
                            className="text-[9px]"
                          >
                            {breach.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{breach.strategy}</div>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span>
                            Current: <span className="text-destructive font-medium">{breach.breachValue}</span>
                          </span>
                          <span>
                            Limit: <span className="font-medium">{breach.limitValue}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={breach.status === "active" ? "destructive" : "outline"} className="text-[9px]">
                        {breach.status.toUpperCase()}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-2">{breach.time}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="resolved" className="mt-4">
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              No resolved breaches to display
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
