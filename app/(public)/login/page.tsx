"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ArrowRight, Mail, Lock, Building2, Shield, Users, Eye } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { PERSONAS } from "@/lib/mocks/fixtures/personas"

// Map persona roles to redirect targets and display info
// ALL personas land on the service hub — the hub shows different services
// based on role/entitlements. Admin sees ops services; clients see their subscriptions.
const PERSONA_REDIRECTS: Record<string, string> = {
  admin: "/service/overview",
  "internal-trader": "/service/overview",
  "client-full": "/service/overview",
  "client-premium": "/service/overview",
  "client-data-only": "/service/overview",
}

const ROLE_ICONS: Record<string, typeof Shield> = {
  admin: Shield,
  internal: Eye,
  client: Users,
}

const ROLE_COLORS: Record<string, string> = {
  admin: "text-red-400",
  internal: "text-emerald-400",
  client: "text-blue-400",
}

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, loginByEmail, login } = useAuth()
  const searchParams = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search) : null
  const redirectTo = searchParams?.get("redirect") || null

  const [loginType, setLoginType] = React.useState<"internal" | "external">("external")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo || "/service/overview")
    }
  }, [loading, user, router, redirectTo])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    await new Promise((resolve) => setTimeout(resolve, 300))

    const success = loginByEmail(email, password)
    if (success) {
      // Find matching persona to get redirect
      const persona = PERSONAS.find((p) => p.email === email)
      const target = redirectTo || (persona ? PERSONA_REDIRECTS[persona.id] : "/service/overview") || "/service/overview"
      router.push(target)
    } else {
      setError("Invalid credentials. Try any demo account below with password: demo")
    }
    setIsLoading(false)
  }

  const handleDemoLogin = (personaId: string) => {
    const success = login(personaId)
    if (success) {
      const target = redirectTo || PERSONA_REDIRECTS[personaId] || "/service/overview"
      router.push(target)
    }
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
              {/* Internal / External toggle */}
              <div className="flex items-center justify-center gap-1 mt-4 p-1 rounded-lg bg-muted/50">
                <button
                  onClick={() => setLoginType("internal")}
                  className={`flex-1 px-4 py-2.5 rounded-md text-xs font-medium transition-all ${
                    loginType === "internal"
                      ? "bg-card shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div>Internal</div>
                  <div className="text-[9px] font-normal text-muted-foreground mt-0.5">Odum team · full platform + admin</div>
                </button>
                <button
                  onClick={() => setLoginType("external")}
                  className={`flex-1 px-4 py-2.5 rounded-md text-xs font-medium transition-all ${
                    loginType === "external"
                      ? "bg-card shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div>External Client</div>
                  <div className="text-[9px] font-normal text-muted-foreground mt-0.5">Subscribed services · your org</div>
                </button>
              </div>
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

              {/* Demo Personas */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Or try a demo account <span className="text-xs">(password: demo)</span>
                </p>
                <div className="space-y-2">
                  {PERSONAS.filter((p) =>
                    loginType === "internal"
                      ? p.role === "internal" || p.role === "admin"
                      : p.role === "client"
                  ).map((persona) => {
                    const Icon = ROLE_ICONS[persona.role] || Users
                    const colorClass = ROLE_COLORS[persona.role] || "text-muted-foreground"
                    return (
                      <button
                        key={persona.id}
                        onClick={() => handleDemoLogin(persona.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left"
                      >
                        <Icon className={`size-4 ${colorClass}`} />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{persona.org.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {persona.email} · {persona.displayName}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            persona.role === "admin" ? "border-red-500/30 text-red-400" :
                            persona.role === "internal" ? "border-emerald-500/30 text-emerald-400" :
                            "border-blue-500/30 text-blue-400"
                          }`}
                        >
                          {persona.role}
                        </Badge>
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
