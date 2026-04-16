"use client";

/**
 * Wraps all widget data providers so cross-tab widgets have access to
 * their required context regardless of which tab is active.
 *
 * Providers that accept only `children` (self-contained data fetching) are
 * included here. Providers that require a `value` prop (Overview, Terminal,
 * Risk) are NOT included — their widgets will show a friendly placeholder
 * via WidgetContextGuard when used on other tabs.
 *
 * TODO(BP-7): When the real API/WebSocket wiring lands, make these three
 * providers self-fetching with lazy activation (only run hooks when a widget
 * from that domain is actually mounted). The hooks are already extracted:
 *   - useRiskPageData     (components/widgets/risk/use-risk-page-data.ts)
 *   - useTerminalPageData (components/widgets/terminal/use-terminal-page-data.ts)
 *   - useOverviewPageData (components/widgets/overview/use-overview-page-data.ts)
 * See docs/audits/BP2-cross-tab-providers.md for full rationale.
 */

import * as React from "react";
import { AccountsDataProvider } from "./accounts/accounts-data-context";
import { AlertsDataProvider } from "./alerts/alerts-data-context";
import { BookTradeDataProvider } from "./book/book-data-context";
import { BundlesDataProvider } from "./bundles/bundles-data-context";
import { DeFiDataProvider } from "./defi/defi-data-context";
import { InstructionsDataProvider } from "./instructions/instructions-data-context";
import { MarketsDataProvider } from "./markets/markets-data-context";
import { OptionsDataProvider } from "./options/options-data-context";
import { OrdersDataProvider } from "./orders/orders-data-context";
import { PnLDataProvider } from "./pnl/pnl-data-context";
import { PositionsDataProvider } from "./positions/positions-data-context";
import { PredictionsDataProvider } from "./predictions/predictions-data-context";
import { SportsDataProvider } from "./sports/sports-data-context";
import { StrategiesDataProvider } from "./strategies/strategies-data-context";

// NOTE: OverviewDataProvider, TerminalDataProvider, and RiskDataProvider
// require a `value` prop and are mounted by their respective page components.
// Widgets from those categories will show a WidgetContextGuard placeholder
// when added to other tabs. Hooks have been extracted for future lazy
// integration — see TODO above.

export function AllWidgetProviders({ children }: { children: React.ReactNode }) {
  return (
    <PositionsDataProvider>
      <OrdersDataProvider>
        <AlertsDataProvider>
          <StrategiesDataProvider>
            <SportsDataProvider>
              <InstructionsDataProvider>
                <PnLDataProvider>
                  <MarketsDataProvider>
                    <DeFiDataProvider>
                      <PredictionsDataProvider>
                        <BookTradeDataProvider>
                          <BundlesDataProvider>
                            <AccountsDataProvider>
                              <OptionsDataProvider>{children}</OptionsDataProvider>
                            </AccountsDataProvider>
                          </BundlesDataProvider>
                        </BookTradeDataProvider>
                      </PredictionsDataProvider>
                    </DeFiDataProvider>
                  </MarketsDataProvider>
                </PnLDataProvider>
              </InstructionsDataProvider>
            </SportsDataProvider>
          </StrategiesDataProvider>
        </AlertsDataProvider>
      </OrdersDataProvider>
    </PositionsDataProvider>
  );
}
