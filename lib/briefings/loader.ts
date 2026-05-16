import * as yaml from "js-yaml";
import * as fs from "node:fs";
import * as path from "node:path";
import { CALENDLY_URL } from "../marketing/calendly";
import type { BriefingHub, BriefingPillar, BriefingPillarSlug, BriefingSection } from "./types";

/**
 * Briefing YAML loader — reads `content/briefings/*.yaml` at build time
 * and returns typed `BriefingPillar` records + the hub index.
 *
 * Runs server-side only (Next.js RSC / build step). Never import from a
 * client component. The loader is synchronous + cached per-process; Next.js
 * re-creates the process on each rebuild so no invalidation is needed.
 *
 * SSOT: content/briefings/*.yaml. The codex markdown
 * (`unified-trading-pm/codex/14-playbooks/experience/*briefing*.md`) is the
 * editable draft; parity CI (`scripts/validate-briefings-yaml.ts`) asserts
 * the YAML covers every codex briefing file.
 *
 * Plan: unified-trading-pm/plans/active/refactor_g3_3_briefings_cms_migration_2026_04_20.md
 */

/**
 * Closed slug vocabulary. Matches `BriefingPillarSlug` in `./types`.
 * Duplicated here as a runtime list so `isValidSlug` + the loader can
 * validate YAML content without parsing the TS type.
 */
const VALID_PILLAR_SLUGS: readonly BriefingPillarSlug[] = [
  "investment-management",
  "dart-trading-infrastructure",
  "regulated-operating-models",
];

