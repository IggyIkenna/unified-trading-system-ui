"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ArrowRight, Mail, Lock, Building2 } from "lucide-react"

// Demo accounts — shared with RequireAuth
const demoAccounts = [
  { email: "admin@odum.io",        password: "demo", org: "Odum Research",          role: "Admin (Full Access)", redirect: "/overview", services: ["*"], entitlements: ["*"], isAdmin: true },
  { email: "trader@odum.io",       password: "demo", org: "Odum Research",          role: "Internal Trader",     redirect: "/overview", services: ["*"] },
  { email: "demo@hedgefund.com",   password: "demo", org: "Alpha Capital",          role: "Investment Client",   redirect: "/overview", services: ["data", "backtesting", "execution"] },
  { email: "cfo@familyoffice.com", password: "demo", org: "Sterling Family Office", role: "Executive",           redirect: "/overview", services: ["investment", "regulatory"] },
  { email: "quant@boutique.com",   password: "demo", org: "Quantum Research",       role: "Quant Client",        redirect: "/overview", services: ["data", "backtesting"] },
]

export default function LoginPage() {
  const router = useRouter()
  const searchParams = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search) : null
  const redirectTo = searchParams?.get("redirect") || null

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    await new Promise((resolve) => setTimeout(resolve, 400))
    const account = demoAccounts.find((a) => a.email === email && a.password === password)
    if (account) {
      localStorage.setItem("portal_user", JSON.stringify(account))
      router.push(redirectTo || account.redirect)
    } else {
      setError("Invalid credentials. Use any demo account with password: demo")
    }
    setIsLoading(false)
  }

  const handleDemoLogin = (account: typeof demoAccounts[0]) => {
    localStorage.setItem("portal_user", JSON.stringify(account))
    router.push(redirectTo || account.redirect)
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
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Don&apos;t have an account?</span>
            <Button variant="outline" size="sm" asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to access your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </form>

              {/* Demo Accounts */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Or try a demo account:
                </p>
                <div className="space-y-2">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.email}
                      onClick={() => handleDemoLogin(account)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                        (account as any).isAdmin 
                          ? "border-primary bg-primary/5 hover:bg-primary/10" 
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      <Building2 className={`size-4 ${(account as any).isAdmin ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {account.org}
                          {(account as any).isAdmin && <span className="ml-2 text-xs text-primary">(Full Access)</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{account.email} · {account.role}</div>
                      </div>
                      <Badge variant={(account as any).isAdmin ? "default" : "outline"} className="text-xs">
                        {(account as any).isAdmin ? "admin" : "demo"}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
