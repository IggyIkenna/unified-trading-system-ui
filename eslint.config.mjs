import nextConfig from "eslint-config-next"

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      "_reference/**",
      "lib/types/api-generated.ts",
      "public/mockServiceWorker.js",
    ],
  },
]

export default eslintConfig
