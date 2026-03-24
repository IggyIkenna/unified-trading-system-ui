"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useSubmitAccessRequest } from "@/hooks/api/use-user-management";

const ENTITLEMENTS = [
  { key: "data-basic", label: "Data (Basic) — 180 instruments, CeFi only" },
  {
    key: "data-pro",
    label: "Data (Pro) — 2400+ instruments, CeFi + TradFi + DeFi",
  },
  { key: "execution-basic", label: "Execution (Basic) — TWAP, VWAP algos" },
  {
    key: "execution-full",
    label: "Execution (Full) — All algos + SOR + dark pools",
  },
  { key: "ml-full", label: "ML & Backtesting — Model training & deployment" },
  {
    key: "strategy-full",
    label: "Strategy Platform — Backtesting & strategy deployment",
  },
  {
    key: "reporting",
    label: "Reporting & Analytics — P&L, settlement, compliance",
  },
];

export default function RequestAccessPage() {
  const router = useRouter();
  const submit = useSubmitAccessRequest();
  const [selected, setSelected] = React.useState<string[]>([]);
  const [reason, setReason] = React.useState("");

  const toggle = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit.mutate(
      { requested_entitlements: selected, reason },
      { onSuccess: () => router.push("/services/manage/users") },
    );
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Request Access</h1>
      <p className="text-muted-foreground">
        Select the services you need access to. Your request will be reviewed by
        an admin.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Select Services</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              {ENTITLEMENTS.map((ent) => (
                <div key={ent.key} className="flex items-start gap-3">
                  <Checkbox
                    id={ent.key}
                    checked={selected.includes(ent.key)}
                    onCheckedChange={() => toggle(ent.key)}
                  />
                  <Label htmlFor={ent.key} className="text-sm cursor-pointer">
                    {ent.label}
                  </Label>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why do you need this access?"
              />
            </div>

            <Button
              type="submit"
              disabled={submit.isPending || selected.length === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              {submit.isPending ? "Submitting..." : "Submit Request"}
            </Button>

            {submit.isSuccess && (
              <p className="text-sm text-green-600">
                Request submitted! An admin will review it shortly.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
