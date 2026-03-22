import { test, expect } from "@playwright/test"
import { existsSync } from "fs"
import { join } from "path"
import { execSync } from "child_process"

/**
 * NO CLIENT-SIDE MOCK DATA E2E TESTS
 *
 * Verifies that client-side mock data is minimized:
 * 1. lib/mocks/ directory does NOT exist
 * 2. execution-platform-mock-data.ts is not imported by any app page
 * 3. No page has inline `const mockData = [` arrays in critical paths
 *
 * These are static checks run via the Playwright runner for convenience.
 */

const PROJECT_ROOT = join(__dirname, "..")

const API = "http://localhost:8030"

test.beforeAll(async ({ request }) => {
  await request.post(`${API}/admin/reset`)
})

test.describe("No Client-Side Mock Data in Production Paths", () => {
  test("lib/mocks/ directory does NOT exist", () => {
    const mocksDir = join(PROJECT_ROOT, "lib", "mocks")
    expect(
      existsSync(mocksDir),
      "lib/mocks/ directory should not exist - mock data belongs in the API"
    ).toBe(false)
  })

  test("execution-platform-mock-data.ts is not imported by app pages", () => {
    // Search app/ directory for imports of execution-platform-mock-data
    let output = ""
    try {
      output = execSync(
        'grep -r "execution-platform-mock-data" --include="*.tsx" --include="*.ts" -l app/',
        { cwd: PROJECT_ROOT, encoding: "utf-8" }
      )
    } catch {
      // grep returns exit code 1 when no matches found — that is the desired outcome
      output = ""
    }

    const importingFiles = output
      .trim()
      .split("\n")
      .filter((f) => f.length > 0)

    expect(
      importingFiles,
      `These app pages import execution-platform-mock-data.ts:\n${importingFiles.join("\n")}`
    ).toHaveLength(0)
  })

  test("no app page has inline const mockData = [ arrays", () => {
    // Search app/ for inline mock data arrays
    let output = ""
    try {
      output = execSync(
        'grep -rn "const mockData = \\[" --include="*.tsx" --include="*.ts" app/',
        { cwd: PROJECT_ROOT, encoding: "utf-8" }
      )
    } catch {
      // grep returns exit code 1 when no matches — desired outcome
      output = ""
    }

    const matches = output
      .trim()
      .split("\n")
      .filter((line) => line.length > 0)

    expect(
      matches,
      `Found inline mockData arrays in app pages:\n${matches.join("\n")}`
    ).toHaveLength(0)
  })

  test("strategy-platform-mock-data.ts is not imported by app pages", () => {
    let output = ""
    try {
      output = execSync(
        'grep -r "strategy-platform-mock-data" --include="*.tsx" --include="*.ts" -l app/',
        { cwd: PROJECT_ROOT, encoding: "utf-8" }
      )
    } catch {
      output = ""
    }

    const importingFiles = output
      .trim()
      .split("\n")
      .filter((f) => f.length > 0)

    expect(
      importingFiles,
      `These app pages import strategy-platform-mock-data.ts:\n${importingFiles.join("\n")}`
    ).toHaveLength(0)
  })
})
