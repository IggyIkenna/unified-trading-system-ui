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
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addApplication, addDocument } from "@/lib/api/mock-onboarding-state"
import { addRequest } from "@/lib/api/mock-provisioning-state"
import type { OnboardingApplication, DocumentArtifact } from "@/lib/api/mock-onboarding-state"
import type { MockAccessRequest } from "@/lib/api/mock-provisioning-state"
import {
  Database, Brain, Zap, Briefcase, Shield, Layers, ArrowRight, ArrowLeft,
  CheckCircle2, Calendar, Mail, Sparkles, Upload, FileText, Check,
} from "lucide-react"

const SERVICES = [
  { id: "data", name: "Data Access", icon: Database, color: "text-sky-400", price: "From £250/mo", desc: "Market data across 128 venues, 5 asset classes" },
  { id: "backtesting", name: "Research & Backtesting", icon: Brain, color: "text-violet-400", price: "Contact us", desc: "ML model training, strategy backtesting, signal configuration" },
  { id: "execution", name: "Execution as a Service", icon: Zap, color: "text-emerald-400", price: "Contact us", desc: "Multi-venue execution, position management, risk monitoring" },
  { id: "investment", name: "Investment Management", icon: Briefcase, color: "text-rose-400", price: "Contact us", desc: "FCA-authorised investment management, SMA/Fund structures" },
  { id: "platform", name: "Full Platform", icon: Layers, color: "text-amber-400", price: "Contact us", desc: "End-to-end: data, research, execution, reporting, compliance" },
  { id: "regulatory", name: "Regulatory Umbrella", icon: Shield, color: "text-slate-400", price: "Contact us", desc: "FCA Appointed Representative services for algo trading firms" },
]
const ONBOARDING_SERVICES = new Set(["regulatory", "investment"])
const REG_OPTS = [
  { id: "ar", label: "Appointed Representative (AR)" }, { id: "compliance", label: "Compliance Monitoring" },
  { id: "reporting", label: "Transaction Reporting" }, { id: "fund", label: "Fund Structure (via affiliate)" },
]
const INV_OPTS = [
  { id: "sma", label: "Separately Managed Account" }, { id: "fund_access", label: "Fund Access" },
  { id: "strategy", label: "Strategy Allocation" }, { id: "discretionary", label: "Full Discretionary" },
]
const TIERS = ["basic", "professional", "institutional", "enterprise"] as const
interface DocSlot { key: string; label: string; required: boolean | "investment_only" }
const DOC_SLOTS: DocSlot[] = [
  { key: "proof_of_address", label: "Proof of Address (utility bill, bank statement)", required: true },
  { key: "identity", label: "Identity Document (passport, national ID)", required: true },
  { key: "source_of_funds", label: "Source of Funds Declaration", required: true },
  { key: "wealth_declaration", label: "Wealth Self-Declaration", required: "investment_only" },
  { key: "management_agreement", label: "Management Agreement (if applicable)", required: false },
  { key: "invoice_or_tax", label: "Invoicing / Tax Documents (W-9, etc.)", required: false },
]
const STEP_LABELS = ["Your Details", "Requirements", "Documents", "Review", "Submitted"]

