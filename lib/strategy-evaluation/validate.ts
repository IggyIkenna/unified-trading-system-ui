/**
 * Strategy Evaluation form validator — extracted from the page client so it
 * can be unit-tested across both engagement intents (allocator vs builder).
 *
 * Allocator intake collects a smaller field set than the builder DDQ; the
 * validator must skip builder-only requirements when the form is in
 * allocator mode, otherwise the allocator submit button silently fails on
 * fields the wizard never renders.
 */

export interface StrategyEvaluationValidatableForm {
  readonly engagementIntent: "" | "allocator" | "builder";
  readonly strategyName: string;
  readonly leadResearcher: string;
  readonly email: string;
  readonly commercialPath: "A" | "B" | "C" | "D" | "";
  readonly understandFit: boolean;
  readonly understandIncubation: boolean;
  readonly understandSignals: boolean;
  readonly allocatorInvestorType: string;
}

export interface StrategyEvaluationFieldError {
  readonly field: string;
  readonly message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateStrategyEvaluation(form: StrategyEvaluationValidatableForm): StrategyEvaluationFieldError[] {
  const errs: StrategyEvaluationFieldError[] = [];
  if (!form.strategyName.trim()) errs.push({ field: "strategyName", message: "Strategy name is required." });
  if (!form.leadResearcher.trim()) errs.push({ field: "leadResearcher", message: "Lead researcher is required." });
  if (!form.email.trim()) errs.push({ field: "email", message: "Email is required." });
  else if (!EMAIL_RE.test(form.email)) errs.push({ field: "email", message: "Enter a valid email address." });
  if (form.engagementIntent === "allocator") {
    if (!form.allocatorInvestorType.trim())
      errs.push({ field: "allocatorInvestorType", message: "Investor type is required." });
    return errs;
  }
  if (!form.commercialPath) errs.push({ field: "commercialPath", message: "Select a commercial path." });
  if (!form.understandFit) errs.push({ field: "understandFit", message: "You must acknowledge this statement." });
  if (!form.understandIncubation)
    errs.push({ field: "understandIncubation", message: "You must acknowledge this statement." });
  if (!form.understandSignals)
    errs.push({ field: "understandSignals", message: "You must acknowledge this statement." });
  return errs;
}
