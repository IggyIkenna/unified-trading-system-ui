/**
 * MSW Mock Infrastructure
 * 
 * Central exports for the mocking system.
 */

export { handlers } from "./handlers"
export { worker, startMocking } from "./browser"
export { 
  getCurrentPersona, 
  getCurrentPersonaId,
  setCurrentPersona,
  clearCurrentPersona,
  scopeByEntitlements,
} from "./utils"
export {
  DEMO_PERSONAS,
  ORGANIZATIONS,
  getPersonaById,
  getPersonaByEmail,
  getDefaultPersona,
} from "./fixtures/personas"
