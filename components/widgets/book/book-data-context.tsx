"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { usePlaceOrder, usePreTradeCheck } from "@/hooks/api/use-orders";
import { useOrganizationsList } from "@/hooks/api/use-organizations";
import { useAuth, type AuthUser } from "@/hooks/use-auth";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { STRATEGIES as REGISTRY_STRATEGIES } from "@/lib/strategy-registry";
import { getTradesForScope } from "@/lib/mocks/fixtures/mock-data-index";
import { BOOK_CATEGORY_LABELS, type BookAlgoType, type BookCategoryTab } from "@/lib/config/services/trading.config";
import { MOCK_TRADES, type BookTrade } from "@/lib/mocks/fixtures/book-trades";

export type { BookAlgoType, BookCategoryTab } from "@/lib/config/services/trading.config";
export type { BookTrade };

export type BookExecutionMode = "execute" | "record_only";
export type BookOrderState = "idle" | "preview" | "submitting" | "success" | "error";

export interface BookComplianceCheckResult {
  name: string;
  passed: boolean;
  limit_value: number | string;
  current_value: number | string;
  proposed_value: number | string;
}

export interface BookPreTradeCheckResponse {
  passed: boolean;
  checks: BookComplianceCheckResult[];
}

interface BookPrefillData {
  org_id?: string;
  client_id?: string;
  strategy_id?: string;
  execution_mode?: BookExecutionMode;
  category?: BookCategoryTab;
  venue?: string;
  instrument?: string;
  side?: "buy" | "sell";
  quantity?: string;
  price?: string;
  algo?: BookAlgoType;
}

export interface BookTradeDataContextValue {
  orgId: string;
  setOrgId: (v: string) => void;
  clientId: string;
  setClientId: (v: string) => void;
  strategyId: string;
  setStrategyId: (v: string) => void;
  organizations: Array<{ id: string; name: string }>;

  executionMode: BookExecutionMode;
  setExecutionMode: (m: BookExecutionMode) => void;
  category: BookCategoryTab;
  setCategory: (c: BookCategoryTab) => void;

  venue: string;
  setVenue: (v: string) => void;
  instrument: string;
  setInstrument: (v: string) => void;
  side: "buy" | "sell";
  setSide: (s: "buy" | "sell") => void;
  quantity: string;
  setQuantity: (q: string) => void;
  price: string;
  setPrice: (p: string) => void;

  algo: BookAlgoType;
  setAlgo: (a: BookAlgoType) => void;
  algoParams: { duration: string; slices: string; displayQty: string; benchmark: string };
  setAlgoParam: (key: string, value: string) => void;

  counterparty: string;
  setCounterparty: (v: string) => void;
  sourceReference: string;
  setSourceReference: (v: string) => void;
  fee: string;
  setFee: (v: string) => void;

  // OTC-specific fields
  settlementMethod: string;
  setSettlementMethod: (v: string) => void;
  settlementCurrency: string;
  setSettlementCurrency: (v: string) => void;
  bilateralTerms: string;
  setBilateralTerms: (v: string) => void;
  isdaReference: string;
  setIsdaReference: (v: string) => void;
  isOtcCategory: boolean;

  orderState: BookOrderState;
  /** Used by preview widget for Edit / Retry navigation in the state machine */
  setOrderState: (s: BookOrderState) => void;
  errorMessage: string;
  complianceResult: BookPreTradeCheckResponse | null;
  complianceUnavailable: boolean;
  complianceLoading: boolean;
  compliancePassed: boolean;

  qty: number;
  priceNum: number;
  total: number;
  canPreview: boolean;
  canExecute: boolean;

  handlePreview: () => void;
  handleSubmit: () => void;
  resetForm: () => void;

  user: AuthUser | null;

  trades: BookTrade[];

  registryStrategies: typeof REGISTRY_STRATEGIES;
  categoryLabels: typeof BOOK_CATEGORY_LABELS;
}

const BookTradeDataContext = React.createContext<BookTradeDataContextValue | null>(null);

