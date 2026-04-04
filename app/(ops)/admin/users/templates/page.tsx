"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/shared/spinner";
import { ApiError } from "@/components/shared/api-error";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, Pencil, Trash2, Shield, Layers } from "lucide-react";
import { useAccessTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from "@/hooks/api/use-user-management";
import type { AccessTemplate } from "@/lib/types/user-management";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// New/Edit template form
// ---------------------------------------------------------------------------

function TemplateForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<AccessTemplate>;
  onSubmit: (data: Omit<AccessTemplate, "id" | "created_at" | "updated_at">) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [role, setRole] = React.useState(initial?.role ?? "client");
  const [entitlements, setEntitlements] = React.useState((initial?.entitlements ?? []).join(", "));

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="tpl-name">Template Name</Label>
        <Input
          id="tpl-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. External Investor (Full)"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tpl-desc">Description</Label>
        <Input
          id="tpl-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description of the template"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tpl-role">Default Role</Label>
        <Input
          id="tpl-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. client, collaborator, admin"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tpl-entitlements">Entitlements (comma-separated)</Label>
        <Input
          id="tpl-entitlements"
          value={entitlements}
          onChange={(e) => setEntitlements(e.target.value)}
          placeholder="data-basic, reporting, execution-basic"
        />
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={() =>
            onSubmit({
              name,
              description,
              role,
              entitlements: entitlements.split(",").map((e) => e.trim()).filter(Boolean),
              services: [],
            })
          }
          disabled={submitting || !name.trim()}
        >
          {submitting ? <Spinner size="sm" className="mr-1" /> : null}
          Save Template
        </Button>
      </DialogFooter>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AccessTemplatesPage() {
  const { data, isLoading, isError, error, refetch } = useAccessTemplates();
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<AccessTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AccessTemplate | null>(null);

  const templates: AccessTemplate[] = data?.templates ?? [];

  function handleCreate(fields: Omit<AccessTemplate, "id" | "created_at" | "updated_at">) {
    createMutation.mutate(fields, {
      onSuccess: () => {
        toast.success("Template created");
        setCreateOpen(false);
        refetch();
      },
      onError: (err) => toast.error(`Failed: ${err.message}`),
    });
  }

  function handleUpdate(fields: Omit<AccessTemplate, "id" | "created_at" | "updated_at">) {
    if (!editTarget) return;
    updateMutation.mutate(
      { id: editTarget.id, ...fields },
      {
        onSuccess: () => {
          toast.success("Template updated");
          setEditTarget(null);
          refetch();
        },
        onError: (err) => toast.error(`Failed: ${err.message}`),
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Template deleted");
        setDeleteTarget(null);
        refetch();
      },
      onError: (err) => toast.error(`Failed: ${err.message}`),
    });
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Access Templates"
        description="Pre-defined permission bundles applied during user onboarding."
        icon={<Layers className="size-5" />}
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-3.5 mr-1.5" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Access Template</DialogTitle>
                <DialogDescription>Define a reusable permission bundle for onboarding.</DialogDescription>
              </DialogHeader>
              <TemplateForm
                onSubmit={handleCreate}
                onCancel={() => setCreateOpen(false)}
                submitting={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <Spinner />
        </div>
      )}

      {isError && (
        <ApiError error={error} retry={refetch} />
      )}

      {!isLoading && !isError && templates.length === 0 && (
        <EmptyState
          icon={<Shield className="size-8 text-muted-foreground" />}
          title="No access templates"
          description="Create a template to speed up user onboarding."
        />
      )}

      {!isLoading && !isError && templates.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Entitlements</TableHead>
                <TableHead>Services</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((tpl) => (
                <TableRow key={tpl.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{tpl.name}</span>
                      {tpl.description && (
                        <span className="text-xs text-muted-foreground">{tpl.description}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-mono">
                      {tpl.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(tpl.entitlements ?? []).map((e) => (
                        <Badge key={e} variant="secondary" className="text-[10px]">
                          {e}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {(tpl.services ?? []).length} service{(tpl.services ?? []).length !== 1 ? "s" : ""}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => setEditTarget(tpl)}
                        title="Edit template"
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(tpl)}
                        title="Delete template"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Update the access template configuration.</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <TemplateForm
              initial={editTarget}
              onSubmit={handleUpdate}
              onCancel={() => setEditTarget(null)}
              submitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone. Users already onboarded with this
              template are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Spinner size="sm" className="mr-1" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
