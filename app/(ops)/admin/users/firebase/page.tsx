"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/shared/spinner";
import { ApiError } from "@/components/shared/api-error";
import { EmptyState } from "@/components/shared/empty-state";
import { Flame, Search, RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useFirebaseUsers } from "@/hooks/api/use-firebase-users";
import type { FirebaseAuthUser } from "@/hooks/api/use-firebase-users";

function formatTimeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ProviderBadge({ providerId }: { providerId: string }) {
  const LABELS: Record<string, string> = {
    "google.com": "Google",
    "password": "Email/Password",
    "microsoft.com": "Microsoft",
    "github.com": "GitHub",
  };
  return (
    <Badge variant="outline" className="text-[10px] font-mono">
      {LABELS[providerId] ?? providerId}
    </Badge>
  );
}

export default function FirebaseUsersPage() {
  const [search, setSearch] = React.useState("");
  const { data, isLoading, isError, error, refetch, isFetching } = useFirebaseUsers({ maxResults: 100 });

  const users: FirebaseAuthUser[] = data?.users ?? [];

  const filtered = React.useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.display_name?.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q),
    );
  }, [users, search]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Firebase Auth Users"
        description={`${data?.total ?? 0} accounts in Firebase Authentication`}
        icon={<Flame className="size-5" />}
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Spinner size="sm" className="mr-1.5" /> : <RefreshCw className="size-3.5 mr-1.5" />}
            Refresh
          </Button>
        }
      />

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="size-4 text-muted-foreground shrink-0" />
        <Input
          placeholder="Search by email, name, or UID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <Spinner />
        </div>
      )}

      {isError && <ApiError error={error} retry={refetch} />}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={<Flame className="size-8 text-muted-foreground" />}
          title={search ? "No users match your search" : "No Firebase users found"}
          description={search ? "Try a different query." : "No accounts exist in Firebase Authentication yet."}
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>User</TableHead>
                <TableHead>UID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Providers</TableHead>
                <TableHead>Last Sign-in</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.uid} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">
                        {u.display_name ?? <span className="text-muted-foreground italic">No name</span>}
                      </span>
                      <span className="text-xs text-muted-foreground">{u.email ?? "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-[10px] text-muted-foreground select-all">{u.uid}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {u.disabled ? (
                        <Badge variant="destructive" className="text-[10px] w-fit">
                          <XCircle className="size-2.5 mr-0.5" /> Disabled
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] w-fit bg-emerald-500/10 text-emerald-400">
                          <CheckCircle2 className="size-2.5 mr-0.5" /> Active
                        </Badge>
                      )}
                      {!u.email_verified && u.email && (
                        <Badge variant="outline" className="text-[10px] w-fit text-amber-400 border-amber-400/30">
                          <AlertCircle className="size-2.5 mr-0.5" /> Unverified
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.provider_data.map((p) => (
                        <ProviderBadge key={p.provider_id} providerId={p.provider_id} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatTimeAgo(u.last_sign_in_time)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatTimeAgo(u.creation_time)}
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
