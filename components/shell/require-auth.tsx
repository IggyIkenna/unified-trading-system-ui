"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Sparkles, Lock, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"

// Demo accounts mirrored from portal/login so either login page works
const DEMO_ACCOUNTS = [
  { email: "admin@odum.io", password: "demo", org: "Odum Research", role: "internal", services: ["*"], entitlements: ["*"], isAdmin: true },
  { email: "demo@hedgefund.com", password: "demo", org: "Alpha Capital",           role: "Investment Client", services: ["data", "backtesting", "execution"] },
  { email: "trader@propdesk.com", password: "demo", org: "Velocity Trading",       role: "Internal Trader",   services: ["whitelabel"] },
  { email: "cfo@familyoffice.com", password: "demo", org: "Sterling Family Office", role: "Executive",         services: ["investment", "regulatory"] },
  { email: "quant@boutique.com",  password: "demo", org: "Quantum Research",       role: "Quant Client",      services: ["data", "backtesting"] },
]

interface RequireAuthProps {
  children: React.ReactNode
  /** Optional login route override — defaults to /login */
  loginHref?: string
}

export function RequireAuth({ children, loginHref = "/login" }: RequireAuthProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const [email, setEmail]       = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError]       = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (user) return <>{children}</>

  // Inline login gate
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    await new Promise(r => setTimeout(r, 400))
    const match = DEMO_ACCOUNTS.find(a => a.email === email && a.password === password)
    if (match) {
      localStorage.setItem("portal_user", JSON.stringify(match))
      // Force re-render by reloading the page at current path
      router.refresh()
      window.location.reload()
    } else {
      setError("Invalid credentials. Try demo@hedgefund.com / demo")
    }
    setSubmitting(false)
  }

  function quickLogin(account: typeof DEMO_ACCOUNTS[0]) {
    localStorage.setItem("portal_user", JSON.stringify(account))
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Odum Research</span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/signup">Get Access</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-5">
          {/* Lock badge */}
          <div className="text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Lock className="size-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Sign in required</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This area requires authentication. Sign in to continue.
            </p>
          </div>

          {/* Login form */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="ra-email" className="text-sm font-medium">Email</label>
                  <input
                    id="ra-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="ra-password" className="text-sm font-medium">Password</label>
                  <input
                    id="ra-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Demo quick-login */}
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Demo Accounts</CardTitle>
              <CardDescription className="text-xs">Click to sign in instantly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {DEMO_ACCOUNTS.map(a => (
                <button
                  key={a.email}
                  onClick={() => quickLogin(a)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                    (a as any).isAdmin 
                      ? "border-primary bg-primary/5 hover:bg-primary/10" 
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {a.org}
                      {(a as any).isAdmin && <span className="ml-2 text-xs text-primary">(Full Access)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{a.email} · {a.role}</div>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
