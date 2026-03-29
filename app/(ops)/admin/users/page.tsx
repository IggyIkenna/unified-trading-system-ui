"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, Search } from "lucide-react";
import { useProvisionedUsers, useAccessRequests } from "@/hooks/api/use-user-management";
import { ApiError } from "@/components/shared/api-error";
import { EmptyState } from "@/components/shared/empty-state";
import { Spinner } from "@/components/shared/spinner";
import type { ProvisionedPerson } from "@/lib/types/user-management";

const ENTITLEMENT_SHORT: Record<string, string> = {
  "data-basic": "Data",
  "data-pro": "Data Pro",
  "execution-basic": "Execution",
  "execution-full": "Execution Full",
  "ml-full": "ML",
  "strategy-full": "Strategy",
  reporting: "Reports",
};

export default function AdminUsersPage() {
  const { data, isLoading, isError, error, refetch } = useProvisionedUsers();
  const pendingRequests = useAccessRequests("pending");
  const [search, setSearch] = React.useState("");

  const pendingByEmail = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const req of pendingRequests.data?.requests ?? []) {
      map[req.requester_email] = (map[req.requester_email] ?? 0) + 1;
    }
    return map;
  }, [pendingRequests.data]);

  const users = React.useMemo(() => {
    const all = data?.users ?? [];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q),
    );
  }, [data, search]);

  const internal = users.filter((u) => ["admin", "collaborator", "operations", "accounting"].includes(u.role));
  const external = users.filter((u) => !["admin", "collaborator", "operations", "accounting"].includes(u.role));

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6 py-12">
        <Spinner size="lg" className="text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-6 py-6">
        <ApiError error={error as Error} onRetry={() => void refetch()} title="Failed to load users" />
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <PageHeader
        title="Users"
        description={
          <>
            {data?.total ?? 0} users across {new Set(users.map((u) => u.role)).size} roles
          </>
        }
      >
        <Link href="/admin/users/onboard">
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-1" /> Onboard
          </Button>
        </Link>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <div className="space-y-8">
        {internal.length > 0 && <UserSection title="Internal" users={internal} pendingByEmail={pendingByEmail} />}
        {external.length > 0 && <UserSection title="External" users={external} pendingByEmail={pendingByEmail} />}
        {internal.length === 0 && external.length === 0 ? (
          <EmptyState title="No users" description="No provisioned users match your search." />
        ) : null}
      </div>
    </div>
  );
}

function UserSection({
  title,
  users,
  pendingByEmail,
}: {
  title: string;
  users: ProvisionedPerson[];
  pendingByEmail: Record<string, number>;
}) {
  return (
    <div>
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
        {title} ({users.length})
      </h2>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="py-2 px-4 font-medium">Name</th>
              <th className="py-2 px-4 font-medium">Email</th>
              <th className="py-2 px-4 font-medium">Role</th>
              <th className="py-2 px-4 font-medium">Access</th>
              <th className="py-2 px-4 font-medium">Since</th>
              <th className="py-2 px-4 font-medium">Stage</th>
              <th className="py-2 px-4 font-medium">Status</th>
              <th className="py-2 px-4 font-medium w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => {
              const pending = pendingByEmail[user.email] ?? 0;
              return (
                <tr key={user.firebase_uid} className="hover:bg-muted/30">
                  <td className="py-2.5 px-4">
                    <Link href={`/admin/users/${user.firebase_uid}`} className="font-medium hover:underline">
                      {user.name}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground">{user.email}</td>
                  <td className="py-2.5 px-4">
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex gap-1 flex-wrap">
                      {user.product_slugs.map((slug) => (
                        <Badge key={slug} variant="secondary" className="text-xs">
                          {ENTITLEMENT_SHORT[slug] ?? slug}
                        </Badge>
                      ))}
                      {user.product_slugs.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground text-xs">
                    {user.provisioned_at
                      ? new Date(user.provisioned_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="py-2.5 px-4">
                    {(user as unknown as Record<string, unknown>).onboarding_stage ? (
                      <Badge variant="outline" className="text-xs capitalize">
                        {String((user as unknown as Record<string, unknown>).onboarding_stage).replace(/_/g, " ")}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={user.status === "active" ? "default" : "secondary"} className="text-xs">
                        {user.status}
                      </Badge>
                      {pending > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {pending} pending
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <Link
                      href={`/admin/users/${user.firebase_uid}`}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
