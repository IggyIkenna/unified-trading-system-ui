"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitSignup, uploadUserDocument } from "@/lib/api/signup-client";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  Database,
  Download,
  FileText,
  Layers,
  Mail,
  Shield,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

const SERVICES = [
  {
    id: "data",
    name: "Data Access",
    icon: Database,
    color: "text-sky-400",
    price: "From £250/mo",
    desc: "Market data across 128 venues, 5 asset classes",
  },
  {
    id: "backtesting",
    name: "Research & Backtesting",
    icon: Brain,
    color: "text-violet-400",
    price: "Contact us",
    desc: "ML model training, strategy backtesting, signal configuration",
  },
  {
    id: "platform",
    name: "Trading Terminal",
    icon: Layers,
    color: "text-amber-400",
    price: "Contact us",
    desc: "Live trading, monitoring, execution, and control in one environment",
  },
  {
    id: "investment",
    name: "Investment Management",
    icon: Briefcase,
    color: "text-rose-400",
    price: "Contact us",
    desc: "FCA-authorised managed strategies with full reporting and oversight",
  },
  {
    id: "regulatory",
    name: "Regulatory Umbrella",
    icon: Shield,
    color: "text-slate-400",
    price: "Contact us",
    desc: "FCA Appointed Representative services for algo trading firms",
  },
];
const ONBOARDING_SERVICES = new Set(["regulatory", "investment"]);
const REG_ENGAGEMENT = [
  {
    id: "ar",
    label: "Appointed Representative (AR)",
    desc: "Operate as our AR under our FCA authorisation",
  },
  {
    id: "advisor",
    label: "Strategic Advisor",
    desc: "Contracted advisory role under our supervision",
  },
];
const REG_ACTIVITIES = [
  { id: "dealing_agent", label: "Dealing in Investments as Agent" },
  { id: "arranging", label: "Arranging (Bringing About) Deals in Investments" },
  {
    id: "making_arrangements",
    label: "Making Arrangements with a View to Transactions",
  },
  {
    id: "managing",
    label:
      "Managing Investments (SMA only — see Fund Management below for fund structures)",
  },
];
const REG_ADDONS = [
  { id: "compliance", label: "Compliance Monitoring" },
  { id: "aml", label: "AML Monitoring" },
  { id: "reporting", label: "P&L & Client Reporting" },
];
const REG_FUND_OPTS = [
  { id: "fund_crypto_spot", label: "Crypto Spot Fund (UK FCA)" },
  {
    id: "fund_derivatives",
    label: "Derivatives & Traditional Markets Fund (EU-regulated)",
  },
];
const INV_OPTS = [
  { id: "sma", label: "Separately Managed Account" },
  { id: "fund_access", label: "Fund Access" },
  { id: "strategy", label: "Strategy Allocation" },
  { id: "discretionary", label: "Full Discretionary" },
];
type ApplicantType = "individual" | "company";
interface DeclarationField {
  id: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
}
interface DocSlot {
  key: string;
  label: string;
  required: boolean | "investment_only";
  declaration?: DeclarationField[];
  applicantType?: ApplicantType;
}

interface PendingUpload {
  file: Blob;
  file_name: string;
  content_type: string;
}
const SOF_FIELDS: DeclarationField[] = [
  {
    id: "employment",
    label: "Current employment / business activity",
    placeholder: "e.g. Director at XYZ Capital Ltd",
  },
  {
    id: "source",
    label: "Primary source of funds for trading",
    placeholder: "e.g. Business profits, salary, investment returns",
  },
  {
    id: "origin",
    label: "Country of origin of funds",
    placeholder: "e.g. United Kingdom",
  },
  {
    id: "expected_volume",
    label: "Expected annual trading volume",
    placeholder: "e.g. GBP 500,000 — 1,000,000",
  },
];
const WEALTH_FIELDS: DeclarationField[] = [
  {
    id: "net_worth",
    label: "Approximate net worth (excluding primary residence)",
    placeholder: "e.g. GBP 1,000,000 — 5,000,000",
  },
  {
    id: "liquid_assets",
    label: "Liquid assets available for investment",
    placeholder: "e.g. GBP 250,000",
  },
  { id: "income", label: "Annual income", placeholder: "e.g. GBP 150,000" },
  {
    id: "experience",
    label: "Investment experience",
    placeholder: "e.g. 10+ years in equities and crypto derivatives",
    multiline: true,
  },
];
const INDIVIDUAL_DOC_SLOTS: DocSlot[] = [
  {
    key: "proof_of_address",
    label: "Proof of Address (utility bill, bank statement)",
    required: true,
    applicantType: "individual",
  },
  {
    key: "identity",
    label: "Identity Document (passport, national ID)",
    required: true,
    applicantType: "individual",
  },
  {
    key: "source_of_funds",
    label: "Source of Funds Declaration",
    required: true,
    declaration: SOF_FIELDS,
  },
  {
    key: "wealth_declaration",
    label: "Wealth Self-Declaration",
    required: "investment_only",
    declaration: WEALTH_FIELDS,
  },
  {
    key: "management_agreement",
    label: "Management Agreement (if applicable)",
    required: false,
  },
];

