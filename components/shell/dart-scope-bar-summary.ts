/**
 * Compact summary text for the DartScopeBar.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan §6:
 *
 *   "Scope: Cross-asset · Arbitrage · Price Dispersion · BTC/ETH ·
 *    CeFi + DeFi · Monitor · Paper"
 *
 * The compact line reads like a sentence — most-meaningful axes first
 * (asset group, family, archetype, share class), then context dials
 * (engagement, stream). Empty axes collapse to "Cross-asset" / "All
 * families" / "All archetypes" rather than showing as gaps.
 */

import type { WorkspaceScope } from "@/lib/architecture-v2/workspace-scope";
import { formatArchetype, formatFamily } from "@/lib/strategy-display";

const ASSET_GROUP_DISPLAY: Record<string, string> = {
  CEFI: "CeFi",
  DEFI: "DeFi",
  TRADFI: "TradFi",
  SPORTS: "Sports",
  PREDICTION: "Prediction",
};

function joinAssetGroups(groups: readonly string[]): string {
  if (groups.length === 0) return "Cross-asset";
  return groups.map((g) => ASSET_GROUP_DISPLAY[g] ?? g).join(" + ");
}

function joinShareClasses(classes: readonly string[]): string | null {
  if (classes.length === 0) return null;
  return classes.join("/");
}

function familyLabel(families: readonly string[]): string {
  if (families.length === 0) return "All families";
  if (families.length === 1) return formatFamily(families[0]);
  return `${families.length} families`;
}

function archetypeLabel(archetypes: readonly string[]): string | null {
  if (archetypes.length === 0) return null;
  if (archetypes.length === 1) return formatArchetype(archetypes[0]);
  return `${archetypes.length} archetypes`;
}

function engagementLabel(engagement: WorkspaceScope["engagement"]): string {
  return engagement === "monitor" ? "Monitor" : "Replicate";
}

function streamLabel(stream: WorkspaceScope["executionStream"]): string {
  return stream === "paper" ? "Paper" : "Live";
}

/**
 * Compose the compact summary line. Returned as the segments-array form so
 * the renderer can intersperse `·` separators without manually splitting
 * the string.
 */
export function compactScopeSegments(scope: WorkspaceScope): readonly string[] {
  const segments: string[] = [];

  segments.push(joinAssetGroups(scope.assetGroups));
  segments.push(familyLabel(scope.families));

  const arch = archetypeLabel(scope.archetypes);
  if (arch) segments.push(arch);

  const sc = joinShareClasses(scope.shareClasses);
  if (sc) segments.push(sc);

  segments.push(engagementLabel(scope.engagement));
  segments.push(streamLabel(scope.executionStream));

  return segments;
}

/** Convenience — `Scope: <segments joined by " · ">`. */
export function compactScopeLine(scope: WorkspaceScope): string {
  return `Scope: ${compactScopeSegments(scope).join(" · ")}`;
}
