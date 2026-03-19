/**
 * MSW handler barrel — aggregates all per-service handlers.
 */

import { dataHandlers } from "./data"

export const handlers = [
  ...dataHandlers,
  // Future handlers will be added here in PLANS_2:
  // ...authHandlers,
  // ...executionHandlers,
  // ...positionsHandlers,
  // ...strategyHandlers,
  // ...mlHandlers,
  // ...riskHandlers,
  // ...tradingHandlers,
  // ...marketDataHandlers,
  // ...alertsHandlers,
  // ...reportingHandlers,
  // ...deploymentHandlers,
  // ...serviceStatusHandlers,
  // ...auditHandlers,
  // ...userManagementHandlers,
]
