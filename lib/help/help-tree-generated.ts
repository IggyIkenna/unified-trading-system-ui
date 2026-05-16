/**
 * Generated help nodes — derived from the runtime SSOTs.
 *
 * The curated help-tree (lib/help/help-tree.ts) covers architectural
 * primitives: cockpit, scope, presets, FOMO, lifecycle, mock-mode. It does
 * NOT enumerate every individual widget / archetype / family / asset group
 * (~250 items today). Hand-writing all of those would drift the moment a
 * new register.ts ships.
 *
 * This module synthesises help nodes from:
 *   - Widget registry (~207 entries, with label / description / asset-group
 *     / scope axes baked in)
 *   - StrategyArchetype enum + ARCHETYPE_TO_FAMILY map (18 archetypes)
 *   - StrategyFamily enum + FAMILY_METADATA (8 families with descriptions)
 *   - VenueAssetGroupV2 enum (5 asset groups)
 *
 * The generated nodes are reachable via search (the existing flattenTree
 * walker indexes them automatically) and via a single "Browse the
 * catalogue" branch on the curated tree. We deliberately bury the flat
 * lists under grouping nodes so the chat tree menu doesn't render 207
 * buttons in one go.
 */

import "@/components/widgets/register-all";
import {
  getAllWidgets,
  getAllWidgetsByCatalogGroup,
  type WidgetDefinition,
} from "@/components/widgets/widget-registry";
import {
  ARCHETYPE_TO_FAMILY,
  STRATEGY_ARCHETYPES_V2,
  STRATEGY_FAMILIES_V2,
  VENUE_ASSET_GROUPS_V2,
  type StrategyArchetype,
  type StrategyFamily,
  type VenueAssetGroupV2,
} from "@/lib/architecture-v2/enums";
import { FAMILY_METADATA } from "@/lib/architecture-v2/families";

import type { HelpNode } from "./help-tree";

// ─────────────────────────────────────────────────────────────────────────────
// Cockpit-href synthesis — derive a deep link from widget metadata.
// ─────────────────────────────────────────────────────────────────────────────

function cockpitHrefForWidget(widget: WidgetDefinition): string {
  const params: string[] = ["surface=terminal"];
  // Pick a sensible Terminal mode from dartMeta if present, else default to
  // command (the most common landing).
  const mode = widget.dartMeta?.terminalModes?.[0] ?? "command";
  params.push(`tm=${mode}`);
  // Add the widget's asset_group as a scope chip, but only for per-asset-
  // group widgets (PLATFORM widgets shouldn't lock scope to one group).
  if (widget.assetGroup !== "PLATFORM") {
    params.push(`ag=${widget.assetGroup}`);
  }
  return `/services/workspace?${params.join("&")}`;
}

function cockpitHrefForArchetype(archetype: StrategyArchetype): string {
  return `/services/strategy-catalogue?arch=${archetype}`;
}

function cockpitHrefForFamily(family: StrategyFamily): string {
  return `/services/strategy-catalogue?fam=${family}`;
}

