"use client";

import * as React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { formatUsd, seededRandom } from "@/lib/mocks/fixtures/options-futures-mock";
import type { Asset, ComboLeg, OptionRow, SelectedInstrument } from "@/lib/types/options";
import { cn } from "@/lib/utils";
import { buildComboInstrument, getGreeks } from "./options-combos-shared";

interface Props {
  asset: Asset;
  strikes: number[];
  chainMap: Map<number, OptionRow>;
  onSelectInstrument: (inst: SelectedInstrument) => void;
}

export function VerticalSpreadMatrix({ asset, strikes, chainMap, onSelectInstrument }: Props) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <ScrollArea className="w-full">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                Long &darr; / Short &rarr;
              </th>
              {strikes.map((s) => (
                <th key={s} className="py-2 px-1.5 text-center font-mono font-medium text-[10px] whitespace-nowrap">
                  {s.toLocaleString()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {strikes.map((longStrike, lIdx) => (
              <tr key={longStrike} className="border-b">
                <td className="py-2 px-2 font-mono font-medium text-[10px] whitespace-nowrap bg-muted/20">
                  {longStrike.toLocaleString()}
                </td>
                {strikes.map((shortStrike, sIdx) => {
                  if (sIdx <= lIdx) {
                    return (
                      <td
                        key={sIdx}
                        className={cn("py-1.5 px-1 text-center", sIdx === lIdx ? "bg-muted/40" : "bg-muted/15")}
                      >
                        {sIdx === lIdx ? <span className="text-muted-foreground/40">-</span> : null}
                      </td>
                    );
                  }
                  const longG = getGreeks(chainMap, longStrike, "call");
                  const shortG = getGreeks(chainMap, shortStrike, "call");
                  const netDebit = longG.price - shortG.price;
                  const spread = Math.abs(netDebit) * 0.02 + seededRandom(longStrike + shortStrike) * 2;
                  const legs: ComboLeg[] = [
                    { strike: longStrike, type: "call", direction: "buy", ...longG },
                    { strike: shortStrike, type: "call", direction: "sell", ...shortG },
                  ];

                  return (
                    <td
                      key={sIdx}
                      className="py-1 px-1 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => {
                        const label = `BUY ${asset}-26JUN26-${longStrike}-C / SELL ${asset}-26JUN26-${shortStrike}-C`;
                        onSelectInstrument(buildComboInstrument(label, legs, "Vertical Spread", netDebit));
                      }}
                    >
                      <div className="rounded border bg-card/80 p-1 min-w-[80px] space-y-0.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={cn("font-mono font-medium", netDebit > 0 ? "text-rose-400" : "text-emerald-400")}
                          >
                            {formatUsd(Math.abs(netDebit - spread), 1)}
                          </span>
                          <span className="font-mono text-muted-foreground">
                            {formatUsd(Math.abs(netDebit + spread), 1)}
                          </span>
                        </div>
                        <p className="text-[8px] text-muted-foreground/60 truncate">
                          {netDebit > 0 ? "Debit" : "Credit"}
                        </p>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
