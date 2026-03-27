"use client";

import * as React from "react";
import {
  ALL_OPERATION_TYPES,
  BUNDLE_INSTRUMENTS,
  BUNDLE_VENUES,
  type BundleOperationType,
} from "@/lib/config/services/bundle.config";
import { BUNDLE_TEMPLATES } from "@/lib/mocks/fixtures/bundle-templates";
import type { BundleStep, BundleTemplate } from "@/lib/types/bundles";

export interface BundlesDataContextValue {
  steps: BundleStep[];
  addStep: () => void;
  removeStep: (id: string) => void;
  moveStep: (id: string, direction: "up" | "down") => void;
  duplicateStep: (id: string) => void;
  updateStep: (id: string, field: keyof BundleStep, value: string | null) => void;

  templates: BundleTemplate[];
  showTemplates: boolean;
  setShowTemplates: (show: boolean) => void;
  loadTemplate: (template: BundleTemplate) => void;
  clearSteps: () => void;

  totalCost: number;
  totalRevenue: number;
  estimatedGas: number;
  netPnl: number;

  operationTypes: readonly BundleOperationType[];
  venues: readonly string[];
  instruments: readonly string[];
}

const BundlesDataContext = React.createContext<BundlesDataContextValue | null>(null);

export function BundlesDataProvider({ children }: { children: React.ReactNode }) {
  const [steps, setSteps] = React.useState<BundleStep[]>([]);
  const [showTemplates, setShowTemplates] = React.useState(true);

  const addStep = React.useCallback(() => {
    setSteps((prev) => [
      ...prev,
      {
        id: `step-${Date.now()}`,
        operationType: "TRADE",
        instrument: "BTC/USDT",
        venue: "Binance",
        side: "BUY",
        quantity: "",
        price: "",
        dependsOn: null,
      },
    ]);
    setShowTemplates(false);
  }, []);

  const removeStep = React.useCallback((id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const moveStep = React.useCallback((id: string, direction: "up" | "down") => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[newIdx];
      next[newIdx] = temp;
      return next;
    });
  }, []);

  const updateStep = React.useCallback((id: string, field: keyof BundleStep, value: string | null) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (field === "operationType" && value !== null) {
          return { ...s, operationType: value as BundleOperationType };
        }
        if (field === "side" && (value === "BUY" || value === "SELL")) {
          return { ...s, side: value };
        }
        return { ...s, [field]: value } as BundleStep;
      }),
    );
  }, []);

  const loadTemplate = React.useCallback((template: BundleTemplate) => {
    const newSteps: BundleStep[] = template.steps.map((s, i) => ({
      ...s,
      id: `step-${Date.now()}-${i}`,
    }));
    setSteps(newSteps);
    setShowTemplates(false);
  }, []);

  const duplicateStep = React.useCallback((id: string) => {
    setSteps((prev) => {
      const step = prev.find((s) => s.id === id);
      if (!step) return prev;
      const idx = prev.findIndex((s) => s.id === id);
      const newStep = { ...step, id: `step-${Date.now()}`, dependsOn: null };
      const next = [...prev];
      next.splice(idx + 1, 0, newStep);
      return next;
    });
  }, []);

  const clearSteps = React.useCallback(() => {
    setSteps([]);
  }, []);

  const totalCost = React.useMemo(
    () =>
      steps.reduce((sum, s) => {
        const qty = parseFloat(s.quantity) || 0;
        const price = parseFloat(s.price) || 0;
        if (s.side === "BUY") return sum + qty * price;
        return sum;
      }, 0),
    [steps],
  );

  const totalRevenue = React.useMemo(
    () =>
      steps.reduce((sum, s) => {
        const qty = parseFloat(s.quantity) || 0;
        const price = parseFloat(s.price) || 0;
        if (s.side === "SELL") return sum + qty * price;
        return sum;
      }, 0),
    [steps],
  );

  const estimatedGas = steps.length * 14.5;
  const netPnl = totalRevenue - totalCost - estimatedGas;

  const value = React.useMemo(
    () => ({
      steps,
      addStep,
      removeStep,
      moveStep,
      duplicateStep,
      updateStep,
      templates: BUNDLE_TEMPLATES,
      showTemplates,
      setShowTemplates,
      loadTemplate,
      clearSteps,
      totalCost,
      totalRevenue,
      estimatedGas,
      netPnl,
      operationTypes: ALL_OPERATION_TYPES,
      venues: BUNDLE_VENUES,
      instruments: BUNDLE_INSTRUMENTS,
    }),
    [
      steps,
      addStep,
      removeStep,
      moveStep,
      duplicateStep,
      updateStep,
      showTemplates,
      loadTemplate,
      clearSteps,
      totalCost,
      totalRevenue,
      estimatedGas,
      netPnl,
    ],
  );

  return <BundlesDataContext.Provider value={value}>{children}</BundlesDataContext.Provider>;
}

export function useBundlesData(): BundlesDataContextValue {
  const ctx = React.useContext(BundlesDataContext);
  if (!ctx) throw new Error("useBundlesData must be used within BundlesDataProvider");
  return ctx;
}
