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
          {/* Hero — pitched as a qualified access point, not a workflow
              explainer. Eyebrow + headline + one short body paragraph;
              the surrounding "what happens next" rail handles procedural
              detail so the hero stays clean. */}
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Start Your Review</p>
            <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Find the right route into Odum.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              A short review helps us understand whether you are allocating capital, operating a strategy, or exploring
              a regulated structure &mdash; then point you to the relevant briefing and next step.
            </p>
          </div>

          {/* Primary card with CTAs */}
          <Card className="border-border/80 bg-card/60">
            <CardHeader>
              <CardTitle className="text-xl">A short routing review</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Answer a few questions about your mandate, markets, structure, and operating needs. We use this to share
                the most relevant briefing before a call.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild size="lg">
                  <Link href="/questionnaire" onClick={() => trackEvent("start_review_begin_questionnaire_click")}>
                    Start review
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/contact" onClick={() => trackEvent("start_review_book_call_click")}>
                    Book a call
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Three-step rail — kept as scan structure but copy stripped of
              "questionnaire mechanics" framing. Reads as outcome-led
              ("Short review → Relevant briefing → Focused call") rather
              than instructional. */}
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
                  <p className="font-medium text-foreground">Short review</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Tell us what you are looking to allocate, build, run, or structure.
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
                  <p className="font-medium text-foreground">Relevant briefing</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    We share the material that fits your route: Odum-Managed Strategies, DART, or Regulated Operating
                    Models.
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
                  <p className="font-medium text-foreground">Focused call</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    If there is a fit, we use the call to discuss the specific mandate rather than run a generic
                    introduction.
                  </p>
                </div>
              </li>
            </ol>
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              Already know exactly what you need?{" "}
              <Link
                href="/contact"
                onClick={() => trackEvent("start_review_skip_to_book_click")}
                className="underline-offset-4 hover:underline"
              >
                Book a call instead
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
