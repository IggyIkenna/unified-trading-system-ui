"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, CheckCircle2, Download, FileText, Upload, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DeclarationField, DocSlot, PendingUpload } from "./signup-data";
import { downloadDeclaration, generateDeclarationHtml } from "./signup-pdf";
import { OnboardingBackBtn, OnboardingNextBtn } from "./signup-ui-bits";

export type OnboardingWizardTailProps = {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  docSlots: DocSlot[];
  isReq: (s: DocSlot) => boolean;
  docs: Record<string, string>;
  setDocs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  declarations: Record<string, Record<string, string>>;
  setDeclarations: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>;
  signatures: Record<string, string>;
  setSignatures: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  pendingUploads: Record<string, PendingUpload>;
  setPendingUploads: React.Dispatch<React.SetStateAction<Record<string, PendingUpload>>>;
  expandedDecl: string | null;
  setExpandedDecl: React.Dispatch<React.SetStateAction<string | null>>;
  prepareDeclarationPdf: (
    docType: string,
    title: string,
    fields: DeclarationField[],
    answers: Record<string, string>,
    sig: string,
  ) => Promise<PendingUpload>;
  name: string;
  email: string;
  company: string;
  phone: string;
  saveProgress: (nextStep: number) => Promise<void>;
  handleSubmit: () => Promise<void>;
  submitting: boolean;
  submitError: string;
  selOpts: Set<string>;
  allOptLabels: Record<string, string>;
  uploadedCount: number;
  appId: string;
};

export function OnboardingWizardTail(props: OnboardingWizardTailProps) {
  const {
    step,
    setStep,
    docSlots,
    isReq,
    docs,
    setDocs,
    declarations,
    setDeclarations,
    signatures,
    setSignatures,
    pendingUploads,
    setPendingUploads,
    expandedDecl,
    setExpandedDecl,
    prepareDeclarationPdf,
    name,
    email,
    company,
    phone,
    saveProgress,
    handleSubmit,
    submitting,
    submitError,
    selOpts,
    allOptLabels,
    uploadedCount,
    appId,
  } = props;

  return (
    <>
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Documents</CardTitle>
            <CardDescription>Upload supporting documents for your application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {docSlots.map((slot) => {
              const req = isReq(slot),
                uploaded = !!docs[slot.key];
              const isDecl = !!slot.declaration;
              const declAnswers = declarations[slot.key] || {};
              const declSigned = !!signatures[slot.key];
              const declFieldsFilled = isDecl && slot.declaration!.every((f) => declAnswers[f.id]?.trim());
              const declComplete = declSigned;
              const isExpanded = expandedDecl === slot.key;

              if (isDecl) {
                return (
                  <div key={slot.key} className="rounded-lg border p-3 space-y-2">
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
                          {declSigned ? "Signed" : req ? "Required" : "Optional"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => setExpandedDecl(isExpanded ? null : slot.key)}
                        >
                          {isExpanded ? "Collapse" : declSigned ? "Edit" : "Fill In"}
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
                            <Label className="text-xs">Electronic Signature — type your full name to sign</Label>
                            <Input
                              placeholder={`Type "${name}" to sign`}
                              value={signatures[slot.key] || ""}
                              onChange={(e) =>
                                setSignatures((p) => ({
                                  ...p,
                                  [slot.key]: e.target.value,
                                }))
                              }
                              className={signatures[slot.key] ? "font-serif italic text-lg" : ""}
                            />
                            {signatures[slot.key] && signatures[slot.key].toLowerCase() !== name.toLowerCase() && (
                              <p className="text-xs text-amber-400">Signature should match your full name: {name}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="text-xs"
                              disabled={!declFieldsFilled || !signatures[slot.key]?.trim()}
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
                              disabled={!declFieldsFilled || !signatures[slot.key]?.trim()}
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
                <div key={slot.key} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText className="size-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm truncate">{slot.label}</p>
                        {uploaded && <p className="text-xs text-emerald-400 truncate">{docs[slot.key]}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={uploaded ? "default" : "outline"}
                        className={`text-[10px] ${uploaded ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : ""}`}
                      >
                        {uploaded ? "Uploaded" : req ? "Required" : "Optional"}
                      </Badge>
                      <Button variant="outline" size="sm" className="relative text-xs" asChild>
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
                                  content_type: f.type || "application/octet-stream",
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
              You can upload documents later — save your progress and come back anytime.
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
                  <Button variant="outline" onClick={() => saveProgress(4)}>
                    Skip for now
                  </Button>
                  <OnboardingNextBtn onClick={() => saveProgress(4)} />
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
              <h3 className="text-sm font-semibold">Documents ({uploadedCount} uploaded)</h3>
              {docSlots.map((slot) => (
                <div key={slot.key} className="flex items-center justify-between text-sm">
                  <span className={docs[slot.key] ? "" : "text-muted-foreground"}>{slot.label}</span>
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
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{submitError}</p>
            )}
            <div className="flex justify-between pt-2">
              <OnboardingBackBtn onStep={setStep} to={3} />
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Application"} <ArrowRight className="ml-2 size-4" />
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
            Application ID: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{appId}</code>
          </p>
          <p className="text-sm text-muted-foreground mb-8">We&apos;ll be in touch within 48 hours.</p>
          <Card className="text-left mb-8">
            <CardHeader>
              <CardTitle className="text-base">What happens next</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {(
                  [
                    [FileText, "We review your documents and application"],
                    [Briefcase, "We create your organisation and set up your accounts"],
                    [Zap, "You receive login credentials and connect your venue API keys"],
                    [CheckCircle2, "Your portal goes live — reporting, compliance, and monitoring ready"],
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
    </>
  );
}