const COMPANY_DOC_SLOTS: DocSlot[] = [
  {
    key: "incorporation",
    label: "Certificate of Incorporation",
    required: true,
    applicantType: "company",
  },
  {
    key: "company_activities",
    label: "Brief Description of Company Activities",
    required: true,
    applicantType: "company",
    declaration: [
      {
        id: "activities",
        label: "Primary business activities",
        placeholder: "e.g. Proprietary trading in crypto derivatives",
        multiline: true,
      },
      {
        id: "website",
        label: "Company website (optional)",
        placeholder: "e.g. https://example.com",
      },
    ],
  },
  {
    key: "ubo_identity",
    label: "Identity Documents for all UBOs (>25% ownership)",
    required: true,
    applicantType: "company",
  },
  {
    key: "ubo_proof_of_address",
    label: "Proof of Address for all UBOs (>25% ownership)",
    required: true,
    applicantType: "company",
  },
  {
    key: "source_of_funds",
    label: "Source of Funds Declaration",
    required: true,
    declaration: SOF_FIELDS,
  },
  {
    key: "wealth_declaration",
    label: "Wealth Self-Declaration",
    required: "investment_only",
    declaration: WEALTH_FIELDS,
  },
  {
    key: "management_agreement",
    label: "Management Agreement (if applicable)",
    required: false,
  },
];

function getDocSlots(applicantType: ApplicantType): DocSlot[] {
  return applicantType === "company" ? COMPANY_DOC_SLOTS : INDIVIDUAL_DOC_SLOTS;
}

