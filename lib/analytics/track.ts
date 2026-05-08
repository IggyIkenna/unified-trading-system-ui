/**
 * Lightweight analytics helper for marketing-page CTAs.
 *
 * Plan: `marketing_site_three_route_consolidation_2026_04_26.md`
 * (Completion Patch §I — Analytics / instrumentation).
 *
 * Phase 3 ships the event taxonomy and call sites; the actual SDK wiring
 * (GA4 / GTM / PostHog / Plausible / etc.) lands in the audit pass. Until
 * then, events are forwarded to `window.dataLayer` (the GTM standard) so a
 * tag-manager wire-up does not require additional code changes, and to the
 * console under `[odum-track]` for local-dev visibility.
 *
 * Event names defined in the plan §I:
 *   - homepage_start_review_click
 *   - homepage_contact_click
 *   - engagement_route_card_click
 *   - start_review_begin_questionnaire_click
 *   - start_review_book_call_click
 *   - briefings_unlock_success
 *   - briefings_book_fit_call_click
 *   - strategy_review_link_opened
 *   - strategy_review_book_demo_click
 *   - contact_track_selected
 */

type DataLayerWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
};

export type TrackedEventName =
  | "homepage_start_review_click"
  | "homepage_contact_click"
  | "engagement_route_card_click"
  | "start_review_begin_questionnaire_click"
  | "start_review_book_call_click"
  | "start_review_skip_to_book_click"
  | "briefings_unlock_success"
  | "briefings_book_fit_call_click"
  | "strategy_review_link_opened"
  | "strategy_review_book_demo_click"
  | "contact_track_selected"
  | "workspace.scope.change"
  | "workspace.preset.applied"
  | "workspace.engagement.toggle"
  | "workspace.execution_stream.toggle"
  | "workspace.locked_preview.click";

export function trackEvent(
  event: TrackedEventName,
  payload?: Readonly<Record<string, string | number | boolean>>,
): void {
  if (typeof window === "undefined") {
    return;
  }
  const w = window as DataLayerWindow;
  const entry: Record<string, unknown> = { event, ...(payload ?? {}) };
  if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push(entry);
  } else {
    w.dataLayer = [entry];
  }
  if (process.env.NODE_ENV !== "production") {
    console.debug("[odum-track]", event, payload ?? {});
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Workspace scope-change instrumentation (§4.2)
// ─────────────────────────────────────────────────────────────────────────────

interface MinimalScopeChangeEvent {
  readonly source: string;
  readonly timestamp: string;
  readonly userId: string | null;
  readonly sessionId: string | null;
  readonly previousScope?: unknown;
  readonly nextScope?: unknown;
}

/**
 * Track a scope-change event. Detail-rich variant of `trackEvent` — emits the
 * full ScopeChangeEvent contract so funnel analytics can replay scope
 * transitions.
 *
 * The full previous/next scope objects are forwarded to dataLayer (downstream
 * tag manager can decide how much to retain) but logged only in summarised
 * form to the dev-mode console to avoid noise.
 */
export function trackScopeChange(event: MinimalScopeChangeEvent): void {
  if (typeof window === "undefined") return;
  const w = window as DataLayerWindow;
  const entry: Record<string, unknown> = {
    event: "workspace.scope.change",
    source: event.source,
    timestamp: event.timestamp,
    userId: event.userId,
    sessionId: event.sessionId,
    previousScope: event.previousScope,
    nextScope: event.nextScope,
  };
  if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push(entry);
  } else {
    w.dataLayer = [entry];
  }
  if (process.env.NODE_ENV !== "production") {
    console.debug("[odum-track] workspace.scope.change", `source=${event.source}`, `ts=${event.timestamp}`);
  }
}
