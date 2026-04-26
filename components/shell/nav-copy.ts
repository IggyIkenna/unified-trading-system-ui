/**
 * Shell nav label for the public /platform page: data registries & ETL,
 * feature subscriptions, research (backtests, ML), and trading terminal
 * (batch vs live, analytics, promotion paths).
 *
 * DART = Data Analytics, Research & Trading.
 *
 * Codex SSOT: unified-trading-pm/codex/14-playbooks/glossary.md
 * Display-label SSOT: lib/copy/service-labels.ts (SERVICE_LABELS.dart.marketing)
 *
 * Why two values here: the compact nav label is "DART" (chip/tag context),
 * the long-form label "DART Trading Infrastructure" is used on the engagement-route
 * page itself, briefings, and homepage cards.
 */
import { SERVICE_LABELS } from "@/lib/copy/service-labels";

export const PLATFORM_MARKETING_NAV_LABEL = "DART";
export const PLATFORM_MARKETING_NAV_LABEL_LONG = SERVICE_LABELS.dart.marketing;
