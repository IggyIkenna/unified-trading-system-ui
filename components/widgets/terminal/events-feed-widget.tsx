"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";

type EventSeverity = "INFO" | "WARNING" | "CRITICAL";
type EventDomain = "EXECUTION" | "RISK" | "DATA" | "SYSTEM" | "STRATEGY";

interface EventEntry {
  id: string;
  timestamp: string;
  domain: EventDomain;
  severity: EventSeverity;
  title: string;
  detail: string;
}

const MOCK_EVENTS: EventEntry[] = [
  { id: "evt-1", timestamp: "14:32:08", domain: "EXECUTION", severity: "INFO", title: "Order Filled", detail: "BTC/USDT LONG 0.5 @ 68,420 on Binance" },
  { id: "evt-2", timestamp: "14:31:45", domain: "RISK", severity: "WARNING", title: "Margin Utilisation High", detail: "Account SL2 at 78.4% margin — threshold 80%" },
  { id: "evt-3", timestamp: "14:30:12", domain: "STRATEGY", severity: "INFO", title: "Signal Generated", detail: "HUF-MOMENTUM-BTC entered LONG bias (score 0.82)" },
  { id: "evt-4", timestamp: "14:29:58", domain: "DATA", severity: "INFO", title: "Market Data Refresh", detail: "MTDS tick batch 2026-04-15T14:29 — 425 venues OK" },
  { id: "evt-5", timestamp: "14:28:30", domain: "SYSTEM", severity: "CRITICAL", title: "Health Check Failed", detail: "features-onchain-service /healthz returned 503 — 2 retries" },
  { id: "evt-6", timestamp: "14:27:15", domain: "EXECUTION", severity: "INFO", title: "Flash Loan Executed", detail: "Aave V3 ETH 50.0 — arb profit $342 (0.18%)" },
  { id: "evt-7", timestamp: "14:26:40", domain: "RISK", severity: "WARNING", title: "Liquidation Proximity", detail: "AAVE ETH-USDC HF 1.12 — monitor threshold 1.15" },
  { id: "evt-8", timestamp: "14:25:02", domain: "STRATEGY", severity: "INFO", title: "Regime Shift", detail: "Commodity regime: Mean-Reverting -> Trending (WTI driver)" },
  { id: "evt-9", timestamp: "14:24:18", domain: "DATA", severity: "INFO", title: "Instruments Refreshed", detail: "instruments-service batch — 12,482 active instruments" },
  { id: "evt-10", timestamp: "14:23:05", domain: "EXECUTION", severity: "INFO", title: "LP Rebalance", detail: "Uniswap V3 ETH/USDC range adjusted: 3,600-4,100" },
];

function severityBadgeVariant(s: EventSeverity): "secondary" | "warning" | "error" {
  if (s === "CRITICAL") return "error";
  if (s === "WARNING") return "warning";
  return "secondary";
}

function domainColor(d: EventDomain): string {
  switch (d) {
    case "EXECUTION": return "text-blue-400";
    case "RISK": return "text-amber-400";
    case "DATA": return "text-cyan-400";
    case "SYSTEM": return "text-red-400";
    case "STRATEGY": return "text-emerald-400";
  }
}

export function EventsFeedWidget(_props: WidgetComponentProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Events Feed</CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            {MOCK_EVENTS.length} events
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1 overflow-auto max-h-[500px]">
          {MOCK_EVENTS.map((evt) => (
            <div
              key={evt.id}
              className="flex items-start gap-2 rounded-sm border border-border/40 bg-muted/10 px-2 py-1.5"
            >
              <div className="text-[10px] font-mono text-muted-foreground whitespace-nowrap pt-0.5">{evt.timestamp}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-medium uppercase ${domainColor(evt.domain)}`}>{evt.domain}</span>
                  <Badge variant={severityBadgeVariant(evt.severity)} className="text-[9px] px-1 py-0">
                    {evt.severity}
                  </Badge>
                  <span className="text-xs font-medium truncate">{evt.title}</span>
                </div>
                <div className="text-[10px] text-muted-foreground truncate">{evt.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
