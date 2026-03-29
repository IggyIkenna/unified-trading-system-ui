"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Receipt, Trash2, X, Zap } from "lucide-react";
import type { Bookmaker, Fixture, OddsMarket } from "./types";
import { BOOKMAKER_DISPLAY_NAMES, EXECUTION_CAPABLE_BOOKMAKERS } from "./types";
import { formatNumber } from "@/lib/utils/formatters";

// ─── Bet Slip Types ────────────────────────────────────────────────────────

export interface BetSlipSelection {
  id: string;
  fixture: Fixture;
  market: OddsMarket;
  outcome: string;
  odds: number;
  bookmaker: Bookmaker;
}

export interface BetSlipState {
  selections: BetSlipSelection[];
  stake: string;
  betType: "single" | "accumulator";
}

// ─── Bet Slip Component ────────────────────────────────────────────────────

export function BetSlip({
  state,
  onUpdateStake,
  onRemoveSelection,
  onChangeBookmaker,
  onClear,
  onPlaceBet,
  onChangeBetType,
  isSubmitting,
  availableBookmakers,
}: {
  state: BetSlipState;
  onUpdateStake: (stake: string) => void;
  onRemoveSelection: (id: string) => void;
  onChangeBookmaker: (selectionId: string, bookmaker: Bookmaker) => void;
  onClear: () => void;
  onPlaceBet: () => void;
  onChangeBetType: (type: "single" | "accumulator") => void;
  isSubmitting: boolean;
  /** Bookmakers that have odds for the current selections */
  availableBookmakers: Bookmaker[];
}) {
  const { selections, stake, betType } = state;
  const stakeNum = parseFloat(stake) || 0;

  const combinedOdds = betType === "accumulator" ? selections.reduce((acc, s) => acc * s.odds, 1) : 0;

  const potentialReturn =
    betType === "accumulator" ? stakeNum * combinedOdds : selections.reduce((acc, s) => acc + stakeNum * s.odds, 0);

  const canPlace = selections.length > 0 && stakeNum > 0 && !isSubmitting;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Receipt className="size-4" />
            Bet Slip
            {selections.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {selections.length}
              </Badge>
            )}
          </CardTitle>
          {selections.length > 0 && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={onClear}>
              Clear all
            </Button>
          )}
        </div>
        {selections.length > 1 && (
          <div className="flex gap-1 pt-1">
            <Button
              variant={betType === "single" ? "default" : "outline"}
              size="sm"
              className="h-6 text-xs flex-1"
              onClick={() => onChangeBetType("single")}
            >
              Singles
            </Button>
            <Button
              variant={betType === "accumulator" ? "default" : "outline"}
              size="sm"
              className="h-6 text-xs flex-1"
              onClick={() => onChangeBetType("accumulator")}
            >
              Accumulator
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {selections.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            Click on odds to add selections to your bet slip
          </p>
        ) : (
          <>
            {selections.map((sel) => (
              <div key={sel.id} className="rounded-lg border border-border/50 p-2.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {sel.fixture.home.shortName} vs {sel.fixture.away.shortName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {sel.market} — {sel.outcome}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge className="font-mono text-xs bg-primary/10 text-primary border-primary/20">
                      {formatNumber(sel.odds, 2)}
                    </Badge>
                    <button
                      onClick={() => onRemoveSelection(sel.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>

                <Select value={sel.bookmaker} onValueChange={(v) => onChangeBookmaker(sel.id, v as Bookmaker)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(availableBookmakers.length > 0 ? availableBookmakers : EXECUTION_CAPABLE_BOOKMAKERS).map((b) => (
                      <SelectItem key={b} value={b}>
                        {BOOKMAKER_DISPLAY_NAMES[b]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

            {/* Stake input */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs">Stake {betType === "single" ? "(per bet)" : "(total)"}</Label>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={stake}
                  onChange={(e) => onUpdateStake(e.target.value)}
                  className="font-mono"
                  min={0}
                  step="any"
                />
                <div className="flex gap-0.5">
                  {[10, 25, 50, 100].map((q) => (
                    <Button
                      key={q}
                      variant="outline"
                      size="sm"
                      className="h-9 px-2 text-xs"
                      onClick={() => onUpdateStake(String(q))}
                    >
                      ${q}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-muted/30 p-2.5 space-y-1">
              {betType === "accumulator" && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Combined odds</span>
                  <span className="font-mono font-medium">{formatNumber(combinedOdds, 2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {betType === "single"
                    ? `${selections.length} bet${selections.length > 1 ? "s" : ""}`
                    : "1 accumulator"}
                </span>
                <span className="font-mono font-medium">${formatNumber(stakeNum, 2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium pt-1 border-t border-border/30">
                <span>Potential return</span>
                <span className={cn("font-mono", potentialReturn > 0 ? "text-[#4ade80]" : "")}>
                  ${formatNumber(potentialReturn, 2)}
                </span>
              </div>
            </div>

            {/* Place bet button */}
            <Button className="w-full gap-2" disabled={!canPlace} onClick={onPlaceBet}>
              <Zap className="size-4" />
              {isSubmitting
                ? "Placing..."
                : betType === "accumulator"
                  ? "Place Accumulator"
                  : `Place ${selections.length} Bet${selections.length > 1 ? "s" : ""}`}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
