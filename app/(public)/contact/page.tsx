"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Handshake,
  Mail,
  MapPin,
  MessageSquare,
  Newspaper,
  Send,
  UserCheck,
} from "lucide-react";
import { CALENDLY_URL } from "@/lib/marketing/calendly";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/auth/firebase-config";
import { dispatchEmail } from "@/lib/email/client";
import type { EmailDispatchOutcome } from "@/lib/email/email-result";
import { EmailStatusBanner } from "@/components/email/email-status-banner";
import { SERVICE_LABELS, PUBLIC_ROUTE_PATHS } from "@/lib/copy/service-labels";
import { trackEvent } from "@/lib/marketing/analytics";

/**
 * Contact page — restructured per Phase 6 of
 * `marketing_site_three_route_consolidation_2026_04_26.plan.md`.
 *
 * The page is human-routing, not funnel-bypass:
 *   - Primary CTA at the top routes through `/start-your-review` so the lead
 *     conversion path stays consolidated. Calendly is intentionally demoted
 *     to a "Prefer to speak first?" sub-section lower on the page.
 *   - Four contact tracks (General · Existing client · Press · Advisor)
 *     surface the canonical email pattern (`info@odum-research.com`, with
 *     pre-tagged subjects so triage stays cheap) and a secondary route into
 *     the contact form / login as appropriate.
 *   - The Calendly sub-section preserves the existing path-specific 45-min
 *     fit calls (Investment Management / DART / Regulatory) using the
 *     marketing labels from `SERVICE_LABELS` SSOT.
 *
 * Banned-CTA discipline (Completion Patch §D): no "Get Started", "Apply Now",
 * "Request Demo", "Sign Up", "Access Platform". Legal-copy guardrails (§H):
 * no guaranteed-coverage language; "where appropriate" / "subject to review"
 * preferred.
 */

type ContactTrackId = "general" | "existing-client" | "press-partnerships" | "advisor-referral";