function cockpitHrefForAssetGroup(group: VenueAssetGroupV2): string {
  return `/services/workspace?surface=terminal&tm=command&ag=${group}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-widget node
// ─────────────────────────────────────────────────────────────────────────────

function widgetAnswer(widget: WidgetDefinition): string {
  const lines: string[] = [widget.description];
  // Where it lives.
  const surfaces = widget.dartMeta?.surfaces ?? ["terminal"];
  const terminalModes = widget.dartMeta?.terminalModes;
  const researchStages = widget.dartMeta?.researchStages;
  const where: string[] = [];
  if (surfaces.includes("terminal") && terminalModes && terminalModes.length > 0) {
    where.push(`Terminal modes: ${terminalModes.join(" / ")}`);
  } else if (surfaces.includes("terminal")) {
    where.push("Terminal (any mode)");
  }
  if (surfaces.includes("research") && researchStages && researchStages.length > 0) {
    where.push(`Research stages: ${researchStages.join(" / ")}`);
  } else if (surfaces.includes("research")) {
    where.push("Research (any stage)");
  }
  if (where.length > 0) {
    lines.push(`\n**Where it lives:** ${where.join("; ")}`);
  }
  // Scope axes.
  const scope: string[] = [];
  if (widget.assetGroup !== "PLATFORM") {
    scope.push(`asset_group=${widget.assetGroup}`);
  }
  if (widget.families && widget.families.length > 0) {
    scope.push(`family=${widget.families.join("/")}`);
  }
  if (widget.archetypes && widget.archetypes.length > 0) {
    scope.push(`archetype=${widget.archetypes.join("/")}`);
  }
  if (scope.length > 0) {
    lines.push(`**Scope axes that surface it:** ${scope.join(" · ")}`);
  } else {
    lines.push("**Scope:** cross-asset (renders on any scope).");
  }
  lines.push(`**Catalog group:** ${widget.catalogGroup}`);
  return lines.join("\n");
}

function widgetHelpNode(widget: WidgetDefinition): HelpNode {
  return {
    id: `widget-${widget.id}`,
    question: `What does the "${widget.label}" widget show?`,
    answer: widgetAnswer(widget),
    link: { href: cockpitHrefForWidget(widget), label: "Open in cockpit" },
  };
}

function generateWidgetCatalogueNode(): HelpNode {
  const byGroup = getAllWidgetsByCatalogGroup();
  const groupKeys = Object.keys(byGroup).sort();
  const groupChildren: HelpNode[] = groupKeys.map((groupKey) => {
    const widgets = [...byGroup[groupKey]].sort((a, b) => a.label.localeCompare(b.label));
    return {
      id: `widget-group-${groupKey.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      question: `${groupKey} (${widgets.length} widget${widgets.length === 1 ? "" : "s"})`,
      answer: `${widgets.length} widget${widgets.length === 1 ? "" : "s"} in the **${groupKey}** catalog group:\n\n${widgets
        .map((w) => `• **${w.label}** — ${w.description}`)
        .join("\n")}`,
      children: widgets.map(widgetHelpNode),
    };
  });

  const total = getAllWidgets().length;
  return {
    id: "browse-widgets",
    question: `Browse all widgets (${total})`,
    answer: `The cockpit ships **${total} widgets** across ${groupKeys.length} catalog groups. Pick a group to drill in — each widget tells you what it shows, where it lives in the cockpit (Terminal mode / Research stage), which scope axes surface it, and links straight to the cockpit shape that renders it.`,
    children: groupChildren,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-archetype node
// ─────────────────────────────────────────────────────────────────────────────

const ARCHETYPE_BLURB: Readonly<Record<StrategyArchetype, string>> = {
  ML_DIRECTIONAL_CONTINUOUS:
    "ML directional alpha on continuously-priced markets (perps, spot, FX). Model emits probability of next-bar direction; trades when probability exceeds implied.",
  ML_DIRECTIONAL_EVENT_SETTLED:
    "ML directional alpha on event-settled markets (sports, prediction markets). Model emits outcome probability; trades when probability gap vs implied is large.",
  RULES_DIRECTIONAL_CONTINUOUS:
    "Rule-based directional signal on continuously-priced markets. SMA/EMA crosses, momentum filters, news triggers — fires when a feature threshold is crossed.",
  RULES_DIRECTIONAL_EVENT_SETTLED:
    "Rule-based directional signal on event-settled markets. Pre-event filters (form, momentum, news) trigger directional bets that settle on event outcome.",
  CARRY_BASIS_DATED:
    "Cash-and-carry basis trade on dated futures. Long spot vs short dated future; harvests basis as future converges to spot.",
  CARRY_BASIS_PERP:
    "Funding-rate carry on perp futures. Long spot + short perp (or reverse) to capture funding payments delta-neutral.",
  CARRY_STAKED_BASIS:
    "Staked-asset basis trade. Long staking yield (e.g. wstETH / jitoSOL) hedged with a short on the underlying perp; captures staking APY minus funding.",
  CARRY_RECURSIVE_STAKED:
    "Recursive staked-basis with leverage. Loop staked-collateral lending → borrow → re-stake to amplify staking carry; multi-leg leveraged.",
  YIELD_ROTATION_LENDING:
    "Lending-rate rotation across DeFi protocols (Aave / Morpho / Compound). Move stablecoin supply to whichever pool offers the highest net rate.",
  YIELD_STAKING_SIMPLE:
    "Simple staking yield capture. Long the staked asset (no hedge), accept directional exposure for staking APY.",
  ARBITRAGE_PRICE_DISPERSION:
    "Cross-venue price-dispersion arbitrage. CEX vs CEX, CEX vs DEX, DEX vs DEX, sportsbook vs sportsbook — buy cheap leg, sell expensive leg, hedge.",
  LIQUIDATION_CAPTURE:
    "DeFi liquidation arbitrage via flash loans. Atomically borrow, repay underwater debt, claim the liquidation bonus, and repay the flash loan in one tx.",
  MARKET_MAKING_CONTINUOUS:
    "Two-sided liquidity provision on continuously-priced order books. Post bid + ask, capture spread, manage inventory.",
  MARKET_MAKING_EVENT_SETTLED:
    "Back/lay market-making on sports exchanges + prediction venues. Post both sides on a binary outcome, capture spread on volume.",
  EVENT_DRIVEN:
    "Trade the surprise of scheduled releases: macro prints, earnings, token unlocks, sports kickoff, prediction resolution.",
  VOL_TRADING_OPTIONS:
    "Implied vs realised vol arbitrage via options (straddle / strangle / iron condor / dispersion). v1 venues: Deribit + CME.",
  STAT_ARB_PAIRS_FIXED:
    "Co-integrated pair mean-reversion. Two assets, fixed weight, trade the spread when it dislocates from its mean.",
  STAT_ARB_CROSS_SECTIONAL:
    "Cross-sectional basket ranking. Rank universe on a feature, long top quintile / short bottom quintile, dollar-neutral.",
};

function archetypeHelpNode(archetype: StrategyArchetype): HelpNode {
  const family = ARCHETYPE_TO_FAMILY[archetype];
  const meta = FAMILY_METADATA[family];
  const blurb = ARCHETYPE_BLURB[archetype] ?? `Strategy archetype in the ${meta.label} family.`;
  return {
    id: `archetype-${archetype}`,
    question: `What is the ${archetype} archetype?`,
    answer: `${blurb}\n\n**Family:** ${meta.label} — ${meta.alphaSource}.`,
    link: { href: cockpitHrefForArchetype(archetype), label: "Open in Strategy Catalogue" },
  };
}

function generateArchetypeCatalogueNode(): HelpNode {
  // Group archetypes by family so the menu has 8 buckets rather than 18 flat
  // entries.
  const familyChildren: HelpNode[] = STRATEGY_FAMILIES_V2.map((family) => {
    const archetypes = STRATEGY_ARCHETYPES_V2.filter((a) => ARCHETYPE_TO_FAMILY[a] === family);
    const meta = FAMILY_METADATA[family];
    return {
      id: `archetype-group-${meta.slug}`,
      question: `${meta.label} archetypes (${archetypes.length})`,
      answer: `${archetypes.length} archetype${archetypes.length === 1 ? "" : "s"} in the **${meta.label}** family:\n\n${archetypes
        .map((a) => `• **${a}** — ${ARCHETYPE_BLURB[a] ?? "(no blurb)"}`)
        .join("\n")}`,
      children: archetypes.map(archetypeHelpNode),
    };
  }).filter((n) => n.children !== undefined && n.children.length > 0);

  return {
    id: "browse-archetypes",
    question: `Browse all strategy archetypes (${STRATEGY_ARCHETYPES_V2.length})`,
    answer: `**${STRATEGY_ARCHETYPES_V2.length} archetypes** across ${STRATEGY_FAMILIES_V2.length} families. Each archetype is a concrete strategy shape with a defined alpha source (carry, dispersion, vol, ML probability, …). Pick a family to drill in.`,
    children: familyChildren,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-family node
// ─────────────────────────────────────────────────────────────────────────────

function familyHelpNode(family: StrategyFamily): HelpNode {
  const meta = FAMILY_METADATA[family];
  return {
    id: `family-${family}`,
    question: `What is the ${meta.label} family?`,
    answer: `${meta.shortDescription}\n\n**Alpha source:** ${meta.alphaSource}.\n\n**Archetypes (${meta.archetypes.length}):**\n${meta.archetypes
      .map((a) => `• ${a} — ${ARCHETYPE_BLURB[a] ?? "(no blurb)"}`)
      .join("\n")}`,
    link: { href: cockpitHrefForFamily(family), label: "Open in Strategy Catalogue" },
  };
}

function generateFamilyCatalogueNode(): HelpNode {
  return {
    id: "browse-families",
    question: `Browse all strategy families (${STRATEGY_FAMILIES_V2.length})`,
    answer: `**${STRATEGY_FAMILIES_V2.length} families** in the v2 strategy taxonomy. Each family groups archetypes by alpha source — directional ML, rule-based directional, carry, structural arbitrage, market-making, event-driven, vol, stat arb. Pick one to see its archetypes.`,
    children: STRATEGY_FAMILIES_V2.map(familyHelpNode),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-asset-group node
// ─────────────────────────────────────────────────────────────────────────────

const ASSET_GROUP_BLURB: Readonly<Record<VenueAssetGroupV2, string>> = {
  CEFI: "Centralised crypto exchanges — spot, perps, futures, options. Venues: Binance, OKX, Bybit, Hyperliquid, Deribit, Kraken, etc. Account-style execution with API keys.",
  DEFI: "On-chain protocols — DEX swaps, lending pools, staking, restaking, flash loans. Protocols: Uniswap, Aave, Morpho, Compound, Lido, Jito, EigenLayer. Wallet-signed execution with gas + slippage.",
  SPORTS:
    "Sports betting venues — bookmakers and sports exchanges. Venues: Betfair (exchange), Bet365 / Pinnacle / Bookmaker (sportsbooks), plus aggregators. Event-settled markets.",
  TRADFI:
    "Traditional finance — equity index futures (ES / NQ / RTY), VIX, FX, rates futures, ETFs. Venues: CME, NYSE/Nasdaq via brokers. v1 scope: BTC/ETH-related futures + ETFs.",
  PREDICTION:
    "Prediction markets — Polymarket and binary-outcome event venues. Resolution-settled YES/NO markets on macro / political / crypto / sports events.",
};

function assetGroupHelpNode(group: VenueAssetGroupV2): HelpNode {
  return {
    id: `asset-group-${group}`,
    question: `What's traded in ${group}?`,
    answer: ASSET_GROUP_BLURB[group],
    link: { href: cockpitHrefForAssetGroup(group), label: "Open cockpit with this asset group" },
  };
}

function generateAssetGroupCatalogueNode(): HelpNode {
  return {
    id: "browse-asset-groups",
    question: `Browse all asset groups (${VENUE_ASSET_GROUPS_V2.length})`,
    answer: `**${VENUE_ASSET_GROUPS_V2.length} asset groups** the cockpit covers: ${VENUE_ASSET_GROUPS_V2.join(" / ")}. Each one is a top-level scope chip on the scope bar; toggling reshapes the cockpit grid + mock data.`,
    children: VENUE_ASSET_GROUPS_V2.map(assetGroupHelpNode),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Top-level browse-catalogue node — single entry point into the 4 generated
// branches. Surfaces in the curated help tree and gets indexed by the existing
// flattenTree search walker automatically.
// ─────────────────────────────────────────────────────────────────────────────

export function generateCatalogueHelpNode(): HelpNode {
  return {
    id: "browse-catalogue",
    question: "Browse the full catalogue (widgets, archetypes, families, asset groups)",
    answer:
      "The cockpit ships hundreds of primitives. Browse the four catalogues:\n\n• **Widgets** — the panels that render in the cockpit grid\n• **Archetypes** — concrete strategy shapes (CARRY_BASIS_PERP, ARBITRAGE_PRICE_DISPERSION, …)\n• **Families** — alpha-source groupings (Carry & Yield, Vol Trading, Market Making, …)\n• **Asset groups** — CEFI / DEFI / SPORTS / TRADFI / PREDICTION\n\nEach entry tells you what the thing is and links straight to the cockpit shape (or catalogue filter) that surfaces it. Search also works directly: type a widget name, archetype id, or family label.",
    children: [
      generateWidgetCatalogueNode(),
      generateArchetypeCatalogueNode(),
      generateFamilyCatalogueNode(),
      generateAssetGroupCatalogueNode(),
    ],
  };
}
