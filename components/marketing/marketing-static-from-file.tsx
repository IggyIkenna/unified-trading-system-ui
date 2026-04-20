import { MarketingStaticShadowDynamic } from "@/components/marketing/marketing-static-shadow-dynamic";
import type { MarketingStaticFilename } from "@/lib/marketing/load-marketing-static";
import { loadMarketingStaticParts } from "@/lib/marketing/load-marketing-static";

/**
 * Server: read `public/*.html` once per request. Client subtree (`marketing-static-shadow-dynamic`)
 * mounts `MarketingStaticShadow`, whose ref callback sets `data-marketing-shadow="ready"`
 * when the host mounts (Playwright / MCP).
 */
export function MarketingStaticFromFile({ file }: { file: MarketingStaticFilename }) {
  const { css, html, headLinks, scripts } = loadMarketingStaticParts(file);
  return <MarketingStaticShadowDynamic css={css} html={html} headLinks={headLinks} scripts={scripts} />;
}
