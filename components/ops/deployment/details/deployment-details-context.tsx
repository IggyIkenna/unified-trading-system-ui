"use client";

import { createContext, useContext } from "react";
import type { DeploymentDetailsModel } from "./use-deployment-details-model";

const DeploymentDetailsContext = createContext<DeploymentDetailsModel | null>(null);

export function DeploymentDetailsProvider({
  value,
  children,
}: {
  value: DeploymentDetailsModel;
  children: React.ReactNode;
}) {
  return <DeploymentDetailsContext.Provider value={value}>{children}</DeploymentDetailsContext.Provider>;
}

export function useDeploymentDetailsModelContext(): DeploymentDetailsModel {
  const ctx = useContext(DeploymentDetailsContext);
  if (!ctx) {
    throw new Error("useDeploymentDetailsModelContext must be used within DeploymentDetailsProvider");
  }
  return ctx;
}
