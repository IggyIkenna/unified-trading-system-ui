"use client";

import { OptionsChain } from "@/components/trading/options-chain/options-chain-view";
import type { OptionsChainProps } from "@/components/trading/options-chain/types";
import * as React from "react";

export type OptionsChainPresetProps = OptionsChainProps;

/**
 * Widget-grid-friendly wrapper around the existing
 * `components/trading/options-chain/options-chain-view.tsx`.
 *
 * Generalises the existing standalone OptionsChain so it can be hosted
 * inside the DART widget grid — per P0.3 of the cross-asset-group market-
 * data terminal plan, the existing `/options` standalone page should be
 * folded back into the grid (no orphan routes).
 *
 * The underlying component already implements the Deribit-style strike ×
 * expiry grouped-header table with ITM shading and per-cell bid/ask/IV/
 * Greeks. This preset doesn't reimplement — it just re-exports with a
 * widget-host-friendly default surface (no Card chrome since widgets
 * already wrap themselves).
 *
 * Greeks/IV computation in the cell renderer is gated on the P6 feature-
 * pipeline prereq (Black-Scholes / Black-76 in features-derivatives-
 * service or UFI). Until that lands, the cells render bid/ask only and
 * Greeks columns show em-dashes — graceful degradation per the
 * "data unavailable" pattern from the plan.
 */
export function OptionsChainPreset(props: OptionsChainPresetProps) {
  return <OptionsChain {...props} />;
}

export type { OptionsChainProps };
