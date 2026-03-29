"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/platform/page-header";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useProvisionedUser, useOffboardUser } from "@/hooks/api/use-user-management";
import type { OffboardAction } from "@/lib/types/user-management";

const SERVICE_LABELS: Record<string, string> = {
  github: "GitHub",
  slack: "Slack",
  microsoft365: "Microsoft 365",
  gcp: "GCP IAM",
  aws: "AWS IAM",
  portal: "Portal",
};

export default function OffboardUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data } = useProvisionedUser(params.id);
  const offboard = useOffboardUser();
  const user = data?.user;

  const provisionedServices = React.useMemo(() => {
    if (!user) return [];
    return Object.entries(user.services).filter(([, status]) => status === "provisioned");
  }, [user]);

  const [actions, setActions] = React.useState<Record<string, OffboardAction>>({});

  React.useEffect(() => {
    if (provisionedServices.length > 0 && Object.keys(actions).length === 0) {
      const initial: Record<string, OffboardAction> = {};
      for (const [svc] of provisionedServices) {
        initial[svc] = "deactivate";
      }
      setActions(initial);
    }
  }, [provisionedServices, actions]);

  if (!user) return <div className="p-6 text-muted-foreground">Loading...</div>;

  const handleOffboard = () => {
    offboard.mutate({ id: params.id, actions }, { onSuccess: () => router.push("/admin/users") });
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
        <PageHeader className="min-w-0 flex-1 space-y-0" title={`Offboard — ${user.name}`} />
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Confirm Offboarding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will revoke access across all provisioned services for <strong>{user.name}</strong> ({user.email}).
            Choose whether to deactivate (preserve data) or delete (remove permanently) each service.
          </p>

          {provisionedServices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No provisioned services to offboard.</p>
          ) : (
            <div className="space-y-3">
              {provisionedServices.map(([svc]) => (
                <div key={svc} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">
                      provisioned
                    </Badge>
                    <span className="text-sm font-medium">{SERVICE_LABELS[svc] ?? svc}</span>
                  </div>
                  <Select
                    value={actions[svc] ?? "deactivate"}
                    onValueChange={(v) =>
                      setActions((prev) => ({
                        ...prev,
                        [svc]: v as OffboardAction,
                      }))
                    }
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deactivate">Deactivate</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="destructive"
              onClick={handleOffboard}
              disabled={offboard.isPending || provisionedServices.length === 0}
            >
              {offboard.isPending ? "Offboarding..." : "Confirm Offboard"}
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
          {offboard.isSuccess && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-600">Offboarding complete.</p>
              {offboard.data?.revocation_steps?.map((step) => (
                <div key={step.service} className="flex items-center justify-between text-sm">
                  <span>{step.label}</span>
                  <Badge variant={step.status === "success" ? "default" : "destructive"}>{step.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
