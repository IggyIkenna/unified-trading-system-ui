"use client";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import * as React from "react";
import { fmtNum } from "./format";
import { OptionCells } from "./option-cells";
import type { ExpiryGroup } from "./types";

const CALL_HEADS = ["Bid", "Ask", "Last", "IV", "Delta", "Gamma", "Theta", "Vega", "Vol", "OI"] as const;
const PUT_HEADS = ["OI", "Vol", "Vega", "Theta", "Gamma", "Delta", "IV", "Last", "Ask", "Bid"] as const;

export function ExpirySection({
  group,
  decimals,
  onSelectStrike,
}: {
  group: ExpiryGroup;
  decimals: number;
  onSelectStrike?: (strike: number, expiry: string, side: "call" | "put") => void;
}) {
  const [open, setOpen] = React.useState(true);

  const atmStrike = group.rows.reduce((closest, row) =>
    Math.abs(row.strike - group.spotPrice) < Math.abs(closest.strike - group.spotPrice) ? row : closest,
  ).strike;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 bg-muted/40 hover:bg-muted/60 transition-colors border-b border-border cursor-pointer">
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        <span className="text-sm font-medium">{group.expiry}</span>
        <Badge variant="outline" className="text-[10px] font-mono">
          {group.daysToExpiry}d
        </Badge>
        <span className="text-xs text-muted-foreground ml-auto">{group.rows.length} strikes</span>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Table>
          <TableHeader>
            <TableRow className="text-[10px]">
              {CALL_HEADS.map((h) => (
                <TableHead key={`c-${h}`} className="text-right px-1.5 py-1 text-emerald-400/80 text-[10px]">
                  {h}
                </TableHead>
              ))}
              <TableHead className="text-center px-2 py-1 bg-muted/30 font-bold text-[10px]">Strike</TableHead>
              {PUT_HEADS.map((h) => (
                <TableHead key={`p-${h}`} className="text-right px-1.5 py-1 text-rose-400/80 text-[10px]">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.rows.map((row) => {
              const isAtm = row.strike === atmStrike;
              const callItm = group.spotPrice > row.strike;
              const putItm = group.spotPrice < row.strike;

              return (
                <TableRow key={row.strike} className={cn(isAtm && "bg-yellow-500/10 border-y border-yellow-500/30")}>
                  <OptionCells
                    leg={row.call}
                    side="call"
                    itm={callItm}
                    decimals={decimals}
                    strike={row.strike}
                    expiry={group.expiry}
                    onSelect={onSelectStrike}
                  />
                  <TableCell
                    className={cn(
                      "text-center font-mono font-bold text-xs px-2 py-1 bg-muted/20",
                      isAtm && "text-yellow-400",
                    )}
                  >
                    {fmtNum(row.strike, decimals)}
                    {isAtm && <span className="ml-1 text-[9px] text-yellow-500/80">ATM</span>}
                  </TableCell>
                  <OptionCells
                    leg={row.put}
                    side="put"
                    itm={putItm}
                    decimals={decimals}
                    strike={row.strike}
                    expiry={group.expiry}
                    onSelect={onSelectStrike}
                  />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CollapsibleContent>
    </Collapsible>
  );
}
