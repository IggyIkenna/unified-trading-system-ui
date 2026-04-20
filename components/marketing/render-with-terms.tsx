import * as React from "react";
import { Term } from "@/components/marketing/term";

/**
 * Token-substitution renderer for copy strings that want inline glossary
 * tooltips without widening the underlying `string` types.
 *
 * Usage in copy:
 *   "... plug signals into {{term:cefi}} venues ..."
 *   "... pay the {{term:hwm|high-water mark}} ..."
 *
 * Token syntax:
 *   {{term:<id>}}            — renders <Term id="id" /> with the glossary's
 *                               canonical label as visible text.
 *   {{term:<id>|<label>}}    — renders <Term id="id">label</Term> so copy can
 *                               keep its exact phrasing while the tooltip key
 *                               stays stable (e.g. "CeFi venues" with id=cefi).
 *
 * Unknown ids fall through to plain text via Term's own fallback, so a typo
 * never breaks a page.
 *
 * First-mention convention: wrap the first mention of a term per briefing/
 * section. Subsequent mentions in the same body stay plain to avoid visual
 * noise (dotted underlines everywhere reads as TOO hedge-y).
 */

const TERM_TOKEN_PATTERN = /\{\{term:([a-z][a-z0-9-]*)(?:\|([^}]+))?\}\}/g;

export function renderWithTerms(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let keyCounter = 0;
  for (const match of text.matchAll(TERM_TOKEN_PATTERN)) {
    const id = match[1];
    const customLabel = match[2];
    const matchIndex = match.index ?? 0;
    if (!id) continue;
    if (matchIndex > lastIndex) {
      nodes.push(text.slice(lastIndex, matchIndex));
    }
    nodes.push(
      <Term key={`term-${keyCounter++}`} id={id}>
        {customLabel ?? undefined}
      </Term>,
    );
    lastIndex = matchIndex + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes.length > 0 ? nodes : [text];
}

/**
 * Apply both the glossary token-substitution pass AND an outer transform
 * (e.g. the briefings page's `linkify` for `/briefings/<slug>` references).
 * Preserves relative order — tokens inside a linked segment still render.
 */
export function composeRenderers(
  text: string,
  outer: (chunk: string) => React.ReactNode[],
): React.ReactNode[] {
  // Run the outer transform first; for each plain-string chunk it yields,
  // run the term-token pass. For non-string nodes, pass through unchanged.
  const outerNodes = outer(text);
  const out: React.ReactNode[] = [];
  let keyCounter = 0;
  for (const node of outerNodes) {
    if (typeof node === "string") {
      for (const inner of renderWithTerms(node)) {
        out.push(
          typeof inner === "string"
            ? inner
            : React.cloneElement(inner as React.ReactElement, {
                key: `composed-term-${keyCounter++}`,
              }),
        );
      }
    } else {
      out.push(node);
    }
  }
  return out;
}
