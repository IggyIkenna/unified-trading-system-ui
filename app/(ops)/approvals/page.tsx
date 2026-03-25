"use client";

import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";
import {
  fetchOnboardingRequests,
  approveRequest,
  rejectRequest,
  fetchRegisteredApps,
  fetchUserDocuments,
  type OnboardingRequest,
  type AppGrant,
} from "@/lib/api/approvals-client";

interface RegisteredApp {
  app_id: string;
  name: string;
  category: string;
}

interface UserDoc {
  id: string;
  doc_type: string;
  file_name: string;
  storage_path: string;
  review_status: string;
}

export default function ApprovalsPage() {
  const { token, isAdmin } = useAuth();
  const [requests, setRequests] = React.useState<OnboardingRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("pending");
  const [selectedRequest, setSelectedRequest] =
    React.useState<OnboardingRequest | null>(null);
  const [actionType, setActionType] = React.useState<
    "approve" | "reject" | null
  >(null);
  const [note, setNote] = React.useState("");
  const [processing, setProcessing] = React.useState(false);
  const [apps, setApps] = React.useState<RegisteredApp[]>([]);
  const [selectedApps, setSelectedApps] = React.useState<
    Record<string, { selected: boolean; role: string }>
  >({});
  const [docs, setDocs] = React.useState<UserDoc[]>([]);

  const loadRequests = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchOnboardingRequests(token, filter);
      setRequests(data.requests || []);
    } catch {
      setRequests([]);
    }
    setLoading(false);
  }, [token, filter]);

  React.useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  React.useEffect(() => {
    if (!token) return;
    fetchRegisteredApps(token)
      .then((d) => setApps(d.applications || []))
      .catch(() => setApps([]));
  }, [token]);

  const openDialog = async (
    req: OnboardingRequest,
    type: "approve" | "reject",
  ) => {
    setSelectedRequest(req);
    setActionType(type);
    setNote("");
    setSelectedApps({});
    setDocs([]);
    if (type === "approve" && token) {
      try {
        const docData = await fetchUserDocuments(token, req.firebase_uid);
        setDocs(docData.documents || []);
      } catch {
        setDocs([]);
      }
    }
  };

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

  const handleAction = async () => {
    if (!selectedRequest || !actionType || !token) return;
    setProcessing(true);
    try {
      if (actionType === "approve") {
        const appGrants: AppGrant[] = Object.entries(selectedApps)
          .filter(([, v]) => v.selected)
          .map(([appId, v]) => ({
            app_id: appId,
            role: v.role,
            environments: ["dev", "staging", "prod"],
          }));
        await approveRequest(token, selectedRequest.id, {
          note,
          role: "client",
          app_grants: appGrants,
        });
      } else {
        await rejectRequest(token, selectedRequest.id, { note });
      }
      setSelectedRequest(null);
      setActionType(null);
      await loadRequests();
    } catch {
      /* display nothing for now */
    }
    setProcessing(false);
  };

  if (!isAdmin()) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            You do not have permission to view this page.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Approvals</h1>
          <p className="text-sm text-muted-foreground">
            Review and manage onboarding requests
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No {filter} requests found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {req.applicant_name}
                    </CardTitle>
                    <CardDescription>{req.applicant_email}</CardDescription>
                  </div>
                  <Badge
                    variant={
                      req.status === "pending"
                        ? "outline"
                        : req.status === "approved"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {req.status === "pending" && (
                      <Clock className="mr-1 h-3 w-3" />
                    )}
                    {req.status === "approved" && (
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                    )}
                    {req.status === "rejected" && (
                      <XCircle className="mr-1 h-3 w-3" />
                    )}
                    {req.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground space-x-4">
                    <span>Company: {req.company || "N/A"}</span>
                    <span>Service: {req.service_type || "general"}</span>
                    <span>
                      Applied:{" "}
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {req.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => openDialog(req, "approve")}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDialog(req, "reject")}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!selectedRequest && !!actionType}
        onOpenChange={() => {
          setSelectedRequest(null);
          setActionType(null);
        }}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Request
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.applicant_name} (
              {selectedRequest?.applicant_email})
            </DialogDescription>
          </DialogHeader>

          {actionType === "approve" && (
            <>
              {docs.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Uploaded Documents
                  </Label>
                  <div className="space-y-1">
                    {docs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-2 text-sm p-2 rounded border"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">{doc.file_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {doc.doc_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Grant Application Access
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                  {apps.map((app) => (
                    <div
                      key={app.app_id}
                      className="flex items-center gap-3 py-1"
                    >
                      <Checkbox
                        id={`app-${app.app_id}`}
                        checked={selectedApps[app.app_id]?.selected || false}
                        onCheckedChange={() => toggleApp(app.app_id)}
                      />
                      <label
                        htmlFor={`app-${app.app_id}`}
                        className="flex-1 text-sm cursor-pointer"
                      >
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
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="review-note">Note (optional)</Label>
            <Textarea
              id="review-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                actionType === "approve"
                  ? "Welcome message or notes..."
                  : "Reason for rejection..."
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "reject" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={processing}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
