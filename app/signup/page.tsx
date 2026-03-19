'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

const SERVICE_LABELS: Record<string, string> = {
  data: "Data Provision",
  backtesting: "Backtesting",
  execution: "Execution",
  investment: "Investment Management",
  regulatory: "Regulatory",
  platform: "Platform / Strategy License",
}

function SignupPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preService = searchParams.get('service') ?? ''
  const preTier    = searchParams.get('tier') ?? ''

  const [step, setStep] = React.useState<'type' | 'form'>('type')
  const [clientType, setClientType] = React.useState<'external' | 'internal' | null>(null)
  const [email, setEmail] = React.useState('')
  const [company, setCompany] = React.useState('')
  const [inquiry, setInquiry] = React.useState(preService)

  // If arriving from pricing with a service pre-selected, skip straight to the external form
  React.useEffect(() => {
    if (preService) {
      setClientType('external')
      setStep('form')
    }
  }, [preService])

  const handleClientTypeSelect = (type: 'external' | 'internal') => {
    setClientType(type)
    setStep('form')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // For demo purposes, redirect based on client type
    if (clientType === 'internal') {
      router.push('/services/platform')
    } else {
      router.push('/portal/dashboard')
    }
  }

  if (step === 'type') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2">Get Started with Odum</h1>
            <p className="text-lg text-muted-foreground">Choose how you'd like to access the platform</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* External Client */}
            <Card className="cursor-pointer border-primary/50 hover:border-primary transition-colors" onClick={() => handleClientTypeSelect('external')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">E</span>
                  </div>
                  External Client
                </CardTitle>
                <CardDescription>
                  Access our services: Data, Backtesting, Execution, or Investment Management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span>Choose your service tier</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span>Manage API keys & usage</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span>Full backtesting & execution</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span>Portfolio reporting</span>
                  </div>
                </div>
                <Button className="w-full mt-4">
                  Continue as External
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Internal User */}
            <Card className="cursor-pointer border-slate-500/50 hover:border-slate-500 transition-colors" onClick={() => handleClientTypeSelect('internal')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-slate-500/10 flex items-center justify-center">
                    <span className="text-slate-400 font-bold">I</span>
                  </div>
                  Internal User
                </CardTitle>
                <CardDescription>
                  Access the full Unified Trading Platform with all roles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span>Trader dashboard</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span>Executive reporting</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span>DevOps monitoring</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span>Admin controls</span>
                  </div>
                </div>
                <Button className="w-full mt-4 bg-slate-700 hover:bg-slate-600">
                  Continue as Internal
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8 text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Badge className="mb-4" variant="outline">
            {clientType === 'internal' ? 'Internal Platform' : 'External Portal'}
          </Badge>
          <h1 className="text-3xl font-bold mb-2">Create Your Account</h1>
          <p className="text-muted-foreground">Get access in minutes</p>
          {preService && (
            <div className="mt-4 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-sm text-primary inline-block">
              {preTier ? `${preTier} — ` : ''}{SERVICE_LABELS[preService] ?? preService}
            </div>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="Your company name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />
              </div>

              {clientType === 'external' && (
                <div className="space-y-2">
                  <Label htmlFor="inquiry">Primary Interest</Label>
                  <select
                    id="inquiry"
                    value={inquiry}
                    onChange={(e) => setInquiry(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a service...</option>
                    <option value="data">Data Provision</option>
                    <option value="backtesting">Backtesting as a Service</option>
                    <option value="execution">Execution as a Service</option>
                    <option value="investment">Investment Management</option>
                  </select>
                </div>
              )}

              <Button type="submit" className="w-full">
                Create Account
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-border text-center text-sm text-muted-foreground">
              Want to go back? <button onClick={() => setStep('type')} className="text-primary hover:underline">Choose account type</button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  )
}

// Wrap with Suspense for useSearchParams (required for static generation)
export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <SignupPageContent />
    </Suspense>
  )
}
