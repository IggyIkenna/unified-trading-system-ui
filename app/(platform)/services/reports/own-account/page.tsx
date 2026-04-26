/**
 * Own-account reports — this org's perf + invoices.
 *
 * Funnel Coherence plan Workstream D2 + D4. Splits the Reports tile into
 * two sub-surfaces:
 *   - /services/reports/strategy-catalogue (general — house catalogue)
 *   - /services/reports/own-account (this surface — org-specific)
 *
 * Empty state when the org has not connected venue credentials. Populated
 * state shows the org's perf + invoices view (renders the existing
 * `/services/reports/overview` payload — no fork; we just gate display on
 * the credential-upload state).
 */

import OwnAccountClient from "./_client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return <OwnAccountClient />;
}