interface ContactTrack {
  readonly id: ContactTrackId;
  readonly title: string;
  readonly description: string;
  readonly cta: { readonly label: string; readonly href: string; readonly external: boolean };
  readonly icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_CONTACT_EMAIL = "info@odum-research.com";

function mailtoWithSubject(subject: string, body?: string): string {
  const params = new URLSearchParams({ subject });
  if (body) params.set("body", body);
  return `mailto:${PRIMARY_CONTACT_EMAIL}?${params.toString()}`;
}

const CONTACT_TRACKS: readonly ContactTrack[] = [
  {
    id: "general",
    title: "General enquiry",
    description:
      "Anything that doesn't fit the other tracks: questions about the firm, fit conversations, or replies to a previous thread.",
    cta: {
      label: "Email the team",
      href: mailtoWithSubject("General enquiry"),
      external: false,
    },
    icon: MessageSquare,
  },
  {
    id: "existing-client",
    title: "Existing client or counterparty",
    description:
      "Already onboarded? Sign in to reach the right desk through your authenticated portal: operational queries are routed there, not through the public form.",
    cta: { label: "Sign in", href: "/login", external: false },
    icon: UserCheck,
  },
  {
    id: "press-partnerships",
    title: "Press or partnerships",
    description:
      "Media enquiries, conference invites, vendor partnerships, or distribution conversations. Email with a one-line context note and we'll route it.",
    cta: {
      label: "Email press / partnerships",
      href: mailtoWithSubject(
        "Press or partnerships enquiry",
        "Please share a short note on the publication or partnership context.",
      ),
      external: false,
    },
    icon: Newspaper,
  },
  {
    id: "advisor-referral",
    title: "Advisor or referral",
    description:
      "Introducing a prospect, advising a client into Odum, or exploring an advisor relationship. Email with the context and we'll come back inside two business days.",
    cta: {
      label: "Email advisor desk",
      href: mailtoWithSubject("Advisor or referral", "Please share a short note on the relationship and the context."),
      external: false,
    },
    icon: Handshake,
  },
] as const;

interface FitCallOption {
  readonly id: "investment" | "dart" | "regulatory";
  readonly label: string;
  readonly tagline: string;
}

const FIT_CALL_OPTIONS: readonly FitCallOption[] = [
  {
    id: "investment",
    label: SERVICE_LABELS.investment.marketing,
    tagline: "SMA or pooled-fund routes; mandate fit, custody mechanic, fee shape.",
  },
  {
    id: "dart",
    label: SERVICE_LABELS.dart.marketing,
    tagline: "Research-to-execution stack, signals capability, reporting overlay.",
  },
  {
    id: "regulatory",
    label: SERVICE_LABELS.regulatory.marketing,
    tagline: "Engagement structuring where appropriate; reviewed case by case.",
  },
] as const;

interface ContactFormState {
  readonly name: string;
  readonly email: string;
  readonly company: string;
  readonly inquiry: string;
  readonly message: string;
}

const INITIAL_FORM_STATE: ContactFormState = {
  name: "",
  email: "",
  company: "",
  inquiry: "",
  message: "",
};

function ContactPageContent() {
  const searchParams = useSearchParams();
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");
  const [emailOutcome, setEmailOutcome] = React.useState<EmailDispatchOutcome | null>(null);
  const [formData, setFormData] = React.useState<ContactFormState>(INITIAL_FORM_STATE);
  const [prefillApplied, setPrefillApplied] = React.useState(false);

  // Pre-fill the message form from query params when a track or service hint
  // is passed in (e.g., footer Contact link, briefings access-code prompts).
  React.useEffect(() => {
    if (prefillApplied) return;
    const track = searchParams.get("track");
    const service = searchParams.get("service");
    if (!track && !service) {
      setPrefillApplied(true);
      return;
    }
    let inquiry = "general";
    let message = "";
    if (track === "press-partnerships") {
      inquiry = "press-partnerships";
      message =
        "I'm reaching out about a press or partnership enquiry. A short note on the publication / partnership context follows.";
    } else if (track === "advisor-referral") {
      inquiry = "advisor-referral";
      message = "I'm reaching out as an advisor / referrer. Short context on the relationship and prospect follows.";
    } else if (service === "investment-management" || service === "investment") {
      inquiry = "fit-call";
      message = `I'd like a 45-minute fit call on ${SERVICE_LABELS.investment.marketing}. Short note on the engagement type follows.`;
    } else if (
      service === "dart" ||
      service === "platform" ||
      service === "dart-full" ||
      service === "dart-signals-in"
    ) {
      inquiry = "fit-call";
      message = `I'd like a 45-minute fit call on ${SERVICE_LABELS.dart.marketing}. Short note on the engagement type follows.`;
    } else if (service === "regulatory") {
      inquiry = "fit-call";
      message = `I'd like a 45-minute fit call on ${SERVICE_LABELS.regulatory.marketing}. Short note on the engagement type follows.`;
    }
    setFormData((prev) => ({ ...prev, inquiry, message }));
    setPrefillApplied(true);
  }, [searchParams, prefillApplied]);

  const handleTrackClick = React.useCallback((trackId: ContactTrackId) => {
    trackEvent("contact_track_selected", { track: trackId });
  }, []);

  const handleFitCallClick = React.useCallback((service: FitCallOption["id"]) => {
    trackEvent("contact_track_selected", { track: "fit-call", service });
  }, []);

  const handleStartReviewClick = React.useCallback(() => {
    trackEvent("contact_track_selected", { track: "start-review" });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setEmailOutcome(null);
    try {
      const db = getFirebaseDb();
      if (db) {
        await addDoc(collection(db, "contact_submissions"), {
          ...formData,
          submittedAt: serverTimestamp(),
          source: "contact-page",
          destination: PRIMARY_CONTACT_EMAIL,
        });
      }
      const outcome = await dispatchEmail("/api/contact", { ...formData });
      setEmailOutcome(outcome);
      // "sent" and "skipped" both count as success — the durable Firestore
      // artefact has landed and ops will pick it up. "failed" keeps the form
      // visible with a red banner so the visitor can retry or use the
      // mailto fallback below.
      if (outcome.status !== "failed") {
        setSubmitted(true);
        trackEvent("contact_track_selected", { track: "form-submit", inquiry: formData.inquiry || "unspecified" });
      }
    } catch {
      setSubmitError(`Failed to send: please email us directly at ${PRIMARY_CONTACT_EMAIL}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Hero — primary CTA routes through Start Your Review (NOT direct
              Calendly). Calendly stays available below as a "speak first"
              option for time-sensitive enquiries. */}
          <section className="mb-12">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">Contact</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Contact Odum</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Most prospect conversations move faster after a short fit review. Start there if you can: the four contact
              tracks below cover everything else.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" onClick={handleStartReviewClick}>
                <Link href={PUBLIC_ROUTE_PATHS.startYourReview}>
                  Start Your Review
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={mailtoWithSubject("General enquiry")}>
                  <Mail className="mr-2 size-4" />
                  Email the team
                </a>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              The fit review is a short questionnaire: it routes you to the right briefing and the right desk. Replies
              within two business days.
            </p>
          </section>

          {/* Four contact tracks. Cards have consistent height + visual
              hierarchy per Completion Patch §E. */}
          <section className="mb-12">
            <h2 className="mb-2 text-2xl font-semibold">Contact tracks</h2>
            <p className="mb-6 text-sm text-muted-foreground">Pick the track that matches your enquiry.</p>
            <div className="grid gap-4 md:grid-cols-2">
              {CONTACT_TRACKS.map((track) => {
                const Icon = track.icon;
                return (
                  <Card
                    key={track.id}
                    className="flex h-full flex-col border-border/60 bg-card/50"
                    data-testid={`contact-track-${track.id}`}
                  >
                    <CardHeader>
                      <div className="mb-2 flex size-10 items-center justify-center rounded-md border border-border/60 bg-background/40">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{track.title}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">{track.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      {track.id === "existing-client" ? (
                        <Button asChild variant="outline" className="w-full" onClick={() => handleTrackClick(track.id)}>
                          <Link href={track.cta.href}>{track.cta.label}</Link>
                        </Button>
                      ) : (
                        <Button asChild variant="outline" className="w-full" onClick={() => handleTrackClick(track.id)}>
                          <a href={track.cta.href}>
                            <Mail className="mr-2 size-4" />
                            {track.cta.label}
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* "Prefer to speak first?" — keeps the path-specific Calendly
              option for time-sensitive enquiries, but framed as the
              second-preference path. */}
          <section className="mb-12 rounded-lg border border-border bg-card/30 p-6">
            <h2 className="text-lg font-semibold">Prefer to speak first?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              If your enquiry is time-sensitive or already specific, request a 45-minute fit call and include a short
              note on the engagement type. Coverage and fit are reviewed case by case; engagement scope is confirmed
              after the call.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {FIT_CALL_OPTIONS.map((option) => (
                <a
                  key={option.id}
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleFitCallClick(option.id)}
                  className="group flex flex-col rounded-md border border-border bg-background/40 p-4 text-left transition-colors hover:border-primary/60 hover:bg-accent"
                  data-testid={`fit-call-${option.id}`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <CalendarClock className="size-4 text-primary" />
                    {option.label}
                  </span>
                  <span className="mt-1 text-xs leading-relaxed text-muted-foreground">{option.tagline}</span>
                  <span className="mt-3 inline-flex items-center text-xs font-medium text-primary">
                    Request fit call
                    <ArrowRight className="ml-1 size-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* Send-us-a-message form — kept for visitors who don't want to
              email or book. Lower in the page so it doesn't compete with
              the primary Start Your Review path. */}
          <section className="mb-12">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Send a message</CardTitle>
                <CardDescription>Fill out the form below and we will respond within two business days.</CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <CheckCircle2 className="size-6 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold">Message sent</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Thank you for reaching out. We will respond to your enquiry within two business days.
                    </p>
                    <div className="mt-4">
                      <EmailStatusBanner
                        outcome={emailOutcome}
                        sentMessage="Your message has been emailed to the team."
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="mt-6"
                      onClick={() => {
                        setSubmitted(false);
                        setEmailOutcome(null);
                        setFormData(INITIAL_FORM_STATE);
                      }}
                    >
                      Send another message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <EmailStatusBanner outcome={emailOutcome} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full name *</Label>
                        <Input
                          id="name"
                          placeholder="Jane Smith"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="jane@firm.com"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          placeholder="Firm name"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inquiry">Enquiry type</Label>
                        <Input
                          id="inquiry"
                          placeholder="e.g. allocator fit, DART scoping, advisor"
                          value={formData.inquiry}
                          onChange={(e) => setFormData({ ...formData, inquiry: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us about your requirements, mandate context, or questions."
                        rows={6}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>

                    {submitError && <p className="text-sm text-red-500">{submitError}</p>}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">* Required fields</p>
                      <Button type="submit" disabled={submitting}>
                        <Send className="mr-2 size-4" />
                        {submitting ? "Sending…" : "Send message"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Office + direct email — institutional details, footer-style. */}
          <section className="mb-4 grid gap-4 md:grid-cols-2">
            <Card className="border-border/60 bg-card/30">
              <CardHeader>
                <Building2 className="mb-2 size-5 text-primary" />
                <CardTitle className="text-base">Registered office</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Odum Research Ltd
                  <br />
                  9 Appold Street
                  <br />
                  London, EC2A 2AP
                  <br />
                  United Kingdom
                </p>
                <p className="mt-3 inline-flex items-center gap-2 text-xs">
                  <MapPin className="size-3" />
                  Authorised &amp; regulated by the FCA: FRN 975797.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/30">
              <CardHeader>
                <Mail className="mb-2 size-5 text-primary" />
                <CardTitle className="text-base">Direct email</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Prefer email?{" "}
                  <a
                    href={`mailto:${PRIMARY_CONTACT_EMAIL}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {PRIMARY_CONTACT_EMAIL}
                  </a>
                  . Replies within two business days.
                </p>
                <p className="mt-3 text-xs">
                  Already onboarded? Sign in via{" "}
                  <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                    /login
                  </Link>{" "}
                  to reach the right desk through your authenticated portal.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function ContactPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="container px-4 py-12 md:px-6">
            <div className="mx-auto max-w-4xl">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Contact Odum</h1>
              <p className="mt-4 text-lg text-muted-foreground">Loading…</p>
            </div>
          </div>
        </div>
      }
    >
      <ContactPageContent />
    </React.Suspense>
  );
}