const VALID_APPLIES_TO = new Set(["signals-in", "full-pipeline", "both"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function isValidSlug(slug: string): slug is BriefingPillarSlug {
  return (VALID_PILLAR_SLUGS as readonly string[]).includes(slug);
}

/**
 * YAML uses `href: /contact` for scheduling-intent CTAs. Resolve to the
 * single Calendly SSOT (`lib/marketing/calendly.ts`) so hub + pillar copy
 * stay aligned with the app without hardcoding the URL in every file.
 */
function resolveBriefingCtaHref(href: string): string {
  return href === "/contact" ? CALENDLY_URL : href;
}

function parsePillar(raw: unknown, sourcePath: string): BriefingPillar {
  if (!isRecord(raw)) {
    throw new Error(`[briefings-loader] ${sourcePath}: root must be a mapping`);
  }
  const { slug, title, tldr, frame, sections, keyMessages, nextCall, cta } = raw;
  if (typeof slug !== "string" || !isValidSlug(slug)) {
    throw new Error(
      `[briefings-loader] ${sourcePath}: slug must be one of ${VALID_PILLAR_SLUGS.join(", ")} (got: ${String(slug)})`,
    );
  }
  if (typeof title !== "string" || title.length === 0) {
    throw new Error(`[briefings-loader] ${sourcePath}: title must be a non-empty string`);
  }
  if (typeof tldr !== "string" || tldr.length === 0) {
    throw new Error(`[briefings-loader] ${sourcePath}: tldr must be a non-empty string`);
  }
  if (typeof frame !== "string" || frame.length === 0) {
    throw new Error(`[briefings-loader] ${sourcePath}: frame must be a non-empty string`);
  }
  if (typeof nextCall !== "string" || nextCall.length === 0) {
    throw new Error(`[briefings-loader] ${sourcePath}: nextCall must be a non-empty string`);
  }
  if (!Array.isArray(sections) || sections.length === 0) {
    throw new Error(`[briefings-loader] ${sourcePath}: sections must be a non-empty list`);
  }
  if (!isStringArray(keyMessages) || keyMessages.length === 0) {
    throw new Error(`[briefings-loader] ${sourcePath}: keyMessages must be a non-empty string list`);
  }
  if (!isRecord(cta) || typeof cta.label !== "string" || typeof cta.href !== "string") {
    throw new Error(`[briefings-loader] ${sourcePath}: cta must have {label, href} strings`);
  }
  const parsedSections: BriefingSection[] = sections.map((s, i) => {
    if (!isRecord(s)) {
      throw new Error(`[briefings-loader] ${sourcePath}: sections[${i}] must be a mapping`);
    }
    if (typeof s.title !== "string" || typeof s.body !== "string") {
      throw new Error(`[briefings-loader] ${sourcePath}: sections[${i}] requires string title + body`);
    }
    const section: BriefingSection = {
      title: s.title,
      body: s.body,
      ...(s.appliesTo !== undefined
        ? {
          appliesTo: (() => {
            if (typeof s.appliesTo !== "string" || !VALID_APPLIES_TO.has(s.appliesTo)) {
              throw new Error(
                `[briefings-loader] ${sourcePath}: sections[${i}].appliesTo must be one of signals-in|full-pipeline|both`,
              );
            }
            return s.appliesTo as BriefingSection["appliesTo"];
          })(),
        }
        : {}),
      ...(s.bullets !== undefined
        ? {
          bullets: (() => {
            if (!isStringArray(s.bullets)) {
              throw new Error(`[briefings-loader] ${sourcePath}: sections[${i}].bullets must be a string list`);
            }
            return s.bullets;
          })(),
        }
        : {}),
      ...(s.bodyAfter !== undefined
        ? {
          bodyAfter: (() => {
            if (typeof s.bodyAfter !== "string") {
              throw new Error(`[briefings-loader] ${sourcePath}: sections[${i}].bodyAfter must be a string`);
            }
            return s.bodyAfter;
          })(),
        }
        : {}),
    };
    return section;
  });
  return {
    slug,
    title,
    tldr,
    frame,
    sections: parsedSections,
    keyMessages,
    nextCall,
    cta: { label: cta.label, href: resolveBriefingCtaHref(cta.href) },
  };
}

function parseHub(raw: unknown, sourcePath: string): BriefingHub {
  if (!isRecord(raw)) {
    throw new Error(`[briefings-loader] ${sourcePath}: root must be a mapping`);
  }
  const { title, tldr, cta, displayOrder, intro } = raw;
  if (typeof title !== "string") {
    throw new Error(`[briefings-loader] ${sourcePath}: title must be a string`);
  }
  if (typeof tldr !== "string") {
    throw new Error(`[briefings-loader] ${sourcePath}: tldr must be a string`);
  }
  if (intro !== undefined && typeof intro !== "string") {
    throw new Error(`[briefings-loader] ${sourcePath}: intro must be a string when present`);
  }
  if (!isRecord(cta) || typeof cta.label !== "string" || typeof cta.href !== "string") {
    throw new Error(`[briefings-loader] ${sourcePath}: cta must have {label, href} strings`);
  }
  if (!isStringArray(displayOrder)) {
    throw new Error(`[briefings-loader] ${sourcePath}: displayOrder must be a list of pillar slugs`);
  }
  for (const slug of displayOrder) {
    if (!isValidSlug(slug)) {
      throw new Error(`[briefings-loader] ${sourcePath}: displayOrder contains unknown slug '${slug}'`);
    }
  }
  return {
    title,
    tldr,
    ...(typeof intro === "string" && intro.length > 0 ? { intro } : {}),
    cta: { label: cta.label, href: resolveBriefingCtaHref(cta.href) },
    displayOrder: displayOrder as BriefingPillarSlug[],
  };
}

const CONTENT_DIR = path.resolve(process.cwd(), "content", "briefings");

interface LoadedContent {
  readonly pillars: readonly BriefingPillar[];
  readonly pillarBySlug: ReadonlyMap<BriefingPillarSlug, BriefingPillar>;
  readonly hub: BriefingHub;
}

let cached: LoadedContent | null = null;

function loadContentFromDisk(): LoadedContent {
  if (!fs.existsSync(CONTENT_DIR)) {
    throw new Error(
      `[briefings-loader] content directory missing: ${CONTENT_DIR}. Run tsx scripts/migrate-briefings-from-codex.ts --write`,
    );
  }
  const hubPath = path.join(CONTENT_DIR, "_hub.yaml");
  if (!fs.existsSync(hubPath)) {
    throw new Error(`[briefings-loader] hub file missing: ${hubPath}`);
  }
  const hubRaw = yaml.load(fs.readFileSync(hubPath, "utf8"));
  const hub = parseHub(hubRaw, hubPath);

  const pillars: BriefingPillar[] = [];
  for (const slug of VALID_PILLAR_SLUGS) {
    const pillarPath = path.join(CONTENT_DIR, `${slug}.yaml`);
    if (!fs.existsSync(pillarPath)) {
      throw new Error(`[briefings-loader] pillar file missing: ${pillarPath}`);
    }
    const raw = yaml.load(fs.readFileSync(pillarPath, "utf8"));
    pillars.push(parsePillar(raw, pillarPath));
  }
  // Order pillars by the hub's displayOrder for a stable iteration order.
  // Any pillar not in displayOrder appends at the end in slug order.
  const orderMap = new Map<BriefingPillarSlug, number>();
  hub.displayOrder.forEach((slug, i) => orderMap.set(slug, i));
  pillars.sort((a, b) => {
    const ia = orderMap.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
    const ib = orderMap.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
    if (ia !== ib) return ia - ib;
    return a.slug.localeCompare(b.slug);
  });

  const bySlug = new Map<BriefingPillarSlug, BriefingPillar>();
  for (const p of pillars) bySlug.set(p.slug, p);
  return { pillars, pillarBySlug: bySlug, hub };
}

function getContent(): LoadedContent {
  if (cached === null) {
    cached = loadContentFromDisk();
  }
  return cached;
}

/**
 * Returns all briefing pillars, ordered by `_hub.yaml.displayOrder`.
 * Safe to call from any server component / build-time code path.
 */
export function getAllBriefings(): readonly BriefingPillar[] {
  return getContent().pillars;
}

/**
 * Looks up a single pillar by slug. Returns `undefined` for unknown slugs
 * so pages can call `notFound()` cleanly.
 */
export function getBriefing(slug: string): BriefingPillar | undefined {
  if (!isValidSlug(slug)) return undefined;
  return getContent().pillarBySlug.get(slug);
}

/**
 * Returns the hub-level framing copy (title, tldr, cta, display order).
 */
export function getBriefingsHub(): BriefingHub {
  return getContent().hub;
}

/**
 * Re-export the closed slug list for callers that need to build static
 * params or enumerate pillars without loading content.
 */
export { VALID_PILLAR_SLUGS };
