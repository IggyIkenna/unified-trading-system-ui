import { test, expect } from "@playwright/test";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * ENVIRONMENT MODE STATIC INVARIANTS — runs in quality gates WITHOUT a server.
 *
 * These are structural code checks that enforce the three-axis philosophy:
 *   1. RuntimeModeBadge must NOT be in root layout (public pages never see it)
 *   2. RuntimeModeBadge MUST be in platform layout (post-login only)
 *   3. "Preparing demo" text must not appear in providers.tsx
 *   4. ApiStatusIndicator must use hostname-derived env, not NEXT_PUBLIC_APP_ENV
 *   5. lib/runtime/environment.ts must export getDeploymentEnv + isPublicRoute
 *
 * Browser integration tests (page.goto assertions) are in environment-mode-audit.spec.ts
 * and run in CI only (require a running dev server).
 *
 * SSOT: unified-trading-pm/codex/08-workflows/environment-mode-philosophy.md
 */

const ROOT = join(__dirname, "..", "..");

function read(rel: string): string {
  const p = join(ROOT, rel);
  if (!existsSync(p)) return "";
  return readFileSync(p, "utf-8");
}

function grep(pattern: string, rel: string): string {
  try {
    return execSync(`grep -r "${pattern}" "${join(ROOT, rel)}" --include="*.tsx" --include="*.ts" -l 2>/dev/null || echo ""`, {
      encoding: "utf-8",
    }).trim();
  } catch {
    return "";
  }
}

test.describe("Environment mode structural invariants", () => {
  test("RuntimeModeBadge is NOT imported in app/layout.tsx (public pages)", () => {
    const rootLayout = read("app/layout.tsx");
    expect(rootLayout, "app/layout.tsx must not import RuntimeModeBadge").not.toContain(
      "RuntimeModeBadge",
    );
  });

  test("RuntimeModeBadge IS imported in app/(platform)/layout.tsx (platform only)", () => {
    const platformLayout = read("app/(platform)/layout.tsx");
    expect(platformLayout, "app/(platform)/layout.tsx must import RuntimeModeBadge").toContain(
      "RuntimeModeBadge",
    );
  });

  test("'Preparing demo' text does not appear in providers.tsx", () => {
    const providers = read("lib/providers.tsx");
    expect(providers.toLowerCase(), "providers.tsx must not contain 'preparing demo'").not.toContain(
      "preparing demo",
    );
  });

  test("ApiStatusIndicator uses getEnvLabel() not NEXT_PUBLIC_APP_ENV as primary env source", () => {
    const indicator = read("components/shell/api-status-indicator.tsx");
    // Must import from runtime/environment
    expect(indicator, "ApiStatusIndicator must import getEnvLabel from lib/runtime/environment").toContain(
      "getEnvLabel",
    );
    // Old direct env-var fallback must not be used as primary
    const legacyPattern = /process\.env\.NEXT_PUBLIC_APP_ENV\s*\??\./;
    expect(legacyPattern.test(indicator), "ApiStatusIndicator must not use NEXT_PUBLIC_APP_ENV as primary env source").toBe(false);
  });

  test("lib/runtime/environment.ts exports getDeploymentEnv and isPublicRoute", () => {
    const env = read("lib/runtime/environment.ts");
    expect(env, "must export getDeploymentEnv").toContain("export function getDeploymentEnv");
    expect(env, "must export isPublicRoute").toContain("export function isPublicRoute");
    expect(env, "must export getEnvLabel").toContain("export function getEnvLabel");
  });

  test("RuntimeModeStrip does not show 'Preparing demo' text", () => {
    const strip = read("components/shell/runtime-mode-strip.tsx");
    expect(strip.toLowerCase()).not.toContain("preparing demo");
  });

  test("RuntimeModeStrip uses getDeploymentEnv for env-context messaging", () => {
    const strip = read("components/shell/runtime-mode-strip.tsx");
    expect(strip, "RuntimeModeStrip must import getDeploymentEnv for dev-vs-prod message branching").toContain(
      "getDeploymentEnv",
    );
  });

  test("backend-unreachable banner has data-testid for Playwright targeting", () => {
    const strip = read("components/shell/runtime-mode-strip.tsx");
    expect(strip, "backend-unreachable banner must have data-testid='backend-unreachable-banner'").toContain(
      'data-testid="backend-unreachable-banner"',
    );
  });

  test("SandboxBanner links to www.odum-research.com", () => {
    const banner = read("components/sandbox-banner.tsx");
    expect(banner, "SandboxBanner must link to www.odum-research.com").toContain(
      "www.odum-research.com",
    );
  });

  test("No file imports RuntimeModeBadge from root layout context (only platform layout allowed)", () => {
    // Scan the public route group for any RuntimeModeBadge usage
    const publicLayoutFiles = ["app/layout.tsx", "app/(public)/layout.tsx"];
    for (const file of publicLayoutFiles) {
      const content = read(file);
      if (!content) continue;
      expect(content, `${file} must not reference RuntimeModeBadge`).not.toContain(
        "RuntimeModeBadge",
      );
    }
  });
});
