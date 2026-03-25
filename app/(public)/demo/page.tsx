"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Shield, Clock, Video } from "lucide-react";

export default function DemoPage() {
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Video className="size-3 mr-1" />
              Live Demo
            </Badge>
            <h1 className="text-4xl font-bold mb-4">Book a Demo</h1>
            <p className="text-xl text-muted-foreground">
              See the Unified Trading Platform in action. Our team will walk you
              through the features most relevant to your use case.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Benefits */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What to Expect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-emerald-400 mt-0.5" />
                    <div>
                      <div className="font-medium">
                        Personalised Walkthrough
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Tailored to your specific asset classes and use case
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-emerald-400 mt-0.5" />
                    <div>
                      <div className="font-medium">Live System Demo</div>
                      <div className="text-sm text-muted-foreground">
                        See real data, real strategies, real execution
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-emerald-400 mt-0.5" />
                    <div>
                      <div className="font-medium">Q&A Session</div>
                      <div className="text-sm text-muted-foreground">
                        Ask questions about pricing, integration, and compliance
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-emerald-400 mt-0.5" />
                    <div>
                      <div className="font-medium">Next Steps</div>
                      <div className="text-sm text-muted-foreground">
                        Clear path to getting started if it&apos;s a fit
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="size-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">30 Minute Session</div>
                      <div className="text-sm text-muted-foreground">
                        Efficient use of your time
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="size-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">FCA Authorised</div>
                      <div className="text-sm text-muted-foreground">
                        Reference Number 975797
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle>Request Demo</CardTitle>
                <CardDescription>
                  Fill out the form and we&apos;ll be in touch within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="size-16 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      Demo Requested
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      We&apos;ll be in touch within 24 hours to schedule your
                      demo.
                    </p>
                    <Button variant="outline" asChild>
                      <Link href="/">Return Home</Link>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Work Email</Label>
                      <Input id="email" type="email" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        placeholder="e.g. Apex Capital, Citadel Securities"
                        autoComplete="organization"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interest">Primary Interest</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="data">Data Provision</SelectItem>
                          <SelectItem value="backtesting">
                            Research &amp; Build
                          </SelectItem>
                          <SelectItem value="platform">
                            Trading Terminal
                          </SelectItem>
                          <SelectItem value="investment">
                            Investment Management
                          </SelectItem>
                          <SelectItem value="regulatory">
                            Regulatory Umbrella
                          </SelectItem>
                          <SelectItem value="multiple">
                            Multiple Services
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">
                        Anything specific you&apos;d like to see?
                      </Label>
                      <Textarea id="message" rows={3} />
                    </div>
                    <Button type="submit" className="w-full">
                      <Calendar className="size-4 mr-2" />
                      Request Demo
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
