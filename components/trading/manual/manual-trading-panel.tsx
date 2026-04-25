"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlaceOrder, usePreTradeCheck } from "@/hooks/api/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { LayoutGrid, PenLine } from "lucide-react";
import * as React from "react";
import { MassQuotePanel } from "./mass-quote-panel";
import { SingleOrderForm } from "./single-order-form";
import type { ManualTradingPanelProps, OrderState, PreTradeCheckResponse } from "./types";
import { useStrategyScopedInstruments } from "@/lib/architecture-v2/use-strategy-scoped-instruments";

export type { ManualTradingPanelProps } from "./types";

export function ManualTradingPanel({
  defaultInstrument = "BTC/USDT",
  defaultVenue = "Binance",
  currentPrice = 0,
  instruments = [],
  strategies = [],
}: ManualTradingPanelProps) {
  const { user } = useAuth();
  const placeOrder = usePlaceOrder();
  const preTradeCheck = usePreTradeCheck();

  const [open, setOpen] = React.useState(false);
  const [panelMode, setPanelMode] = React.useState<"single" | "mass-quote">("single");
  const [side, setSide] = React.useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = React.useState<"limit" | "market">("limit");
  const [instrument, setInstrument] = React.useState(defaultInstrument);
  const [venue, setVenue] = React.useState(defaultVenue);
  const [quantity, setQuantity] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [strategyId, setStrategyId] = React.useState("manual");
  // Scope the instruments dropdown to whatever the selected strategy slot
  // declares in strategy_instruments.json. Falls through to the full list
  // when strategyId is "manual" or an unresolvable token. (Phase 10 P10.4.)
  const scopedInstruments = useStrategyScopedInstruments(strategyId, instruments);
  const [reason, setReason] = React.useState("");
  const [algo, setAlgo] = React.useState<string>("MARKET");
  const [algoParams, setAlgoParams] = React.useState<Record<string, number>>({});
  const [executionMode, setExecutionMode] = React.useState<"execute" | "record_only">("execute");
  const [counterparty, setCounterparty] = React.useState("");
  const [sourceReference, setSourceReference] = React.useState("");
  const [orderState, setOrderState] = React.useState<OrderState>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [complianceResult, setComplianceResult] = React.useState<PreTradeCheckResponse | null>(null);
  const [complianceUnavailable, setComplianceUnavailable] = React.useState(false);
  const [complianceLoading, setComplianceLoading] = React.useState(false);

  React.useEffect(() => {
    setInstrument(defaultInstrument);
  }, [defaultInstrument]);

  React.useEffect(() => {
    setVenue(defaultVenue);
  }, [defaultVenue]);

  const effectivePrice = orderType === "market" ? currentPrice : parseFloat(price) || 0;
  const qty = parseFloat(quantity) || 0;
  const total = effectivePrice * qty;

  const canPreview = qty > 0 && (orderType === "market" || effectivePrice > 0);

  const handlePreview = async () => {
    if (!canPreview) return;
    setOrderState("preview");
    setComplianceResult(null);
    setComplianceUnavailable(false);
    setComplianceLoading(true);
    try {
      const result = (await preTradeCheck.mutateAsync({
        instrument,
        side,
        quantity: qty,
        price: orderType === "limit" ? effectivePrice : undefined,
        strategy_id: strategyId === "manual" ? undefined : strategyId,
      })) as PreTradeCheckResponse;
      setComplianceResult(result);
    } catch {
      setComplianceUnavailable(true);
    } finally {
      setComplianceLoading(false);
    }
  };

  const handleSubmit = async () => {
    setOrderState("submitting");
    setErrorMessage("");
    try {
      await placeOrder.mutateAsync({
        instrument,
        side,
        order_type: orderType,
        quantity: qty,
        price: orderType === "limit" ? effectivePrice : undefined,
        venue,
        strategy_id: strategyId === "manual" ? undefined : strategyId,
        client_id: user?.org?.id,
        reason: reason || undefined,
        algo,
        algo_params: Object.keys(algoParams).length > 0 ? algoParams : undefined,
        execution_mode: executionMode,
        counterparty: executionMode === "record_only" && counterparty ? counterparty : undefined,
        source_reference: executionMode === "record_only" && sourceReference ? sourceReference : undefined,
      });
      setOrderState("success");
      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Order failed");
      setOrderState("error");
    }
  };

  const resetForm = () => {
    setQuantity("");
    setPrice("");
    setReason("");
    setStrategyId("manual");
    setAlgo("MARKET");
    setAlgoParams({});
    setExecutionMode("execute");
    setCounterparty("");
    setSourceReference("");
    setOrderState("idle");
    setErrorMessage("");
    setComplianceResult(null);
    setComplianceUnavailable(false);
    setComplianceLoading(false);
    setPanelMode("single");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <PenLine className="size-3.5" />
          Manual Trade
        </Button>
      </SheetTrigger>
      <SheetContent
        className={cn(
          "overflow-y-auto",
          panelMode === "mass-quote" ? "w-[480px] sm:w-[520px]" : "w-[400px] sm:w-[440px]",
        )}
      >
        <SheetHeader>
          <SheetTitle>{panelMode === "single" ? "Manual Trade Entry" : "Mass Quote"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <Tabs value={panelMode} onValueChange={(v) => setPanelMode(v as "single" | "mass-quote")}>
            <TabsList className="w-full">
              <TabsTrigger value="single" className="flex-1">
                Single Order
              </TabsTrigger>
              <TabsTrigger value="mass-quote" className="flex-1 gap-1.5">
                <LayoutGrid className="size-3" />
                Mass Quote
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {panelMode === "mass-quote" && <MassQuotePanel />}

          {panelMode === "single" && (
            <SingleOrderForm
              instruments={[...scopedInstruments]}
              strategies={strategies}
              currentPrice={currentPrice}
              side={side}
              setSide={setSide}
              orderType={orderType}
              setOrderType={setOrderType}
              instrument={instrument}
              setInstrument={setInstrument}
              venue={venue}
              setVenue={setVenue}
              quantity={quantity}
              setQuantity={setQuantity}
              price={price}
              setPrice={setPrice}
              strategyId={strategyId}
              setStrategyId={setStrategyId}
              reason={reason}
              setReason={setReason}
              algo={algo}
              setAlgo={setAlgo}
              algoParams={algoParams}
              setAlgoParams={setAlgoParams}
              executionMode={executionMode}
              setExecutionMode={setExecutionMode}
              counterparty={counterparty}
              setCounterparty={setCounterparty}
              sourceReference={sourceReference}
              setSourceReference={setSourceReference}
              orderState={orderState}
              setOrderState={setOrderState}
              errorMessage={errorMessage}
              complianceResult={complianceResult}
              complianceUnavailable={complianceUnavailable}
              complianceLoading={complianceLoading}
              effectivePrice={effectivePrice}
              qty={qty}
              total={total}
              canPreview={canPreview}
              handlePreview={handlePreview}
              handleSubmit={handleSubmit}
            />
          )}

          {user && (
            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">
                {user.org?.id ?? "unknown org"}
              </Badge>
              <span>Submitted by {user.displayName ?? user.email ?? "unknown"}</span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
