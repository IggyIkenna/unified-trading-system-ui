"use client";

import * as React from "react";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  LayoutTemplate,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Separator } from "@/components/ui/separator";
import {
  listAccessTemplates,
  createAccessTemplate,
  updateAccessTemplate,
  deleteAccessTemplate,
} from "@/lib/admin/api/access-templates";
import type { AccessTemplate } from "@/lib/admin/api/types";

const SLACK_RE = /^[CGD][A-Z0-9]{8,}$/;
const GITHUB_RE = /^[a-z0-9][a-z0-9_-]*$/;
const AWS_RE = /^[A-Za-z0-9:_./-]+$/;

interface FormFields {
  name: string;
  description: string;
  aws_permission_sets: string;
  slack_channels: string;
  github_teams: string;
}

const EMPTY_FORM: FormFields = {
  name: "",
  description: "",
  aws_permission_sets: "",
  slack_channels: "",
  github_teams: "",
};

function splitCsv(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function validateFields(fields: FormFields): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!fields.name.trim()) errors.name = "Name is required";

  const slackIds = splitCsv(fields.slack_channels);
  for (const id of slackIds) {
    if (!SLACK_RE.test(id)) {
      errors.slack_channels = `Invalid Slack ID: ${id} (expected ^[CGD][A-Z0-9]{8,}$)`;
      break;
    }
  }

  const githubSlugs = splitCsv(fields.github_teams);
  for (const slug of githubSlugs) {
    if (!GITHUB_RE.test(slug)) {
      errors.github_teams = `Invalid GitHub slug: ${slug} (expected ^[a-z0-9][a-z0-9_-]*$)`;
      break;
    }
  }

  const awsSets = splitCsv(fields.aws_permission_sets);
  for (const s of awsSets) {
    if (!AWS_RE.test(s)) {
      errors.aws_permission_sets = `Invalid AWS set: ${s} (expected ^[A-Za-z0-9:_./-]+$)`;
      break;
    }
  }

  return errors;
}

function fieldsFromTemplate(t: AccessTemplate): FormFields {
  return {
    name: t.name,
    description: t.description,
    aws_permission_sets: t.aws_permission_sets.join(", "),
    slack_channels: t.slack_channels.join(", "),
    github_teams: t.github_teams.join(", "),
  };
}

