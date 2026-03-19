const nextJest = require("next/jest")

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
  ],
  collectCoverageFrom: [
    "components/**/*.{js,jsx,ts,tsx}",
    "app/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  // Test categories
  projects: [
    {
      displayName: "unit",
      testMatch: ["<rootDir>/__tests__/components/**/*.test.{ts,tsx}"],
      testEnvironment: "jsdom",
    },
    {
      displayName: "integration",
      testMatch: ["<rootDir>/__tests__/integration/**/*.test.{ts,tsx}"],
      testEnvironment: "jsdom",
    },
    {
      displayName: "audit",
      testMatch: ["<rootDir>/__tests__/audit/**/*.test.{ts,tsx}"],
      testEnvironment: "jsdom",
    },
  ],
}

module.exports = createJestConfig(customJestConfig)
