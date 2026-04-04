"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { services } from "./devops-data";

export function LogsPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Logs</h1>
          <p className="text-xs text-muted-foreground">Service and system logs</p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[160px] h-8">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map((s) => (
                <SelectItem key={s.name} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select defaultValue="info">
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="font-mono text-xs bg-muted/30 p-4 h-[500px] overflow-auto">
            <div className="text-muted-foreground">
              [2024-01-15 14:32:15] [INFO] [execution-service] Order executed: BUY 0.5 BTC @ 43245
            </div>
            <div className="text-muted-foreground">
              [2024-01-15 14:32:14] [INFO] [risk-service] Position updated for btc-basis-v3
            </div>
            <div className="text-warning">[2024-01-15 14:32:12] [WARN] [ml-inference] High latency detected: 145ms</div>
            <div className="text-muted-foreground">
              [2024-01-15 14:32:10] [INFO] [market-data-api] Tick received: BTC-USD 43245
            </div>
            <div className="text-destructive">
              [2024-01-15 14:32:08] [ERROR] [position-monitor] Failed to connect to database
            </div>
            <div className="text-muted-foreground">
              [2024-01-15 14:32:05] [INFO] [alerting-service] Alert triggered: margin_utilization_high
            </div>
            <div className="text-muted-foreground">
              [2024-01-15 14:32:02] [DEBUG] [strategy-service] Processing signal for eth-staked
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
