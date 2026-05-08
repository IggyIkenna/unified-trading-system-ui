"use client";

/**
 * Admin view of onboarding documents uploaded by this organisation.
 *
 * Plan: unified-trading-pm/plans/active/reg_umbrella_questionnaire_and_onboarding_docs_2026_04_21.plan
 *
 * Lists docs from /api/onboarding/docs/list?org_id=..., renders one row
 * per doc with View / Download / Delete-with-confirm actions. Delete
 * fires POST /api/onboarding/docs/delete with the literal "DELETE"
 * confirm string and the exact coordinates.
 */

import { useCallback, useEffect, useState } from "react";

import { AlertTriangle, Download, Eye, FileText, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface DocEntry {
  readonly org_id: string;
  readonly application_id: string;
  readonly doc_type: string;
  readonly filename: string;
  readonly size: number;
  readonly uploaded_at: string;
  readonly local_path?: string;
  readonly gcs_path: string;
}

interface Props {
  readonly orgId: string;
  readonly orgName: string;
}

type LoadState =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly docs: readonly DocEntry[] }
  | { readonly kind: "error"; readonly message: string };

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.valueOf())) return iso;
  return parsed.toLocaleString("en-GB");
}

function downloadUrl(doc: DocEntry): string {
  const params = new URLSearchParams({
    org_id: doc.org_id,
    application_id: doc.application_id,
    doc_type: doc.doc_type,
  });
  return `/api/onboarding/download?${params.toString()}`;
}

export function OrgDocumentsSection({ orgId, orgName }: Props) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [toDelete, setToDelete] = useState<DocEntry | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch(
        `/api/onboarding/docs/list?org_id=${encodeURIComponent(orgId)}`,
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setState({
          kind: "error",
          message: body.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      const data = (await res.json()) as { docs?: readonly DocEntry[] };
      setState({ kind: "ready", docs: data.docs ?? [] });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async () => {
    if (toDelete === null) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/onboarding/docs/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: toDelete.org_id,
          application_id: toDelete.application_id,
          doc_type: toDelete.doc_type,
          confirm: "DELETE",
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setToDelete(null);
      setConfirmText("");
      await load();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(false);
    }
  };

  const confirmMatches = confirmText === "DELETE";

  return (
    <Card data-testid="org-documents-section">
      <CardHeader>
        <CardTitle className="text-base">Documents</CardTitle>
        <CardDescription>
          Onboarding documents uploaded by <span className="font-medium">{orgName}</span>
          . Cloud-backed in staging/prod; local disk in dev/mock.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.kind === "loading" && (
          <p className="text-sm text-muted-foreground" data-testid="org-documents-loading">
            Loading documents…
          </p>
        )}
        {state.kind === "error" && (
          <p className="text-sm text-muted-foreground" data-testid="org-documents-error">
            Couldn&apos;t list documents: {state.message}
          </p>
        )}
        {state.kind === "ready" && state.docs.length === 0 && (
          <p className="text-sm text-muted-foreground" data-testid="org-documents-empty">
            No documents on file. The prospect hasn&apos;t uploaded anything yet.
          </p>
        )}
        {state.kind === "ready" && state.docs.length > 0 && (
          <div className="space-y-2" data-testid="org-documents-list">
            {state.docs.map((doc) => (
              <div
                key={`${doc.application_id}/${doc.doc_type}`}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <FileText className="size-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {doc.doc_type}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({doc.filename})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {doc.application_id} · {formatSize(doc.size)} · uploaded{" "}
                      {formatDate(doc.uploaded_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button asChild variant="ghost" size="sm">
                    <a href={downloadUrl(doc)} target="_blank" rel="noopener noreferrer">
                      <Eye className="size-3.5" />
                      View
                    </a>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <a href={downloadUrl(doc)} download>
                      <Download className="size-3.5" />
                      Download
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setToDelete(doc);
                      setConfirmText("");
                      setDeleteError(null);
                    }}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setToDelete(null);
            setConfirmText("");
            setDeleteError(null);
          }
        }}
      >
        <DialogContent data-testid="org-documents-delete-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              Delete document
            </DialogTitle>
            <DialogDescription>
              You are about to permanently delete{" "}
              <span className="font-mono">
                {toDelete?.doc_type} / {toDelete?.filename}
              </span>{" "}
              for {orgName}. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm">
            Type <span className="font-mono font-medium">DELETE</span> to confirm:
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            data-testid="org-documents-delete-confirm-input"
          />
          {deleteError && (
            <p className="text-xs text-destructive" data-testid="org-documents-delete-error">
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setToDelete(null);
                setConfirmText("");
                setDeleteError(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!confirmMatches || deleting}
              onClick={handleDelete}
              data-testid="org-documents-delete-confirm"
            >
              {deleting ? "Deleting…" : "Delete document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
