"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/shared/page-header";
import { ArrowLeft, Save, ChevronRight, ChevronDown, Lock, Briefcase } from "lucide-react";
import {
  useProvisionedUser,
  useModifyUser,
  useAccessTemplates,
  usePermissionCatalogue,
} from "@/hooks/api/use-user-management";
import type { ProvisioningRole } from "@/lib/types/user-management";
import { useAuth } from "@/hooks/use-auth";
import { hasAdminPermission } from "@/lib/auth/admin-permissions";

const ROLES: ProvisioningRole[] = [
  "admin",
  "collaborator",
  "board",
  "client",
  "shareholder",
  "accounting",
  "operations",
  "investor",
];

export default function ModifyUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data } = useProvisionedUser(params.id);
  const modify = useModifyUser();
  const templates = useAccessTemplates();
  const { data: catalogueData, isLoading: catalogueLoading } = usePermissionCatalogue();
  const user = data?.user;
  const { user: currentUser } = useAuth();
  const canModify = hasAdminPermission(currentUser, "admin:modify_user");
  const canGrantRole = hasAdminPermission(currentUser, "admin:grant_role");

  const [role, setRole] = React.useState<ProvisioningRole | "">("");
  const [githubHandle, setGithubHandle] = React.useState("");
  const [templateId, setTemplateId] = React.useState("");
  const [productSlugs, setProductSlugs] = React.useState<string[]>([]);
  const [expandedDomains, setExpandedDomains] = React.useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (user) {
      setRole(user.role);
      setGithubHandle(user.github_handle ?? "");
      setTemplateId(user.access_template_id ?? "");
      setProductSlugs(user.product_slugs ?? []);
    }
  }, [user]);

  const toggleSlug = (key: string) => {
    setProductSlugs((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  };

  const toggleDomain = (key: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleCategory = (domainKey: string, catKey: string) => {
    const compositeKey = `${domainKey}:${catKey}`;
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(compositeKey)) next.delete(compositeKey);
      else next.add(compositeKey);
      return next;
    });
  };

  if (!user) return <div className="p-6 text-muted-foreground">Loading...</div>;

  const isInternal = ["admin", "collaborator", "operations", "accounting"].includes(user.role);
  const domains = (catalogueData?.domains ?? []).filter(
    (d) => isInternal || !d.categories.every((c) => c.permissions.every((p) => p.internal_only)),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify) {
      // Permission-denied soft-fail — admin:modify_user required.
      return;
    }
    // Promoting to admin requires the separate admin:grant_role permission.
    if (role === "admin" && !canGrantRole) {
      return;
    }
    modify.mutate(
      {
        id: params.id,
        role: role as ProvisioningRole,
        github_handle: githubHandle || undefined,
        access_template_id: templateId || undefined,
        product_slugs: productSlugs,
      },
      { onSuccess: () => router.push(`/admin/users/${params.id}`) },
    );
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-start gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="mt-1 shrink-0"
          onClick={() => router.push(`/admin/users/${params.id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader className="min-w-0 flex-1 space-y-0" title={`Modify — ${user.name}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as ProvisioningRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub Handle</Label>
              <Input id="github" value={githubHandle} onChange={(e) => setGithubHandle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Access Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {(templates.data?.templates ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Catalogue-driven entitlements picker */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <Label className="text-base font-semibold">Entitlements</Label>
              </div>
              <CardDescription>
                Select which apps and services this user can access. Expand domains and categories to pick individual
                permissions.
              </CardDescription>

              {catalogueLoading ? (
                <p className="text-sm text-muted-foreground">Loading catalogue...</p>
              ) : (
                domains.map((domain) => {
                  const isDomainExpanded = expandedDomains.has(domain.key);
                  const domainSelectedCount = domain.categories.reduce(
                    (sum, cat) => sum + cat.permissions.filter((p) => productSlugs.includes(p.key)).length,
                    0,
                  );
                  return (
                    <div key={domain.key} className="border rounded-md">
                      <button
                        type="button"
                        onClick={() => toggleDomain(domain.key)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          {isDomainExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                          <span className="text-sm font-medium">{domain.label}</span>
                          <span className="text-xs text-muted-foreground">{domain.description}</span>
                        </div>
                        {domainSelectedCount > 0 && (
                          <Badge variant="default" className="text-xs">
                            {domainSelectedCount} selected
                          </Badge>
                        )}
                      </button>
                      {isDomainExpanded && (
                        <div className="px-3 pb-3 space-y-2">
                          {domain.categories.map((cat) => {
                            const compositeKey = `${domain.key}:${cat.key}`;
                            const isCatExpanded = expandedCategories.has(compositeKey);
                            const visiblePerms = isInternal
                              ? cat.permissions
                              : cat.permissions.filter((p) => !p.internal_only);
                            if (visiblePerms.length === 0) return null;
                            return (
                              <div key={cat.key} className="ml-4">
                                <button
                                  type="button"
                                  onClick={() => toggleCategory(domain.key, cat.key)}
                                  className="w-full flex items-center gap-2 py-1 text-sm hover:bg-muted/30 rounded px-2 transition-colors text-left"
                                >
                                  {isCatExpanded ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                  <span className="font-medium">{cat.label}</span>
                                  <span className="text-xs text-muted-foreground">({visiblePerms.length})</span>
                                </button>
                                {isCatExpanded && (
                                  <div className="ml-5 space-y-1 pb-1">
                                    {visiblePerms.map((perm) => (
                                      <div key={perm.key} className="flex items-start gap-3 py-1">
                                        <Checkbox
                                          id={`slug-${domain.key}-${cat.key}-${perm.key}`}
                                          checked={productSlugs.includes(perm.key)}
                                          onCheckedChange={() => toggleSlug(perm.key)}
                                        />
                                        <div>
                                          <Label
                                            htmlFor={`slug-${domain.key}-${cat.key}-${perm.key}`}
                                            className="text-sm cursor-pointer font-medium flex items-center gap-1"
                                          >
                                            {perm.label}
                                            {perm.internal_only && <Lock className="h-3 w-3 text-muted-foreground" />}
                                          </Label>
                                          <p className="text-xs text-muted-foreground">{perm.description}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <Button type="submit" disabled={modify.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {modify.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
