// SSOT ESLint config for all UI repos — owned by unified-trading-pm
// Do NOT edit per-repo. Edit this file and propagate via:
//   python3 unified-trading-pm/scripts/propagation/rollout-quality-gates-unified.py --ui-only
// OR:
//   bash unified-trading-pm/scripts/repo-management/run-all-setup.sh --rollout-first --ui-only
//
// Rule philosophy (matches Python zero-warning policy):
//   - no-explicit-any    → error  (was warn; agents must use specific types)
//   - no-unused-vars     → error  (was warn; dead code is noise)
//   - no-console         → error  (enforced by base-ui.sh [3.5] codex check too)
//   - react-refresh      → warn   (informational; never blocks a build)
//
// Per-repo overrides: add a rules{} block in .eslintrc.cjs AFTER the spread/require,
// or use inline eslint-disable comments for documented exceptions.
// Document all exceptions in QUALITY_GATE_BYPASS_AUDIT.md.

module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["react-hooks", "react-refresh", "@typescript-eslint"],
  rules: {
    // Promoted from warn → error (parity with Python zero-warning policy)
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "no-console": "error",

    // Keep as warn — informational, never blocks a build
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
  },
  ignorePatterns: [
    "dist",
    "coverage",
    "*.config.js",
    "*.config.ts",
    "*.config.cjs",
    "*.cjs",
  ],
};