function generateDeclarationHtml(
  title: string,
  applicantName: string,
  company: string,
  fields: DeclarationField[],
  answers: Record<string, string>,
  signature: string,
) {
  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:20px;color:#111;line-height:1.6}
.logo-header{display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #ddd}
.logo-header img{height:48px;width:auto}
.logo-header .company-name{font-size:14px;color:#555;font-weight:600;letter-spacing:1px}
h1{font-size:18px;text-transform:uppercase;border-bottom:2px solid #111;padding-bottom:8px}
.field{margin:16px 0}.field-label{font-weight:bold;font-size:13px;color:#555;margin-bottom:2px}
.field-value{font-size:15px;padding:4px 0;border-bottom:1px solid #ddd}
.confirmation{margin-top:32px;padding:16px;background:#f9f9f9;border:1px solid #ddd;font-size:14px}
.sig-block{margin-top:40px;display:flex;gap:40px}.sig-col{flex:1}
.sig-line{border-bottom:1px solid #111;min-height:40px;display:flex;align-items:flex-end;padding-bottom:4px;font-style:italic;font-size:18px}
.sig-label{font-size:11px;color:#555;margin-top:4px}
@media print{body{margin:0;padding:20px}}</style></head><body>
<div class="logo-header"><img src="${typeof window !== "undefined" ? window.location.origin : ""}/images/odum-logo.png" alt="Odum Research" crossorigin="anonymous" /><div class="company-name">Odum Research Ltd</div></div>
<h1>${title}</h1><p style="color:#555;font-size:13px">Date: ${date}</p>
<p>I, <strong>${applicantName}</strong>, of <strong>${company}</strong>, hereby declare the following:</p>
${fields.map((f) => `<div class="field"><div class="field-label">${f.label}</div><div class="field-value">${answers[f.id] || "<em>Not provided</em>"}</div></div>`).join("")}
<div class="confirmation">I confirm that the information provided above is true and accurate to the best of my knowledge and belief.</div>
<div class="sig-block"><div class="sig-col"><div class="sig-line">${signature}</div><div class="sig-label">Signature</div></div>
<div class="sig-col"><div class="sig-line">${applicantName}</div><div class="sig-label">Print Name</div></div>
<div class="sig-col"><div class="sig-line">${date}</div><div class="sig-label">Date</div></div></div>
<p style="margin-top:40px;font-size:11px;color:#888">Document generated electronically via Odum Research Ltd onboarding portal. Electronic signature accepted.</p>
</body></html>`;
}

async function generateDeclarationPdfBlob(
  title: string,
  applicantName: string,
  company: string,
  fields: DeclarationField[],
  answers: Record<string, string>,
  signature: string,
): Promise<Blob> {
  const html = generateDeclarationHtml(
    title,
    applicantName,
    company,
    fields,
    answers,
    signature,
  );
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.width = "794px";
  iframe.style.height = "1123px";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
  await new Promise((r) => setTimeout(r, 200));
  const { default: html2canvas } = await import("html2canvas");
  const { jsPDF } = await import("jspdf");
  const canvas = await html2canvas(doc.body, {
    scale: 2,
    useCORS: true,
    width: 794,
    windowWidth: 794,
  });
  document.body.removeChild(iframe);
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = (canvas.height * pdfW) / canvas.width;
  pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
  return pdf.output("blob");
}

async function downloadDeclaration(
  title: string,
  applicantName: string,
  company: string,
  fields: DeclarationField[],
  answers: Record<string, string>,
  signature: string,
) {
  const blob = await generateDeclarationPdfBlob(
    title,
    applicantName,
    company,
    fields,
    answers,
    signature,
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-${company.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
const STEP_LABELS = [
  "Your Details",
  "Requirements",
  "Documents",
  "Review",
  "Submitted",
];

function StepIndicator({
  current,
  onNavigate,
}: {
  current: number;
  onNavigate: (s: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {STEP_LABELS.map((label, i) => {
        const num = i + 1,
          done = num < current,
          active = num === current;
        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <div
                className={`h-px w-6 sm:w-10 ${done ? "bg-emerald-500" : "bg-border"}`}
              />
            )}
            <button
              type="button"
              disabled={!done || current === 5}
              onClick={() => done && onNavigate(num)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                done
                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                  : active
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "text-muted-foreground"
              }`}
            >
              {done ? (
                <Check className="size-3" />
              ) : (
                <span className="text-[10px]">{num}</span>
              )}
              <span className="hidden sm:inline">{label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function OnboardingBackBtn({
  to,
  onStep,
}: {
  to: number;
  onStep: (n: number) => void;
}) {
  return (
    <Button variant="ghost" onClick={() => onStep(to)}>
      <ArrowLeft className="mr-2 size-4" />
      Back
    </Button>
  );
}

function OnboardingNextBtn({
  disabled,
  onClick,
  label = "Continue",
  type = "button",
}: {
  disabled?: boolean;
  onClick?: () => void;
  label?: string;
  type?: "button" | "submit";
}) {
  return (
    <Button
      type={type}
      disabled={disabled}
      onClick={type === "submit" ? undefined : onClick}
    >
      {label} <ArrowRight className="ml-2 size-4" />
    </Button>
  );
}

function OnboardingWizard({
  serviceType,
}: {
  serviceType: "regulatory" | "investment";
}) {
  const svcName =
    serviceType === "regulatory"
      ? "Regulatory Umbrella"
      : "Investment Management";
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
  const [pendingUploads, setPendingUploads] = React.useState<
    Record<string, PendingUpload>
  >({});
  const [declarations, setDeclarations] = React.useState<
    Record<string, Record<string, string>>
  >({});
  const [signatures, setSignatures] = React.useState<Record<string, string>>(
    {},
  );
  const [applicantType, setApplicantType] =
    React.useState<ApplicantType>("individual");
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
    const pdfBlob = await generateDeclarationPdfBlob(
      title,
      name,
      company,
      fields,
      answers,
      sig,
    );
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
    s.required === true ||
    (s.required === "investment_only" && serviceType === "investment");
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
    const missingRequiredDocs = reqDocs
      .filter((slot) => !docs[slot.key])
      .map((slot) => slot.label);
    if (missingRequiredDocs.length > 0) {
      setSubmitError(
        `Please upload required documents: ${missingRequiredDocs.join(", ")}.`,
      );
      return;
    }
    const staleDraftDocs = Object.keys(docs).filter((key) => !pendingUploads[key]);
    if (staleDraftDocs.length > 0) {
      setSubmitError(
        "This draft was resumed without file binaries. Please re-upload documents before submitting.",
      );
      return;
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
      setSubmitError(
        err instanceof Error ? err.message : "Signup failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const step1Complete =
    Boolean(name) &&
    Boolean(email) &&
    Boolean(company) &&
    Boolean(password) &&
    password.length >= 6 &&
    password === confirmPassword;

  function onStep1Next(e: React.FormEvent) {
    e.preventDefault();
    if (!step1Complete) return;
    setStep(2);
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
          {step < 5 && (
            <h1 className="text-2xl font-bold">Apply for {svcName}</h1>
          )}
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
                    <p className="text-sm font-medium">
                      Continue your application?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You have an incomplete application for{" "}
                      {resumeDraft.company} ({resumeDraft.email}).
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
                        setApplicantType(
                          resumeDraft.applicantType || "individual",
                        );
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
                      <p className="text-xs text-muted-foreground">
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Full Name *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email *</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {applicantType === "company"
                      ? "Company / Organisation *"
                      : "Company (optional)"}
                  </Label>
                  <Input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Capital"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone (optional)</Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 7XXX XXX XXX"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Expected AUM (optional)</Label>
                <Input
                  type="text"
                  value={expectedAum}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    setExpectedAum(
                      raw ? Number(raw).toLocaleString("en-GB") : "",
                    );
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Confirm Password *</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <OnboardingNextBtn type="submit" disabled={!step1Complete} />
              </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && serviceType === "regulatory" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Configure Your Engagement
              </CardTitle>
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
                    className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/30 transition-colors"
                  >
                    <Checkbox
                      checked={selOpts.has(a.id)}
                      onCheckedChange={() => toggle(a.id)}
                    />
                    <span className="text-sm">{a.label}</span>
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Add-on Services (optional)
                </Label>
                <p className="text-xs text-muted-foreground">
                  If you don&apos;t select a service, you&apos;ll need to
                  provide proof of your own coverage.
                </p>
                {REG_ADDONS.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/30 transition-colors"
                  >
                    <Checkbox
                      checked={selOpts.has(a.id)}
                      onCheckedChange={() => toggle(a.id)}
                    />
                    <span className="text-sm">{a.label}</span>
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Fund Structure (optional bolt-on)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Bolt on a fund vehicle to any engagement above. Requires
                  Managing Investments.
                </p>
                {REG_FUND_OPTS.map((f) => (
                  <label
                    key={f.id}
                    className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/30 transition-colors"
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
                    <span className="text-sm">{f.label}</span>
                  </label>
                ))}
                {(selOpts.has("fund_crypto_spot") ||
                  selOpts.has("fund_derivatives")) &&
                  !selOpts.has("managing") && (
                    <p className="text-xs text-amber-400">
                      Managing Investments is required for fund structures and
                      has been selected above.
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
                    Feeling overwhelmed? Just get in touch — we&apos;ll walk you
                    through it.
                  </Link>
                  <OnboardingNextBtn
                    disabled={!selOpts.has("ar") && !selOpts.has("advisor")}
                    onClick={() => setStep(3)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && serviceType === "investment" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                What are you looking for?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {INV_OPTS.map((o) => (
                  <label
                    key={o.id}
                    className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/30 transition-colors"
                  >
                    <Checkbox
                      checked={selOpts.has(o.id)}
                      onCheckedChange={() => toggle(o.id)}
                    />
                    <span className="text-sm">{o.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <OnboardingBackBtn onStep={setStep} to={1} />
                <OnboardingNextBtn
                  disabled={selOpts.size === 0}
                  onClick={() => setStep(3)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Documents</CardTitle>
              <CardDescription>
                Upload supporting documents for your application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {docSlots.map((slot) => {
                const req = isReq(slot),
                  uploaded = !!docs[slot.key];
                const isDecl = !!slot.declaration;
                const declAnswers = declarations[slot.key] || {};
                const declSigned = !!signatures[slot.key];
                const declFieldsFilled =
                  isDecl &&
                  slot.declaration!.every((f) => declAnswers[f.id]?.trim());
                const declComplete = declSigned;
                const isExpanded = expandedDecl === slot.key;

                if (isDecl) {
                  return (
                    <div
                      key={slot.key}
                      className="rounded-lg border p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <FileText className="size-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm">{slot.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {declSigned
                                ? `E-signed by ${signatures[slot.key]}`
                                : "Fill in the details below and sign electronically."}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={declComplete ? "default" : "outline"}
                            className={`text-[10px] ${declComplete ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : ""}`}
                          >
                            {declSigned
                              ? "Signed"
                              : req
                                ? "Required"
                                : "Optional"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() =>
                              setExpandedDecl(isExpanded ? null : slot.key)
                            }
                          >
                            {isExpanded
                              ? "Collapse"
                              : declSigned
                                ? "Edit"
                                : "Fill In"}
                          </Button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="space-y-3 pt-2 border-t">
                          {slot.declaration!.map((field) => (
                            <div key={field.id} className="space-y-1">
                              <Label className="text-xs">{field.label}</Label>
                              {field.multiline ? (
                                <Textarea
                                  placeholder={field.placeholder}
                                  rows={2}
                                  value={declAnswers[field.id] || ""}
                                  onChange={(e) =>
                                    setDeclarations((p) => ({
                                      ...p,
                                      [slot.key]: {
                                        ...p[slot.key],
                                        [field.id]: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              ) : (
                                <Input
                                  placeholder={field.placeholder}
                                  value={declAnswers[field.id] || ""}
                                  onChange={(e) =>
                                    setDeclarations((p) => ({
                                      ...p,
                                      [slot.key]: {
                                        ...p[slot.key],
                                        [field.id]: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              )}
                            </div>
                          ))}
                          <div className="pt-3 border-t space-y-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">
                                Electronic Signature — type your full name to
                                sign
                              </Label>
                              <Input
                                placeholder={`Type "${name}" to sign`}
                                value={signatures[slot.key] || ""}
                                onChange={(e) =>
                                  setSignatures((p) => ({
                                    ...p,
                                    [slot.key]: e.target.value,
                                  }))
                                }
                                className={
                                  signatures[slot.key]
                                    ? "font-serif italic text-lg"
                                    : ""
                                }
                              />
                              {signatures[slot.key] &&
                                signatures[slot.key].toLowerCase() !==
                                  name.toLowerCase() && (
                                  <p className="text-xs text-amber-400">
                                    Signature should match your full name:{" "}
                                    {name}
                                  </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="text-xs"
                                disabled={
                                  !declFieldsFilled ||
                                  !signatures[slot.key]?.trim()
                                }
                                onClick={async () => {
                                  const prepared = await prepareDeclarationPdf(
                                    slot.key,
                                    slot.label,
                                    slot.declaration!,
                                    declAnswers,
                                    signatures[slot.key] || "",
                                  );
                                  setPendingUploads((p) => ({
                                    ...p,
                                    [slot.key]: prepared,
                                  }));
                                  setDocs((p) => ({
                                    ...p,
                                    [slot.key]: `${slot.label} — e-signed by ${signatures[slot.key]}`,
                                  }));
                                  setExpandedDecl(null);
                                }}
                              >
                                <CheckCircle2 className="size-3 mr-1" />
                                Sign &amp; Complete
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                disabled={
                                  !declFieldsFilled ||
                                  !signatures[slot.key]?.trim()
                                }
                                onClick={async () =>
                                  downloadDeclaration(
                                    slot.label,
                                    name,
                                    company,
                                    slot.declaration!,
                                    declAnswers,
                                    signatures[slot.key] || "",
                                  )
                                }
                              >
                                <Download className="size-3 mr-1" />
                                Download for Records
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={slot.key}
                    className="rounded-lg border p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <FileText className="size-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm truncate">{slot.label}</p>
                          {uploaded && (
                            <p className="text-xs text-emerald-400 truncate">
                              {docs[slot.key]}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={uploaded ? "default" : "outline"}
                          className={`text-[10px] ${uploaded ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : ""}`}
                        >
                          {uploaded
                            ? "Uploaded"
                            : req
                              ? "Required"
                              : "Optional"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="relative text-xs"
                          asChild
                        >
                          <label className="cursor-pointer">
                            <Upload className="size-3 mr-1" />
                            {uploaded ? "Replace" : "Upload"}
                            <input
                              type="file"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                setPendingUploads((p) => ({
                                  ...p,
                                  [slot.key]: {
                                    file: f,
                                    file_name: f.name,
                                    content_type:
                                      f.type || "application/octet-stream",
                                  },
                                }));
                                setDocs((p) => ({ ...p, [slot.key]: f.name }));
                              }}
                            />
                          </label>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground pt-2">
                You can upload documents later — save your progress and come
                back anytime.
              </p>
              <div className="flex justify-between items-center pt-4 border-t">
                <OnboardingBackBtn onStep={setStep} to={2} />
                <div className="flex items-center gap-3">
                  <Link
                    href="/contact?service=regulatory"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Too much paperwork? We can help — get in touch.
                  </Link>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(4)}>
                      Skip for now
                    </Button>
                    <OnboardingNextBtn onClick={() => setStep(4)} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Review &amp; Submit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border p-4 space-y-2">
                <h3 className="text-sm font-semibold">Applicant</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span>{name}</span>
                  <span className="text-muted-foreground">Email</span>
                  <span>{email}</span>
                  <span className="text-muted-foreground">Company</span>
                  <span>{company}</span>
                  {phone && (
                    <>
                      <span className="text-muted-foreground">Phone</span>
                      <span>{phone}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <h3 className="text-sm font-semibold">Requirements</h3>
                <div className="flex flex-wrap gap-1.5">
                  {[...selOpts].map((id) => (
                    <Badge key={id} variant="secondary" className="text-xs">
                      {allOptLabels[id] ?? id}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <h3 className="text-sm font-semibold">
                  Documents ({uploadedCount} uploaded)
                </h3>
                {docSlots.map((slot) => (
                  <div
                    key={slot.key}
                    className="flex items-center justify-between text-sm"
                  >
                    <span
                      className={docs[slot.key] ? "" : "text-muted-foreground"}
                    >
                      {slot.label}
                    </span>
                    {docs[slot.key] ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                        Uploaded
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${isReq(slot) ? "border-amber-500/30 text-amber-400" : ""}`}
                      >
                        {isReq(slot) ? "Still needed" : "Optional"}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              {submitError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {submitError}
                </p>
              )}
              <div className="flex justify-between pt-2">
                <OnboardingBackBtn onStep={setStep} to={3} />
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Application"}{" "}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 5 && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="size-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Application Submitted</h1>
            <p className="text-muted-foreground mb-1">
              Application ID:{" "}
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {appId}
              </code>
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              We&apos;ll be in touch within 48 hours.
            </p>
            <Card className="text-left mb-8">
              <CardHeader>
                <CardTitle className="text-base">What happens next</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {(
                    [
                      [FileText, "We review your documents and application"],
                      [
                        Briefcase,
                        "We create your organisation and set up your accounts",
                      ],
                      [
                        Zap,
                        "You receive login credentials and connect your venue API keys",
                      ],
                      [
                        CheckCircle2,
                        "Your portal goes live — reporting, compliance, and monitoring ready",
                      ],
                    ] as const
                  ).map(([Icon, text], i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-0.5">
                        <Icon className="size-3.5 text-primary" />
                      </div>
                      <span className="text-sm">{text}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link href="/">Back to Home</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        )}

        {step < 5 && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

function GenericSignup() {
  const searchParams = useSearchParams();
  const preService = searchParams.get("service") ?? "";
  const [selectedServices, setSelectedServices] = React.useState<Set<string>>(
    preService ? new Set([preService]) : new Set(),
  );
  const [step, setStep] = React.useState<"select" | "contact">(
    preService ? "contact" : "select",
  );
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const toggleSvc = (id: string) =>
    setSelectedServices((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="size-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">We&apos;ll be in touch</h1>
          <p className="text-muted-foreground mb-6">
            Our team will reach out within 24 hours to discuss
            {selectedServices.size === 1
              ? ` ${SERVICES.find((s) => s.id === [...selectedServices][0])?.name}`
              : ` your ${selectedServices.size} selected services`}
            .
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href="/">Back to Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Sign In (Existing User)</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  if (step === "select") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3">
              <Sparkles className="mr-1.5 size-3" /> Get Started
            </Badge>
            <h1 className="text-3xl font-bold mb-2">
              Which services are you interested in?
            </h1>
            <p className="text-muted-foreground">
              Select one or more. We&apos;ll tailor the conversation to your
              needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {SERVICES.map((svc) => {
              const Icon = svc.icon,
                sel = selectedServices.has(svc.id);
              return (
                <button
                  key={svc.id}
                  onClick={() => toggleSvc(svc.id)}
                  className={`text-left rounded-xl border p-5 transition-all ${sel ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-border/80 hover:bg-accent/30"}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Icon className={`size-5 ${svc.color}`} />
                      <span className="font-semibold text-sm">{svc.name}</span>
                    </div>
                    {sel && <CheckCircle2 className="size-5 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{svc.desc}</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-[10px]">
                      {svc.price}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              disabled={selectedServices.size === 0}
              onClick={() => setStep("contact")}
            >
              Continue <ArrowRight className="ml-2 size-4" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">
            How would you like to proceed?
          </h1>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {[...selectedServices].map((id) => {
              const s = SERVICES.find((sv) => sv.id === id);
              return s ? (
                <Badge key={id} variant="secondary" className="text-xs">
                  {s.name}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="border-primary/30 hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-5 text-center">
              <Calendar className="size-8 text-primary mx-auto mb-3" />
              <CardTitle className="text-base mb-1">Book a Live Demo</CardTitle>
              <CardDescription className="text-xs">
                See the platform in action. 30-min call with our team.
              </CardDescription>
              <Button size="sm" className="mt-4 w-full" asChild>
                <Link
                  href={`/contact?action=demo&service=${[...selectedServices].join(",")}`}
                >
                  Book Demo <ArrowRight className="ml-1 size-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-border hover:border-border/80 transition-colors cursor-pointer">
            <CardContent className="pt-5 text-center">
              <Mail className="size-8 text-muted-foreground mx-auto mb-3" />
              <CardTitle className="text-base mb-1">Contact Sales</CardTitle>
              <CardDescription className="text-xs">
                Get pricing details, discuss your requirements.
              </CardDescription>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 w-full"
                asChild
              >
                <Link
                  href={`/contact?service=${[...selectedServices].join(",")}`}
                >
                  Contact Us <ArrowRight className="ml-1 size-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs text-muted-foreground">
              or leave your details and we&apos;ll reach out
            </span>
          </div>
        </div>
        <Card>
          <CardContent className="pt-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs">
                    Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company" className="text-xs">
                    Company
                  </Label>
                  <Input
                    id="company"
                    placeholder="Your company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs">
                  Message (optional)
                </Label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your requirements..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">
                Submit Inquiry <ArrowRight className="ml-2 size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="text-center mt-6">
          <button
            onClick={() => setStep("select")}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Change service selection
          </button>
          <span className="mx-3 text-muted-foreground/30">|</span>
          <Link href="/login" className="text-xs text-primary hover:underline">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

function SignupPageContent() {
  const searchParams = useSearchParams();
  const service = searchParams.get("service");
  if (service && ONBOARDING_SERVICES.has(service))
    return (
      <OnboardingWizard serviceType={service as "regulatory" | "investment"} />
    );
  return <GenericSignup />;
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
