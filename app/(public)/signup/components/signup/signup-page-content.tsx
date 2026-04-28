"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import { QUESTIONNAIRE_ENVELOPE_LOCAL_STORAGE_KEY, QUESTIONNAIRE_LOCAL_STORAGE_KEY } from "@/lib/questionnaire/types";

import { GenericSignup } from "./generic-signup";
import { OnboardingWizard } from "./onboarding-wizard";
import { ONBOARDING_SERVICES } from "./signup-data";

export function SignupPageContent() {
  const searchParams = useSearchParams();
  const service = searchParams.get("service");
  const questionnaireState = useQuestionnaireState();

  // Until we've checked localStorage, render nothing — avoids a flash of
  // the "please fill the questionnaire" prompt before we know the user
  // already has a response saved.
  if (questionnaireState === "loading") return null;

  if (questionnaireState === "missing") {
    return <QuestionnairePrompt service={service ?? undefined} />;
  }

  // questionnaireState === "present" — render the normal signup surface.
  if (service && ONBOARDING_SERVICES.has(service))
    return (
      <>
        <QuestionnaireAttachedBanner email={questionnaireState.email} />
        <OnboardingWizard serviceType={service as "regulatory" | "investment"} />
      </>
    );
  return (
    <>
      <QuestionnaireAttachedBanner email={questionnaireState.email} />
      <GenericSignup />
    </>
  );
}

type QuestionnaireState = "loading" | "missing" | { readonly kind: "present"; readonly email: string | null };

function useQuestionnaireState(): QuestionnaireState {
  const [state, setState] = React.useState<QuestionnaireState>("loading");
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const response = window.localStorage.getItem(QUESTIONNAIRE_LOCAL_STORAGE_KEY);
    if (response === null || response.length === 0) {
      setState("missing");
      return;
    }
    const envelopeRaw = window.localStorage.getItem(QUESTIONNAIRE_ENVELOPE_LOCAL_STORAGE_KEY);
    let email: string | null = null;
    if (envelopeRaw !== null) {
      try {
        const parsed = JSON.parse(envelopeRaw) as { email?: unknown };
        if (typeof parsed.email === "string" && parsed.email.length > 0) {
          email = parsed.email;
        }
      } catch {
        // Envelope is optional; treat parse errors as "no email on file".
      }
    }
    setState({ kind: "present", email });
  }, []);
  return state === "loading" || state === "missing" ? state : state;
}

/** Gate card shown when no questionnaire response is on file yet.
 *  Preserves the `?service=` query param so return-to-signup keeps context. */
function QuestionnairePrompt({ service }: { service?: string }) {
  const questionnaireHref =
    service && service.length > 0
      ? `/questionnaire?service=${encodeURIComponent(mapSignupServiceToQuestionnaire(service))}`
      : "/questionnaire";
  const signupReturnHref = service && service.length > 0 ? `/signup?service=${service}` : "/signup";
  return (
    <div className="mx-auto max-w-xl space-y-5 rounded-lg border border-border/60 bg-card/40 p-6">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Start with the questionnaire</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Before we set up an account, we ask every prospect to complete a short 2-minute questionnaire. It lets us
        pre-configure the right path for you (IM / DART / Signals / Regulatory Umbrella) and skip the redundant
        questions at signup.
      </p>
      <div className="flex flex-wrap gap-3 pt-1">
        <Link
          href={questionnaireHref}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Take the questionnaire &rarr;
        </Link>
        <Link
          href={signupReturnHref}
          className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Skip the pre-check: only do this if you know what you're doing."
        >
          I&apos;ve already filled it in, continue
        </Link>
      </div>
      <p className="text-xs text-muted-foreground/80">
        If you filled it in on another device or browser, use the &ldquo;continue&rdquo; option: we&apos;ll
        cross-reference your email when you submit the signup.
      </p>
    </div>
  );
}

/** Tiny acknowledgment shown above the wizard when a questionnaire is on file. */
function QuestionnaireAttachedBanner({ email }: { email: string | null }) {
  return (
    <div className="mx-auto mb-6 max-w-3xl rounded-md border border-border/40 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
      {email !== null ? (
        <>
          Questionnaire on file for <span className="font-medium text-foreground">{email}</span>: we&apos;ll attach your
          answers to this signup.
        </>
      ) : (
        <>Questionnaire on file: we&apos;ll attach your answers once you provide an email below.</>
      )}
    </div>
  );
}

/** Map the signup-side service id (investment / platform / signals / regulatory)
 *  to the questionnaire-side service_family enum used by the Reg-Umbrella branch. */
function mapSignupServiceToQuestionnaire(signupService: string): string {
  switch (signupService) {
    case "investment":
      return "IM";
    case "regulatory":
      return "RegUmbrella";
    case "platform":
    case "signals":
    default:
      return "DART";
  }
}
