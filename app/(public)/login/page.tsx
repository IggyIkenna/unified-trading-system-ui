"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail, Lock, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, loginByEmail, loginError } = useAuth();
  const [redirectTo, setRedirectTo] = React.useState<string | null>(null);

  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setRedirectTo(sp.get("redirect"));
  }, []);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [resetSent, setResetSent] = React.useState(false);

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your email address first.");
      return;
    }
    // In mock mode, just show a toast
    if (isMockDataMode() || process.env.NEXT_PUBLIC_AUTH_PROVIDER === "demo") {
      toast({
        title: "Password reset (demo mode)",
        description: `In production, a reset link would be sent to ${email}. Demo accounts use password "demo".`,
      });
      setResetSent(true);
      return;
    }
    // In production, use Firebase sendPasswordResetEmail
    try {
      const { getFirebaseAuth } = await import("@/lib/auth/firebase-config");
      const auth = getFirebaseAuth();
      if (auth) {
        const { sendPasswordResetEmail } = await import("firebase/auth");
        await sendPasswordResetEmail(auth, email);
      }
      toast({ title: "Reset email sent", description: `Check ${email} for a password reset link.` });
      setResetSent(true);
    } catch {
      setError("Could not send reset email. Check your email address.");
    }
  }

  React.useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo || "/dashboard");
    }
  }, [loading, user, router, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const success = await loginByEmail(email, password);
    if (success) {
      // Check if user has a pending application to resume
      const draft = localStorage.getItem("onboarding-draft");
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.email === email && parsed.step && parsed.step < 5) {
            router.push(`/signup?service=${parsed.service || "regulatory"}&resume=true`);
            setIsLoading(false);
            return;
          }
        } catch { /* ignore */ }
      }
      // Check mock provisioning state for pending users
      try {
        const res = await fetch(`/api/v1/users/${email}/application`);
        if (res.ok) {
          const data = await res.json();
          if (data.application && data.stage === "registered") {
            router.push(`/signup?service=${data.application.service_type || "regulatory"}&resume=true`);
            setIsLoading(false);
            return;
          }
        }
      } catch { /* no backend, continue */ }
      router.push(redirectTo || "/dashboard");
    } else if (!loginError) {
      setError("Invalid credentials. Check your email and password.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in to access your dashboard
              </CardDescription>
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
                      autoComplete="email"
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
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); handleForgotPassword(); }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <KeyRound className="size-3 inline mr-1" />
                    Forgot password?
                  </button>
                </div>
                {resetSent && (
                  <p className="text-sm text-emerald-400 bg-emerald-500/10 rounded-md px-3 py-2">
                    Password reset email sent to {email}.
                  </p>
                )}
                {(error || loginError) && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    {loginError || error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
              <p className="text-center text-xs text-muted-foreground mt-2">
                Reading the briefings and need an access code?{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  Contact us
                </Link>{" "}
                to request one.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
