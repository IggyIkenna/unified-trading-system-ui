"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Strategy } from "@/lib/strategy-registry";

export function StrategyDetailArchetypePanel({ strategy, arch }: { strategy: Strategy; arch: string }) {
  return (
    <>
      {/* Strategy-Type Specific Panel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {arch === "market-making" || arch === "MARKET_MAKING"
              ? "Market Making Analytics"
              : strategy.assetClass === "DeFi"
                ? "DeFi Protocol Analytics"
                : strategy.assetClass === "Sports"
                  ? "Sports & Betting Analytics"
                  : strategy.assetClass === "Prediction"
                    ? "Prediction Market Analytics"
                    : arch === "basis-trade" || arch === "BASIS_TRADE"
                      ? "Basis/Spread Analytics"
                      : arch === "OPTIONS" || arch === "market-making-options"
                        ? "Derivatives Analytics"
                        : "Strategy Analytics"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const arch = strategy.archetype as string;
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                {/* Common metrics */}
                <div>
                  <span className="text-muted-foreground text-[10px]">Win Rate</span>
                  <div className="font-mono font-medium text-lg">62%</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px]">Avg Trade Duration</span>
                  <div className="font-mono font-medium text-lg">4.2h</div>
                </div>

                {/* Market Making specific */}
                {(arch === "market-making" || arch === "MARKET_MAKING") && (
                  <>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Avg Spread Captured</span>
                      <div className="font-mono font-medium text-lg text-emerald-400">2.4 bps</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Inventory Turnover</span>
                      <div className="font-mono font-medium text-lg">8.2x/day</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Adverse Selection</span>
                      <div className="font-mono font-medium text-lg text-amber-400">12%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Fill Rate</span>
                      <div className="font-mono font-medium text-lg">94.2%</div>
                    </div>
                  </>
                )}

                {/* DeFi specific */}
                {strategy.assetClass === "DeFi" && (
                  <>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Health Factor</span>
                      <div className="font-mono font-medium text-lg text-emerald-400">1.45</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">APY (Current)</span>
                      <div className="font-mono font-medium text-lg">8.2%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Gas Cost (24h)</span>
                      <div className="font-mono font-medium text-lg">$142</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Protocol TVL</span>
                      <div className="font-mono font-medium text-lg">$12.4B</div>
                    </div>
                  </>
                )}

                {/* Sports specific */}
                {strategy.assetClass === "Sports" && (
                  <>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Edge (Avg)</span>
                      <div className="font-mono font-medium text-lg text-emerald-400">3.1%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Markets Scanned</span>
                      <div className="font-mono font-medium text-lg">2,400</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Active Bets</span>
                      <div className="font-mono font-medium text-lg">18</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Yield</span>
                      <div className="font-mono font-medium text-lg">4.8%</div>
                    </div>
                  </>
                )}

                {/* Prediction specific */}
                {strategy.assetClass === "Prediction" && (
                  <>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Markets Active</span>
                      <div className="font-mono font-medium text-lg">12</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Avg Mispricing</span>
                      <div className="font-mono font-medium text-lg text-emerald-400">2.8%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Resolution Rate</span>
                      <div className="font-mono font-medium text-lg">87%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Cross-Platform Arb</span>
                      <div className="font-mono font-medium text-lg">$420</div>
                    </div>
                  </>
                )}

                {/* Basis/Spread specific */}
                {(arch === "basis-trade" || arch === "BASIS_TRADE") && (
                  <>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Basis Spread</span>
                      <div className="font-mono font-medium text-lg text-emerald-400">+4.2 bps</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Funding Rate</span>
                      <div className="font-mono font-medium text-lg">0.012%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Carry P&L (24h)</span>
                      <div className="font-mono font-medium text-lg text-emerald-400">$1.2K</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Roll Cost</span>
                      <div className="font-mono font-medium text-lg text-rose-400">-$80</div>
                    </div>
                  </>
                )}

                {/* Derivatives/Options specific */}
                {(arch === "OPTIONS" || arch === "market-making-options") && (
                  <>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Net Delta</span>
                      <div className="font-mono font-medium text-lg">+2.4</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Net Gamma</span>
                      <div className="font-mono font-medium text-lg">0.15</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Theta Decay (24h)</span>
                      <div className="font-mono font-medium text-lg text-rose-400">-$850</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">IV vs RV Spread</span>
                      <div className="font-mono font-medium text-lg text-emerald-400">+3.2%</div>
                    </div>
                  </>
                )}

                {/* Momentum/Directional/ML */}
                {(arch === "momentum" ||
                  arch === "ml-directional" ||
                  arch === "ML_DIRECTIONAL" ||
                  arch === "MOMENTUM" ||
                  arch === "DIRECTIONAL") && (
                  <>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Signal Strength</span>
                      <div className="font-mono font-medium text-lg text-emerald-400">0.72</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Regime</span>
                      <div className="font-mono font-medium text-lg">Trending</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Confidence</span>
                      <div className="font-mono font-medium text-lg">84%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Signal Lag</span>
                      <div className="font-mono font-medium text-lg">2.1s</div>
                    </div>
                  </>
                )}

                {/* Mean Reversion */}
                {(arch === "mean-reversion" || arch === "MEAN_REVERSION") && (
                  <>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Z-Score</span>
                      <div className="font-mono font-medium text-lg text-amber-400">1.8σ</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Half-Life</span>
                      <div className="font-mono font-medium text-lg">4.2h</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Mean Distance</span>
                      <div className="font-mono font-medium text-lg">0.3%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Reversal Rate</span>
                      <div className="font-mono font-medium text-lg">71%</div>
                    </div>
                  </>
                )}

                {/* Arbitrage / Statistical Arb */}
                {(arch === "arbitrage" ||
                  arch === "ARBITRAGE" ||
                  arch === "statistical-arb" ||
                  arch === "STATISTICAL_ARB") && (
                  <>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Spread (Current)</span>
                      <div className="font-mono font-medium text-lg text-emerald-400">+1.8 bps</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Opportunities/hr</span>
                      <div className="font-mono font-medium text-lg">142</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Execution Speed</span>
                      <div className="font-mono font-medium text-lg">12ms</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Hit Rate</span>
                      <div className="font-mono font-medium text-lg">78%</div>
                    </div>
                  </>
                )}

                {/* Recursive Staked Basis (DeFi subset) */}
                {(arch === "recursive-staked-basis" || arch === "RECURSIVE_STAKED_BASIS") && (
                  <>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Leverage Loop</span>
                      <div className="font-mono font-medium text-lg">3.2x</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Net APY</span>
                      <div className="font-mono font-medium text-lg text-emerald-400">12.4%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Liquidation Distance</span>
                      <div className="font-mono font-medium text-lg">28%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Staking Yield</span>
                      <div className="font-mono font-medium text-lg">3.8%</div>
                    </div>
                  </>
                )}

                {/* AMM LP */}
                {(arch === "amm-lp" || arch === "AMM_LP") && (
                  <>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Fee APR</span>
                      <div className="font-mono font-medium text-lg text-emerald-400">18.2%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">IL (Impermanent Loss)</span>
                      <div className="font-mono font-medium text-lg text-rose-400">-1.2%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Range Efficiency</span>
                      <div className="font-mono font-medium text-lg">82%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">Pool Share</span>
                      <div className="font-mono font-medium text-lg">0.04%</div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </>
  );
}
