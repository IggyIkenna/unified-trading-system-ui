/**
 * Lightweight analytics helper for public marketing pages.
 *
 * Per `marketing_site_three_route_consolidation_2026_04_26` Completion Patch §I,
 * the public site fires named events on key prospect interactions:
 *   - homepage_start_review_click
 *   - homepage_contact_click
 *   - start_review_begin_questionnaire_click
 *   - start_review_book_call_click
 *   - engagement_route_card_click
 *   - briefings_unlock_success
 *   - briefings_book_fit_call_click
 *   - strategy_review_link_opened
 *   - strategy_review_book_demo_click
 *   - contact_track_selected
 *
 * The codebase does not yet wire a third-party analytics SDK. To stay forward
 * compatible without introducing one, `trackEvent` pushes a typed object onto
 * `window.dataLayer` (Google Tag Manager-compatible) when present, and
 * otherwise no-ops in production. In development, events are echoed to
 * `console.debug` so that wiring can be verified against the Completion Patch
 * §I list during local QA.
 *
 * SSR-safe: the helper checks for `window` before any access. `properties`
 * values are restricted to JSON-serialisable scalars to keep payloads
 * compatible with downstream tag-manager pipelines.
 */

export type AnalyticsScalar = string | number | boolean | null;
export type AnalyticsProperties = Readonly<Record<string, AnalyticsScalar>>;

interface DataLayerEntry extends Record<string, AnalyticsScalar> {
  event: string;
}

interface MarketingWindow {
  dataLayer?: DataLayerEntry[];
}

export function trackEvent(name: string, properties: AnalyticsProperties = {}): void {
  if (typeof window === "undefined") return;
  const entry: DataLayerEntry = { event: name, ...properties };
  const win = window as unknown as MarketingWindow;
  if (Array.isArray(win.dataLayer)) {
    win.dataLayer.push(entry);
  }
  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", name, properties);
  }
}
