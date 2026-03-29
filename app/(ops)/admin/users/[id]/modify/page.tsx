"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/shared/page-header";
import { ArrowLeft, Save } from "lucide-react";
import { useProvisionedUser, useModifyUser, useAccessTemplates } from "@/hooks/api/use-user-management";
import type { ProvisioningRole } from "@/lib/types/user-management";

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

const SERVICE_ACCESS = [
  {
    category: "Data",
    items: [
      {
        key: "data-basic",
        label: "Data (Basic)",
        desc: "180 CeFi instruments, daily candles",
      },
      {
        key: "data-pro",
        label: "Data (Pro)",
        desc: "2400+ instruments, tick data, full coverage",
      },
    ],
  },
  {
    category: "Research",
    items: [
      {
        key: "ml-full",
        label: "ML & Models",
        desc: "Model training, experiments, deployment",
      },
      {
        key: "strategy-full",
        label: "Strategy Platform",
        desc: "Backtesting, candidates, handoff",
      },
    ],
  },
  {
    category: "Trading & Execution",
    items: [
      {
        key: "execution-basic",
        label: "Execution (Basic)",
        desc: "TWAP, VWAP, basic routing",
      },
      {
        key: "execution-full",
        label: "Execution (Full)",
        desc: "All algos, SOR, dark pools, TCA",
      },
    ],
  },
  {
    category: "Reporting",
    items: [
      {
        key: "reporting",
        label: "Reporting & Analytics",
        desc: "P&L, settlement, reconciliation, regulatory",
      },
    ],
  },
];

export default function ModifyUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data } = useProvisionedUser(params.id);
  const modify = useModifyUser();
  const templates = useAccessTemplates();
  const user = data?.user;

  const [role, setRole] = React.useState<ProvisioningRole | "">("");
  const [githubHandle, setGithubHandle] = React.useState("");
  const [templateId, setTemplateId] = React.useState("");
  const [productSlugs, setProductSlugs] = React.useState<string[]>([]);

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

  if (!user) return <div className="p-6 text-muted-foreground">Loading...</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="p-6 max-w-2xl space-y-6">
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
            <div className="space-y-4 pt-2">
              <Label className="text-base font-semibold">Entitlements</Label>
              {SERVICE_ACCESS.map((cat) => (
                <div key={cat.category} className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{cat.category}</p>
                  {cat.items.map((item) => (
                    <label
                      key={item.key}
                      className="flex items-start gap-3 cursor-pointer rounded-md border p-3 hover:bg-muted/30"
                    >
                      <Checkbox
                        checked={productSlugs.includes(item.key)}
                        onCheckedChange={() => toggleSlug(item.key)}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="text-sm font-medium">{item.label}</span>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ))}
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
