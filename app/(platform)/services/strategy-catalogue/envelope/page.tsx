"use client";

import { EnvelopeBrowser } from "@/components/strategy-catalogue/EnvelopeBrowser";

/**
 * Full combinatoric envelope view — 5k+ catalogue rows with 4-level filter
 * cascade (category → family → archetype → instance), virtualised, with
 * access-aware lock badges per slot.
 *
 * Reads from /api/catalogue/envelope (GCS proxy).
 */
export default function EnvelopePage(): React.ReactElement {
  return (
    <div className="container max-w-7xl py-6">
      <EnvelopeBrowser />
    </div>
  );
}
