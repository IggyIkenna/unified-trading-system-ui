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
} from "lucide-react";

/**
 * Service labels and pre-fill message templates
 * Maps URL param values to form inquiry values and contextual messages
 */
const SERVICE_CONFIG: Record<
  string,
  { inquiryValue: string; label: string; demoMessage: string }
> = {
  data: {
    inquiryValue: "data",
    label: "Data API Access",
    demoMessage:
      "I'd like to schedule a demo of the Data Provision service to explore instrument coverage, data freshness monitoring, and query/download pricing.",
  },
  backtesting: {
    inquiryValue: "backtesting",
    label: "Backtesting Services",
    demoMessage:
      "I'd like to schedule a demo of the Research & Backtesting platform to explore strategy backtesting, ML signal evaluation, and promotion pipelines.",
  },
  execution: {
    inquiryValue: "execution",
    label: "Execution Services",
    demoMessage:
      "I'd like to schedule a demo of the Execution Services to explore order management, venue connectivity, and execution analytics.",
  },
  platform: {
    inquiryValue: "platform",
    label: "Platform Licensing",
    demoMessage:
      "I'm interested in licensing the full platform for my organisation. I'd like to discuss deployment options and pricing.",
  },
  investment: {
    inquiryValue: "investment",
    label: "Investment Management",
    demoMessage:
      "I'd like to discuss investment management services and explore how Odum Research can help with portfolio management.",
  },
  regulatory: {
    inquiryValue: "regulatory",
    label: "Regulatory Services (AR)",
    demoMessage:
      "I'd like to learn more about becoming an Appointed Representative and the regulatory services offered.",
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
    } else if (actionParam && ACTION_CONFIG[actionParam]) {
      message = serviceConfig.demoMessage + ACTION_CONFIG[actionParam].suffix;
    }

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
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Get in touch with our team. We typically respond within 24 hours.
            </p>
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
                    Data API access
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Backtesting services
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Platform licensing
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Investment management
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Regulatory services
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Partnership opportunities
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
                            <SelectItem value="data">
                              Data API Access
                            </SelectItem>
                            <SelectItem value="backtesting">
                              Backtesting Services
                            </SelectItem>
                            <SelectItem value="execution">
                              Execution Services
                            </SelectItem>
                            <SelectItem value="platform">
                              Platform Licensing
                            </SelectItem>
                            <SelectItem value="investment">
                              Investment Management
                            </SelectItem>
                            <SelectItem value="regulatory">
                              Regulatory Services (AR)
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
          <div className="mt-12 text-center">
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
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <ContactPageContent />
    </React.Suspense>
  );
}
