"use client";

import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { OptionLeg } from "./types";
import { fmtInt, fmtIv, fmtNum } from "./format";

export function OptionCells({
  leg,
  side,
  itm,
  decimals,
  strike,
  expiry,
  onSelect,
}: {
  leg: OptionLeg;
  side: "call" | "put";
  itm: boolean;
  decimals: number;
  strike: number;
  expiry: string;
  onSelect?: (strike: number, expiry: string, side: "call" | "put") => void;
}) {
  const bg = itm ? (side === "call" ? "bg-emerald-500/5" : "bg-rose-500/5") : "";
  const cls = cn("font-mono text-xs cursor-pointer", bg);

  const cells = [
    fmtNum(leg.bid, decimals),
    fmtNum(leg.ask, decimals),
    fmtNum(leg.last, decimals),
    fmtIv(leg.iv),
    fmtNum(leg.greeks.delta, 3),
    fmtNum(leg.greeks.gamma, 4),
    fmtNum(leg.greeks.theta, 2),
    fmtNum(leg.greeks.vega, 2),
    fmtInt(leg.volume),
    fmtInt(leg.openInterest),
  ];

  const ordered = side === "put" ? [...cells].reverse() : cells;

  return (
    <>
      {ordered.map((val, i) => (
        <TableCell
          key={i}
          className={cn(cls, "text-right px-1.5 py-1")}
          onClick={() => onSelect?.(strike, expiry, side)}
        >
          {val}
        </TableCell>
      ))}
    </>
  );
}
