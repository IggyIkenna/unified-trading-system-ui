"use client";

import * as React from "react";
import { ShieldCheck, UserX, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/admin/ui/table-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listFirebaseUsers } from "@/lib/admin/api/firebase-auth";
import type { FirebaseAuthUser } from "@/lib/admin/api/types";

type StatusFilter = "all" | "active" | "disabled";

export default function FirebaseUsersPage() {
  const [users, setUsers] = React.useState<FirebaseAuthUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await listFirebaseUsers();
        setUsers(res.data.users);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load Firebase users",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = React.useMemo(() => {
    if (statusFilter === "all") return users;
    if (statusFilter === "active") return users.filter((u) => !u.disabled);
    return users.filter((u) => u.disabled);
  }, [users, statusFilter]);

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Firebase Users</h1>
          <p className="text-sm text-muted-foreground">
            View all Firebase Authentication accounts
          </p>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <TableSkeleton rows={8} columns={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description={
            statusFilter !== "all"
              ? "Try changing the status filter."
              : "No Firebase users available."
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>UID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entitlements / Claims</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const claims = u.custom_claims ?? {};
                const entitlements = Array.isArray(claims["entitlements"])
                  ? (claims["entitlements"] as string[])
                  : null;
                const personaId =
                  typeof claims["persona_id"] === "string" ? claims["persona_id"] : null;
                const isAdmin = claims["admin"] === true;
                return (
                  <TableRow key={u.uid}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {u.uid}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.display_name || "—"}</TableCell>
                    <TableCell>
                      {u.disabled ? (
                        <Badge variant="destructive" className="gap-1">
                          <UserX className="size-3" />
                          Disabled
                        </Badge>
                      ) : (
                        <Badge className="gap-1 bg-emerald-600/15 text-emerald-400 border-emerald-600/20">
                          <ShieldCheck className="size-3" />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs max-w-xs">
                      {isAdmin && (
                        <Badge className="mr-1 mb-1 text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/20">
                          admin
                        </Badge>
                      )}
                      {personaId && (
                        <span className="block font-medium text-muted-foreground mb-1">
                          {personaId}
                        </span>
                      )}
                      {entitlements ? (
                        <span className="text-[10px] text-muted-foreground break-words">
                          {entitlements.join(", ")}
                        </span>
                      ) : Object.keys(claims).length === 0 ? (
                        <span className="text-muted-foreground italic text-[10px]">No claims</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-mono break-all">
                          {JSON.stringify(claims).slice(0, 120)}
                        </span>
                      )}
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
