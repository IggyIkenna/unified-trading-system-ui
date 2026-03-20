"use client"

import Link from "next/link"
import { ArrowRight, Check, Building2, Users, Zap, Shield, BarChart3, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/shell/site-header"

const ENGAGEMENT_MODELS = [
  {
    id: "saas",
    name: "SaaS Platform",
    description: "Full access to our cloud-hosted trading platform with dedicated support.",
    icon: Zap,
    pricing: "From $5,000/mo",
    features: [
      "Cloud-hosted infrastructure",
      "Real-time market data feeds",
      "Strategy backtesting engine",
      "Execution management system",
      "Risk monitoring dashboard",
      "API access for custom integrations",
      "24/7 technical support",
      "Regular platform updates",
    ],
    bestFor: "Hedge funds, family offices, and trading desks seeking turnkey solutions",
    cta: "Start Free Trial",
  },
  {
    id: "whitelabel",
    name: "White-Label",
    description: "Deploy our platform under your brand with full customization options.",
    icon: Building2,
    pricing: "Custom pricing",
    features: [
      "Your branding and domain",
      "Custom UI/UX design",
      "Dedicated infrastructure",
      "Private cloud or on-premise",
      "Custom feature development",
      "Integration with existing systems",
      "Dedicated account manager",
      "SLA guarantees",
    ],
    bestFor: "Banks, brokers, and fintechs building client-facing platforms",
    cta: "Contact Sales",
  },
  {
    id: "managed",
    name: "Managed Services",
    description: "We operate and optimize your trading infrastructure end-to-end.",
    icon: Users,
    pricing: "Performance-based",
    features: [
      "Full operational management",
      "Strategy optimization",
      "Risk management oversight",
      "Regulatory compliance support",
      "Performance reporting",
      "Infrastructure scaling",
      "Disaster recovery",
      "Audit trail management",
    ],
    bestFor: "Asset managers and allocators seeking operational efficiency",
    cta: "Schedule Call",
  },
]

const COMPARISON_FEATURES = [
  { feature: "Platform Access", saas: true, whitelabel: true, managed: true },
  { feature: "Custom Branding", saas: false, whitelabel: true, managed: false },
  { feature: "Dedicated Infrastructure", saas: false, whitelabel: true, managed: true },
  { feature: "API Access", saas: true, whitelabel: true, managed: true },
  { feature: "24/7 Support", saas: true, whitelabel: true, managed: true },
  { feature: "Custom Development", saas: false, whitelabel: true, managed: false },
  { feature: "Operational Management", saas: false, whitelabel: false, managed: true },
  { feature: "Performance Optimization", saas: false, whitelabel: false, managed: true },
  { feature: "Compliance Support", saas: "Basic", whitelabel: "Full", managed: "Full" },
  { feature: "SLA Guarantee", saas: "99.5%", whitelabel: "99.9%", managed: "99.9%" },
]

export default function EngagementModelsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-4">Flexible Partnership Options</Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Engagement Models
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Choose the partnership model that best fits your business needs. 
              From self-service SaaS to fully managed solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Models Grid */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {ENGAGEMENT_MODELS.map((model) => (
              <Card key={model.id} className="relative flex flex-col">
                {model.id === "whitelabel" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <model.icon className="size-5 text-primary" />
                    </div>
                    <CardTitle>{model.name}</CardTitle>
                  </div>
                  <CardDescription>{model.description}</CardDescription>
                  <div className="pt-2">
                    <span className="text-2xl font-bold">{model.pricing}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-2 mb-6 flex-1">
                    {model.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="size-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-4">
                      <strong>Best for:</strong> {model.bestFor}
                    </p>
                    <Button className="w-full" variant={model.id === "whitelabel" ? "default" : "outline"} asChild>
                      <Link href="/contact">
                        {model.cta}
                        <ArrowRight className="ml-2 size-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Feature Comparison</h2>
            <p className="text-muted-foreground">See what's included in each engagement model</p>
          </div>
          
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 font-medium">Feature</th>
                  <th className="text-center py-4 px-4 font-medium">SaaS</th>
                  <th className="text-center py-4 px-4 font-medium">White-Label</th>
                  <th className="text-center py-4 px-4 font-medium">Managed</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((row) => (
                  <tr key={row.feature} className="border-b">
                    <td className="py-3 px-4 text-sm">{row.feature}</td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.saas === "boolean" ? (
                        row.saas ? (
                          <Check className="size-4 text-primary mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )
                      ) : (
                        <span className="text-sm">{row.saas}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.whitelabel === "boolean" ? (
                        row.whitelabel ? (
                          <Check className="size-4 text-primary mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )
                      ) : (
                        <span className="text-sm">{row.whitelabel}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.managed === "boolean" ? (
                        row.managed ? (
                          <Check className="size-4 text-primary mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )
                      ) : (
                        <span className="text-sm">{row.managed}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Not sure which model is right for you?</h2>
              <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Our team can help you evaluate your requirements and recommend the best engagement model for your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/contact">Schedule Consultation</Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10" asChild>
                  <Link href="/demo">View Platform Demo</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4 md:px-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Odum Research Ltd. All rights reserved. FCA Registered (975797)</p>
        </div>
      </footer>
    </div>
  )
}
