import { Button } from "@/components/ui/button";
import Link from "next/link";
import { renderWithTerms } from "@/components/marketing/render-with-terms";
import type { BriefingCta } from "@/lib/briefings/content";

/**
 * BriefingHero — single-message hero for every `/briefings/<slug>` page.
 *
 * Rule 02 (tone-and-posture): calm, specific, credible. One TL;DR sentence up top,
 * one primary CTA. No bulleted wall above the fold. The longer body renders below
 * the hero.
 *
 * Rendered identifier: `[data-briefing-hero]` — Playwright asserts this exists on
 * every briefing slug page.
 *
 * Codex SSOT: unified-trading-pm/codex/14-playbooks/experience/briefings-hub.md
 */
export interface BriefingHeroProps {
  readonly title: string;
  readonly tldr: string;
  readonly cta: BriefingCta;
}

export function BriefingHero({ title, tldr, cta }: BriefingHeroProps) {
  return (
    <section
      data-briefing-hero=""
      className="space-y-4 border-b border-border/40 pb-8"
    >
      <h1 className="text-page-title font-semibold tracking-tight">{title}</h1>
      <p className="text-body text-foreground/90 max-w-2xl">{renderWithTerms(tldr)}</p>
      <div className="pt-1" data-testid="briefing-primary-cta">
        <Button asChild size="sm">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      </div>
    </section>
  );
}
