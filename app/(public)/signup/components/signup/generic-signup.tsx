"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Calendar, CheckCircle2, Mail, Sparkles } from "lucide-react";
import { ONBOARDING_SERVICES, SERVICES } from "./signup-data";

export function GenericSignup() {
  const searchParams = useSearchParams();
  const preService = searchParams.get("service") ?? "";
  const [selectedServices, setSelectedServices] = React.useState<Set<string>>(
    preService ? new Set([preService]) : new Set(),
  );
  const [step, setStep] = React.useState<"select" | "contact">(preService ? "contact" : "select");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [company, setCompany] = React.useState("");
  const preServiceLabel = preService ? SERVICES.find((s) => s.id === preService)?.name || preService : "";
  const [message, setMessage] = React.useState(
    preService ? `I'm interested in ${preServiceLabel}. I'd like to learn more about how it works and pricing.` : "",
  );
  const [submitted, setSubmitted] = React.useState(false);
  // Single service selection for signup
  const selectSvc = (id: string) => setSelectedServices(new Set([id]));

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
            <h1 className="text-3xl font-bold mb-2">Which service would you like to sign up for?</h1>
            <p className="text-muted-foreground">
              Select one service. Once you&apos;re onboarded, you can easily add more.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {SERVICES.map((svc) => {
              const Icon = svc.icon,
                sel = selectedServices.has(svc.id);
              return (
                <button
                  key={svc.id}
                  onClick={() => selectSvc(svc.id)}
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
            {selectedServices.size === 1 && ONBOARDING_SERVICES.has([...selectedServices][0]) ? (
              <Button size="lg" asChild>
                <Link href={`/signup?service=${[...selectedServices][0]}`}>
                  Start Application <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            ) : selectedServices.size === 1 ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground max-w-md">
                  This service doesn&apos;t currently support self-service signup. Get in touch and we&apos;ll help get
                  you set up.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button size="lg" asChild>
                    <Link href={`/demo?service=${[...selectedServices][0]}`}>
                      Book a Demo <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href={`/contact?service=${[...selectedServices][0]}`}>Contact Us</Link>
                  </Button>
                </div>
              </div>
            ) : null}
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
          <h1 className="text-2xl font-bold mb-2">How would you like to proceed?</h1>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {[...selectedServices].map((id) => {
              const s = SERVICES.find((sv) => sv.id === id);
              const Icon = s?.icon;
              return s ? (
                <Badge key={id} variant="secondary" className="text-xs gap-1">
                  {Icon && <Icon className={`size-3 ${s.color}`} />}
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
                <Link href={`/demo?service=${[...selectedServices].join(",")}`}>
                  Book Demo <ArrowRight className="ml-1 size-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-border hover:border-border/80 transition-colors cursor-pointer">
            <CardContent className="pt-5 text-center">
              <Mail className="size-8 text-muted-foreground mx-auto mb-3" />
              <CardTitle className="text-base mb-1">Get in Touch</CardTitle>
              <CardDescription className="text-xs">Get pricing details, discuss your requirements.</CardDescription>
              <Button size="sm" variant="outline" className="mt-4 w-full" asChild>
                <Link href={`/contact?service=${[...selectedServices].join(",")}`}>
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
          <button onClick={() => setStep("select")} className="text-xs text-muted-foreground hover:text-foreground">
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
