"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MarketsTab } from "@/components/trading/predictions/markets-tab";
import { PortfolioTab } from "@/components/trading/predictions/portfolio-tab";
import { OdumFocusTab } from "@/components/trading/predictions/odum-focus-tab";
import { ArbStreamTab } from "@/components/trading/predictions/arb-stream-tab";
import { TradeTab } from "@/components/trading/predictions/trade-tab";

export default function PredictionMarketsPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-lg font-semibold">Prediction Markets</h1>
        <p className="text-sm text-muted-foreground">
          Trade and monitor prediction markets across Polymarket, Kalshi, and sports bookmakers
        </p>
      </div>

      <Tabs defaultValue="markets" className="w-full">
        <TabsList className="h-9 text-xs">
          <TabsTrigger value="markets" className="text-xs">
            Markets
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="text-xs">
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="odum" className="text-xs">
            ODUM Focus
          </TabsTrigger>
          <TabsTrigger value="arb" className="text-xs">
            Arb Stream
          </TabsTrigger>
          <TabsTrigger value="trade" className="text-xs">
            Trade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="markets" className="mt-4">
          <MarketsTab />
        </TabsContent>
        <TabsContent value="portfolio" className="mt-4">
          <PortfolioTab />
        </TabsContent>
        <TabsContent value="odum" className="mt-4">
          <OdumFocusTab />
        </TabsContent>
        <TabsContent value="arb" className="mt-4">
          <ArbStreamTab />
        </TabsContent>
        <TabsContent value="trade" className="mt-4">
          <TradeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
