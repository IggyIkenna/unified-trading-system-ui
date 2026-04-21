"use client";

import * as React from "react";
import {
  GitBranch,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  Globe,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  discoverRepos,
  listRepos,
  listAssignments,
  assignRepo,
  scanActualRepoAccess,
  revokeRepoAccess,
} from "@/lib/admin/api/github";
import { listUsers } from "@/lib/admin/api/users";
import { useAuth } from "@/hooks/admin/use-auth";
import { formatDateTime } from "@/lib/admin/utils";
import type {
  GitHubRepo,
  GitHubRepoAssignment,
  GitHubRepoRole,
  Person,
} from "@/lib/admin/api/types";

const ROLE_OPTIONS: {
  value: GitHubRepoRole;
  label: string;
  description: string;
}[] = [
  { value: "pull", label: "Read", description: "Can read and clone" },
  {
    value: "triage",
    label: "Triage",
    description: "Can manage issues and PRs",
  },
  { value: "push", label: "Write", description: "Can push to branches" },
  {
    value: "maintain",
    label: "Maintain",
    description: "Can manage without admin",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Full access including settings",
  },
];

const ROLE_COLORS: Record<string, string> = {
  pull: "bg-zinc-600/15 text-zinc-400",
  triage: "bg-blue-600/15 text-blue-400 border-blue-600/20",
  push: "bg-emerald-600/15 text-emerald-400 border-emerald-600/20",
  maintain: "bg-amber-600/15 text-amber-400 border-amber-600/20",
  admin: "bg-red-600/15 text-red-400 border-red-600/20",
};

