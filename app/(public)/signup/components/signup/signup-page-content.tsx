"use client";

import { useSearchParams } from "next/navigation";
import { ONBOARDING_SERVICES } from "./signup-data";
import { GenericSignup } from "./generic-signup";
import { OnboardingWizard } from "./onboarding-wizard";

export function SignupPageContent() {
  const searchParams = useSearchParams();
  const service = searchParams.get("service");
  if (service && ONBOARDING_SERVICES.has(service))
    return <OnboardingWizard serviceType={service as "regulatory" | "investment"} />;
  return <GenericSignup />;
}
