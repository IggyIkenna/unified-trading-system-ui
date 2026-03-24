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
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Scale,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function RegulatoryServicePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-slate-400/10">
              <Shield className="size-8 text-slate-400" />
            </div>
            <Badge variant="outline" className="mb-4">
              FCA 975797
            </Badge>
            <h1 className="text-3xl font-bold">Regulatory Umbrella</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              FCA Appointed Representative services for institutional algo
              trading firms. Operate legally in weeks.
            </p>
          </div>

          {/* Key Benefits */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <Clock className="size-8 text-emerald-400 mb-2" />
                <CardTitle className="text-base">Days, Not Years</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Start trading legally in days rather than the 12-24 months for
                  direct FCA authorisation
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Scale className="size-8 text-sky-400 mb-2" />
                <CardTitle className="text-base">Full FCA Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Dealing, arranging, advising, and managing permissions under
                  our FCA authorisation
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Users className="size-8 text-violet-400 mb-2" />
                <CardTitle className="text-base">Compliance Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  MLRO services and ongoing regulatory supervision
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* FCA Activities */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Regulated Activities Available</CardTitle>
              <CardDescription>
                Activities you can conduct under our UK and EU regulatory
                coverage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-medium">
                    Dealing in Investments as Principal{" "}
                    <Badge
                      variant="outline"
                      className="ml-2 text-[10px] px-1.5 py-0"
                    >
                      UK — FCA
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Trade your own capital across regulated markets
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-medium">
                    Dealing in Investments as Agent{" "}
                    <Badge
                      variant="outline"
                      className="ml-2 text-[10px] px-1.5 py-0"
                    >
                      UK — FCA
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Execute trades on behalf of clients
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-medium">
                    Arranging Deals in Investments{" "}
                    <Badge
                      variant="outline"
                      className="ml-2 text-[10px] px-1.5 py-0"
                    >
                      UK — FCA
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Introduce clients and arrange transactions
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-medium">
                    Managing Investments{" "}
                    <Badge
                      variant="outline"
                      className="ml-2 text-[10px] px-1.5 py-0"
                    >
                      UK — FCA
                    </Badge>{" "}
                    <Badge
                      variant="outline"
                      className="ml-1 text-[10px] px-1.5 py-0"
                    >
                      EU Regulated
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Discretionary portfolio management
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-400/5 border border-emerald-400/20">
                <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-medium">
                    Fund Structure — Crypto Spot{" "}
                    <Badge
                      variant="outline"
                      className="ml-2 text-[10px] px-1.5 py-0"
                    >
                      UK — FCA
                    </Badge>{" "}
                    <Badge
                      variant="outline"
                      className="ml-1 text-[10px] px-1.5 py-0"
                    >
                      EU Regulated
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Pure crypto spot fund vehicles managed by us.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <CheckCircle2 className="size-5 text-primary shrink-0" />
                <div>
                  <div className="font-medium">
                    Fund Structure — Derivatives &amp; Traditional Markets{" "}
                    <Badge
                      variant="outline"
                      className="ml-2 text-[10px] px-1.5 py-0"
                    >
                      EU Regulated
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Crypto derivatives, options, futures, and traditional
                    markets (equities, FX, fixed income, commodities). Managed
                    by us under combined UK + EU regulatory coverage.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Options */}
          <h3 className="text-xl font-semibold mb-4">Engagement Options</h3>
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card className="border-emerald-400/30">
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-2">
                  Appointed Representative
                </Badge>
                <CardTitle>AR Setup</CardTitle>
                <div className="text-xl font-bold">From £4,000/mo</div>
                <CardDescription>
                  Plus one-time setup fee. Operate under our FCA authorisation
                  as an Appointed Representative.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Full FCA AR registration
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Due diligence review
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  FCA notification
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Compliance manual
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Staff training
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-2">
                  Strategic Advisor
                </Badge>
                <CardTitle>Advisory Engagement</CardTitle>
                <div className="text-xl font-bold">From £3,000/mo</div>
                <CardDescription>
                  Plus one-time setup fee. Contracted advisory role under our
                  regulatory supervision.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Contracted advisory role
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Activities under our supervision
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Access to additional services
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Streamlined onboarding
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Revenue sharing models
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <Badge
                  variant="outline"
                  className="w-fit mb-2 border-primary/40 text-primary"
                >
                  Fund Structure
                </Badge>
                <CardTitle>Fund Management</CardTitle>
                <div className="text-2xl font-bold">Contact Us</div>
                <CardDescription>
                  Two paths depending on asset class — we manage both under full
                  regulatory coverage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Crypto Spot
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Pure crypto spot funds housed entirely by us
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Streamlined setup with full platform support
                </div>
                <div className="border-t border-border my-2" />
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Derivatives &amp; Traditional Markets
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Derivatives and traditional markets (equities, FX, fixed
                  income, commodities)
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  EU-regulated fund vehicles for all asset classes
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Combined FCA + EU regulatory coverage
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Fees */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>AR Monthly Supervision</CardTitle>
              <div className="text-2xl font-bold">
                Included with Full Platform
              </div>
              <CardDescription>
                Ongoing compliance services for Appointed Representatives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    Compliance monitoring
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    MLRO services
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    Regulatory reporting
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    Annual review
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    MiFID II transaction reporting
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    Ongoing regulatory supervision
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-400">
                  Professional Clients Only
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  All Odum Research services are available exclusively to
                  Professional Clients and Eligible Counterparties. Retail
                  client business is not permitted.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Start your application. Upload documents progressively — you
              don&apos;t need everything at once.
            </p>
            <Button size="lg" asChild>
              <Link href="/signup?service=regulatory">
                Get Started
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* See It In Action */}
      <section className="border-t border-border">
        <div className="container px-4 py-16 md:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <h2 className="text-2xl font-bold">See It In Action</h2>
              <p className="mt-2 text-muted-foreground">
                Start your application online. Upload your documents at your own
                pace — proof of address, identity, source of funds. We review
                everything and get you trading under our regulatory umbrella.
              </p>
              <Link href="/signup?service=regulatory">
                <Badge
                  variant="outline"
                  className="mt-4 border-primary/30 text-primary cursor-pointer hover:bg-primary/10"
                >
                  Apply Now
                </Badge>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Control Levels */}
      <section className="py-12 border-t border-border">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl">
            <h3 className="text-lg font-semibold mb-2">How You Can Use This</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Choose your level of control. Mix and match as needed.
            </p>
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Self-Service</CardTitle>
                  <CardDescription className="text-xs">
                    Our tools and templates, you manage
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Compliance dashboard and reporting templates
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    MiFID II transaction reporting tools
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Best execution monitoring and audit trail
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    KYC/AML workflow management
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Managed</CardTitle>
                  <CardDescription className="text-xs">
                    We handle all compliance for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    MLRO services and ongoing regulatory supervision
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Full FCA regulatory reporting handled by us
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Ongoing supervision and annual reviews
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Staff training and compliance manual maintenance
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">BYO Processes</CardTitle>
                  <CardDescription className="text-xs">
                    Your compliance processes, our regulatory umbrella
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Operate under our FCA authorisation as AR
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Use your own compliance processes and team
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Our oversight ensures regulatory compliance
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Faster onboarding than direct FCA authorisation
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Fund Structure</CardTitle>
                  <CardDescription className="text-xs">
                    We set up and manage fund vehicles for your strategies
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Regulated fund vehicle setup and administration
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Launch regulated fund vehicles for your strategies
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Client distribution through our network
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />{" "}
                    Combined with our regulatory umbrella for full coverage
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance nudge */}
      <section className="border-t border-border">
        <div className="container px-4 py-12 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you&apos;re managing capital, executing trades, or advising on
              investments — however you describe it internally — those are
              regulated activities. The line between software and advice is
              thinner than most people think, and the consequences of getting it
              wrong are real. Getting properly authorised doesn&apos;t have to
              be complicated or expensive. We&apos;ve built the infrastructure
              to make it straightforward. Better to do it right from day one
              than to find out the hard way.
            </p>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="border-t border-border">
        <div className="container px-4 py-16 md:px-6">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-2">
              Ready to get started?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Book a live demo to see the platform, or create your account to
              start exploring.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/contact?service=regulatory&action=demo">
                  Book a Live Demo
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/signup?service=regulatory">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