export default function GitHubPage() {
  const { user: authUser } = useAuth();
  const [repos, setRepos] = React.useState<GitHubRepo[]>([]);
  const [assignments, setAssignments] = React.useState<GitHubRepoAssignment[]>(
    [],
  );
  const [users, setUsers] = React.useState<Person[]>([]);
  const [reposLoading, setReposLoading] = React.useState(true);
  const [assignLoading, setAssignLoading] = React.useState(true);
  const [discovering, setDiscovering] = React.useState(false);
  const [discoverResult, setDiscoverResult] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [assignmentUserFilter, setAssignmentUserFilter] = React.useState("all");
  const [showAccessibleOnly, setShowAccessibleOnly] = React.useState(false);
  const [actualAccessRepos, setActualAccessRepos] = React.useState<Set<string>>(
    new Set(),
  );
  const [actualAccessLoading, setActualAccessLoading] = React.useState(false);
  const [actualAccessError, setActualAccessError] = React.useState("");
  const [actualAccessCount, setActualAccessCount] = React.useState(0);

  const [grantOpen, setGrantOpen] = React.useState(false);
  const [grantForm, setGrantForm] = React.useState({
    firebase_uid: "",
    repo_full_name: "",
    role: "push" as GitHubRepoRole,
  });
  const [granting, setGranting] = React.useState(false);
  const [grantError, setGrantError] = React.useState("");

  const [revokeTarget, setRevokeTarget] =
    React.useState<GitHubRepoAssignment | null>(null);
  const [revoking, setRevoking] = React.useState(false);

  const fetchRepos = React.useCallback(async () => {
    try {
      setReposLoading(true);
      const res = await listRepos();
      setRepos(res.data.repos);
    } catch {
      /* first load may be empty */
    } finally {
      setReposLoading(false);
    }
  }, []);

  const fetchAssignments = React.useCallback(async () => {
    try {
      setAssignLoading(true);
      const res = await listAssignments();
      setAssignments(res.data.assignments);
    } catch {
      /* non-critical */
    } finally {
      setAssignLoading(false);
    }
  }, []);

  const fetchUsers = React.useCallback(async () => {
    try {
      const res = await listUsers();
      setUsers(res.data.users);
    } catch {
      /* non-critical */
    }
  }, []);

  React.useEffect(() => {
    fetchRepos();
    fetchAssignments();
    fetchUsers();
  }, [fetchRepos, fetchAssignments, fetchUsers]);

  React.useEffect(() => {
    if (!authUser?.firebase_uid) return;
    setAssignmentUserFilter((prev) =>
      prev === "all" ? authUser.firebase_uid : prev,
    );
  }, [authUser?.firebase_uid]);

  const selectedUser = React.useMemo(
    () => users.find((u) => u.firebase_uid === assignmentUserFilter),
    [users, assignmentUserFilter],
  );

  const refreshActualAccess = React.useCallback(async () => {
    if (assignmentUserFilter === "all" || !selectedUser?.github_handle) {
      setActualAccessRepos(new Set());
      setActualAccessCount(0);
      setActualAccessError("");
      return;
    }
    setActualAccessLoading(true);
    setActualAccessError("");
    try {
      const res = await scanActualRepoAccess(selectedUser.github_handle);
      setActualAccessRepos(
        new Set(res.data.accessible_repos.map((repo) => repo.repo_full_name)),
      );
      setActualAccessCount(res.data.accessible_total);
      if (res.data.errors.length > 0) {
        setActualAccessError(
          `Some repos could not be scanned (${res.data.errors.length}).`,
        );
      }
    } catch (err) {
      setActualAccessRepos(new Set());
      setActualAccessCount(0);
      setActualAccessError(
        err instanceof Error
          ? err.message
          : "Failed to scan actual GitHub access.",
      );
    } finally {
      setActualAccessLoading(false);
    }
  }, [assignmentUserFilter, selectedUser?.github_handle]);

  React.useEffect(() => {
    refreshActualAccess();
  }, [refreshActualAccess]);

  async function handleDiscover() {
    setDiscovering(true);
    setDiscoverResult("");
    try {
      const res = await discoverRepos();
      setDiscoverResult(
        `Discovered ${res.data.total} repos from ${res.data.org}`,
      );
      await fetchRepos();
    } catch (err) {
      setDiscoverResult(
        err instanceof Error ? err.message : "Discovery failed",
      );
    } finally {
      setDiscovering(false);
    }
  }

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    if (!grantForm.firebase_uid || !grantForm.repo_full_name) {
      setGrantError("User and repo are required.");
      return;
    }
    const user = users.find((u) => u.firebase_uid === grantForm.firebase_uid);
    if (!user?.github_handle) {
      setGrantError("Selected user has no GitHub handle configured.");
      return;
    }
    setGranting(true);
    setGrantError("");
    try {
      await assignRepo({
        firebase_uid: grantForm.firebase_uid,
        github_handle: user.github_handle,
        repo_full_name: grantForm.repo_full_name,
        role: grantForm.role,
      });
      setGrantOpen(false);
      setGrantForm({ firebase_uid: "", repo_full_name: "", role: "push" });
      await fetchAssignments();
    } catch (err) {
      setGrantError(err instanceof Error ? err.message : "Failed to assign");
    } finally {
      setGranting(false);
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await revokeRepoAccess(revokeTarget.id);
      setRevokeTarget(null);
      await fetchAssignments();
    } catch {
      /* show inline */
    } finally {
      setRevoking(false);
    }
  }

  const filteredAssignments = React.useMemo(() => {
    if (assignmentUserFilter === "all") return assignments;
    return assignments.filter((a) => a.firebase_uid === assignmentUserFilter);
  }, [assignments, assignmentUserFilter]);

  const accessibleRepoNames = React.useMemo(() => {
    const fromAssignments = filteredAssignments.map((a) => a.repo_full_name);
    return new Set([...fromAssignments, ...actualAccessRepos]);
  }, [filteredAssignments, actualAccessRepos]);

  const filteredRepos = repos.filter((r) => {
    if (showAccessibleOnly && !accessibleRepoNames.has(r.full_name)) {
      return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.full_name.toLowerCase().includes(q) ||
      (r.language || "").toLowerCase().includes(q)
    );
  });

  const usersWithGitHub = users.filter((u) => u.github_handle);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <GitBranch className="size-6 text-primary" />
            GitHub Access
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover repos and assign collaborator access with specific roles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDiscover}
            disabled={discovering}
          >
            <RefreshCw
              className={`mr-2 size-4 ${discovering ? "animate-spin" : ""}`}
            />
            {discovering ? "Discovering..." : "Discover Repos"}
          </Button>
          <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Assign Repo Access
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleGrant}>
                <DialogHeader>
                  <DialogTitle>Assign Repository Access</DialogTitle>
                  <DialogDescription>
                    Grant a user collaborator access to a GitHub repository.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label>User</Label>
                    <Select
                      value={grantForm.firebase_uid}
                      onValueChange={(v) =>
                        setGrantForm((f) => ({ ...f, firebase_uid: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user with GitHub handle..." />
                      </SelectTrigger>
                      <SelectContent>
                        {usersWithGitHub.map((u) => (
                          <SelectItem
                            key={u.firebase_uid}
                            value={u.firebase_uid}
                          >
                            {u.name} (@{u.github_handle})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Repository</Label>
                    <Select
                      value={grantForm.repo_full_name}
                      onValueChange={(v) =>
                        setGrantForm((f) => ({ ...f, repo_full_name: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a repository..." />
                      </SelectTrigger>
                      <SelectContent>
                        {repos
                          .filter((r) => !r.archived)
                          .map((r) => (
                            <SelectItem key={r.full_name} value={r.full_name}>
                              {r.full_name} {r.private ? "🔒" : ""}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select
                      value={grantForm.role}
                      onValueChange={(v) =>
                        setGrantForm((f) => ({
                          ...f,
                          role: v as GitHubRepoRole,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label} — {opt.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {grantError && (
                    <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                      {grantError}
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={granting}>
                    {granting ? "Assigning..." : "Assign Access"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {discoverResult && (
        <p className="text-sm text-emerald-400 bg-emerald-600/10 rounded-md px-3 py-2">
          {discoverResult}
        </p>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Current Assignments</CardTitle>
              <CardDescription>
                Users with collaborator access to specific repositories
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={assignmentUserFilter}
                onValueChange={setAssignmentUserFilter}
              >
                <SelectTrigger className="h-8 w-64">
                  <SelectValue placeholder="Filter assignment user..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {usersWithGitHub.map((u) => (
                    <SelectItem key={u.firebase_uid} value={u.firebase_uid}>
                      {u.name} (@{u.github_handle})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assignmentUserFilter !== "all" && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-8"
                  onClick={refreshActualAccess}
                  disabled={actualAccessLoading}
                >
                  {actualAccessLoading
                    ? "Checking GitHub..."
                    : "Refresh Actual Access"}
                </Button>
              )}
              <Badge variant="secondary">
                {filteredAssignments.length} assignments
              </Badge>
              {assignmentUserFilter !== "all" && (
                <Badge variant="secondary">
                  {actualAccessCount} actual repos
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {actualAccessError && assignmentUserFilter !== "all" && (
            <p className="mb-3 text-sm text-amber-500">{actualAccessError}</p>
          )}
          {assignLoading ? (
            <TableSkeleton rows={4} columns={5} />
          ) : filteredAssignments.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title="No assignments"
              description="No assignment matches the current filter."
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Repository</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Granted</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        @{a.github_handle}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {a.repo_full_name}
                      </TableCell>
                      <TableCell>
                        <Badge className={ROLE_COLORS[a.role] || "bg-muted"}>
                          {a.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(a.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          onClick={() => setRevokeTarget(a)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Discovered Repositories
              </CardTitle>
              <CardDescription>
                Repos the platform token has access to in the org
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={showAccessibleOnly ? "default" : "outline"}
                className="h-8"
                onClick={() => setShowAccessibleOnly((prev) => !prev)}
              >
                {showAccessibleOnly
                  ? "Showing Accessible Repos"
                  : "Show Accessible Repos Only"}
              </Button>
              <Input
                placeholder="Filter repos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-48 text-sm"
              />
              <Badge variant="secondary">
                {filteredRepos.length} of {repos.length}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reposLoading ? (
            <TableSkeleton rows={6} columns={5} />
          ) : repos.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title="No repos discovered"
              description='Click "Discover Repos" to scan the GitHub org.'
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Repository</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRepos.map((repo) => (
                    <TableRow key={repo.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{repo.name}</p>
                          {repo.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {repo.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {repo.language ? (
                          <Badge variant="outline" className="text-xs">
                            {repo.language}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            ---
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {repo.private ? (
                          <Badge
                            variant="outline"
                            className="text-xs border-amber-600/30 text-amber-400"
                          >
                            <Lock className="size-3 mr-1" />
                            Private
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs border-emerald-600/30 text-emerald-400"
                          >
                            <Globe className="size-3 mr-1" />
                            Public
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {repo.archived ? (
                          <Badge
                            variant="outline"
                            className="text-xs text-zinc-400"
                          >
                            <Archive className="size-3 mr-1" />
                            Archived
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-600/15 text-emerald-400 border-emerald-600/20 text-xs">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDateTime(repo.updated_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke repo access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove @{revokeTarget?.github_handle} as a collaborator
              on {revokeTarget?.repo_full_name}. This calls the GitHub API
              directly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={revoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoking ? "Revoking..." : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
