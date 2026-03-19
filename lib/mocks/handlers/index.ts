/**
 * MSW Handler Registry
 * 
 * Exports all mock API handlers.
 * Each handler file corresponds to a service domain.
 */

import { dataHandlers } from "./data"
import { executionHandlers } from "./execution"
import { strategyHandlers } from "./strategy"
import { authHandlers } from "./auth"

// Combine all handlers
export const handlers = [
  ...authHandlers,
  ...dataHandlers,
  ...executionHandlers,
  ...strategyHandlers,
]
