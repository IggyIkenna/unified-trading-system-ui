"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail, Lock, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useDefaultLanding } from "@/lib/auth/default-landing";
import { toast } from "@/hooks/use-toast";
import { isDemoPersonaEmail } from "@/lib/auth/personas";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import Link from "next/link";

// Map of personal-email accounts that previously had admin and have since
// been demoted in favour of a workspace identity. When someone types one of
// these, we show a friendly hint pointing them at the right login. The map
// is intentionally small — internals only — and lives here so the hint
// stays close to the form. Add new entries when an internal team member's
// admin role gets moved off a personal email.
const DEMOTED_INTERNAL_EMAIL_HINTS: Readonly<Record<string, string>> = {
  "femi.amoo@gmail.com": "femi@odum-research.com",
  "femi.amoo3@gmail.com": "femi@odum-research.com",
  "harshkantariya.work@gmail.com": "harsh@odum-research.com",
};

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, loginByEmail, loginError } = useAuth();
  const [redirectTo, setRedirectTo] = React.useState<string | null>(null);

  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setRedirectTo(sp.get("redirect"));
  }, []);

  /**
   * Post-login default landing. Investor / board users go straight to the IR hub —
   * the advisor email (board-website-update) assumes this. Per-prospect demo
   * personas (Desmond, Patrick, etc.) and admin / internal accounts land on
   * /dashboard. An explicit `?redirect=` query param always wins.
   *
   * Shared with the public homepage's logged-in-user auto-redirect — see
   * `lib/auth/default-landing.ts` for the canonical resolution rules.
   *
   * Detection is belt-and-suspenders: (a) the `investor-board` / `investor-archive`
   * entitlements when the user-management-api has returned them, (b) a hardcoded
   * email fallback (IR_EMAILS, module-scope) covering both the canonical IR
   * distribution aliases (`investors@odum-research.com` / `.co.uk`) and the
   * seeded singular personas (`investor@`, `advisor@`) so the redirect also
   * works when the authz backend is slow or momentarily unreachable.
   *
   * Admin / internal users land on /dashboard regardless of entitlements. Their
   * wildcard `["*"]` entitlement set would otherwise make `hasEntitlement(...)`
   * return true for every entitlement (including investor-board / archive) and
   * route them to the IR hub on every login.
   */
  const defaultLanding = useDefaultLanding();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [resetSent, setResetSent] = React.useState(false);
  const [uatRedirecting, setUatRedirecting] = React.useState(false);

  // Demo-persona handoff from prod login. The prod /login page packs the
  // user's typed email (?email=) and password (#pwd=) into the redirect
  // when it sends a demo persona to uat.odum-research.com (see the
  // setTimeout in handleLogin further down). On the UAT side we read
  // them on mount, prefill the form, and auto-submit so the user sees
  // one continuous "redirecting..." state instead of a second sign-in
  // prompt. Email lives in the query (visible in URL bar / history);
  // password lives in the URL fragment (client-side only - never
  // reaches server logs / Referer headers). Strip from URL after
  // consumption so refresh doesn't re-trigger and a screen-share doesn't
  // show the password fragment.
  const [autoSubmitting, setAutoSubmitting] = React.useState(false);
  const handoffRanRef = React.useRef(false);
  const formRef = React.useRef<HTMLFormElement | null>(null);
  React.useEffect(() => {
    if (handoffRanRef.current) return;
    handoffRanRef.current = true;
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const handoffEmail = sp.get("email") ?? "";
    const fragment = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    const fp = new URLSearchParams(fragment);
    const handoffPwd = fp.get("pwd") ?? "";
    if (handoffEmail) setEmail(decodeURIComponent(handoffEmail));
    if (handoffPwd) {
      setPassword(decodeURIComponent(handoffPwd));
      setAutoSubmitting(true);
    }
    if (handoffEmail || handoffPwd) {
      const cleanQuery = new URLSearchParams(window.location.search);
      cleanQuery.delete("email");
      const qs = cleanQuery.toString();
      const cleanUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, []);

  // Auto-submit the form once the handoff fields have populated state.
  // formRef.requestSubmit() routes through the existing handleLogin path
  // so the auth flow has a single source of truth.
  React.useEffect(() => {
    if (!autoSubmitting) return;
    if (!email || !password) return;
    const t = setTimeout(() => {
      formRef.current?.requestSubmit();
      setAutoSubmitting(false);
    }, 0);
    return () => clearTimeout(t);
  }, [autoSubmitting, email, password]);

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
    // In production, use our Resend-backed reset route (Firebase Admin generates the link)
    try {
      const res = await fetch("/api/auth/send-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("send failed");
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

    // On the main production site, demo accounts (advisors / investor relations on
    // @odum-research.co.uk + @odum-research.com domains, plus per-prospect demo
    // personas like Desmond's gmail) are homed on the UAT demo environment. Show a
    // brief notice then redirect — they never auth against prod Firebase.
    //
    // Domain-suffix match catches the standing internal accounts; isDemoPersonaEmail
    // checks the canonical PERSONAS list in lib/auth/personas.ts so adding a new
    // prospect persona auto-enrolls them in the redirect without touching this page.
    const lowerEmail = email.toLowerCase();
    const isStandingInternalEmail =
      lowerEmail.endsWith("@odum-research.co.uk") || lowerEmail.endsWith("@odum-research.com");
    const isAdvisorOrDemoEmail = isStandingInternalEmail || isDemoPersonaEmail(email);
    const isProdSite = process.env.NEXT_PUBLIC_SITE_URL?.includes("www.odum-research.com") ?? false;
    if (isAdvisorOrDemoEmail && isProdSite) {
      setIsLoading(false);
      setUatRedirecting(true);
      // Standing internal advisor accounts go to /investor-relations; per-prospect
      // demo personas (Desmond, Patrick, etc.) land on /dashboard so they hit the
      // platform shell and the DemoPlanToggle is in scope.
      const fallback = isStandingInternalEmail ? "/investor-relations" : "/dashboard";
      const target = encodeURIComponent(redirectTo || fallback);
      // Hand off the credentials the user just typed so they don't have to
      // sign in twice. Email goes via query string (low risk; many sites
      // do this with email-magic-link patterns). Password goes via the
      // URL fragment (#pwd=...) — fragments are client-side only and
      // never hit server logs or Referer headers, so this is the safest
      // place to ferry a one-shot demo password across the redirect.
      // The demo personas all use shared, well-known passwords; the
      // handoff is an ergonomic win, not a secret. UAT login page reads
      // both, prefills, and auto-submits on mount.
      const emailParam = encodeURIComponent(email);
      const pwdFragment = encodeURIComponent(password);
      setTimeout(() => {
        window.location.href = `https://uat.odum-research.com/login?redirect=${target}&email=${emailParam}#pwd=${pwdFragment}`;
      }, 2800);
      return;
    }

    const loggedInUser = await loginByEmail(email, password);
    if (loggedInUser) {
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
        } catch {
          /* ignore */
        }
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
      } catch {
        /* no backend, continue */
      }
      router.push(redirectTo || defaultLanding(loggedInUser));
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
              <CardDescription>Sign in to access your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form ref={formRef} onSubmit={handleLogin} className="space-y-4">
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
                    onClick={() => {
                      setShowForgotPassword(true);
                      handleForgotPassword();
                    }}
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
                      <span className="font-mono">uat.odum-research.com</span>. You&rsquo;re being redirected there now
                      and signed in automatically &mdash; you won&rsquo;t need to re-enter your password.
                    </p>
                  </div>
                )}
                {autoSubmitting && (
                  <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-200">
                    <p className="font-medium">Completing your sign-in&hellip;</p>
                    <p className="mt-1 text-xs text-emerald-300/80">
                      Carrying your credentials across from the main site so you don&rsquo;t have to type them again.
                    </p>
                  </div>
                )}
                {DEMOTED_INTERNAL_EMAIL_HINTS[email.trim().toLowerCase()] && (
                  <div className="rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-3 text-sm text-sky-200">
                    <p className="font-medium">Use your Odum Research email</p>
                    <p className="mt-1 text-xs text-sky-300/80">
                      Internal team accounts moved to{" "}
                      <button
                        type="button"
                        className="font-mono underline hover:text-sky-100"
                        onClick={() => setEmail(DEMOTED_INTERNAL_EMAIL_HINTS[email.trim().toLowerCase()] ?? "")}
                      >
                        {DEMOTED_INTERNAL_EMAIL_HINTS[email.trim().toLowerCase()]}
                      </button>
                      . Tap to switch.
                    </p>
                  </div>
                )}
                {(error || loginError) && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    {loginError || error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading || uatRedirecting || autoSubmitting}>
                  {isLoading || autoSubmitting ? "Signing in..." : "Sign In"}
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
