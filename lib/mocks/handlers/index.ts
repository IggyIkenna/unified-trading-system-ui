/**
 * MSW handler barrel — aggregates all 16 per-service handlers.
 *
 * Handler categories:
 * - Core trading: auth, data, execution, positions, strategy, ml, risk, trading, market-data
 * - Platform features: alerts, reporting
 * - Ops/internal: deployment, service-status, audit, user-management
 */

import { authHandlers } from "./auth"
import { dataHandlers } from "./data"
import { executionHandlers } from "./execution"
import { positionsHandlers } from "./positions"
import { strategyHandlers } from "./strategy"
import { mlHandlers } from "./ml"
import { riskHandlers } from "./risk"
import { tradingHandlers } from "./trading"
import { marketDataHandlers } from "./market-data"
import { alertsHandlers } from "./alerts"
import { reportingHandlers } from "./reporting"
import { deploymentHandlers } from "./deployment"
import { serviceStatusHandlers } from "./service-status"
import { auditHandlers } from "./audit"
import { userManagementHandlers } from "./user-management"

export const handlers = [
  // Core trading
  ...authHandlers,
  ...dataHandlers,
  ...executionHandlers,
  ...positionsHandlers,
  ...strategyHandlers,
  ...mlHandlers,
  ...riskHandlers,
  ...tradingHandlers,
  ...marketDataHandlers,
  // Platform features
  ...alertsHandlers,
  ...reportingHandlers,
  // Ops / internal
  ...deploymentHandlers,
  ...serviceStatusHandlers,
  ...auditHandlers,
  ...userManagementHandlers,
]
