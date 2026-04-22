"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitSignup, type ContactChannelKind } from "@/lib/api/signup-client";
import { QUESTIONNAIRE_ENVELOPE_LOCAL_STORAGE_KEY } from "@/lib/questionnaire/types";
import { Briefcase, CheckCircle2, Shield } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { OnboardingWizardTail } from "./onboarding-wizard-tail";
import {
  INV_OPTS,
  REG_ACTIVITIES,
  REG_ADDONS,
  REG_ENGAGEMENT,
  REG_FUND_OPTS,
  type ApplicantType,
} from "./signup-data";
import { OnboardingBackBtn, OnboardingNextBtn, StepIndicator } from "./signup-ui-bits";

export function OnboardingWizard({ serviceType }: { serviceType: "regulatory" | "investment" }) {
  const svcName = serviceType === "regulatory" ? "Regulatory Umbrella" : "Investment Management";
  const allOptLabels: Record<string, string> = Object.fromEntries([
    ...REG_ENGAGEMENT.map((e) => [e.id, e.label]),
    ...REG_ACTIVITIES.map((a) => [a.id, a.label]),
    ...REG_ADDONS.map((a) => [a.id, a.label]),
    ...REG_FUND_OPTS.map((f) => [f.id, f.label]),
    ...INV_OPTS.map((o) => [o.id, o.label]),
  ]);
  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [contactChannel, setContactChannel] = React.useState<ContactChannelKind>("phone");
  const [contactValue, setContactValue] = React.useState("");
  const [entityAddress, setEntityAddress] = React.useState("");
  const [expectedAum, setExpectedAum] = React.useState("");
  const [selOpts, setSelOpts] = React.useState<Set<string>>(new Set());
  const [applicantType, setApplicantType] = React.useState<ApplicantType>("individual");
  const [appId, setAppId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [submitError, setSubmitError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [firebaseUid, setFirebaseUid] = React.useState("");
  const [onboardingRequestId, setOnboardingRequestId] = React.useState("");
  const draftId = React.useRef(`draft-${Date.now().toString(36)}`).current;

  const [resumeDraft, setResumeDraft] = React.useState<any>(null);

  React.useEffect(() => {
    const raw = localStorage.getItem("onboarding-draft");
    if (raw) {
      try {
        setResumeDraft(JSON.parse(raw));
      } catch {
        /* invalid draft */
      }
    }
  }, []);

  React.useEffect(() => {
    if (step > 1 && name) {
      localStorage.setItem(
        "onboarding-draft",
        JSON.stringify({
          draftId,
          orgSlug: company.toLowerCase().replace(/\s+/g, "-"),
          service: serviceType,
          applicantType,
          name,
          email,
          company,
          phone,
          expectedAum,
          selOpts: [...selOpts],
          step,
          firebaseUid,
          onboardingRequestId,
        }),
      );
    }
  }, [
    step,
    draftId,
    serviceType,
    applicantType,
    name,
    email,
    company,
    phone,
    expectedAum,
    selOpts,
    firebaseUid,
    onboardingRequestId,
  ]);

  const toggle = (id: string) =>
    setSelOpts((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  async function handleSubmit() {
    // The Firebase Auth account + Firestore profile + onboarding request
    // are already provisioned in step 1 (`onStep1Next`) so the prospect
    // can resume after closing the tab. Step-4 submit only finalises the
    // application: it persists the latest selections + flips the draft to
    // submitted and shows the confirmation screen.
    //
    // Per codex/08-workflows/signup-signin-workflow.md §2.3.2, we do NOT
    // upload PEP / KYC documents at signup — those move to the admin-side
    // signed-URL drop-box once an Odum operator approves the application.
    // So no doc-blocker checks here, and no second submitSignup call.
    setSubmitting(true);
    setSubmitError("");
    try {
      if (firebaseUid) {
        setAppId(onboardingRequestId);
        await saveProgress(5);
        localStorage.removeItem("onboarding-draft");
      } else {
        // Defensive: should never happen because step 1 creates the
        // account before letting the user advance, but if it does, just
        // surface the error rather than silently no-op.
        setSubmitError("Account is not provisioned yet. Go back to step 1 and re-submit your details.");
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Signup failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const [step1Errors, setStep1Errors] = React.useState<Record<string, string>>({});

  const nameValid = name.trim().includes(" ");
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneValid = !phone || /^\+\d[\d\s-]{6,}$/.test(phone.trim());
  const passwordValid = password.length >= 6;
  const passwordMatch = password === confirmPassword;
  const companyValid = applicantType === "individual" || Boolean(company.trim());

  const step1Complete = nameValid && emailValid && companyValid && phoneValid && passwordValid && passwordMatch;

  const [creatingAccount, setCreatingAccount] = React.useState(false);

  async function onStep1Next(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Required";
    else if (!nameValid) errors.name = "Enter first and last name";
    if (!email.trim()) errors.email = "Required";
    else if (!emailValid) errors.email = "Enter a valid email address";
    if (applicantType === "company" && !company.trim()) errors.company = "Required for company applications";
    if (phone && !phoneValid) errors.phone = "Start with + and country code (e.g. +44 7700 900000)";
    if (!password) errors.password = "Required";
    else if (!passwordValid) errors.password = "At least 6 characters";
    if (!confirmPassword) errors.confirmPassword = "Required";
    else if (!passwordMatch) errors.confirmPassword = "Passwords don't match";
    setStep1Errors(errors);
    if (Object.keys(errors).length > 0) return;

    // Create account immediately so they can resume later
    if (!firebaseUid) {
      setCreatingAccount(true);
      setSubmitError("");

      // If the prospect has a prior questionnaire response on this device,
      // surface its envelope id to the backend so it can be attached to the
      // user profile. Backend falls back to email lookup if absent.
      let questionnaireResponseId: string | undefined;
      try {
        const envelopeRaw = window.localStorage.getItem(QUESTIONNAIRE_ENVELOPE_LOCAL_STORAGE_KEY);
        if (envelopeRaw) {
          const parsed = JSON.parse(envelopeRaw) as {
            submissionId?: unknown;
            response_id?: unknown;
            id?: unknown;
          };
          const candidate =
            typeof parsed.submissionId === "string"
              ? parsed.submissionId
              : typeof parsed.response_id === "string"
                ? parsed.response_id
                : typeof parsed.id === "string"
                  ? parsed.id
                  : undefined;
          if (candidate) questionnaireResponseId = candidate;
        }
      } catch {
        /* envelope parsing is best-effort; backend falls back to email lookup */
      }

      try {
        const result = await submitSignup({
          name,
          email,
          password,
          company,
          phone: contactChannel === "phone" ? phone : undefined,
          contact_channel: contactChannel,
          contact_value: contactChannel === "phone" ? phone : contactValue,
          entity_address: entityAddress || undefined,
          service_type: serviceType,
          applicant_type: applicantType,
          expected_aum: expectedAum,
          questionnaire_response_id: questionnaireResponseId,
          send_email_verification: true,
        });
        setFirebaseUid(result.user.firebase_uid);
        setOnboardingRequestId(result.onboarding_request_id);
        // Save draft with UID so resume works
        localStorage.setItem(
          "onboarding-draft",
          JSON.stringify({
            firebaseUid: result.user.firebase_uid,
            onboardingRequestId: result.onboarding_request_id,
            service: serviceType,
            applicantType,
            name,
            email,
            company,
            phone,
            expectedAum,
            step: 2,
          }),
        );
      } catch (err: unknown) {
        setSubmitError(err instanceof Error ? err.message : "Account creation failed. Please try again.");
        setCreatingAccount(false);
        return;
      }
      setCreatingAccount(false);
    }
    setStep(2);
  }

  // Auto-save progress when advancing steps
  async function saveProgress(nextStep: number) {
    if (firebaseUid) {
      try {
        await fetch(`/api/v1/users/${firebaseUid}/application`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_step: nextStep,
            selected_options: [...selOpts],
          }),
        });
      } catch {
        /* best effort */
      }
    }
    localStorage.setItem(
      "onboarding-draft",
      JSON.stringify({
        firebaseUid,
        onboardingRequestId,
        service: serviceType,
        applicantType,
        name,
        email,
        company,
        phone,
        expectedAum,
        selOpts: [...selOpts],
        step: nextStep,
      }),
    );
    setStep(nextStep);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-2">
          <Badge variant="secondary" className="mb-3">
            {serviceType === "regulatory" ? (
              <Shield className="mr-1.5 size-3" />
            ) : (
              <Briefcase className="mr-1.5 size-3" />
            )}
            {svcName}
          </Badge>
          {step < 5 && <h1 className="text-2xl font-bold">Apply for {svcName}</h1>}
        </div>
        <StepIndicator current={step} onNavigate={setStep} />

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onStep1Next} className="space-y-4">
                {resumeDraft && !name && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Continue your application?</p>
                      <p className="text-xs text-muted-foreground">
                        You have an incomplete application for {resumeDraft.company} ({resumeDraft.email}).
                        {resumeDraft.step < 5
                          ? " You can continue where you left off."
                          : " Your application was submitted — you can upload remaining documents."}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setApplicantType(resumeDraft.applicantType || "individual");
                          setName(resumeDraft.name || "");
                          setEmail(resumeDraft.email || "");
                          setCompany(resumeDraft.company || "");
                          setPhone(resumeDraft.phone || "");
                          setExpectedAum(resumeDraft.expectedAum || "");
                          setSelOpts(new Set(resumeDraft.selOpts || []));
                          if (resumeDraft.step >= 5) {
                            setStep(3);
                          } else {
                            setStep(resumeDraft.step || 1);
                          }
                          setResumeDraft(null);
                        }}
                      >
                        Resume
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          localStorage.removeItem("onboarding-draft");
                          setResumeDraft(null);
                        }}
                      >
                        Start Fresh
                      </Button>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Applicant Type
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        {
                          id: "individual" as const,
                          label: "Individual",
                          desc: "Personal application",
                        },
                        {
                          id: "company" as const,
                          label: "Company / Organisation",
                          desc: "Corporate application",
                        },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setApplicantType(opt.id)}
                        className={`text-left rounded-lg border p-3 transition-colors ${applicantType === opt.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:bg-accent/30"}`}
                      >
                        <span className="text-sm font-medium">{opt.label}</span>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Full Name *</Label>
                    <Input
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setStep1Errors((p) => ({ ...p, name: "" }));
                      }}
                      placeholder="Jane Smith"
                      className={step1Errors.name ? "border-red-500" : ""}
                    />
                    {step1Errors.name && <p className="text-xs text-red-400">{step1Errors.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email *</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setStep1Errors((p) => ({ ...p, email: "" }));
                      }}
                      placeholder="jane@company.com"
                      className={step1Errors.email ? "border-red-500" : ""}
                    />
                    {step1Errors.email && <p className="text-xs text-red-400">{step1Errors.email}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      {applicantType === "company" ? "Company / Organisation *" : "Company (optional)"}
                    </Label>
                    <Input
                      value={company}
                      onChange={(e) => {
                        setCompany(e.target.value);
                        setStep1Errors((p) => ({ ...p, company: "" }));
                      }}
                      placeholder="Acme Capital"
                      className={step1Errors.company ? "border-red-500" : ""}
                    />
                    {step1Errors.company && <p className="text-xs text-red-400">{step1Errors.company}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Preferred contact channel</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          { id: "phone", label: "Phone" },
                          { id: "telegram", label: "Telegram" },
                          { id: "whatsapp", label: "WhatsApp" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setContactChannel(opt.id);
                            setPhone("");
                            setContactValue("");
                            setStep1Errors((p) => ({ ...p, phone: "" }));
                          }}
                          className={
                            contactChannel === opt.id
                              ? "rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                              : "rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-border/80 hover:text-foreground transition-colors"
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <Input
                      type={contactChannel === "phone" || contactChannel === "whatsapp" ? "tel" : "text"}
                      value={contactChannel === "phone" ? phone : contactValue}
                      onChange={(e) => {
                        if (contactChannel === "phone") {
                          setPhone(e.target.value);
                        } else {
                          setContactValue(e.target.value);
                        }
                        setStep1Errors((p) => ({ ...p, phone: "" }));
                      }}
                      placeholder={
                        contactChannel === "telegram"
                          ? "@your-handle"
                          : contactChannel === "whatsapp"
                            ? "+44 7XXX XXX XXX"
                            : "+44 7XXX XXX XXX"
                      }
                      className={step1Errors.phone ? "border-red-500" : ""}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {contactChannel === "telegram"
                        ? "Telegram handle starting with @."
                        : "Start with + and country code, e.g. +44 for UK."}
                    </p>
                    {step1Errors.phone && <p className="text-xs text-red-400">{step1Errors.phone}</p>}
                  </div>
                </div>
                {applicantType === "company" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Entity registered address{" "}
                      <span className="text-muted-foreground">(for contract generation)</span>
                    </Label>
                    <Input
                      type="text"
                      value={entityAddress}
                      onChange={(e) => setEntityAddress(e.target.value)}
                      placeholder="Registered address"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Expected AUM (optional)</Label>
                  <Input
                    type="text"
                    value={expectedAum}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setExpectedAum(raw ? Number(raw).toLocaleString("en-GB") : "");
                    }}
                    placeholder="e.g. 1,000,000"
                    inputMode="numeric"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Password *</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setStep1Errors((p) => ({ ...p, password: "" }));
                      }}
                      placeholder="Min 6 characters"
                      className={step1Errors.password ? "border-red-500" : ""}
                    />
                    {step1Errors.password && <p className="text-xs text-red-400">{step1Errors.password}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Confirm Password *</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setStep1Errors((p) => ({ ...p, confirmPassword: "" }));
                      }}
                      placeholder="Repeat password"
                      className={step1Errors.confirmPassword ? "border-red-500" : ""}
                    />
                    {step1Errors.confirmPassword && (
                      <p className="text-xs text-red-400">{step1Errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
                {submitError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-400">
                    {submitError}
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <OnboardingNextBtn
                    type="submit"
                    disabled={creatingAccount}
                    label={creatingAccount ? "Creating account..." : "Continue"}
                  />
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step >= 2 && firebaseUid && (
          <div className="text-center text-xs text-emerald-400 mb-2 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="size-3" />
            Account created — your progress is saved. You can close and resume anytime by logging in.
          </div>
        )}

        {step === 2 && serviceType === "regulatory" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configure Your Engagement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Engagement Type
                </Label>
                {REG_ENGAGEMENT.map((e) => (
                  <label
                    key={e.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${selOpts.has(e.id) ? "border-primary bg-primary/5" : "hover:bg-accent/30"}`}
                  >
                    <Checkbox
                      checked={selOpts.has(e.id)}
                      onCheckedChange={() => {
                        setSelOpts((p) => {
                          const n = new Set(p);
                          REG_ENGAGEMENT.forEach((x) => n.delete(x.id));
                          if (!p.has(e.id)) n.add(e.id);
                          return n;
                        });
                      }}
                    />
                    <div>
                      <span className="text-sm font-medium">{e.label}</span>
                      <p className="text-xs text-muted-foreground">{e.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Regulated Activities (select all that apply)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Which of our FCA-authorised activities do you want to conduct?
                </p>
                {REG_ACTIVITIES.map((a) => (
                  <label
                    key={a.id}
                    className="group flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/30 transition-colors relative"
                  >
                    <Checkbox checked={selOpts.has(a.id)} onCheckedChange={() => toggle(a.id)} />
                    <div className="flex-1">
                      <span className="text-sm">{a.label}</span>
                      {a.tooltip && (
                        <p className="text-[11px] text-muted-foreground mt-1 hidden group-hover:block">{a.tooltip}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Add-on Services (optional)
                </Label>
                <p className="text-xs text-muted-foreground">
                  If you don&apos;t select a service, you&apos;ll need to provide proof of your own coverage.
                </p>
                {REG_ADDONS.map((a) => (
                  <label
                    key={a.id}
                    className="group flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/30 transition-colors"
                  >
                    <Checkbox checked={selOpts.has(a.id)} onCheckedChange={() => toggle(a.id)} />
                    <div className="flex-1">
                      <span className="text-sm">{a.label}</span>
                      {a.tooltip && (
                        <p className="text-[11px] text-muted-foreground mt-1 hidden group-hover:block">{a.tooltip}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Fund Structure (optional bolt-on)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Bolt on a fund vehicle to any engagement above. Requires Managing Investments.
                </p>
                {REG_FUND_OPTS.map((f) => (
                  <label
                    key={f.id}
                    className="group flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/30 transition-colors"
                  >
                    <Checkbox
                      checked={selOpts.has(f.id)}
                      onCheckedChange={() => {
                        setSelOpts((p) => {
                          const n = new Set(p);
                          if (n.has(f.id)) {
                            n.delete(f.id);
                          } else {
                            n.add(f.id);
                            n.add("managing");
                          }
                          return n;
                        });
                      }}
                    />
                    <div className="flex-1">
                      <span className="text-sm">{f.label}</span>
                      {f.tooltip && (
                        <p className="text-[11px] text-muted-foreground mt-1 hidden group-hover:block">{f.tooltip}</p>
                      )}
                    </div>
                  </label>
                ))}
                {(selOpts.has("fund_crypto_spot") || selOpts.has("fund_derivatives")) && !selOpts.has("managing") && (
                  <p className="text-xs text-amber-400">
                    Managing Investments is required for fund structures and has been selected above.
                  </p>
                )}
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <OnboardingBackBtn onStep={setStep} to={1} />
                <div className="flex items-center gap-3">
                  <Link
                    href="/contact?service=regulatory"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Feeling overwhelmed? Just get in touch — we&apos;ll walk you through it.
                  </Link>
                  <OnboardingNextBtn
                    disabled={!selOpts.has("ar") && !selOpts.has("advisor")}
                    onClick={() => saveProgress(3)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && serviceType === "investment" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What are you looking for?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {INV_OPTS.map((o) => (
                  <label
                    key={o.id}
                    className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/30 transition-colors"
                  >
                    <Checkbox checked={selOpts.has(o.id)} onCheckedChange={() => toggle(o.id)} />
                    <span className="text-sm">{o.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <OnboardingBackBtn onStep={setStep} to={1} />
                <OnboardingNextBtn disabled={selOpts.size === 0} onClick={() => saveProgress(3)} />
              </div>
            </CardContent>
          </Card>
        )}

        <OnboardingWizardTail
          step={step}
          setStep={setStep}
          serviceType={serviceType}
          name={name}
          email={email}
          company={company}
          phone={phone}
          saveProgress={saveProgress}
          handleSubmit={handleSubmit}
          submitting={submitting}
          submitError={submitError}
          selOpts={selOpts}
          allOptLabels={allOptLabels}
          appId={appId}
        />
      </div>
    </div>
  );
}
