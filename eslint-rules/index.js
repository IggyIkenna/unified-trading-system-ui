/**
 * Custom ESLint rules for trading dashboard
 * 
 * These rules help catch common issues:
 * - Buttons without handlers
 * - Components that don't respect filters
 * - Missing accessibility attributes
 */

module.exports = {
  rules: {
    "require-button-handler": require("./require-button-handler"),
    "require-filter-prop": require("./require-filter-prop"),
  },
  configs: {
    recommended: {
      plugins: ["trading-dashboard"],
      rules: {
        "trading-dashboard/require-button-handler": "warn",
        "trading-dashboard/require-filter-prop": "warn",
      },
    },
    strict: {
      plugins: ["trading-dashboard"],
      rules: {
        "trading-dashboard/require-button-handler": "error",
        "trading-dashboard/require-filter-prop": "error",
      },
    },
  },
}
