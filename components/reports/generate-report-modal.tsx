"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/shared/spinner";
import { useGenerateReport } from "@/hooks/api/use-manage";
import { Download, FileText } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

const REPORT_TYPES = [
  { value: "pnl-attribution", label: "P&L Attribution" },
  { value: "executive-summary", label: "Executive Summary" },
  { value: "regulatory-mifid", label: "MiFID II Transaction Report" },
  { value: "regulatory-fca", label: "FCA Best Execution" },
  { value: "regulatory-emir", label: "EMIR Derivative Report" },
  { value: "settlement-summary", label: "Settlement Summary" },
];

const CLIENTS = [
  { value: "all", label: "All Clients" },
  { value: "acme-capital", label: "Acme Capital" },
  { value: "vertex-partners", label: "Vertex Partners" },
  { value: "apex-trading", label: "Apex Trading Group" },
  { value: "meridian-fund", label: "Meridian Fund" },
];

interface GenerateReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: string;
}

export function GenerateReportModal({ open, onOpenChange, defaultType }: GenerateReportModalProps) {
  const [reportType, setReportType] = React.useState(defaultType ?? "pnl-attribution");
  const [clientId, setClientId] = React.useState("all");
  const [dateFrom, setDateFrom] = React.useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [format, setFormat] = React.useState<"pdf" | "csv" | "xlsx">("pdf");
  const [generating, setGenerating] = React.useState(false);
  const [downloadReady, setDownloadReady] = React.useState(false);

  const generateReport = useGenerateReport();

  async function handleGenerate() {
    setGenerating(true);
    setDownloadReady(false);

    try {
      await generateReport.mutateAsync({
        type: reportType,
        client_id: clientId === "all" ? undefined : clientId,
        date_range: { start: dateFrom, end: dateTo },
        format,
      });
      setDownloadReady(true);
      toast.success("Report generated", {
        description: `${REPORT_TYPES.find((t) => t.value === reportType)?.label ?? reportType} is ready for download`,
      });
    } catch {
      // In mock mode, simulate success after a delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setDownloadReady(true);
      toast.success("Report generated (mock)", {
        description: "Sample report ready for download",
      });
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload() {
    // In mock mode, generate a simple text file as a sample report
    const content = [
      `${REPORT_TYPES.find((t) => t.value === reportType)?.label ?? "Report"}`,
      `Generated: ${new Date().toISOString()}`,
      `Client: ${CLIENTS.find((c) => c.value === clientId)?.label ?? "All"}`,
      `Period: ${dateFrom} to ${dateTo}`,
      "",
      "This is a sample report generated in mock mode.",
      "In production, this would be a full PDF/Excel document.",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${reportType}-${dateTo}.${format === "pdf" ? "txt" : format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.info("Report downloaded");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setDownloadReady(false);
          setGenerating(false);
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Generate Report
          </DialogTitle>
          <DialogDescription>Configure and generate a downloadable report</DialogDescription>
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
            <label className="text-sm font-medium">Client</label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLIENTS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <Select value={format} onValueChange={(v) => setFormat(v as "pdf" | "csv" | "xlsx")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          {downloadReady ? (
            <Button onClick={handleDownload} className="w-full">
              <Download className="mr-2 size-4" />
              Download Report
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={generating} className="w-full">
              {generating ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 size-4" />
                  Generate
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
