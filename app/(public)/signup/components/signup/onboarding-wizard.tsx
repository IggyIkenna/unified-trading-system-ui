"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitSignup, uploadUserDocument } from "@/lib/api/signup-client";
import { Briefcase, CheckCircle2, Shield } from "lucide-react";
import {
  REG_ACTIVITIES,
  REG_ADDONS,
  REG_ENGAGEMENT,
  REG_FUND_OPTS,
  INV_OPTS,
  type ApplicantType,
  type DeclarationField,
  type DocSlot,
  type PendingUpload,
  getDocSlots,
} from "./signup-data";
import { generateDeclarationPdfBlob } from "./signup-pdf";
import { OnboardingBackBtn, OnboardingNextBtn, StepIndicator } from "./signup-ui-bits";
import { OnboardingWizardTail } from "./onboarding-wizard-tail";

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
  const [expectedAum, setExpectedAum] = React.useState("");
  const [selOpts, setSelOpts] = React.useState<Set<string>>(new Set());
  const [docs, setDocs] = React.useState<Record<string, string>>({});
  const [pendingUploads, setPendingUploads] = React.useState<Record<string, PendingUpload>>({});
  const [declarations, setDeclarations] = React.useState<Record<string, Record<string, string>>>({});
  const [signatures, setSignatures] = React.useState<Record<string, string>>({});
  const [applicantType, setApplicantType] = React.useState<ApplicantType>("individual");
  const [expandedDecl, setExpandedDecl] = React.useState<string | null>(null);
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
          docs,
          declarations,
          signatures,
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
    docs,
    declarations,
    signatures,
    firebaseUid,
    onboardingRequestId,
  ]);

  const orgSlug = company.toLowerCase().replace(/\s+/g, "-") || "unknown";
  async function prepareDeclarationPdf(
    docType: string,
    title: string,
    fields: DeclarationField[],
    answers: Record<string, string>,
    sig: string,
  ): Promise<PendingUpload> {
    const pdfBlob = await generateDeclarationPdfBlob(title, name, company, fields, answers, sig);
    const fileName = `${docType}-${orgSlug}.pdf`;
    return {
      file: pdfBlob,
      file_name: fileName,
      content_type: "application/pdf",
    };
  }

  const toggle = (id: string) =>
    setSelOpts((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const isReq = (s: DocSlot) =>
    s.required === true || (s.required === "investment_only" && serviceType === "investment");
  const docSlots = getDocSlots(applicantType);
  const uploadedCount = Object.values(docs).filter(Boolean).length;
  const reqDocs = docSlots.filter(isReq);

  async function handleSubmit() {
    if (password.length < 6) {
      setSubmitError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }
    const missingRequiredDocs = reqDocs.filter((slot) => !docs[slot.key]).map((slot) => slot.label);
    if (missingRequiredDocs.length > 0) {
      setSubmitError(`Please upload required documents: ${missingRequiredDocs.join(", ")}.`);
      return;
    }
    const isMock = process.env.NEXT_PUBLIC_MOCK_API === "true" || process.env.NEXT_PUBLIC_AUTH_PROVIDER === "demo";
    if (!isMock) {
      const staleDraftDocs = Object.keys(docs).filter((key) => !pendingUploads[key]);
      if (staleDraftDocs.length > 0) {
        setSubmitError("This draft was resumed without file binaries. Please re-upload documents before submitting.");
        return;
      }
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const result = await submitSignup({
        name,
        email,
        password,
        company,
        phone,
        service_type: serviceType,
        selected_options: [...selOpts],
        expected_aum: expectedAum,
      });

      const uid = result.user.firebase_uid;
      const reqId = result.onboarding_request_id;
      setFirebaseUid(uid);
      setOnboardingRequestId(reqId);
      setAppId(reqId);

      for (const [key, upload] of Object.entries(pendingUploads)) {
        await uploadUserDocument({
          firebase_uid: uid,
          onboarding_request_id: reqId,
          doc_type: key,
          file_name: upload.file_name,
          content_type: upload.content_type,
          file: upload.file,
        });
      }

      setStep(5);
      localStorage.removeItem("onboarding-draft");
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
      try {
        const result = await submitSignup({
          name,
          email,
          password,
          company,
          phone,
          service_type: serviceType,
          applicant_type: applicantType,
          expected_aum: expectedAum,
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
            docs_uploaded: Object.keys(docs).filter((k) => docs[k]),
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
        docs,
        declarations,
        signatures,
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
                          setDocs(resumeDraft.docs || {});
                          setDeclarations(resumeDraft.declarations || {});
                          setSignatures(resumeDraft.signatures || {});
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
                    <Label className="text-xs">Phone (optional)</Label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setStep1Errors((p) => ({ ...p, phone: "" }));
                      }}
                      placeholder="+44 7XXX XXX XXX"
                      className={step1Errors.phone ? "border-red-500" : ""}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Start with + and country code, e.g. +44 for UK, +1 for US
                    </p>
                    {step1Errors.phone && <p className="text-xs text-red-400">{step1Errors.phone}</p>}
                  </div>
                </div>
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
          docSlots={docSlots}
          isReq={isReq}
          docs={docs}
          setDocs={setDocs}
          declarations={declarations}
          setDeclarations={setDeclarations}
          signatures={signatures}
          setSignatures={setSignatures}
          pendingUploads={pendingUploads}
          setPendingUploads={setPendingUploads}
          expandedDecl={expandedDecl}
          setExpandedDecl={setExpandedDecl}
          prepareDeclarationPdf={prepareDeclarationPdf}
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
          uploadedCount={uploadedCount}
          appId={appId}
        />
      </div>
    </div>
  );
}
