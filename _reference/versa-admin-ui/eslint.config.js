// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  // Global ignores (replaces ignorePatterns)
  {
    ignores: ["**/dist/", "**/node_modules/", "**/coverage/", "**/*.cjs"],
  },

  // Base configs
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // Global TypeScript settings
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "no-console": "warn",
    },
  },

  // React hooks plugin
  {
    files: ["packages/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // batch-audit: Relax unsafe rules in test files since @testing-library types
  // can be unresolvable at the workspace tsconfig level
  {
    files: [
      "packages/batch-audit/**/*.test.tsx",
      "packages/batch-audit/**/*.test.ts",
      "packages/batch-audit/**/*.spec.tsx",
      "packages/batch-audit/**/*.spec.ts",
    ],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },

  // deployment: MIGRATION DEBT — rules turned off for initial migration from
  // standalone deployment-ui repo. See: unified_admin_ui_creation_2026_03_09.plan.md
  {
    files: ["packages/deployment/**/*.{ts,tsx}"],
    rules: {
      // async event handlers — TODO: wrap calls with void operator
      "@typescript-eslint/no-misused-promises": "off",
      // floating promises — TODO: add void/await wrappers
      "@typescript-eslint/no-floating-promises": "off",
      // response.json() returns unknown — TODO: add type guards around API responses
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      // explicit return types — TODO: add return types to all exported functions
      "@typescript-eslint/explicit-function-return-type": "off",
      // console.info used for mock mode debug output
      "no-console": "off",
      // unnecessary type assertions — TODO: remove redundant casts
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      // no-base-to-string — TODO: add proper string coercion for complex types
      "@typescript-eslint/no-base-to-string": "off",
      // require-await — TODO: remove async keyword from non-awaiting functions
      "@typescript-eslint/require-await": "off",
      // Allow _prefixed unused vars (conventional pattern in source repo)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
