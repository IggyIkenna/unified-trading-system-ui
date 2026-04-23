"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  MapPin,
  Phone,
  Send,
  CheckCircle2,
  Building2,
  MessageSquare,
  CalendarClock,
} from "lucide-react";
import { CALENDLY_URL } from "@/lib/marketing/calendly";

/**
 * Commercial-path labels and pre-fill message templates for the five paths
 * locked 2026-04-20. URL query param `?service=<key>` prefills the inquiry
 * dropdown and seeds a contextual message.
 *
 * Legacy keys (`data`, `backtesting`, `execution`, `platform`) are mapped
 * forward to the nearest current path so inbound links from older surfaces
 * do not break.
 */
const SERVICE_CONFIG: Record<
  string,
  { inquiryValue: string; label: string; demoMessage: string }
> = {
  "investment-management": {
    inquiryValue: "investment-management",
    label: "Investment Management",
    demoMessage:
      "I'd like to book the 45-minute Investment Management call to walk the strategy surface, SMA-versus-Pooled structure, and platform-fee choice against my mandate.",
  },
  regulatory: {
    inquiryValue: "regulatory",
    label: "Regulatory Umbrella",
    demoMessage:
      "I'd like to book the 45-minute Regulatory Umbrella call to walk my activity against Odum's FCA permissions, confirm scope fit, and map the five onboarding workstreams.",
  },
  "dart-signals-in": {
    inquiryValue: "dart-signals-in",
    label: "DART Signals-In — your signals, our execution",
    demoMessage:
      "I'd like to book the 45-minute DART Signals-In call to walk the instruction schema against my upstream and cover execution, reconciliation, and reporting scope.",
  },
  "dart-full": {
    inquiryValue: "dart-full",
    label: "DART — Full Pipeline",
    demoMessage:
      "I'd like to book the 45-minute DART Full-Pipeline call to walk the research surface against one of my strategy candidates and the promotion path through to live.",
  },
  "signals-out": {
    inquiryValue: "signals-out",
    label: "Odum Signals — our signals, your execution",
    demoMessage:
      "I'd like to discuss Odum Signals — Odum-generated signals delivered to my execution infrastructure. Interested in delivery mechanics, payload schema, and counterparty onboarding.",
  },
  // Legacy aliases — forward to the nearest current path.
  investment: {
    inquiryValue: "investment-management",
    label: "Investment Management",
    demoMessage:
      "I'd like to book the 45-minute Investment Management call to walk the strategy surface, SMA-versus-Pooled structure, and platform-fee choice against my mandate.",
  },
  platform: {
    inquiryValue: "dart-full",
    label: "DART — Full Pipeline",
    demoMessage:
      "I'd like to book the 45-minute DART call to walk the platform scope against my operation.",
  },
  data: {
    inquiryValue: "dart-full",
    label: "DART — Full Pipeline",
    demoMessage:
      "I'd like to book the 45-minute DART call to walk data coverage and research scope against my operation.",
  },
  backtesting: {
    inquiryValue: "dart-full",
    label: "DART — Full Pipeline",
    demoMessage:
      "I'd like to book the 45-minute DART Full-Pipeline call to walk the research and promote surface against one of my strategy candidates.",
  },
  execution: {
    inquiryValue: "dart-signals-in",
    label: "DART — Signals-In",
    demoMessage:
      "I'd like to book the 45-minute DART Signals-In call to cover execution, reconciliation, and reporting scope against my upstream.",
  },
};

const ACTION_CONFIG: Record<string, { suffix: string }> = {
  demo: { suffix: "" }, // demo message is already in SERVICE_CONFIG
  "smart-alpha": {
    suffix:
      "\n\nI'm particularly interested in the Smart Alpha execution algorithms.",
  },
};

