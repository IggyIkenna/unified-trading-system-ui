"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  listOnboardingRequests,
  getOnboardingRequest,
  approveRequest,
  rejectRequest,
  listUserDocuments,
  reviewDocument,
  getDocumentDownloadUrl,
  type OnboardingRequest,
  type UserDocument,
  type AppGrant,
} from "@/lib/admin/api/onboarding-requests";
import { listApplications } from "@/lib/admin/api/applications";
import type { Application } from "@/lib/admin/api/types";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  Building2,
  Phone,
  Mail,
  User,
  Briefcase,
  DollarSign,
  Calendar,
  Download,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    icon: typeof Clock;
  }
> = {
  pending: { label: "Pending", variant: "outline", icon: Clock },
  approved: { label: "Approved", variant: "default", icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
};

function RequestDetailPanel({ request }: { request: OnboardingRequest }) {
  const [documents, setDocuments] = React.useState<UserDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = React.useState(true);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);
  const [reviewingId, setReviewingId] = React.useState<string | null>(null);

  const loadDocuments = React.useCallback(async () => {
    setLoadingDocs(true);
    try {
      const detailRes = await getOnboardingRequest(request.id);
      setDocuments(detailRes.data.documents || []);
    } catch {
      try {
        const docsRes = await listUserDocuments(request.firebase_uid);
        setDocuments(docsRes.data.documents || []);
      } catch {
        setDocuments([]);
      }
    } finally {
      setLoadingDocs(false);
    }
  }, [request.id, request.firebase_uid]);

  React.useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function handleDownload(doc: UserDocument) {
    setDownloadingId(doc.id);
    const newTab = window.open("about:blank", "_blank");
    try {
      const res = await getDocumentDownloadUrl(request.firebase_uid, doc.id);
      if (newTab) {
        newTab.location.href = res.data.url;
      } else {
        window.location.assign(res.data.url);
      }
    } catch {
      if (newTab) newTab.close();
      alert("Failed to get download link. The file may not exist in storage.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleReview(doc: UserDocument, status: "approved" | "rejected") {
    setReviewingId(doc.id);
    try {
      await reviewDocument(request.firebase_uid, doc.id, status);
      await loadDocuments();
    } catch {
      alert(`Failed to ${status} document.`);
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <div className="mt-3 border-t pt-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Applicant Details</h4>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="size-3.5 shrink-0" />
              <span className="font-medium text-foreground">{request.applicant_name}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="size-3.5 shrink-0" />
              <span>{request.applicant_email}</span>
            </div>
            {request.company && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="size-3.5 shrink-0" />
                <span>{request.company}</span>
              </div>
            )}
            {request.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-3.5 shrink-0" />
                <span>{request.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Service Request</h4>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="size-3.5 shrink-0" />
              <span>
                Type: <span className="font-medium text-foreground">{request.service_type || "General"}</span>
              </span>
            </div>
            {"expected_aum" in request && request.expected_aum ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="size-3.5 shrink-0" />
                <span>
                  Expected AUM: <span className="font-medium text-foreground">{String(request.expected_aum)}</span>
                </span>
              </div>
            ) : null}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-3.5 shrink-0" />
              <span>Submitted: {new Date(request.created_at).toLocaleString()}</span>
            </div>
            {request.selected_options.length > 0 && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" />
                <div className="flex flex-wrap gap-1">
                  {request.selected_options.map((o) => (
                    <Badge key={o} variant="secondary" className="text-xs">
                      {o}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="size-3.5" />
          Uploaded Documents
        </h4>
        {loadingDocs ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="size-3.5 animate-spin" />
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-1">No documents uploaded.</p>
        ) : (
          <div className="space-y-1.5">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{doc.file_name}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {doc.doc_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <Badge
                    variant={
                      doc.review_status === "approved"
                        ? "default"
                        : doc.review_status === "rejected"
                          ? "destructive"
                          : "outline"
                    }
                    className="text-[10px]"
                  >
                    {doc.review_status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2"
                    disabled={downloadingId === doc.id}
                    onClick={() => handleDownload(doc)}
                  >
                    {downloadingId === doc.id ? (
                      <Loader2 className="size-3 animate-spin mr-1" />
                    ) : (
                      <Download className="size-3 mr-1" />
                    )}
                    View
                  </Button>
                  {doc.review_status !== "approved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                      disabled={reviewingId === doc.id}
                      onClick={() => handleReview(doc, "approved")}
                    >
                      {reviewingId === doc.id ? (
                        <Loader2 className="size-3 animate-spin mr-1" />
                      ) : (
                        <Check className="size-3 mr-1" />
                      )}
                      Approve
                    </Button>
                  )}
                  {doc.review_status !== "rejected" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive/80"
                      disabled={reviewingId === doc.id}
                      onClick={() => handleReview(doc, "rejected")}
                    >
                      {reviewingId === doc.id ? (
                        <Loader2 className="size-3 animate-spin mr-1" />
                      ) : (
                        <X className="size-3 mr-1" />
                      )}
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {request.review_note && (
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">Review Note</h4>
          <p className="text-sm text-muted-foreground">{request.review_note}</p>
        </div>
      )}
    </div>
  );
}

export default function OnboardingRequestsPage() {
  const [requests, setRequests] = React.useState<OnboardingRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [actionDialog, setActionDialog] = React.useState<{
    type: "approve" | "reject";
    request: OnboardingRequest;
  } | null>(null);
  const [actionNote, setActionNote] = React.useState("");
  const [actionRole, setActionRole] = React.useState("client");
  const [actionInProgress, setActionInProgress] = React.useState(false);
  const [apps, setApps] = React.useState<Application[]>([]);
  const [selectedApps, setSelectedApps] = React.useState<Record<string, { selected: boolean; role: string }>>({});
  const [actionError, setActionError] = React.useState<string | null>(null);

  const fetchRequests = React.useCallback(async () => {
    setLoading(true);
    try {
      const filter = statusFilter === "all" ? undefined : statusFilter;
      const res = await listOnboardingRequests(filter);
      setRequests(res.data?.requests ?? []);
    } catch {
      /* network error */
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  React.useEffect(() => {
    listApplications()
      .then((res) => setApps(res.data.applications || []))
      .catch(() => setApps([]));
  }, []);

  const toggleApp = (appId: string) => {
    setSelectedApps((prev) => ({
      ...prev,
      [appId]: {
        selected: !prev[appId]?.selected,
        role: prev[appId]?.role || "viewer",
      },
    }));
  };

  const setAppRole = (appId: string, role: string) => {
    setSelectedApps((prev) => ({
      ...prev,
      [appId]: { ...prev[appId], selected: true, role },
    }));
  };

  const allAppsSelected = apps.length > 0 && apps.every((a) => selectedApps[a.app_id]?.selected);

  const toggleSelectAll = () => {
    if (allAppsSelected) {
      setSelectedApps({});
    } else {
      const all: Record<string, { selected: boolean; role: string }> = {};
      for (const app of apps) {
        all[app.app_id] = {
          selected: true,
          role: selectedApps[app.app_id]?.role || actionRole || "viewer",
        };
      }
      setSelectedApps(all);
    }
  };

  const setAllAppsRole = (role: string) => {
    setSelectedApps((prev) => {
      const updated = { ...prev };
      for (const app of apps) {
        if (updated[app.app_id]?.selected) {
          updated[app.app_id] = { ...updated[app.app_id], role };
        }
      }
      return updated;
    });
  };

  async function handleAction() {
    if (!actionDialog) return;
    setActionInProgress(true);
    setActionError(null);
    try {
      if (actionDialog.type === "approve") {
        const appGrants: AppGrant[] = Object.entries(selectedApps)
          .filter(([, v]) => v.selected)
          .map(([appId, v]) => ({
            app_id: appId,
            role: v.role,
            environments: ["dev", "staging", "prod"],
          }));
        await approveRequest(actionDialog.request.id, actionNote, actionRole, appGrants);
      } else {
        await rejectRequest(actionDialog.request.id, actionNote, false);
      }
      setActionDialog(null);
      setActionNote("");
      setActionError(null);
      setSelectedApps({});
      fetchRequests();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed. Please try again.");
    } finally {
      setActionInProgress(false);
    }
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Signup Requests</h1>
          <p className="text-sm text-muted-foreground">
            Review and approve pending user signups.
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingCount} pending
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">No requests found.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const config = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            const StatusIcon = config.icon;
            const isExpanded = expandedId === req.id;
            return (
              <Card key={req.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : req.id)}>
                      <CardTitle className="text-base flex items-center gap-2">
                        {req.applicant_name}
                        <Badge variant={config.variant} className="text-xs">
                          <StatusIcon className="size-3 mr-1" />
                          {config.label}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {req.applicant_email}
                        {req.company && ` · ${req.company}`}
                        {` · ${req.service_type}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setActionDialog({
                                type: "approve",
                                request: req,
                              });
                              setActionNote("");
                              setActionRole("client");
                              setActionError(null);
                            }}
                          >
                            <CheckCircle2 className="size-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setActionDialog({ type: "reject", request: req });
                              setActionNote("");
                              setActionError(null);
                            }}
                          >
                            <XCircle className="size-3.5 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/users/${req.firebase_uid}`}>
                          <Eye className="size-3.5 mr-1" />
                          View User
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Submitted: {new Date(req.created_at).toLocaleDateString()}</span>
                    {req.selected_options.length > 0 && (
                      <span>
                        Options:{" "}
                        {req.selected_options.map((o) => (
                          <Badge key={o} variant="outline" className="text-[10px] mx-0.5">
                            {o}
                          </Badge>
                        ))}
                      </span>
                    )}
                  </div>
                  {isExpanded && <RequestDetailPanel request={req} />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={!!actionDialog}
        onOpenChange={() => {
          setActionDialog(null);
          setActionError(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{actionDialog?.type === "approve" ? "Approve" : "Reject"} Request</DialogTitle>
            <DialogDescription>
              {actionDialog?.type === "approve"
                ? `Approve ${actionDialog?.request.applicant_name}'s signup. This will enable their Firebase account and grant access.`
                : `Reject ${actionDialog?.request.applicant_name}'s signup.`}
            </DialogDescription>
          </DialogHeader>

          <WidgetScroll className="max-h-[85vh]">
            {actionDialog && (
              <div className="rounded border bg-muted/30 p-3 space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <User className="size-3.5 text-muted-foreground" />
                  <span className="font-medium">{actionDialog.request.applicant_name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-3.5" />
                  <span>{actionDialog.request.applicant_email}</span>
                </div>
                {actionDialog.request.company && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="size-3.5" />
                    <span>{actionDialog.request.company}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="size-3.5" />
                  <span>{actionDialog.request.service_type || "General"}</span>
                </div>
                {actionDialog.request.selected_options.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {actionDialog.request.selected_options.map((o) => (
                      <Badge key={o} variant="secondary" className="text-xs">
                        {o}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {actionDialog?.type === "approve" && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Role</Label>
                  <Select value={actionRole} onValueChange={setActionRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="collaborator">Collaborator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Grant Application Access</Label>
                    <div className="flex items-center gap-2">
                      {Object.values(selectedApps).some((v) => v.selected) && (
                        <Select onValueChange={setAllAppsRole}>
                          <SelectTrigger className="w-28 h-7 text-xs">
                            <SelectValue placeholder="Set all roles" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">All Viewer</SelectItem>
                            <SelectItem value="editor">All Editor</SelectItem>
                            <SelectItem value="admin">All Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={toggleSelectAll}
                      >
                        {allAppsSelected ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                  </div>
                  <WidgetScroll className="max-h-48 border rounded" viewportClassName="space-y-2 p-2">
                    {apps.map((app) => (
                      <div key={app.app_id} className="flex items-center gap-3 py-1">
                        <Checkbox
                          id={`umu-app-${app.app_id}`}
                          checked={selectedApps[app.app_id]?.selected || false}
                          onCheckedChange={() => toggleApp(app.app_id)}
                        />
                        <label htmlFor={`umu-app-${app.app_id}`} className="flex-1 text-sm cursor-pointer">
                          {app.name}
                        </label>
                        {selectedApps[app.app_id]?.selected && (
                          <Select
                            value={selectedApps[app.app_id]?.role || "viewer"}
                            onValueChange={(v) => setAppRole(app.app_id, v)}
                          >
                            <SelectTrigger className="w-24 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </WidgetScroll>
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Note (optional)</label>
              <Textarea
                value={actionNote}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setActionNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
              />
            </div>
            {actionError && (
              <div className="rounded border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {actionError}
              </div>
            )}
          </WidgetScroll>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog(null);
                setActionError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionDialog?.type === "approve" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={actionInProgress}
            >
              {actionInProgress ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {actionDialog?.type === "approve" ? "Approve & Enable" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