function StepIndicator({ current, onNavigate }: { current: number; onNavigate: (s: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {STEP_LABELS.map((label, i) => {
        const num = i + 1, done = num < current, active = num === current
        return (
          <React.Fragment key={label}>
            {i > 0 && <div className={`h-px w-6 sm:w-10 ${done ? "bg-emerald-500" : "bg-border"}`} />}
            <button type="button" disabled={!done || current === 5} onClick={() => done && onNavigate(num)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                done ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                  : active ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "text-muted-foreground"}`}>
              {done ? <Check className="size-3" /> : <span className="text-[10px]">{num}</span>}
              <span className="hidden sm:inline">{label}</span>
            </button>
          </React.Fragment>
        )
      })}
    </div>
  )
}

function OnboardingWizard({ serviceType }: { serviceType: "regulatory" | "investment" }) {
  const svcName = serviceType === "regulatory" ? "Regulatory Umbrella" : "Investment Management"
  const options = serviceType === "regulatory" ? REG_OPTS : INV_OPTS
  const [step, setStep] = React.useState(1)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [company, setCompany] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [selOpts, setSelOpts] = React.useState<Set<string>>(new Set())
  const [tier, setTier] = React.useState<typeof TIERS[number]>("professional")
  const [docs, setDocs] = React.useState<Record<string, string>>({})
  const [appId, setAppId] = React.useState("")

  const toggle = (id: string) => setSelOpts(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const isReq = (s: DocSlot) => s.required === true || (s.required === "investment_only" && serviceType === "investment")
  const uploadedCount = Object.values(docs).filter(Boolean).length
  const reqDocs = DOC_SLOTS.filter(isReq)

  function handleSubmit() {
    const id = `onb-${Date.now().toString(36)}`, now = new Date().toISOString()
    const app: OnboardingApplication = {
      id, applicant_user_id: `uid-${Date.now()}`, applicant_name: name, applicant_email: email,
      org_name: company, desired_product_slugs: [...selOpts], subscription_tier: tier,
      status: "submitted", submitted_at: now, reviewer_id: null, review_note: "",
      correlation_id: `corr-${id}`, created_at: now, updated_at: now,
    }
    addApplication(app)
    for (const [key, fileName] of Object.entries(docs)) {
      if (!fileName) continue
      const doc: DocumentArtifact = {
        id: `doc-${Date.now().toString(36)}-${key}`, application_id: id,
        doc_type: key as DocumentArtifact["doc_type"], file_name: fileName,
        uploaded_at: now, review_status: "pending", review_note: "",
      }
      addDocument(doc)
    }
    const req: MockAccessRequest = {
      id: `req-${Date.now().toString(36)}`, requester_email: email, requester_name: name,
      org_id: company.toLowerCase().replace(/\s+/g, "-"), requested_entitlements: ["reporting"],
      reason: `Auto-request from ${svcName} onboarding ${id}`, status: "pending",
      admin_note: "", reviewed_by: "", created_at: now, updated_at: now,
    }
    addRequest(req)
    setAppId(id)
    setStep(5)
  }

  const BackBtn = ({ to }: { to: number }) => <Button variant="ghost" onClick={() => setStep(to)}><ArrowLeft className="mr-2 size-4" />Back</Button>
  const NextBtn = ({ disabled, onClick, label = "Continue" }: { disabled?: boolean; onClick: () => void; label?: string }) => (
    <Button disabled={disabled} onClick={onClick}>{label} <ArrowRight className="ml-2 size-4" /></Button>
  )

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-2">
          <Badge variant="secondary" className="mb-3">
            {serviceType === "regulatory" ? <Shield className="mr-1.5 size-3" /> : <Briefcase className="mr-1.5 size-3" />}
            {svcName}
          </Badge>
          {step < 5 && <h1 className="text-2xl font-bold">Apply for {svcName}</h1>}
        </div>
        <StepIndicator current={step} onNavigate={setStep} />

        {step === 1 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Your Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs">Full Name *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Email *</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@company.com" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs">Company / Organisation *</Label>
                  <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Capital" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Phone (optional)</Label>
                  <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 7XXX XXX XXX" /></div>
              </div>
              <div className="flex justify-end pt-2"><NextBtn disabled={!name || !email || !company} onClick={() => setStep(2)} /></div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">What are you looking for?</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {options.map(o => (
                  <label key={o.id} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/30 transition-colors">
                    <Checkbox checked={selOpts.has(o.id)} onCheckedChange={() => toggle(o.id)} />
                    <span className="text-sm">{o.label}</span>
                  </label>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Subscription Tier</Label>
                <Select value={tier} onValueChange={v => setTier(v as typeof tier)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIERS.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex justify-between pt-2">
                <BackBtn to={1} /><NextBtn disabled={selOpts.size === 0} onClick={() => setStep(3)} />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Upload Documents</CardTitle>
              <CardDescription>Upload supporting documents for your application.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {DOC_SLOTS.map(slot => {
                const req = isReq(slot), uploaded = !!docs[slot.key]
                return (
                  <div key={slot.key} className="flex items-center justify-between rounded-lg border p-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText className="size-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm truncate">{slot.label}</p>
                        {uploaded && <p className="text-xs text-emerald-400 truncate">{docs[slot.key]}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={uploaded ? "default" : "outline"} className={`text-[10px] ${uploaded ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : ""}`}>
                        {uploaded ? "Uploaded" : req ? "Required" : "Optional"}
                      </Badge>
                      <Button variant="outline" size="sm" className="relative" asChild>
                        <label className="cursor-pointer"><Upload className="size-3 mr-1" />{uploaded ? "Replace" : "Upload"}
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => { if (e.target.files?.[0]) setDocs(p => ({ ...p, [slot.key]: e.target.files![0].name })) }} />
                        </label>
                      </Button>
                    </div>
                  </div>
                )
              })}
              <p className="text-xs text-muted-foreground pt-2">You can upload documents later — save your progress and come back anytime.</p>
              <div className="flex justify-between pt-2">
                <BackBtn to={2} />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(4)}>Skip for now</Button>
                  <NextBtn onClick={() => setStep(4)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Review &amp; Submit</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border p-4 space-y-2">
                <h3 className="text-sm font-semibold">Applicant</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Name</span><span>{name}</span>
                  <span className="text-muted-foreground">Email</span><span>{email}</span>
                  <span className="text-muted-foreground">Company</span><span>{company}</span>
                  {phone && <><span className="text-muted-foreground">Phone</span><span>{phone}</span></>}
                </div>
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <h3 className="text-sm font-semibold">Requirements</h3>
                <div className="flex flex-wrap gap-1.5">
                  {[...selOpts].map(id => <Badge key={id} variant="secondary" className="text-xs">{options.find(o => o.id === id)?.label ?? id}</Badge>)}
                </div>
                <p className="text-xs text-muted-foreground">Tier: <span className="capitalize">{tier}</span></p>
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <h3 className="text-sm font-semibold">Documents ({uploadedCount} uploaded)</h3>
                {DOC_SLOTS.map(slot => (
                  <div key={slot.key} className="flex items-center justify-between text-sm">
                    <span className={docs[slot.key] ? "" : "text-muted-foreground"}>{slot.label}</span>
                    {docs[slot.key]
                      ? <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">Uploaded</Badge>
                      : <Badge variant="outline" className={`text-[10px] ${isReq(slot) ? "border-amber-500/30 text-amber-400" : ""}`}>
                          {isReq(slot) ? "Still needed" : "Optional"}
                        </Badge>}
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <BackBtn to={3} /><Button onClick={handleSubmit}>Submit Application <ArrowRight className="ml-2 size-4" /></Button>
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
            <p className="text-muted-foreground mb-1">Application ID: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{appId}</code></p>
            <p className="text-sm text-muted-foreground mb-8">We&apos;ll be in touch within 48 hours.</p>
            <Card className="text-left mb-8">
              <CardHeader><CardTitle className="text-base">What happens next</CardTitle></CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {([
                    [FileText, "We review your documents and application"],
                    [Briefcase, "We create your organisation and accounts"],
                    [Zap, "You receive API credentials and portal access"],
                    [CheckCircle2, "You access your portal and start onboarding"],
                  ] as const).map(([Icon, text], i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-0.5"><Icon className="size-3.5 text-primary" /></div>
                      <span className="text-sm">{text}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
            <div className="flex gap-3 justify-center">
              <Button asChild><Link href="/">Back to Home</Link></Button>
              <Button variant="outline" asChild><Link href="/login">Sign In</Link></Button>
            </div>
          </div>
        )}

        {step < 5 && <p className="text-center text-xs text-muted-foreground mt-6">Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link></p>}
      </div>
    </div>
  )
}

function GenericSignup() {
  const searchParams = useSearchParams()
  const preService = searchParams.get("service") ?? ""
  const [selectedServices, setSelectedServices] = React.useState<Set<string>>(preService ? new Set([preService]) : new Set())
  const [step, setStep] = React.useState<"select" | "contact">(preService ? "contact" : "select")
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [company, setCompany] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)
  const toggleSvc = (id: string) => setSelectedServices(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500/10"><CheckCircle2 className="size-8 text-emerald-400" /></div>
          <h1 className="text-2xl font-bold mb-2">We&apos;ll be in touch</h1>
          <p className="text-muted-foreground mb-6">
            Our team will reach out within 24 hours to discuss
            {selectedServices.size === 1 ? ` ${SERVICES.find(s => s.id === [...selectedServices][0])?.name}` : ` your ${selectedServices.size} selected services`}.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild><Link href="/">Back to Home</Link></Button>
            <Button variant="outline" asChild><Link href="/login">Sign In (Existing User)</Link></Button>
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
            <Badge variant="outline" className="mb-3"><Sparkles className="mr-1.5 size-3" /> Get Started</Badge>
            <h1 className="text-3xl font-bold mb-2">Which services are you interested in?</h1>
            <p className="text-muted-foreground">Select one or more. We&apos;ll tailor the conversation to your needs.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {SERVICES.map((svc) => {
              const Icon = svc.icon, sel = selectedServices.has(svc.id)
              return (
                <button key={svc.id} onClick={() => toggleSvc(svc.id)}
                  className={`text-left rounded-xl border p-5 transition-all ${sel ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-border/80 hover:bg-accent/30"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3"><Icon className={`size-5 ${svc.color}`} /><span className="font-semibold text-sm">{svc.name}</span></div>
                    {sel && <CheckCircle2 className="size-5 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{svc.desc}</p>
                  <div className="mt-2"><Badge variant="outline" className="text-[10px]">{svc.price}</Badge></div>
                </button>
              )
            })}
          </div>
          <div className="flex flex-col items-center gap-4">
            <Button size="lg" disabled={selectedServices.size === 0} onClick={() => setStep("contact")}>Continue <ArrowRight className="ml-2 size-4" /></Button>
            <p className="text-xs text-muted-foreground">Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link></p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">How would you like to proceed?</h1>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {[...selectedServices].map(id => { const s = SERVICES.find(sv => sv.id === id); return s ? <Badge key={id} variant="secondary" className="text-xs">{s.name}</Badge> : null })}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="border-primary/30 hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-5 text-center">
              <Calendar className="size-8 text-primary mx-auto mb-3" />
              <CardTitle className="text-base mb-1">Book a Live Demo</CardTitle>
              <CardDescription className="text-xs">See the platform in action. 30-min call with our team.</CardDescription>
              <Button size="sm" className="mt-4 w-full" asChild><Link href={`/contact?action=demo&service=${[...selectedServices].join(",")}`}>Book Demo <ArrowRight className="ml-1 size-3" /></Link></Button>
            </CardContent>
          </Card>
          <Card className="border-border hover:border-border/80 transition-colors cursor-pointer">
            <CardContent className="pt-5 text-center">
              <Mail className="size-8 text-muted-foreground mx-auto mb-3" />
              <CardTitle className="text-base mb-1">Contact Sales</CardTitle>
              <CardDescription className="text-xs">Get pricing details, discuss your requirements.</CardDescription>
              <Button size="sm" variant="outline" className="mt-4 w-full" asChild><Link href={`/contact?service=${[...selectedServices].join(",")}`}>Contact Us <ArrowRight className="ml-1 size-3" /></Link></Button>
            </CardContent>
          </Card>
        </div>
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or leave your details and we&apos;ll reach out</span></div>
        </div>
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={e => { e.preventDefault(); setSubmitted(true) }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label htmlFor="name" className="text-xs">Name</Label>
                  <Input id="name" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required /></div>
                <div className="space-y-1.5"><Label htmlFor="company" className="text-xs">Company</Label>
                  <Input id="company" placeholder="Your company" value={company} onChange={e => setCompany(e.target.value)} required /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="email" className="text-xs">Email</Label>
                <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              <div className="space-y-1.5"><Label htmlFor="message" className="text-xs">Message (optional)</Label>
                <Textarea id="message" placeholder="Tell us about your requirements..." value={message} onChange={e => setMessage(e.target.value)} rows={3} /></div>
              <Button type="submit" className="w-full">Submit Inquiry <ArrowRight className="ml-2 size-4" /></Button>
            </form>
          </CardContent>
        </Card>
        <div className="text-center mt-6">
          <button onClick={() => setStep("select")} className="text-xs text-muted-foreground hover:text-foreground">← Change service selection</button>
          <span className="mx-3 text-muted-foreground/30">|</span>
          <Link href="/login" className="text-xs text-primary hover:underline">Already have an account? Sign in</Link>
        </div>
      </div>
    </div>
  )
}

function SignupPageContent() {
  const searchParams = useSearchParams()
  const service = searchParams.get("service")
  if (service && ONBOARDING_SERVICES.has(service)) return <OnboardingWizard serviceType={service as "regulatory" | "investment"} />
  return <GenericSignup />
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <SignupPageContent />
    </Suspense>
  )
}
