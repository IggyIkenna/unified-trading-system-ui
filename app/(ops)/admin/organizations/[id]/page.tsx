"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2, CheckCircle2, Key, Mail, Users } from "lucide-react";

interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  contact_email: string;
  contact_name: string;
  status: string;
  tier: string;
  api_keys: Array<{
    id: string;
    venue: string;
    label: string;
    api_key_masked: string;
    status: string;
    added_at: string;
  }>;
  created_at: string;
}

export default function AdminOrgDetailPage() {
  const params = useParams();
  const orgId = params.id as string;
  const [org, setOrg] = React.useState<OrgDetail | null>(null);
  const [members, setMembers] = React.useState<
    Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
    }>
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const [orgRes, usersRes] = await Promise.all([
          fetch(`/api/auth/provisioning/organizations/${orgId}`),
          fetch("/api/auth/provisioning/users"),
        ]);
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          setOrg(orgData.organization);
        }
        if (usersRes.ok) {
          const userData = await usersRes.json();
          setMembers((userData.users ?? []).filter((u: Record<string, string>) => u.org_id === orgId));
        }
      } catch {
        /* mock mode */
      }
      setLoading(false);
    }
    load();
  }, [orgId]);

  async function handleActivate() {
    try {
      const res = await fetch(`/api/auth/provisioning/organizations/${orgId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrg(data.organization);
      }
    } catch {
      /* */
    }
  }

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  if (!org) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Organisation not found.</p>
        <Link href="/admin" className="text-primary hover:underline text-sm">
          Back to Admin
        </Link>
      </div>
    );
  }

  const activeKeys = org.api_keys.filter((k) => k.status === "active");

  return (
    <div className="px-6 py-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4 mr-1" /> Admin
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="size-6 text-primary" />
          </div>
          <PageHeader
            className="min-w-0 space-y-0.5"
            title={org.name}
            description={`${org.contact_email} — ${org.tier}`}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant={org.status === "active" ? "default" : "secondary"}
            className={org.status === "active" ? "bg-emerald-500/10 text-emerald-400" : ""}
          >
            {org.status}
          </Badge>
          {org.status === "onboarding" && (
            <Button size="sm" onClick={handleActivate}>
              <CheckCircle2 className="size-4 mr-1" /> Activate
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <Users className="size-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{members.length}</div>
            <div className="text-xs text-muted-foreground">Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <Key className="size-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{activeKeys.length}</div>
            <div className="text-xs text-muted-foreground">Active API Keys</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <Mail className="size-6 text-primary mx-auto mb-2" />
            <div className="text-xs text-muted-foreground mt-2">Primary Contact</div>
            <div className="text-sm font-medium truncate">{org.contact_name}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
          <CardDescription>Users linked to this organisation</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                  <div>
                    <Link href={`/admin/users/${m.id}`} className="font-medium text-sm hover:underline">
                      {m.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {m.role}
                    </Badge>
                    <Badge variant={m.status === "active" ? "default" : "secondary"} className="text-xs">
                      {m.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Venue API Keys</CardTitle>
          <CardDescription>
            API keys submitted by the client for venue connectivity.
            {activeKeys.length === 0 && " None submitted yet — reports will be empty until keys are provided."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {org.api_keys.length === 0 ? (
            <div className="text-center py-6">
              <Key className="size-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No API keys yet. The client needs to add keys at Settings &gt; API Keys.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {org.api_keys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Key className="size-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">{key.venue}</span>
                      <span className="text-xs text-muted-foreground ml-2">{key.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{key.api_key_masked}</code>
                    <Badge
                      variant={key.status === "active" ? "default" : "secondary"}
                      className={`text-[10px] ${key.status === "active" ? "bg-emerald-500/10 text-emerald-400" : ""}`}
                    >
                      {key.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reports Access</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {activeKeys.length > 0 ? (
              <>
                <CheckCircle2 className="size-4 text-emerald-400 inline mr-1" />
                This organisation has {activeKeys.length} active API key
                {activeKeys.length > 1 ? "s" : ""}. Reports are populated from{" "}
                {activeKeys.map((k) => k.venue).join(", ")} data.
              </>
            ) : (
              <>
                Reports are empty until the client submits venue API keys. Once keys are provided, P&amp;L, execution
                quality, and risk reports will be automatically generated from their trading activity.
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
