"use client"

import * as React from "react"
import Link from "next/link"
import { Lock, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { PERSONAS } from "@/lib/auth/personas"

const isFirebaseMode = process.env.NEXT_PUBLIC_AUTH_PROVIDER === "firebase"

interface RequireAuthProps {
  children: React.ReactNode
  loginHref?: string
}

export function RequireAuth({ children, loginHref = "/login" }: RequireAuthProps) {
  const { user, loading, loginByEmail, switchPersona } = useAuth()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (user) return <>{children}</>

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    const ok = await loginByEmail(email, password)
    if (!ok) {
      setError(
        isFirebaseMode
          ? "Invalid credentials. Check your email and password."
          : "Invalid credentials. Try one of the demo accounts below.",
      )
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/images/odum-logo.png" alt="Odum Research" className="size-9" />
            <span className="text-lg font-semibold">Odum Research</span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/signup">Get Access</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Lock className="size-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Sign in required</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This area requires authentication. Sign in to continue.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="ra-email" className="text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="ra-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="ra-password" className="text-sm font-medium">
                    Password
                  </label>
                  <input
                    id="ra-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 size-4" />
                  )}
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>

          {!isFirebaseMode && (
            <Card className="border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Demo Accounts</CardTitle>
                <CardDescription className="text-xs">
                  Click to sign in instantly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => void switchPersona(p.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {p.displayName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.email} &middot; {p.org.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground/60 truncate mt-0.5">
                        {p.description}
                      </div>
                    </div>
                    <ArrowRight className="size-3.5 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
