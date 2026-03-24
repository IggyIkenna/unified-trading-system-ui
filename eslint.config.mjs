import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      "_reference/**",
      "coverage/**",
      "lib/types/api-generated.ts",
    ],
  },
];

export default eslintConfig;
