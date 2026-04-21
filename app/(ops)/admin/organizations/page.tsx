"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Search, ArrowRight } from "lucide-react";

interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  contact_email: string;
  contact_name: string;
  status: "onboarding" | "active" | "suspended";
  tier: string;
  api_keys: Array<{ id: string; status: string }>;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  onboarding: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = React.useState<OrgSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/auth/provisioning/organizations");
        if (!res.ok) {
          throw new Error(`Failed to load organisations (${res.status})`);
        }
        const data = (await res.json()) as { organizations?: OrgSummary[] };
        setOrgs(data.organizations ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load organisations");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = React.useMemo(() => {
    if (!search) return orgs;
    const q = search.toLowerCase();
    return orgs.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.contact_email.toLowerCase().includes(q) ||
        o.tier.toLowerCase().includes(q) ||
        o.slug.toLowerCase().includes(q),
    );
  }, [orgs, search]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6 py-12">
        <Spinner size="lg" className="text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <PageHeader
        title="Organisations"
        description={
          <>
            {orgs.length} client organisation{orgs.length === 1 ? "" : "s"} — onboarding, mandates, venue API keys.
          </>
        }
      />

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, tier, or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={orgs.length === 0 ? "No organisations" : "No matches"}
          description={
            orgs.length === 0
              ? "No client organisations have been provisioned yet."
              : "No organisations match your search."
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Active Keys</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((org) => {
                const activeKeys = org.api_keys.filter((k) => k.status === "active").length;
                return (
                  <TableRow key={org.id} className="group">
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/organizations/${org.id}`}
                        className="hover:underline underline-offset-4"
                      >
                        {org.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{org.slug}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="text-sm">{org.contact_name}</div>
                      <div className="text-xs">{org.contact_email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {org.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={activeKeys > 0 ? "text-sm" : "text-sm text-muted-foreground"}>
                        {activeKeys}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {org.created_at
                        ? new Date(org.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${STATUS_STYLES[org.status] ?? ""}`}
                      >
                        {org.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/organizations/${org.id}`}
                        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                        aria-label={`View ${org.name}`}
                      >
                        <ArrowRight className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