export default function TemplatesPage() {
  const [templates, setTemplates] = React.useState<AccessTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [createForm, setCreateForm] = React.useState<FormFields>(EMPTY_FORM);
  const [createErrors, setCreateErrors] = React.useState<
    Record<string, string>
  >({});
  const [creating, setCreating] = React.useState(false);

  const [editId, setEditId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState<FormFields>(EMPTY_FORM);
  const [editErrors, setEditErrors] = React.useState<Record<string, string>>(
    {},
  );
  const [saving, setSaving] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState<AccessTemplate | null>(
    null,
  );
  const [deleting, setDeleting] = React.useState(false);

  const [cancelEditOpen, setCancelEditOpen] = React.useState(false);

  const fetchTemplates = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await listAccessTemplates();
      setTemplates(res.data.templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateFields(createForm);
    setCreateErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setCreating(true);
    try {
      await createAccessTemplate({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        aws_permission_sets: splitCsv(createForm.aws_permission_sets),
        slack_channels: splitCsv(createForm.slack_channels),
        github_teams: splitCsv(createForm.github_teams),
      });
      setCreateForm(EMPTY_FORM);
      setCreateErrors({});
      await fetchTemplates();
    } catch (err) {
      setCreateErrors({
        _form: err instanceof Error ? err.message : "Failed to create template",
      });
    } finally {
      setCreating(false);
    }
  }

  function startEdit(t: AccessTemplate) {
    setEditId(t.id);
    setEditForm(fieldsFromTemplate(t));
    setEditErrors({});
  }

  function requestCancelEdit() {
    setCancelEditOpen(true);
  }

  function confirmCancelEdit() {
    setEditId(null);
    setEditForm(EMPTY_FORM);
    setEditErrors({});
    setCancelEditOpen(false);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    const errs = validateFields(editForm);
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await updateAccessTemplate(editId, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        aws_permission_sets: splitCsv(editForm.aws_permission_sets),
        slack_channels: splitCsv(editForm.slack_channels),
        github_teams: splitCsv(editForm.github_teams),
      });
      setEditId(null);
      setEditForm(EMPTY_FORM);
      setEditErrors({});
      await fetchTemplates();
    } catch (err) {
      setEditErrors({
        _form: err instanceof Error ? err.message : "Failed to save template",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAccessTemplate(deleteTarget.id);
      setDeleteTarget(null);
      await fetchTemplates();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete template",
      );
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function renderFieldError(errors: Record<string, string>, field: string) {
    if (!errors[field]) return null;
    return <p className="text-sm text-destructive mt-1">{errors[field]}</p>;
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Access Templates</h1>
          <p className="text-sm text-muted-foreground">
            Manage permission templates for user onboarding
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create Template</CardTitle>
          <CardDescription>
            Define a reusable set of AWS, Slack, and GitHub permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ct-name">Name</Label>
                <Input
                  id="ct-name"
                  placeholder="e.g. engineering-standard"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
                {renderFieldError(createErrors, "name")}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ct-desc">Description</Label>
                <Input
                  id="ct-desc"
                  placeholder="Template description"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="ct-aws">AWS Permission Sets</Label>
                <Input
                  id="ct-aws"
                  placeholder="ViewOnlyAccess, PowerUserAccess"
                  value={createForm.aws_permission_sets}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      aws_permission_sets: e.target.value,
                    }))
                  }
                />
                {renderFieldError(createErrors, "aws_permission_sets")}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ct-slack">Slack Channels</Label>
                <Input
                  id="ct-slack"
                  placeholder="C01ABC2DEF, C02GHI3JKL"
                  value={createForm.slack_channels}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      slack_channels: e.target.value,
                    }))
                  }
                />
                {renderFieldError(createErrors, "slack_channels")}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ct-gh">GitHub Teams</Label>
                <Input
                  id="ct-gh"
                  placeholder="backend, platform-eng"
                  value={createForm.github_teams}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      github_teams: e.target.value,
                    }))
                  }
                />
                {renderFieldError(createErrors, "github_teams")}
              </div>
            </div>
            {createErrors._form && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {createErrors._form}
              </p>
            )}
            <Button type="submit" disabled={creating} size="sm">
              {creating ? (
                <Spinner className="mr-2 size-4" />
              ) : (
                <Plus className="mr-2 size-4" />
              )}
              Create Template
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-6" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No templates yet"
          description="Create your first access template above."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id}>
              {editId === t.id ? (
                <form onSubmit={handleSaveEdit}>
                  <CardHeader>
                    <CardTitle className="text-base">Edit Template</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Name</Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, name: e.target.value }))
                        }
                      />
                      {renderFieldError(editErrors, "name")}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Input
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            description: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>AWS Permission Sets</Label>
                      <Input
                        value={editForm.aws_permission_sets}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            aws_permission_sets: e.target.value,
                          }))
                        }
                      />
                      {renderFieldError(editErrors, "aws_permission_sets")}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Slack Channels</Label>
                      <Input
                        value={editForm.slack_channels}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            slack_channels: e.target.value,
                          }))
                        }
                      />
                      {renderFieldError(editErrors, "slack_channels")}
                    </div>
                    <div className="space-y-1.5">
                      <Label>GitHub Teams</Label>
                      <Input
                        value={editForm.github_teams}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            github_teams: e.target.value,
                          }))
                        }
                      />
                      {renderFieldError(editErrors, "github_teams")}
                    </div>
                    {editErrors._form && (
                      <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                        {editErrors._form}
                      </p>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" size="sm" disabled={saving}>
                        {saving ? "Saving…" : "Save"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={requestCancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </form>
              ) : (
                <>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{t.name}</CardTitle>
                        <CardDescription>{t.description}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEdit(t)}>
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteTarget(t)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {t.aws_permission_sets.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-1">
                          AWS Permission Sets
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {t.aws_permission_sets.map((s) => (
                            <Badge key={s} variant="outline">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {t.slack_channels.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-1">
                          Slack Channels
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {t.slack_channels.map((c) => (
                            <Badge key={c} variant="secondary">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {t.github_teams.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-1">
                          GitHub Teams
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {t.github_teams.map((g) => (
                            <Badge key={g} variant="secondary">
                              {g}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {typeof t.assigned_user_count === "number" && (
                      <p className="text-muted-foreground">
                        {t.assigned_user_count} user
                        {t.assigned_user_count !== 1 ? "s" : ""} assigned
                      </p>
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={cancelEditOpen} onOpenChange={setCancelEditOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved edits. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelEdit}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{deleteTarget?.name}&rdquo;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
