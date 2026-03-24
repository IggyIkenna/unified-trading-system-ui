/**
 * ESLint rule: require-filter-prop
 *
 * Ensures components that display data accept filter props for context-aware rendering.
 * This prevents components from showing unfiltered data when a global filter is active.
 */

// Components that should accept filter props
const DATA_DISPLAY_COMPONENTS = [
  "StrategyAuditTrail",
  "PositionsTable",
  "PnLWaterfall",
  "TimeSeriesChart",
  "AlertsPanel",
  "CircuitBreakerGrid",
  "HealthStatusGrid",
  "EventStreamViewer",
];

// Required filter-related props
const FILTER_PROPS = [
  "strategies",
  "strategyIds",
  "selectedStrategyIds",
  "filteredStrategies",
  "clientIds",
  "organizationIds",
  "context",
];

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require filter props on data display components",
      category: "Best Practices",
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      missingFilterProp:
        "Component '{{name}}' should accept filter-related props (strategies, strategyIds, etc.) for context-aware rendering",
    },
  },

  create(context) {
    return {
      // Check component definitions
      "FunctionDeclaration, ArrowFunctionExpression"(node) {
        // Get component name
        let componentName = null;
        if (node.type === "FunctionDeclaration" && node.id) {
          componentName = node.id.name;
        } else if (node.parent && node.parent.type === "VariableDeclarator") {
          componentName = node.parent.id.name;
        }

        // Skip if not a data display component
        if (
          !componentName ||
          !DATA_DISPLAY_COMPONENTS.includes(componentName)
        ) {
          return;
        }

        // Check if props parameter includes filter props
        const params = node.params;
        if (params.length === 0) {
          context.report({
            node,
            messageId: "missingFilterProp",
            data: { name: componentName },
          });
          return;
        }

        // If using destructured props, check for filter props
        const firstParam = params[0];
        if (firstParam.type === "ObjectPattern") {
          const propNames = firstParam.properties
            .filter((p) => p.key)
            .map((p) => p.key.name);

          const hasFilterProp = FILTER_PROPS.some((fp) =>
            propNames.includes(fp),
          );

          if (!hasFilterProp) {
            context.report({
              node,
              messageId: "missingFilterProp",
              data: { name: componentName },
            });
          }
        }
      },
    };
  },
};
