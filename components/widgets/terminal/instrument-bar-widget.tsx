"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ManualTradingPanel } from "@/components/trading/manual-trading-panel";
import { Database, Maximize2, Radio, RefreshCw, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTerminalData } from "./terminal-data-context";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

export function InstrumentBarWidget(_props: WidgetComponentProps) {
  const {
    instruments,
    instrumentsByCategory,
    selectedInstrument,
    setSelectedInstrument,
    livePrice,
    priceChange,
    selectedAccount,
    setSelectedAccount,
    availableAccounts,
    isBatchMode,
  } = useTerminalData();

  const formatPrice = (v: number) => {
    if (v >= 1000) return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (v >= 1) return formatNumber(v, 4);
    return formatNumber(v, 6);
  };

  return (
    <div className="flex items-center gap-3 px-3 h-full flex-wrap">
      <Select
        value={`${selectedInstrument.symbol}@${selectedInstrument.venue}`}
        onValueChange={(val) => {
          const inst = instruments.find((i) => `${i.symbol}@${i.venue}` === val);
          if (inst) setSelectedInstrument(inst);
        }}
      >
        <SelectTrigger className="w-[200px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(instrumentsByCategory).map(([cat, insts]) => (
            <div key={cat}>
              <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">{cat}</div>
              {insts.map((inst) => (
                <SelectItem
                  key={`${inst.symbol}@${inst.venue}`}
                  value={`${inst.symbol}@${inst.venue}`}
                  className="text-xs"
                >
                  {inst.symbol} <span className="text-muted-foreground ml-1">{inst.venue}</span>
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedAccount?.id ?? ""}
        onValueChange={(val) => {
          const acc = availableAccounts.find((a) => a.id === val);
          if (acc) setSelectedAccount(acc);
        }}
      >
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="Select account" />
        </SelectTrigger>
        <SelectContent>
          {availableAccounts.map((acc) => (
            <SelectItem key={acc.id} value={acc.id} className="text-xs">
              {acc.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 ml-2">
        <span
          className={cn(
            "text-lg font-mono font-bold tabular-nums",
            priceChange >= 0 ? "text-emerald-400" : "text-rose-400",
          )}
        >
          {formatPrice(livePrice)}
        </span>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px]",
            priceChange >= 0 ? "text-emerald-400 border-emerald-400/30" : "text-rose-400 border-rose-400/30",
          )}
        >
          {priceChange >= 0 ? "+" : ""}
          {formatPercent(priceChange, 2)}
        </Badge>
        {!isBatchMode && (
          <Badge variant="outline" className="text-[10px] gap-1">
            <Radio className="size-2 animate-pulse text-emerald-400" />
            LIVE
          </Badge>
        )}
        {isBatchMode && (
          <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/30 text-amber-500">
            <Database className="size-2" />
            BATCH
          </Badge>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <RefreshCw className="size-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Settings className="size-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Maximize2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
