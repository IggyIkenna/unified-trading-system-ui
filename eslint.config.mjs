import eslintConfigPrettier from "eslint-config-prettier";
import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["_reference/**", "coverage/**", "lib/types/api-generated.ts"],
  },
  eslintConfigPrettier,
];

export default eslintConfig;
