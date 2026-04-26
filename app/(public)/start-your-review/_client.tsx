"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics/track";

/**
 * Client wrapper for `/start-your-review` — keeps analytics handlers on the
 * client while the page-shell metadata stays server-side.
 */
export function StartYourReviewClient() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-3xl">
          {/* Hero */}
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Start Your Review</p>
            <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Tell us what you&rsquo;re looking for, and we&rsquo;ll route the conversation properly.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              Odum works with a small number of allocators, trading teams, and regulated-structure prospects. Answering
              a short questionnaire lets us point you at the relevant briefing, the right engagement route, and the
              right next step &mdash; without a generic discovery call.
            </p>
          </div>

          {/* Primary card with CTAs */}
          <Card className="border-border/80 bg-card/60">
            <CardHeader>
              <CardTitle className="text-xl">The questionnaire takes a few minutes</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Six axes: who you are, the engagement type you&rsquo;re considering, the markets you operate in, the
                strategy styles relevant to your mandate, the structures you can use, and how you currently run trading
                or allocation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild size="lg">
                  <Link href="/questionnaire" onClick={() => trackEvent("start_review_begin_questionnaire_click")}>
                    Begin Questionnaire
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/contact" onClick={() => trackEvent("start_review_book_call_click")}>
                    Book a call instead
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Three-step explainer */}
          <section
            aria-labelledby="review-journey"
            className="mt-12 rounded-lg border border-border/60 bg-card/30 p-6 md:p-8"
          >
            <h2 id="review-journey" className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              What happens next
            </h2>
            <ol className="mt-5 space-y-5">
              <li className="flex gap-4">
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background text-xs font-semibold tabular-nums"
                >
                  1
                </span>
                <div>
                  <p className="font-medium text-foreground">Questionnaire</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    A few minutes. Your answers route you to the relevant briefing pillar and unlock the gated material.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background text-xs font-semibold tabular-nums"
                >
                  2
                </span>
                <div>
                  <p className="font-medium text-foreground">Briefings</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Three pillars covering Odum-managed strategies, DART trading infrastructure, and regulated operating
                    models. Read what applies; skip what doesn&rsquo;t.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background text-xs font-semibold tabular-nums"
                >
                  3
                </span>
                <div>
                  <p className="font-medium text-foreground">Fit call</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    If your situation looks like a fit on both sides, we schedule a focused call rather than a generic
                    intro &mdash; your answers do the priming.
                  </p>
                </div>
              </li>
            </ol>
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              If your enquiry is time-sensitive or already specific, you can skip the questionnaire and book a call
              directly via the secondary CTA above.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
