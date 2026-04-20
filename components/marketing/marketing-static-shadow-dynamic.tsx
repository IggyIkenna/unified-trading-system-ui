"use client";

import MarketingStaticShadow from "@/components/marketing/marketing-static-shadow";
import type { MarketingShadowHeadLink } from "@/lib/marketing/load-marketing-static";

export type MarketingStaticShadowDynamicProps = {
  css: string;
  html: string;
  headLinks?: readonly MarketingShadowHeadLink[];
  scripts?: readonly string[];
};

/**
 * Client boundary so the parent can stay a Server Component (`loadMarketingStaticParts`).
 * We intentionally avoid `next/dynamic({ ssr: false })` here: with Turbopack dev, the lazy
 * boundary can remain on the `loading` fallback indefinitely when HMR/WebSocket is unhealthy,
 * which breaks Playwright (`marketing-static-host` never appears). The shadow host mounts in
 * the browser; the ref in `MarketingStaticShadow` sets `data-marketing-shadow` after commit.
 */
export function MarketingStaticShadowDynamic({ css, html, headLinks, scripts }: MarketingStaticShadowDynamicProps) {
  return <MarketingStaticShadow css={css} html={html} headLinks={headLinks} scripts={scripts ?? []} />;
}
