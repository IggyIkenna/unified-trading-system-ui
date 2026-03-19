const nextJest = require("next/jest")

const createJestConfig = nextJest({
  dir: "./",
})

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^msw/node$": "<rootDir>/node_modules/msw/lib/node/index.js",
    "^msw/browser$": "<rootDir>/node_modules/msw/lib/browser/index.js",
    "^msw$": "<rootDir>/node_modules/msw/lib/core/index.js",
  },
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    "<rootDir>/_reference/",
  ],
  testMatch: [
    "<rootDir>/__tests__/**/*.test.{ts,tsx}",
  ],
  collectCoverageFrom: [
    "lib/mocks/utils.ts",
    "lib/mocks/fixtures/**/*.{ts,tsx}",
    "lib/config/**/*.{ts,tsx}",
    "lib/stores/**/*.{ts,tsx}",
    "!lib/config/index.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
