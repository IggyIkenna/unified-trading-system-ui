"use client";

import * as React from "react";
import {
  Plus,
  Trash2,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Users,
  FolderOpen,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  listGroups,
  createGroup,
  deleteGroup,
  addGroupMember,
  removeGroupMember,
  bulkAssignGroupToApps,
} from "@/lib/admin/api/groups";
import { listFirebaseUsers } from "@/lib/admin/api/firebase-auth";
import { listApplications } from "@/lib/admin/api/applications";
import type { UserGroup, FirebaseAuthUser, Application } from "@/lib/admin/api/types";

export default function GroupsPage() {
  const [groups, setGroups] = React.useState<UserGroup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const [addMemberGroupId, setAddMemberGroupId] = React.useState<string | null>(
    null,
  );
  const [firebaseUsers, setFirebaseUsers] = React.useState<FirebaseAuthUser[]>(
    [],
  );
  const [fbLoading, setFbLoading] = React.useState(false);
  const [selectedUid, setSelectedUid] = React.useState("");
  const [addingMember, setAddingMember] = React.useState(false);

  const [removeMember, setRemoveMember] = React.useState<{
    groupId: string;
    uid: string;
    name: string;
  } | null>(null);
  const [removingMember, setRemovingMember] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState<UserGroup | null>(
    null,
  );
  const [deletingGroup, setDeletingGroup] = React.useState(false);

  const [bulkGroupId, setBulkGroupId] = React.useState<string | null>(null);
  const [apps, setApps] = React.useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = React.useState(false);
  const [selectedApps, setSelectedApps] = React.useState<string[]>([]);
  const [bulkRole, setBulkRole] = React.useState("viewer");
  const [bulkEnvs, setBulkEnvs] = React.useState<string[]>([]);
  const [bulkAssigning, setBulkAssigning] = React.useState(false);

  const fetchGroups = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await listGroups();
      setGroups(res.data.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createGroup({ name: newName.trim(), description: newDesc.trim() });
      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
      await fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setCreating(false);
    }
  }

  async function openAddMember(groupId: string) {
    setAddMemberGroupId(groupId);
    setSelectedUid("");
    if (firebaseUsers.length === 0) {
      setFbLoading(true);
      try {
        const res = await listFirebaseUsers();
        setFirebaseUsers(res.data.users);
      } catch {
        setError("Failed to load Firebase users");
      } finally {
        setFbLoading(false);
      }
    }
  }

  async function handleAddMember() {
    if (!addMemberGroupId || !selectedUid) return;
    const fbUser = firebaseUsers.find((u) => u.uid === selectedUid);
    if (!fbUser) return;
    setAddingMember(true);
    try {
      await addGroupMember(addMemberGroupId, {
        firebase_uid: fbUser.uid,
        name: fbUser.display_name,
        email: fbUser.email,
      });
      setAddMemberGroupId(null);
      await fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember() {
    if (!removeMember) return;
    setRemovingMember(true);
    try {
      await removeGroupMember(removeMember.groupId, removeMember.uid);
      setRemoveMember(null);
      await fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setRemovingMember(false);
    }
  }

  async function handleDeleteGroup() {
    if (!deleteTarget) return;
    setDeletingGroup(true);
    try {
      await deleteGroup(deleteTarget.id);
      setDeleteTarget(null);
      await fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete group");
    } finally {
      setDeletingGroup(false);
    }
  }

  async function openBulkAssign(groupId: string) {
    setBulkGroupId(groupId);
    setSelectedApps([]);
    setBulkRole("viewer");
    setBulkEnvs([]);
    if (apps.length === 0) {
      setAppsLoading(true);
      try {
        const res = await listApplications();
        setApps(res.data.applications);
      } catch {
        setError("Failed to load applications");
      } finally {
        setAppsLoading(false);
      }
    }
  }

  async function handleBulkAssign() {
    if (!bulkGroupId || selectedApps.length === 0) return;
    setBulkAssigning(true);
    try {
      await bulkAssignGroupToApps(bulkGroupId, {
        app_ids: selectedApps,
        role: bulkRole,
        environments: bulkEnvs,
      });
      setBulkGroupId(null);
      await fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to bulk assign");
    } finally {
      setBulkAssigning(false);
    }
  }

  function toggleApp(appId: string) {
    setSelectedApps((prev) =>
      prev.includes(appId) ? prev.filter((a) => a !== appId) : [...prev, appId],
    );
  }

  function toggleEnv(env: string) {
    setBulkEnvs((prev) =>
      prev.includes(env) ? prev.filter((e) => e !== env) : [...prev, env],
    );
  }

  const ENV_OPTIONS = ["development", "staging", "production"];

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Groups</h1>
          <p className="text-sm text-muted-foreground">
            Manage groups and their members
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 size-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateGroup}>
              <DialogHeader>
                <DialogTitle>Create Group</DialogTitle>
                <DialogDescription>
                  Create a new user group for bulk access management.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="grp-name">Name</Label>
                  <Input
                    id="grp-name"
                    placeholder="e.g. backend-engineers"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="grp-desc">Description</Label>
                  <Input
                    id="grp-desc"
                    placeholder="Group description"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-6" />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups yet"
          description="Create a group to start managing access in bulk."
        />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const isExpanded = expandedId === g.id;
            return (
              <Card key={g.id}>
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : g.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground" />
                      )}
                      <div>
                        <CardTitle className="text-base">{g.name}</CardTitle>
                        <CardDescription>{g.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {g.members.length} member
                        {g.members.length !== 1 ? "s" : ""}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openBulkAssign(g.id);
                        }}
                      >
                        <FolderOpen className="mr-1 size-3.5" />
                        Assign to Apps
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(g);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium">Members</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAddMember(g.id)}
                      >
                        <UserPlus className="mr-1 size-3.5" />
                        Add Member
                      </Button>
                    </div>
                    {g.members.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No members in this group.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Added</TableHead>
                            <TableHead className="w-16" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {g.members.map((m) => (
                            <TableRow key={m.firebase_uid}>
                              <TableCell className="font-medium">
                                {m.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {m.email}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(m.added_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-destructive hover:text-destructive"
                                  onClick={() =>
                                    setRemoveMember({
                                      groupId: g.id,
                                      uid: m.firebase_uid,
                                      name: m.name,
                                    })
                                  }
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog
        open={addMemberGroupId !== null}
        onOpenChange={(open) => !open && setAddMemberGroupId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Select a Firebase user to add to this group.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {fbLoading ? (
              <div className="flex justify-center py-4">
                <Spinner className="size-5" />
              </div>
            ) : (
              <Select value={selectedUid} onValueChange={setSelectedUid}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {firebaseUsers.map((u) => (
                    <SelectItem key={u.uid} value={u.uid}>
                      {u.display_name || u.email} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddMember}
              disabled={addingMember || !selectedUid}
            >
              {addingMember ? "Adding…" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog
        open={bulkGroupId !== null}
        onOpenChange={(open) => !open && setBulkGroupId(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Group to Applications</DialogTitle>
            <DialogDescription>
              Grant this group access to multiple applications at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={bulkRole} onValueChange={setBulkRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Environments</Label>
              <div className="flex gap-4">
                {ENV_OPTIONS.map((env) => (
                  <label
                    key={env}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    <Checkbox
                      checked={bulkEnvs.includes(env)}
                      onCheckedChange={() => toggleEnv(env)}
                    />
                    {env}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Applications</Label>
              {appsLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner className="size-5" />
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border p-2">
                  {apps.map((app) => (
                    <label
                      key={app.id}
                      className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedApps.includes(app.id)}
                        onCheckedChange={() => toggleApp(app.id)}
                      />
                      {app.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleBulkAssign}
              disabled={
                bulkAssigning ||
                selectedApps.length === 0 ||
                bulkEnvs.length === 0
              }
            >
              {bulkAssigning
                ? "Assigning…"
                : `Assign to ${selectedApps.length} app(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirm */}
      <AlertDialog
        open={removeMember !== null}
        onOpenChange={(open) => !open && setRemoveMember(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove &ldquo;{removeMember?.name}&rdquo; from this group? They
              will lose access granted through group membership.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removingMember}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={removingMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removingMember ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Group Confirm */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{deleteTarget?.name}&rdquo;
              and remove all member associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingGroup}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={deletingGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingGroup ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
