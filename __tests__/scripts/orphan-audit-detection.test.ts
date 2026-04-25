/**
 * Executable documentation of the orphan-audit scanner's reachability
 * detection rules AND the whitelist triage rule.
 *
 * SSOT: `unified-trading-pm/codex/06-coding-standards/orphan-audit.md`
 *       §Whitelist Triage Rule
 *
 * These tests lock in the set of source-code patterns that count as
 * reachability. If a pattern below stops being recognised, a real user
 * click path regresses into an "orphan" — so the scanner must keep
 * supporting each one.
 *
 * They also enforce the reason-string format on the whitelist JSON so a
 * rogue "admin-only deep-link" entry cannot sneak back in.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  extractHrefsFromSource,
  isAcceptableWhitelistReason,
  ACCEPTABLE_WHITELIST_PREFIXES,
} from "@/scripts/orphan-audit-lib";

describe("extractHrefsFromSource — reachability detection", () => {
  it("detects <Link href='/foo'>", () => {
    const src = `import Link from "next/link";\nexport default () => <Link href="/foo">Foo</Link>;`;
    expect(extractHrefsFromSource(src)).toContain("/foo");
  });

  it("detects router.push('/bar')", () => {
    const src = `
      "use client";
      import { useRouter } from "next/navigation";
      export default function P() {
        const router = useRouter();
        return <button onClick={() => router.push("/bar")}>Go</button>;
      }
    `;
    expect(extractHrefsFromSource(src)).toContain("/bar");
  });

  it("detects router.replace('/baz')", () => {
    const src = `router.replace("/baz");`;
    expect(extractHrefsFromSource(src)).toContain("/baz");
  });

  it("detects arbitrary-identifier push/replace (e.g. useRouter() hook assigned to 'r')", () => {
    const src = `const r = useRouter(); r.push("/bar2"); r.replace("/baz2");`;
    const found = extractHrefsFromSource(src);
    expect(found).toContain("/bar2");
    expect(found).toContain("/baz2");
  });

  it("detects redirect('/login') — Next.js server action helper", () => {
    const src = `import { redirect } from "next/navigation"; redirect("/login");`;
    expect(extractHrefsFromSource(src)).toContain("/login");
  });

  it("detects window.location.href = '/qux'", () => {
    const src = `if (done) { window.location.href = "/qux"; }`;
    expect(extractHrefsFromSource(src)).toContain("/qux");
  });

  it("detects bare location.href = '/quux'", () => {
    const src = `location.href = "/quux";`;
    expect(extractHrefsFromSource(src)).toContain("/quux");
  });

  it("detects window.location.assign('/corge')", () => {
    const src = `window.location.assign("/corge");`;
    expect(extractHrefsFromSource(src)).toContain("/corge");
  });

  it("detects window.location.replace('/grault')", () => {
    const src = `window.location.replace("/grault");`;
    expect(extractHrefsFromSource(src)).toContain("/grault");
  });

  it("detects next.config redirects source + destination", () => {
    const src = `
      const nextConfig = {
        redirects: async () => [
          { source: "/old", destination: "/new", permanent: true },
        ],
      };
    `;
    const found = extractHrefsFromSource(src);
    expect(found).toContain("/old");
    expect(found).toContain("/new");
  });

  it("detects path: '/path' in nav-config object literals (lifecycle-mapping-style)", () => {
    const src = `
      const NAV_ITEMS = [
        { label: "Data", path: "/services/data/overview" },
      ];
    `;
    expect(extractHrefsFromSource(src)).toContain("/services/data/overview");
  });

  it("does NOT mark an unrelated page as reachable from unrelated content", () => {
    const src = `const colour = "blue"; // no hrefs anywhere`;
    const found = extractHrefsFromSource(src);
    // Path must not appear when nothing references it.
    expect(found.has("/orphan-never-linked")).toBe(false);
  });

  it("captures generic path literals too (over-inclusive by design)", () => {
    // Over-inclusion is SAFE for orphan audit — only false-negatives
    // (missed reachability) are harmful. False positives just keep a
    // route listed as reachable.
    const src = `const HELP_URL = "/help/getting-started";`;
    expect(extractHrefsFromSource(src)).toContain("/help/getting-started");
  });
});

describe("Whitelist triage rule (codex §Whitelist Triage Rule)", () => {
  const WHITELIST_PATH = join(__dirname, "..", "..", "scripts", ".orphan-audit-whitelist.json");

  it("isAcceptableWhitelistReason accepts the three approved prefixes", () => {
    for (const prefix of ACCEPTABLE_WHITELIST_PREFIXES) {
      expect(isAcceptableWhitelistReason(`${prefix} — test reason`)).toBe(true);
    }
  });

  it("isAcceptableWhitelistReason rejects vague admin-only / deep-link reasons", () => {
    expect(isAcceptableWhitelistReason("admin-only, no public nav by design")).toBe(false);
    expect(isAcceptableWhitelistReason("deep-link from another page's click handler")).toBe(false);
    expect(isAcceptableWhitelistReason("internal tool")).toBe(false);
    expect(isAcceptableWhitelistReason("query-param driven drilldown")).toBe(false);
  });

  it("every entry in .orphan-audit-whitelist.json begins with an approved prefix", () => {
    if (!existsSync(WHITELIST_PATH)) {
      // Scanner not rolled out in this repo — nothing to assert.
      return;
    }
    const raw = readFileSync(WHITELIST_PATH, "utf8");
    const parsed = JSON.parse(raw) as {
      entries: ReadonlyArray<{ path: string; reason: string }>;
    };
    const offenders: string[] = [];
    for (const entry of parsed.entries) {
      if (!isAcceptableWhitelistReason(entry.reason)) {
        offenders.push(`${entry.path}: "${entry.reason}"`);
      }
    }
    expect(
      offenders,
      `Whitelist entries must start with one of ${ACCEPTABLE_WHITELIST_PREFIXES.join(
        " / ",
      )}. Offenders:\n  ${offenders.join("\n  ")}`,
    ).toHaveLength(0);
  });
});
