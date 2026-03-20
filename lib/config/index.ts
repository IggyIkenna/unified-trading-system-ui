/**
 * Centralized Config Barrel Export
 * 
 * All configuration is exported from here.
 * Import from @/lib/config instead of individual files.
 */

// API configuration
export {
  API_BASE_URLS,
  API_ENV,
  USE_MOCK_API,
  ENDPOINTS,
  TIMEOUTS,
  RETRY_CONFIG,
  buildApiUrl,
  withParams,
} from "./api"

// Branding configuration
export {
  COMPANY,
  LOGOS,
  COLORS,
  TYPOGRAPHY,
  RADII,
  USPS,
  SOCIAL,
  CONTACT,
} from "./branding"

// Auth configuration
export {
  ENTITLEMENTS,
  ROLES,
  SUBSCRIPTION_TIERS,
  hasEntitlement,
  hasAnyEntitlement,
  hasAllEntitlements,
  isInternal,
  canAccessOps,
  canAccessAdmin,
} from "./auth"
export type {
  Entitlement,
  Role,
  Organization,
  AuthUser,
  DemoPersona,
  SubscriptionTier,
} from "./auth"

// Services configuration
export {
  SERVICES,
  getAccessibleServices,
  canAccessService,
  getAccessibleRoutes,
} from "./services"
export type { ServiceDefinition } from "./services"
