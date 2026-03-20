"use client"

import React, { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Database, Brain, Zap, Briefcase, Shield, Layers,
  ArrowRight, CheckCircle2, Calendar, Mail, Sparkles,
} from "lucide-react"

const SERVICES = [
  { id: "data", name: "Data Access", icon: Database, color: "text-sky-400", price: "From £250/mo", desc: "Market data across 128 venues, 5 asset classes" },
  { id: "backtesting", name: "Research & Backtesting", icon: Brain, color: "text-violet-400", price: "Contact us", desc: "ML model training, strategy backtesting, signal configuration" },
  { id: "execution", name: "Execution as a Service", icon: Zap, color: "text-emerald-400", price: "Contact us", desc: "Multi-venue execution, position management, risk monitoring" },
  { id: "investment", name: "Investment Management", icon: Briefcase, color: "text-rose-400", price: "Contact us", desc: "FCA-authorised investment management, SMA/Fund structures" },
  { id: "platform", name: "Full Platform", icon: Layers, color: "text-amber-400", price: "Contact us", desc: "End-to-end: data, research, execution, reporting, compliance" },
  { id: "regulatory", name: "Regulatory Umbrella", icon: Shield, color: "text-slate-400", price: "Contact us", desc: "FCA Appointed Representative services for algo trading firms" },
]

function SignupPageContent() {
  const searchParams = useSearchParams()
  const preService = searchParams.get("service") ?? ""
  const preAction = searchParams.get("action") ?? ""

  const [selectedServices, setSelectedServices] = React.useState<Set<string>>(
    preService ? new Set([preService]) : new Set()
  )
  const [step, setStep] = React.useState<"select" | "contact">(preService ? "contact" : "select")
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [company, setCompany] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  function toggleService(id: string) {
    setSelectedServices(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

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
              ? ` ${SERVICES.find(s => s.id === [...selectedServices][0])?.name}`
              : ` your ${selectedServices.size} selected services`
            }.
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
    )
  }

  if (step === "select") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3">
              <Sparkles className="mr-1.5 size-3" /> Get Started
            </Badge>
            <h1 className="text-3xl font-bold mb-2">Which services are you interested in?</h1>
            <p className="text-muted-foreground">
              Select one or more. We&apos;ll tailor the conversation to your needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {SERVICES.map((service) => {
              const Icon = service.icon
              const selected = selectedServices.has(service.id)
              return (
                <button
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={`text-left rounded-xl border p-5 transition-all ${
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:border-border/80 hover:bg-accent/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Icon className={`size-5 ${service.color}`} />
                      <span className="font-semibold text-sm">{service.name}</span>
                    </div>
                    {selected && <CheckCircle2 className="size-5 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{service.desc}</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-[10px]">{service.price}</Badge>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              disabled={selectedServices.size === 0}
              onClick={() => setStep("contact")}
            >
              Continue
              <ArrowRight className="ml-2 size-4" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Contact form step
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">How would you like to proceed?</h1>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {[...selectedServices].map(id => {
              const svc = SERVICES.find(s => s.id === id)
              return svc ? (
                <Badge key={id} variant="secondary" className="text-xs">{svc.name}</Badge>
              ) : null
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="border-primary/30 hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-5 text-center">
              <Calendar className="size-8 text-primary mx-auto mb-3" />
              <CardTitle className="text-base mb-1">Book a Live Demo</CardTitle>
              <CardDescription className="text-xs">
                See the platform in action. 30-min call with our team.
              </CardDescription>
              <Button size="sm" className="mt-4 w-full" asChild>
                <Link href={`/contact?action=demo&service=${[...selectedServices].join(",")}`}>
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
              <Button size="sm" variant="outline" className="mt-4 w-full" asChild>
                <Link href={`/contact?service=${[...selectedServices].join(",")}`}>
                  Contact Us <ArrowRight className="ml-1 size-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Or leave details directly */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or leave your details and we&apos;ll reach out</span></div>
        </div>

        <Card>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs">Name</Label>
                  <Input id="name" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company" className="text-xs">Company</Label>
                  <Input id="company" placeholder="Your company" value={company} onChange={e => setCompany(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs">Message (optional)</Label>
                <Textarea id="message" placeholder="Tell us about your requirements..." value={message} onChange={e => setMessage(e.target.value)} rows={3} />
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
          <Link href="/login" className="text-xs text-primary hover:underline">Already have an account? Sign in</Link>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <SignupPageContent />
    </Suspense>
  )
}
