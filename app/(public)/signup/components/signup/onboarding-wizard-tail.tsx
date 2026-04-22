"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, CheckCircle2, FileText, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingBackBtn, OnboardingNextBtn } from "./signup-ui-bits";

export type OnboardingWizardTailProps = {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  serviceType: "regulatory" | "investment";
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
  appId: string;
};

export function OnboardingWizardTail(props: OnboardingWizardTailProps) {
  const {
    step,
    setStep,
    serviceType,
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
    appId,
  } = props;

  return (
    <>
      {step === 3 && serviceType === "investment" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No uploads needed at signup</CardTitle>
            <CardDescription>
              Investment Management contracts are generated from your firm details; KYC / AML documents
              are handled after approval via a signed-URL drop-box.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-border/60 bg-muted/20 p-4 text-sm text-foreground/85">
              <p className="font-medium text-foreground">What happens next</p>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
                <li>
                  We generate the <strong>investment management agreement</strong> and the custody / SMA
                  letters from the entity details you&apos;ve provided.
                </li>
                <li>
                  An Odum team member reviews your application and emails you the draft contracts plus a
                  secure upload link for any KYC / AML documents needed at that stage.
                </li>
                <li>
                  Once everything&apos;s signed, your account is activated and you&apos;ll receive an email
                  verification link before first sign-in.
                </li>
              </ul>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <OnboardingBackBtn onStep={setStep} to={2} />
              <OnboardingNextBtn onClick={() => saveProgress(4)} />
            </div>
          </CardContent>
        </Card>
      )}
      {step === 3 && serviceType !== "investment" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No uploads needed at signup</CardTitle>
            <CardDescription>
              Regulatory Umbrella contracts are generated from your engagement type and entity
              details; KYC / AML and PEP documents are handled after approval via a signed-URL
              drop-box.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-border/60 bg-muted/20 p-4 text-sm text-foreground/85">
              <p className="font-medium text-foreground">What happens next</p>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
                <li>
                  We draft the <strong>engagement-specific contract pack</strong> (AR or Advisory
                  agreement, scope of regulated activities, add-on services) from the entity details
                  you&apos;ve provided.
                </li>
                <li>
                  An Odum compliance team member reviews your application and emails you the draft
                  contracts plus a secure upload link for KYC / AML / PEP documents needed at that
                  stage.
                </li>
                <li>
                  Once everything&apos;s signed, your account is activated and you&apos;ll receive an
                  email verification link before first sign-in.
                </li>
              </ul>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <OnboardingBackBtn onStep={setStep} to={2} />
              <div className="flex items-center gap-3">
                <Link
                  href="/contact?service=regulatory"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Questions about the contract scope? Get in touch.
                </Link>
                <OnboardingNextBtn onClick={() => saveProgress(4)} />
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
            <div className="rounded-lg border p-4 space-y-1.5">
              <h3 className="text-sm font-semibold">Documents</h3>
              <p className="text-xs text-muted-foreground">
                No documents are uploaded at signup. After approval an Odum operator emails you a
                signed-URL drop-box for KYC / AML / PEP documents.
              </p>
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
