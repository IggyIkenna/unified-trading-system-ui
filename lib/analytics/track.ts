/**
 * Lightweight analytics helper for marketing-page CTAs.
 *
 * Plan: `marketing_site_three_route_consolidation_2026_04_26.plan.md`
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
  | "briefings_unlock_success"
  | "briefings_book_fit_call_click"
  | "strategy_review_link_opened"
  | "strategy_review_book_demo_click"
  | "contact_track_selected";

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
