import nextConfig from "eslint-config-next";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      "_reference/**",
      "coverage/**",
      "lib/types/api-generated.ts",
      ".claude/**",
      ".next/**",
      "**/.next/**",
      "build-artifacts/**",
      "functions/**",
      "node_modules/**",
    ],
  },
  {
    // React Compiler / React 19 strict-mode rules land as warnings during
    // phased cleanup. rules-of-hooks stays an error — it's a real runtime
    // bug class. See unified-trading-pm/codex/06-coding-standards/ui-testing-layers.md
    // (branch-tier gate policy: whole-surface gates warn on feat/*, block
    // on main; "what you just touched" still blocks).
    // Tracked in unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
  eslintConfigPrettier,
];

export default eslintConfig;