export function BookTradeDataProvider({ children }: { children: React.ReactNode }) {
  const { user, hasEntitlement } = useAuth();
  const canExecute =
    hasEntitlement("execution-full" as never) || hasEntitlement("can-trade" as never) || user?.role === "admin";

  const searchParams = useSearchParams();
  const placeOrder = usePlaceOrder();
  const preTradeCheck = usePreTradeCheck();
  const { data: organizations } = useOrganizationsList();
  const { scope: globalScope } = useGlobalScope();

  const [orgId, setOrgId] = React.useState("");
  const [clientId, setClientId] = React.useState("");
  const [strategyId, setStrategyId] = React.useState("manual");

  // Sync book form org/client/strategy from global scope when it changes
  React.useEffect(() => {
    if (globalScope.organizationIds.length > 0) {
      setOrgId(globalScope.organizationIds[0]);
    }
  }, [globalScope.organizationIds]);

  React.useEffect(() => {
    if (globalScope.clientIds.length > 0) {
      setClientId(globalScope.clientIds[0]);
    }
  }, [globalScope.clientIds]);

  React.useEffect(() => {
    if (globalScope.strategyIds.length > 0) {
      setStrategyId(globalScope.strategyIds[0]);
    }
  }, [globalScope.strategyIds]);

  const [executionMode, setExecutionMode] = React.useState<BookExecutionMode>("execute");
  const [category, setCategory] = React.useState<BookCategoryTab>("cefi_spot");

  const [venue, setVenue] = React.useState("");
  const [instrument, setInstrument] = React.useState("");
  const [side, setSide] = React.useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = React.useState("");
  const [price, setPrice] = React.useState("");

  const [algo, setAlgo] = React.useState<BookAlgoType>("MARKET");
  const [algoParamDuration, setAlgoParamDuration] = React.useState("");
  const [algoParamSlices, setAlgoParamSlices] = React.useState("");
  const [algoParamDisplayQty, setAlgoParamDisplayQty] = React.useState("");
  const [algoParamBenchmark, setAlgoParamBenchmark] = React.useState("");

  const [counterparty, setCounterparty] = React.useState("");
  const [sourceReference, setSourceReference] = React.useState("");
  const [fee, setFee] = React.useState("");

  // OTC-specific
  const [settlementMethod, setSettlementMethod] = React.useState("DVP");
  const [settlementCurrency, setSettlementCurrency] = React.useState("USDT");
  const [bilateralTerms, setBilateralTerms] = React.useState("");
  const [isdaReference, setIsdaReference] = React.useState("");
  const isOtcCategory = category === "otc";

  const [orderState, setOrderState] = React.useState<BookOrderState>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [complianceResult, setComplianceResult] = React.useState<BookPreTradeCheckResponse | null>(null);
  const [complianceUnavailable, setComplianceUnavailable] = React.useState(false);
  const [complianceLoading, setComplianceLoading] = React.useState(false);

  React.useEffect(() => {
    const prefillRaw = searchParams.get("prefill");
    if (!prefillRaw) return;
    try {
      const data = JSON.parse(prefillRaw) as BookPrefillData;
      if (data.org_id) setOrgId(data.org_id);
      if (data.client_id) setClientId(data.client_id);
      if (data.strategy_id) setStrategyId(data.strategy_id);
      if (data.execution_mode) setExecutionMode(data.execution_mode);
      if (data.category) setCategory(data.category);
      if (data.venue) setVenue(data.venue);
      if (data.instrument) setInstrument(data.instrument);
      if (data.side) setSide(data.side);
      if (data.quantity) setQuantity(data.quantity);
      if (data.price) setPrice(data.price);
      if (data.algo) setAlgo(data.algo);
    } catch {
      // Invalid prefill JSON — ignore
    }
  }, [searchParams]);

  React.useEffect(() => {
    setVenue("");
  }, [category]);

  const algoParams = React.useMemo(
    () => ({
      duration: algoParamDuration,
      slices: algoParamSlices,
      displayQty: algoParamDisplayQty,
      benchmark: algoParamBenchmark,
    }),
    [algoParamDuration, algoParamSlices, algoParamDisplayQty, algoParamBenchmark],
  );

  const setAlgoParam = React.useCallback((key: string, value: string) => {
    switch (key) {
      case "duration":
        setAlgoParamDuration(value);
        break;
      case "slices":
        setAlgoParamSlices(value);
        break;
      case "displayQty":
        setAlgoParamDisplayQty(value);
        break;
      case "benchmark":
        setAlgoParamBenchmark(value);
        break;
      default:
        break;
    }
  }, []);

  const qty = parseFloat(quantity) || 0;
  const priceNum = parseFloat(price) || 0;
  const total = priceNum * qty;
  const canPreview = qty > 0 && priceNum > 0 && instrument.length > 0 && venue.length > 0;

  const compliancePassed =
    executionMode === "record_only" || complianceUnavailable || (complianceResult?.passed ?? false);

  const handlePreview = React.useCallback(async () => {
    if (!canPreview) return;
    setOrderState("preview");
    setComplianceResult(null);
    setComplianceUnavailable(false);

    if (executionMode === "execute") {
      setComplianceLoading(true);
      try {
        const result = (await preTradeCheck.mutateAsync({
          instrument,
          side,
          quantity: qty,
          price: priceNum,
          strategy_id: strategyId === "manual" ? undefined : strategyId,
        })) as BookPreTradeCheckResponse;
        setComplianceResult(result);
      } catch {
        setComplianceUnavailable(true);
      } finally {
        setComplianceLoading(false);
      }
    }
  }, [canPreview, executionMode, preTradeCheck, instrument, side, qty, priceNum, strategyId]);

  const resetForm = React.useCallback(() => {
    setInstrument("");
    setQuantity("");
    setPrice("");
    setFee("");
    setCounterparty("");
    setSourceReference("");
    setAlgoParamDuration("");
    setAlgoParamSlices("");
    setAlgoParamDisplayQty("");
    setAlgoParamBenchmark("");
    setOrderState("idle");
    setErrorMessage("");
    setComplianceResult(null);
    setComplianceUnavailable(false);
    setComplianceLoading(false);
  }, []);

  const handleSubmit = React.useCallback(async () => {
    setOrderState("submitting");
    setErrorMessage("");
    try {
      await placeOrder.mutateAsync({
        instrument,
        side,
        order_type: executionMode === "execute" ? "limit" : "market",
        quantity: qty,
        price: priceNum || undefined,
        venue,
        strategy_id: strategyId === "manual" ? undefined : strategyId,
        client_id: clientId || orgId || user?.org?.id,
        reason: undefined,
        execution_mode: executionMode,
        counterparty: executionMode === "record_only" ? counterparty || undefined : undefined,
        source_reference: executionMode === "record_only" ? sourceReference || undefined : undefined,
        category: BOOK_CATEGORY_LABELS[category],
        portfolio_id: orgId || undefined,
      });
      setOrderState("success");
      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Order failed");
      setOrderState("error");
    }
  }, [
    placeOrder,
    instrument,
    side,
    executionMode,
    qty,
    priceNum,
    venue,
    strategyId,
    clientId,
    orgId,
    user?.org?.id,
    counterparty,
    sourceReference,
    category,
    resetForm,
  ]);

  const orgList = Array.isArray(organizations) ? (organizations as Array<{ id: string; name: string }>) : [];

  const scopedTrades: BookTrade[] = React.useMemo(() => {
    const seed = getTradesForScope(globalScope.organizationIds, globalScope.clientIds, globalScope.strategyIds);
    if (seed.length > 0) {
      return seed.map((s) => ({
        id: s.id,
        timestamp: s.timestamp,
        instrument: s.instrument,
        venue: s.venue,
        side: s.side,
        quantity: s.quantity,
        price: s.price,
        fees: s.fees,
        total: s.total,
        status: s.status === "settled" ? ("settled" as const) : ("filled" as const),
        counterparty: s.counterparty,
        settlementDate: s.settlementDate,
        tradeType: s.tradeType,
      }));
    }
    return MOCK_TRADES;
  }, [globalScope.organizationIds, globalScope.clientIds, globalScope.strategyIds]);

  const value = React.useMemo(
    () => ({
      orgId,
      setOrgId,
      clientId,
      setClientId,
      strategyId,
      setStrategyId,
      organizations: orgList,

      executionMode,
      setExecutionMode,
      category,
      setCategory,

      venue,
      setVenue,
      instrument,
      setInstrument,
      side,
      setSide,
      quantity,
      setQuantity,
      price,
      setPrice,

      algo,
      setAlgo,
      algoParams,
      setAlgoParam,

      counterparty,
      setCounterparty,
      sourceReference,
      setSourceReference,
      fee,
      setFee,

      settlementMethod,
      setSettlementMethod,
      settlementCurrency,
      setSettlementCurrency,
      bilateralTerms,
      setBilateralTerms,
      isdaReference,
      setIsdaReference,
      isOtcCategory,

      orderState,
      setOrderState,
      errorMessage,
      complianceResult,
      complianceUnavailable,
      complianceLoading,
      compliancePassed,

      qty,
      priceNum,
      total,
      canPreview,
      canExecute,

      handlePreview,
      handleSubmit,
      resetForm,

      user,

      trades: scopedTrades,

      registryStrategies: REGISTRY_STRATEGIES,
      categoryLabels: BOOK_CATEGORY_LABELS,
    }),
    [
      orgId,
      clientId,
      strategyId,
      orgList,
      executionMode,
      category,
      venue,
      instrument,
      side,
      quantity,
      price,
      algo,
      algoParams,
      setAlgoParam,
      counterparty,
      sourceReference,
      fee,
      settlementMethod,
      settlementCurrency,
      bilateralTerms,
      isdaReference,
      isOtcCategory,
      orderState,
      errorMessage,
      complianceResult,
      complianceUnavailable,
      complianceLoading,
      compliancePassed,
      qty,
      priceNum,
      total,
      canPreview,
      canExecute,
      handlePreview,
      handleSubmit,
      resetForm,
      user,
      scopedTrades,
      canExecute,
    ],
  );

  return <BookTradeDataContext.Provider value={value}>{children}</BookTradeDataContext.Provider>;
}

export function useBookTradeData(): BookTradeDataContextValue {
  const ctx = React.useContext(BookTradeDataContext);
  if (!ctx) throw new Error("useBookTradeData must be used within BookTradeDataProvider");
  return ctx;
}
