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
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react"

// Mock users for demo
const mockUsers = [
  { email: "demo@hedgefund.com", password: "demo", org: "Alpha Capital", services: ["data", "backtesting", "execution"] },
  { email: "trader@propdesk.com", password: "demo", org: "Velocity Trading", services: ["whitelabel"] },
  { email: "cfo@familyoffice.com", password: "demo", org: "Sterling Family Office", services: ["investment", "regulatory"] },
  { email: "quant@boutique.com", password: "demo", org: "Quantum Research", services: ["data", "backtesting"] },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const user = mockUsers.find((u) => u.email === email && u.password === password)
    if (user) {
      // Store user in localStorage for demo
      localStorage.setItem("portal_user", JSON.stringify(user))
      router.push("/portal/dashboard")
    } else {
      setError("Invalid email or password. Try demo@hedgefund.com / demo")
    }
    setIsLoading(false)
  }

  const handleDemoLogin = (user: typeof mockUsers[0]) => {
    localStorage.setItem("portal_user", JSON.stringify(user))
    router.push("/portal/dashboard")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <Link href="/portal" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            <span className="text-sm">Back to Portal</span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="flex justify-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary">
                <Sparkles className="size-6 text-primary-foreground" />
              </div>
            </div>
            <h1 className="mt-4 text-2xl font-bold">Welcome back</h1>
            <p className="mt-1 text-muted-foreground">Sign in to your Odum Research account</p>
          </div>

          {/* Login Form */}
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/portal/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
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
                  <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Sign In
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="grid gap-2">
                <Button variant="outline" type="button" disabled>
                  Sign in with SSO
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Demo Accounts */}
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Demo Accounts</CardTitle>
              <CardDescription className="text-xs">
                Click to instantly log in as a demo user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockUsers.map((user) => (
                <button
                  key={user.email}
                  onClick={() => handleDemoLogin(user)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left"
                >
                  <div>
                    <div className="text-sm font-medium">{user.org}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {user.services.slice(0, 2).map((service) => (
                      <Badge key={service} variant="secondary" className="text-[10px]">
                        {service}
                      </Badge>
                    ))}
                    {user.services.length > 2 && (
                      <Badge variant="secondary" className="text-[10px]">
                        +{user.services.length - 2}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Sign up link */}
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/portal/signup" className="text-primary hover:underline">
              Get started
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