function ContactPageContent() {
  const searchParams = useSearchParams();
  const [submitted, setSubmitted] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    company: "",
    inquiry: "",
    message: "",
  });
  const [prefillApplied, setPrefillApplied] = React.useState(false);

  // Pre-fill form based on URL params (only once on mount)
  React.useEffect(() => {
    if (prefillApplied) return;

    const serviceParam = searchParams.get("service");
    const actionParam = searchParams.get("action");

    if (!serviceParam) return;

    // Handle multiple services (comma-separated from signup page)
    const services = serviceParam.split(",").filter(Boolean);
    const primaryService = services[0];
    const serviceConfig = SERVICE_CONFIG[primaryService];

    if (!serviceConfig) return;

    let inquiry = serviceConfig.inquiryValue;
    let message = "";

    // Build message based on action
    if (actionParam === "demo") {
      message = serviceConfig.demoMessage;
      // If multiple services selected, mention them
      if (services.length > 1) {
        const additionalServices = services
          .slice(1)
          .map((s) => SERVICE_CONFIG[s]?.label)
          .filter(Boolean);
        if (additionalServices.length > 0) {
          message += `\n\nI'm also interested in: ${additionalServices.join(", ")}.`;
        }
      }
    } else if (actionParam && ACTION_CONFIG[actionParam]) {
      message = serviceConfig.demoMessage + ACTION_CONFIG[actionParam].suffix;
    } else {
      // General inquiry — list all selected services naturally
      const allLabels = services
        .map((s) => SERVICE_CONFIG[s]?.label)
        .filter(Boolean);
      if (allLabels.length === 1) {
        message = `I'm interested in ${allLabels[0]}. I'd like to learn more about pricing and how it works.`;
      } else {
        const lines = allLabels.map((l) => `I'm interested in ${l}.`);
        message =
          lines.join("\n") +
          "\n\nI'd like to learn more about pricing and how these services work together.";
      }
    }

    setFormData((prev) => ({
      ...prev,
      inquiry,
      message,
    }));
    setPrefillApplied(true);
  }, [searchParams, prefillApplied]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-16 md:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Get in touch with our team. We typically respond within 24 hours.
            </p>
          </div>

          {/* Calendly shortcut — skip the form if you'd rather book directly */}
          <div className="mb-10 flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card/40 px-4 py-5 text-center sm:flex-row sm:gap-4 sm:text-left">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Prefer to skip the form?
              </p>
              <p className="text-sm text-muted-foreground">
                Book a 45-minute call directly — no email required.
              </p>
            </div>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <CalendarClock className="size-4" />
              Book a 45-minute call
            </a>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <Mail className="size-6 text-primary mb-2" />
                  <CardTitle className="text-base">Email</CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href="mailto:info@odum-research.co.uk"
                    className="text-sm text-primary hover:underline"
                  >
                    info@odum-research.co.uk
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <Building2 className="size-6 text-primary mb-2" />
                  <CardTitle className="text-base">Registered Office</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Odum Research Ltd
                    <br />
                    9 Appold Street
                    <br />
                    London, EC2A 2AP
                  </p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    FCA 975797
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <MessageSquare className="size-6 text-primary mb-2" />
                  <CardTitle className="text-base">Inquiry Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Investment Management
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Regulatory Umbrella
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    DART Signals-In (your signals, our execution)
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    DART — Full Pipeline
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Odum Signals (our signals, your execution)
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Partnership
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>
                  Fill out the form below and we will get back to you shortly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                      <CheckCircle2 className="size-6 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold">Message Sent</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Thank you for reaching out. We will respond to your
                      inquiry within 24 hours.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-6"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          name: "",
                          email: "",
                          company: "",
                          inquiry: "",
                          message: "",
                        });
                      }}
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="John Smith"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@company.com"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          placeholder="Company Name"
                          value={formData.company}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              company: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inquiry">Inquiry Type *</Label>
                        <Select
                          value={formData.inquiry}
                          onValueChange={(value) =>
                            setFormData({ ...formData, inquiry: value })
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select inquiry type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="investment-management">
                              Investment Management
                            </SelectItem>
                            <SelectItem value="regulatory">
                              Regulatory Umbrella
                            </SelectItem>
                            <SelectItem value="dart-signals-in">
                              DART Signals-In — your signals, our execution
                            </SelectItem>
                            <SelectItem value="dart-full">
                              DART — Full Pipeline
                            </SelectItem>
                            <SelectItem value="signals-out">
                              Odum Signals — our signals, your execution
                            </SelectItem>
                            <SelectItem value="partnership">
                              Partnership
                            </SelectItem>
                            <SelectItem value="support">
                              Technical Support
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us about your requirements, use case, or questions..."
                        rows={6}
                        required
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        * Required fields
                      </p>
                      <Button type="submit">
                        <Send className="mr-2 size-4" />
                        Send Message
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alternative Contact */}
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              <CalendarClock className="size-4" />
              Book a 45-minute call on Calendly
            </a>
            <p className="text-sm text-muted-foreground">
              Prefer to email directly? Reach us at{" "}
              <a
                href="mailto:info@odum-research.co.uk"
                className="text-primary hover:underline"
              >
                info@odum-research.co.uk
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer handled by (public)/layout.tsx */}
    </div>
  );
}

export default function ContactPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="container px-4 py-16 md:px-6">
            <div className="mx-auto max-w-4xl">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight">
                  Contact Us
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  Get in touch with our team.
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ContactPageContent />
    </React.Suspense>
  );
}
