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
        <TableSkeleton rows={8} columns={4} />
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
