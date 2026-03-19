import { useState } from "react";
import {
  Card,
  CardContent,
  Button,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@unified-trading/ui-kit";
import { FileText } from "lucide-react";

const CLIENTS = [
  "Apex Capital",
  "Meridian Fund",
  "QuantEdge HK",
  "All Clients",
];
const TYPES = ["monthly", "quarterly", "annual", "custom"];
const PERIODS = ["2026-02", "2026-01", "2025-12", "2025-Q4", "2025-Q3"];

export function GenerateTab() {
  const [client, setClient] = useState("");
  const [type, setType] = useState("");
  const [period, setPeriod] = useState("");
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    if (!client || !type || !period) return;
    setGenerated(true);
    setTimeout(() => setGenerated(false), 3000);
  };

  return (
    <div className="p-6 max-w-lg">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-6">
        Generate Report
      </h2>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select value={client} onValueChange={setClient}>
              <SelectTrigger>
                <SelectValue placeholder="Select client..." />
              </SelectTrigger>
              <SelectContent>
                {CLIENTS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Report Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Period</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select period..." />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="pt-2 flex justify-between items-center">
            <Button
              onClick={handleGenerate}
              disabled={!client || !type || !period}
            >
              <FileText size={14} />
              Generate Report
            </Button>
            {generated && (
              <span className="text-xs text-[var(--color-success)] font-mono">
                Report queued successfully!
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
