/**
 * MSW Handler Registry
 * 
 * Exports all mock API handlers.
 * Each handler file corresponds to a service domain.
 */

// Core trading handlers
import { authHandlers } from "./auth"
import { dataHandlers } from "./data"
import { executionHandlers } from "./execution"
import { strategyHandlers } from "./strategy"
import { positionsHandlers } from "./positions"
import { riskHandlers } from "./risk"
import { mlHandlers } from "./ml"
import { tradingHandlers } from "./trading"
import { alertsHandlers } from "./alerts"

// Combine all handlers
export const handlers = [
  // Auth & Core
  ...authHandlers,
  ...dataHandlers,
  
  // Trading
  ...executionHandlers,
  ...strategyHandlers,
  ...positionsHandlers,
  ...tradingHandlers,
  
  // Risk & ML
  ...riskHandlers,
  ...mlHandlers,
  
  // Alerts
  ...alertsHandlers,
]

// Re-export individual handlers for testing
export {
  authHandlers,
  dataHandlers,
  executionHandlers,
  strategyHandlers,
  positionsHandlers,
  riskHandlers,
  mlHandlers,
  tradingHandlers,
  alertsHandlers,
}
