"use client";

/**
 * Wraps all widget data providers so cross-tab widgets have access to
 * their required context regardless of which tab is active.
 *
 * All 17 domain providers are included. Overview, Terminal, and Risk
 * use self-fetching wrappers that call the same hooks their page
 * components use, so their widgets render with real data on any tab.
 *
 * TODO(BP-5): Replace the always-on self-fetching wrappers with lazy
 * activation (only run hooks when a widget from that domain is actually
 * mounted on the current tab). This avoids Terminal's 500ms price sim
 * and WebSocket running on tabs that don't need them.
 * See docs/audits/BP2-cross-tab-providers.md for the implementation sketch.
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
import { OverviewDataProvider } from "./overview/overview-data-context";
import { useOverviewPageData } from "./overview/use-overview-page-data";
import { PnLDataProvider } from "./pnl/pnl-data-context";
import { PositionsDataProvider } from "./positions/positions-data-context";
import { PredictionsDataProvider } from "./predictions/predictions-data-context";
import { RiskDataProvider } from "./risk/risk-data-context";
import { useRiskPageData } from "./risk/use-risk-page-data";
import { SportsDataProvider } from "./sports/sports-data-context";
import { StrategiesDataProvider } from "./strategies/strategies-data-context";
import { TerminalDataProvider } from "./terminal/terminal-data-context";
import { useTerminalPageData } from "./terminal/use-terminal-page-data";

// ---------------------------------------------------------------------------
// Self-fetching wrappers for providers that require a value prop.
// BP-5 will replace these with lazy-activated versions.
// ---------------------------------------------------------------------------

function SelfFetchingRiskProvider({ children }: { children: React.ReactNode }) {
  const { riskData } = useRiskPageData();
  return <RiskDataProvider value={riskData}>{children}</RiskDataProvider>;
}

function SelfFetchingTerminalProvider({ children }: { children: React.ReactNode }) {
  const { terminalData } = useTerminalPageData();
  return <TerminalDataProvider value={terminalData}>{children}</TerminalDataProvider>;
}

function SelfFetchingOverviewProvider({ children }: { children: React.ReactNode }) {
  const { overviewData } = useOverviewPageData();
  return <OverviewDataProvider value={overviewData}>{children}</OverviewDataProvider>;
}

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
                              <OptionsDataProvider>
                                <SelfFetchingRiskProvider>
                                  <SelfFetchingTerminalProvider>
                                    <SelfFetchingOverviewProvider>{children}</SelfFetchingOverviewProvider>
                                  </SelfFetchingTerminalProvider>
                                </SelfFetchingRiskProvider>
                              </OptionsDataProvider>
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
