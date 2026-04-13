"use client";

/**
 * Wraps all widget data providers so cross-tab widgets have access to
 * their required context regardless of which tab is active.
 *
 * Providers that accept only `children` (self-contained data fetching) are
 * included here. Providers that require a `value` prop (Overview, Terminal,
 * Risk) are NOT included — their widgets will show a friendly placeholder
 * via WidgetContextGuard when used on other tabs.
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
// when added to other tabs.

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
