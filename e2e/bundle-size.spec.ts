import { test, expect } from "@playwright/test"
import { execSync } from "child_process"
import { readdirSync, statSync } from "fs"
import { join } from "path"

/**
 * BUNDLE SIZE E2E TESTS
 *
 * Validates that production builds stay within size budgets and that
 * charting components use dynamic imports (code-splitting).
 */

const PROJECT_ROOT = join(__dirname, "..")
const MAX_CHUNK_BYTES = 500 * 1024 // 500 KB

function walkDir(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      walkDir(full, files)
    } else {
      files.push(full)
    }
  }
  return files
}

test.describe("Bundle Size Validation", () => {
  let buildOutput: string

  test.beforeAll(() => {
    // Run a production build and capture output
    buildOutput = execSync("npx next build", {
      cwd: PROJECT_ROOT,
      env: { ...process.env, VITE_MOCK_API: "true", NODE_ENV: "production" },
      timeout: 300_000,
    }).toString()
  })

  test("no JS chunk exceeds 500KB", () => {
    // Next.js outputs chunks to .next/static/chunks/
    const chunksDir = join(PROJECT_ROOT, ".next", "static", "chunks")
    const jsFiles = walkDir(chunksDir).filter((f) => f.endsWith(".js"))

    expect(jsFiles.length).toBeGreaterThan(0)

    const oversized: string[] = []
    for (const file of jsFiles) {
      const size = statSync(file).size
      if (size > MAX_CHUNK_BYTES) {
        const name = file.replace(chunksDir + "/", "")
        oversized.push(`${name} (${(size / 1024).toFixed(0)}KB)`)
      }
    }

    expect(
      oversized,
      `Chunks exceeding 500KB:\n${oversized.join("\n")}`
    ).toHaveLength(0)
  })

  test("charting components use dynamic imports", () => {
    // The build output or source should confirm dynamic imports for heavy chart deps.
    // We verify by checking that the trading overview page uses next/dynamic for charting.
    const { readFileSync } = require("fs")
    const tradingOverview = readFileSync(
      join(
        PROJECT_ROOT,
        "app/(platform)/services/trading/overview/page.tsx"
      ),
      "utf-8"
    )

    // OptionsChain and VolSurfaceChart are dynamically imported
    expect(tradingOverview).toContain("dynamic(() => import")
    expect(tradingOverview).toContain("OptionsChain")
    expect(tradingOverview).toContain("VolSurfaceChart")
  })
})
