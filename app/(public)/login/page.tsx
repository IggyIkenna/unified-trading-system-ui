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
  const { user, loading, loginByEmail, loginError, hasEntitlement } = useAuth();
  const [redirectTo, setRedirectTo] = React.useState<string | null>(null);

  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setRedirectTo(sp.get("redirect"));
  }, []);

  /**
   * Post-login default landing. Investor / board users go straight to the IR hub —
   * the advisor email (board-website-update) assumes this. Everyone else lands on /dashboard.
   * An explicit `?redirect=` query param always wins.
   *
   * Detection is belt-and-suspenders: (a) the `investor-board` / `investor-archive`
   * entitlements when the user-management-api has returned them, (b) a hardcoded email
   * fallback for the canonical advisor account so the redirect also works when the
   * authz backend is slow or momentarily unreachable.
   */
  const defaultLanding = React.useCallback((): string => {
    if (hasEntitlement("investor-board") || hasEntitlement("investor-archive")) {
      return "/investor-relations";
    }
    if (user?.email === "investor@odum-research.com" || user?.email === "advisor@odum-research.com") {
      return "/investor-relations";
    }
    return "/dashboard";
  }, [hasEntitlement, user?.email]);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [resetSent, setResetSent] = React.useState(false);
  const [uatRedirecting, setUatRedirecting] = React.useState(false);

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
      router.replace(redirectTo || defaultLanding());
    }
  }, [loading, user, router, redirectTo, defaultLanding]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // On the main production site, advisor/demo accounts (@odum-research.com) are homed
    // on the UAT demo environment. Show a brief notice then redirect — they never auth
    // against prod Firebase so they cannot access production internal services.
    if (
      email.toLowerCase().endsWith("@odum-research.com") &&
      typeof window !== "undefined" &&
      window.location.hostname === "www.odum-research.com"
    ) {
      setIsLoading(false);
      setUatRedirecting(true);
      const target = encodeURIComponent(redirectTo || "/investor-relations");
      setTimeout(() => {
        window.location.href = `https://uat.odum-research.com/login?redirect=${target}`;
      }, 2800);
      return;
    }

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
      router.push(redirectTo || defaultLanding());
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
                {uatRedirecting && (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-200">
                    <p className="font-medium">Taking you to the demo environment&hellip;</p>
                    <p className="mt-1 text-xs text-amber-300/80">
                      This account is set up for our secure demo environment at{" "}
                      <span className="font-mono">uat.odum-research.com</span>. You&rsquo;re being
                      redirected there now. Once you&rsquo;re in, a banner at the top links back to
                      the main site &mdash; though your sign-in won&rsquo;t transfer across.
                    </p>
                  </div>
                )}
                {(error || loginError) && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    {loginError || error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading || uatRedirecting}>
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
