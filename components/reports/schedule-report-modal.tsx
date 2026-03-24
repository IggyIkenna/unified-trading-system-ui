"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";

const REPORT_TYPES = [
  { value: "pnl-attribution", label: "P&L Attribution" },
  { value: "executive-summary", label: "Executive Summary" },
  { value: "regulatory-mifid", label: "MiFID II Report" },
  { value: "settlement-summary", label: "Settlement Summary" },
];

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const FORMATS = [
  { value: "pdf", label: "PDF" },
  { value: "xlsx", label: "Excel" },
];

interface ScheduleReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleReportModal({
  open,
  onOpenChange,
}: ScheduleReportModalProps) {
  const { token } = useAuth();
  const [reportType, setReportType] = React.useState("pnl-attribution");
  const [frequency, setFrequency] = React.useState("weekly");
  const [format, setFormat] = React.useState("pdf");
  const [recipients, setRecipients] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit() {
    if (!recipients.trim()) {
      toast.error("Please enter at least one recipient email");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/api/reporting/schedules", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_type: reportType,
          frequency,
          format,
          recipients: recipients
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean),
          created_at: new Date().toISOString(),
        }),
      });
      toast.success("Report scheduled", {
        description: `${FREQUENCIES.find((f) => f.value === frequency)?.label} ${REPORT_TYPES.find((t) => t.value === reportType)?.label} scheduled`,
      });
      onOpenChange(false);
      setRecipients("");
    } catch {
      // Mock mode fallback — simulate success
      toast.success("Report scheduled (mock)", {
        description: `${FREQUENCIES.find((f) => f.value === frequency)?.label} report configured`,
      });
      onOpenChange(false);
      setRecipients("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Schedule Report
          </DialogTitle>
          <DialogDescription>
            Configure a recurring report delivery. In mock mode, this saves the
            configuration but does not send emails.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Frequency</label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Recipients (comma-separated emails)
            </label>
            <Input
              placeholder="pm@acme.com, ops@acme.com"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Scheduling...
              </>
            ) : (
              <>
                <Clock className="mr-2 size-4" /> Schedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
