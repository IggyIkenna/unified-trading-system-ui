import { useState } from "react";
import { apiClient } from "../api/apiClient";
import {
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@unified-trading/ui-kit";

export function GenerateReportPage() {
  const [periodMonth, setPeriodMonth] = useState("");
  const [reportType, setReportType] = useState("executive_summary");
  const [status, setStatus] = useState<string | null>(null);

  const submit = async () => {
    setStatus("Generating...");
    try {
      await apiClient.post("/api/reports/generate", {
        period_month: periodMonth,
        report_type: reportType,
      });
      setStatus("Report generated successfully.");
    } catch {
      setStatus("Error generating report.");
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <h1>Generate Report</h1>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxWidth: "400px",
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="periodMonth">Period Month (YYYY-MM):</Label>
          <Input
            id="periodMonth"
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
            placeholder="2025-01"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reportType">Report Type:</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger id="reportType">
              <SelectValue placeholder="Select report type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="executive_summary">
                Executive Summary
              </SelectItem>
              <SelectItem value="btc_investor_note">
                BTC Investor Note
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="default" onClick={() => void submit()}>
          Generate
        </Button>
        {status && <p>{status}</p>}
      </div>
    </div>
  );
}
