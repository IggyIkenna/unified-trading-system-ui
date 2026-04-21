"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { seededRandom } from "@/lib/mocks/fixtures/options-futures-mock";
import type { ComboLeg, ComboType, OptionRow, SelectedInstrument } from "@/lib/types/options";

export const COMBO_TYPES: { value: ComboType; label: string }[] = [
  { value: "vertical-spread", label: "Vertical Spread" },
  { value: "straddle", label: "Straddle" },
  { value: "strangle", label: "Strangle" },
  { value: "calendar", label: "Calendar" },
  { value: "butterfly", label: "Butterfly" },
  { value: "risk-reversal", label: "Risk Reversal" },
];

export const CALENDAR_EXPIRIES = [
  "26 JUN 26",
  "25 SEP 26",
  "25 DEC 26",
  "26 MAR 27",
  "26 JUN 27",
  "25 SEP 27",
] as const;

export interface LegGreeks {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export function getGreeks(chainMap: Map<number, OptionRow>, strike: number, side: "call" | "put"): LegGreeks {
  const row = chainMap.get(strike);
  if (!row) {
    return { price: 0, delta: 0, gamma: 0, theta: 0, vega: 0 };
  }
  if (side === "call") {
    return {
      price: row.callMark,
      delta: row.callDelta,
      gamma: 0.003 + seededRandom(strike) * 0.005,
      theta: -(8 + seededRandom(strike + 1) * 15),
      vega: 0.1 + seededRandom(strike + 2) * 0.2,
    };
  }
  return {
    price: row.putMark,
    delta: row.putDelta,
    gamma: 0.003 + seededRandom(strike + 10) * 0.005,
    theta: -(8 + seededRandom(strike + 11) * 15),
    vega: 0.1 + seededRandom(strike + 12) * 0.2,
  };
}

export function buildComboInstrument(
  label: string,
  legs: ComboLeg[],
  type: string,
  netDebit: number,
): SelectedInstrument {
  return {
    name: label,
    type: "combo",
    price: Math.abs(netDebit),
    delta: legs.reduce((s, l) => s + l.delta * (l.direction === "buy" ? 1 : -1), 0),
    gamma: legs.reduce((s, l) => s + l.gamma * (l.direction === "buy" ? 1 : -1), 0),
    theta: legs.reduce((s, l) => s + l.theta * (l.direction === "buy" ? 1 : -1), 0),
    vega: legs.reduce((s, l) => s + l.vega * (l.direction === "buy" ? 1 : -1), 0),
    legs,
    comboType: type,
    netDebit,
  };
}

export function ComboTypePills({
  comboType,
  setComboType,
}: {
  comboType: ComboType;
  setComboType: (ct: ComboType) => void;
}) {
  return (
    <ScrollArea className="w-full">
      <div className="flex items-center gap-1 pb-1">
        {COMBO_TYPES.map((ct) => (
          <Button
            key={ct.value}
            variant={comboType === ct.value ? "default" : "outline"}
            size="sm"
            className="h-7 px-2.5 text-[10px] whitespace-nowrap shrink-0"
            onClick={() => setComboType(ct.value)}
          >
            {ct.label}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
