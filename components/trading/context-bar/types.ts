import type * as React from "react";

export interface Organization {
  id: string;
  name: string;
  logo?: string;
}

export interface Client {
  id: string;
  name: string;
  orgId: string;
  status: "active" | "onboarding" | "inactive";
}

export interface Strategy {
  id: string;
  name: string;
  clientId: string;
  assetClass: string;
  strategyType: string;
  status: "live" | "paused" | "warning" | "stopped" | "error";
}

export interface Underlying {
  id: string;
  symbol: string;
  name: string;
  type: "crypto" | "equity" | "commodity" | "sport" | "event";
  icon?: React.ReactNode;
}

export interface ContextState {
  mode: "live" | "batch";
  asOfDatetime?: string;
  organizationIds: string[];
  clientIds: string[];
  strategyIds: string[];
  underlyingIds: string[];
}

export interface ContextBarProps {
  organizations?: Organization[];
  clients?: Client[];
  strategies?: Strategy[];
  underlyings?: Underlying[];
  context: ContextState;
  onContextChange: (context: ContextState) => void;
  availableLevels?: {
    organization?: boolean;
    client?: boolean;
    strategy?: boolean;
    underlying?: boolean;
  };
  className?: string;
}
