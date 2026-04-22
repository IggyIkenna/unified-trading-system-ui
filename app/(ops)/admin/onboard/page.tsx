"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus, CheckCircle2, XCircle, Loader2, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { checkOnboardQuota, onboardUser } from "@/lib/admin/api/users";
import { listAccessTemplates } from "@/lib/admin/api/access-templates";
import type { UserRole, AccessTemplate, ProvisioningStep, QuotaCheckResult } from "@/lib/admin/api/types";

const ROLE_OPTIONS: UserRole[] = [
  "admin",
  "internal",
  "collaborator",
  "board",
  "client",
  "shareholder",
  "accounting",
  "operations",
  "investor",
];

const ROLES_WITH_GITHUB: UserRole[] = ["admin", "internal", "collaborator"];

function stepIcon(status: ProvisioningStep["status"]) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="size-4 text-green-500" />;
    case "failed":
      return <XCircle className="size-4 text-red-500" />;
    case "running":
      return <Loader2 className="size-4 text-cyan-500 animate-spin" />;
    case "pending":
      return <Clock className="size-4 text-muted-foreground" />;
  }
}

export default function OnboardPage() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("collaborator");
  const [githubHandle, setGithubHandle] = React.useState("");
  const [productSlugs, setProductSlugs] = React.useState("");
  const [accessTemplateId, setAccessTemplateId] = React.useState("");

  const [templates, setTemplates] = React.useState<AccessTemplate[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [steps, setSteps] = React.useState<ProvisioningStep[]>([]);
  const [submitted, setSubmitted] = React.useState(false);

  const [quotaWarning, setQuotaWarning] = React.useState<QuotaCheckResult | null>(null);
  const [showQuotaDialog, setShowQuotaDialog] = React.useState(false);

  React.useEffect(() => {
    listAccessTemplates()
      .then((res) => setTemplates(res.data?.templates ?? []))
      .catch(() => {});
  }, []);

  const showGithub = ROLES_WITH_GITHUB.includes(role);

  const doSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await onboardUser({
        name,
        email,
        role,
        github_handle: showGithub && githubHandle ? githubHandle : undefined,
        product_slugs: productSlugs
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        access_template_id: accessTemplateId || undefined,
      });
      setSteps(res.data?.provisioning_steps ?? []);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Onboarding failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const quotaRes = await checkOnboardQuota({ email, role });
      const quota = quotaRes.data.quota;
      if (!quota.ok) {
        setQuotaWarning(quota);
        setShowQuotaDialog(true);
        return;
      }
    } catch {
      // quota check failed - proceed anyway
    }

    await doSubmit();
  };

  const handleQuotaOverride = async () => {
    setShowQuotaDialog(false);
    setQuotaWarning(null);
    await doSubmit();
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-5" />
              User Onboarded
            </CardTitle>
            <CardDescription>
              Provisioning steps are running for {name} ({email}).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3 rounded-md border border-border px-4 py-3">
                {stepIcon(step.status)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{step.label}</p>
                  {step.message && <p className="text-xs text-muted-foreground">{step.message}</p>}
                </div>
                <Badge
                  variant={
                    step.status === "success"
                      ? "success"
                      : step.status === "failed"
                        ? "error"
                        : step.status === "running"
                          ? "running"
                          : "pending"
                  }
                >
                  {step.status}
                </Badge>
              </div>
            ))}
            <div className="pt-4">
              <Button onClick={() => router.push("/users")}>Back to Users</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Onboard New User
          </CardTitle>
          <CardDescription>Create a new user and provision access across all services.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@odum-research.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showGithub && (
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub Handle</Label>
                  <Input
                    id="github"
                    placeholder="johndoe"
                    value={githubHandle}
                    onChange={(e) => setGithubHandle(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="products">Product Slugs</Label>
                <Input
                  id="products"
                  placeholder="trading-ui, backtest-ui"
                  value={productSlugs}
                  onChange={(e) => setProductSlugs(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Comma-separated list of product slugs</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Access Template</Label>
                <Select value={accessTemplateId} onValueChange={setAccessTemplateId}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select template (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Onboarding…
                  </>
                ) : (
                  "Onboard User"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/users")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Service Quota Warning
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>{quotaWarning?.message || "One or more services are near their quota limit."}</p>
                {quotaWarning?.checks?.map((check) => (
                  <div
                    key={check.service}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span className="font-medium capitalize">{check.service}</span>
                    <span className="text-muted-foreground">
                      {check.used} / {check.limit} used ({check.available} available)
                    </span>
                  </div>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleQuotaOverride}>Proceed Anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
