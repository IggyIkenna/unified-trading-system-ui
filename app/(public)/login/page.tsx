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
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Mail, Lock, Shield, Users, Eye } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PERSONAS } from "@/lib/auth/personas";

const PERSONA_REDIRECTS: Record<string, string> = {
  admin: "/dashboard",
  "internal-trader": "/dashboard",
  "client-full": "/dashboard",
  "client-premium": "/dashboard",
  "client-data-only": "/dashboard",
};

const ROLE_ICONS: Record<string, typeof Shield> = {
  admin: Shield,
  internal: Eye,
  client: Users,
};

const ROLE_COLORS: Record<string, string> = {
  admin: "text-red-400",
  internal: "text-emerald-400",
  client: "text-blue-400",
};

const isFirebaseMode = process.env.NEXT_PUBLIC_AUTH_PROVIDER === "firebase";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, loginByEmail, login, logout } = useAuth();
  const [redirectTo, setRedirectTo] = React.useState<string | null>(null);
  const [personaParam, setPersonaParam] = React.useState<string | null>(null);

  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setRedirectTo(sp.get("redirect"));
    setPersonaParam(sp.get("persona"));
  }, []);

  const [loginType, setLoginType] = React.useState<"internal" | "external">(
    "external",
  );
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!personaParam || loading) return;
    if (user && user.id !== personaParam) {
      void logout().then(() => {
        window.location.reload();
      });
      return;
    }
    if (!user) {
      void login(personaParam).then((success) => {
        if (success) {
          router.replace(
            redirectTo || PERSONA_REDIRECTS[personaParam] || "/dashboard",
          );
        }
      });
    }
  }, [personaParam, loading, user, login, logout, router, redirectTo]);

  React.useEffect(() => {
    if (!loading && user && !personaParam) {
      router.replace(redirectTo || "/dashboard");
    }
  }, [loading, user, router, redirectTo, personaParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const success = await loginByEmail(email, password);
    if (success) {
      const persona = PERSONAS.find((p) => p.email === email);
      const target =
        redirectTo ||
        (persona ? PERSONA_REDIRECTS[persona.id] : "/dashboard") ||
        "/dashboard";
      router.push(target);
    } else {
      setError(
        isFirebaseMode
          ? "Invalid credentials. Check your email and password."
          : "Invalid credentials. Try any demo account below with password: demo",
      );
    }
    setIsLoading(false);
  };

  const handleDemoLogin = async (personaId: string) => {
    const success = await login(personaId);
    if (success) {
      const target = redirectTo || PERSONA_REDIRECTS[personaId] || "/dashboard";
      router.push(target);
    }
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
              {!isFirebaseMode && (
                <div className="flex items-center justify-center gap-1 mt-4 p-1 rounded-lg bg-muted/50">
                  <button
                    type="button"
                    onClick={() => setLoginType("internal")}
                    className={`flex-1 px-4 py-2.5 rounded-md text-xs font-medium transition-all ${
                      loginType === "internal"
                        ? "bg-card shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div>Internal</div>
                    <div className="text-[9px] font-normal text-muted-foreground mt-0.5">
                      Odum team · full platform + admin
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginType("external")}
                    className={`flex-1 px-4 py-2.5 rounded-md text-xs font-medium transition-all ${
                      loginType === "external"
                        ? "bg-card shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div>External Client</div>
                    <div className="text-[9px] font-normal text-muted-foreground mt-0.5">
                      Subscribed services · your org
                    </div>
                  </button>
                </div>
              )}
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
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </form>

              {!isFirebaseMode && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Or try a demo account{" "}
                    <span className="text-xs">(password: demo)</span>
                  </p>
                  <div className="space-y-2">
                    {PERSONAS.filter((p) =>
                      loginType === "internal"
                        ? p.role === "internal" || p.role === "admin"
                        : p.role === "client",
                    ).map((persona) => {
                      const Icon = ROLE_ICONS[persona.role] || Users;
                      const colorClass =
                        ROLE_COLORS[persona.role] || "text-muted-foreground";
                      return (
                        <button
                          type="button"
                          key={persona.id}
                          onClick={() => void handleDemoLogin(persona.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left"
                        >
                          <Icon className={`size-4 ${colorClass}`} />
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {persona.org.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {persona.email} · {persona.displayName}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              persona.role === "admin"
                                ? "border-red-500/30 text-red-400"
                                : persona.role === "internal"
                                  ? "border-emerald-500/30 text-emerald-400"
                                  : "border-blue-500/30 text-blue-400"
                            }`}
                          >
                            {persona.role}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
