/**
 * MSW handler barrel — aggregates all per-service handlers.
 */

import { dataHandlers } from "./data"
import { executionHandlers } from "./execution"
import { strategyHandlers } from "./strategy"
import { mlHandlers } from "./ml"

export const handlers = [
  ...dataHandlers,
  ...executionHandlers,
  ...strategyHandlers,
  ...mlHandlers,
  // Future handlers (PLANS_2):
  // ...authHandlers,
  // ...positionsHandlers,
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
