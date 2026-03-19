"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Lock, ArrowLeft, Shield } from "lucide-react"

export default function InternalLoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Demo: Accept any @odum-research.com email or specific demo accounts
    await new Promise(resolve => setTimeout(resolve, 800))
    
    if (email.endsWith("@odum-research.co.uk") || email === "demo@internal.com") {
      // Redirect to internal Unified Trading Platform
      router.push("/services/platform")
    } else {
      setError("Access restricted to internal users only")
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-semibold">Odum Research</span>
              <Badge variant="secondary" className="ml-2 text-xs">Internal</Badge>
            </div>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="size-4 mr-2" />
              Back to Portal
            </Link>
          </Button>
        </div>
      </header>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
              <Shield className="size-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Internal Access</CardTitle>
            <CardDescription>
              Sign in with your Odum Research credentials to access the Unified Trading Platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@odum-research.co.uk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {error && (
                <div className="text-sm text-destructive text-center">{error}</div>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Lock className="size-4 mr-2 animate-pulse" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Lock className="size-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-4">
                Demo Access
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setEmail("demo@internal.com")
                  setPassword("demo")
                }}
              >
                Use Demo Credentials
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                This will grant full access to the Unified Trading Platform with mock data
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-4">
        <div className="container px-4 md:px-6">
          <p className="text-xs text-muted-foreground text-center">
            Internal systems access only. Unauthorised access is prohibited and may be subject to legal action.
          </p>
        </div>
      </footer>
    </div>
  )
}
