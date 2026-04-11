import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { isMockDataMode } from "@/lib/runtime/data-mode";

// ── Types ──────────────────────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "issued" | "accepted" | "paid" | "disputed" | "voided";
export type InvoiceType = "performance_fee" | "management_fee";

export interface Invoice {
  invoice_id: string;
  org_id: string;
  type: InvoiceType;
  period_month: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  description: string;
  issued_at: string;
  due_date: string;
  opening_aum: number;
  closing_aum: number;
  pnl: number;
  trader_hwm_before: number;
  odum_hwm_before: number;
  trader_fee: number;
  odum_fee: number;
  is_underwater: boolean;
  server_cost: number;
  payment_txid: string | null;
  notes: string;
}

export interface GenerateInvoiceParams {
  org_id: string;
  period_month: string;
  invoice_type: InvoiceType;
  currency: string;
}

export type TransitionAction = "issue" | "accept" | "pay" | "dispute" | "void" | "reissue";

export interface TransitionInvoiceParams {
  invoice_id: string;
  action: TransitionAction;
  note?: string;
  payment_txid?: string;
}

/** Valid next transitions per status */
export const VALID_TRANSITIONS: Record<InvoiceStatus, TransitionAction[]> = {
  draft: ["issue"],
  issued: ["accept", "dispute"],
  accepted: ["pay"],
  paid: [],
  disputed: ["reissue", "void"],
  voided: [],
};

// ── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_INVOICES: Invoice[] = [
  {
    invoice_id: "INV-2026-0401",
    org_id: "org-alpha",
    type: "performance_fee",
    period_month: "2026-03",
    status: "issued",
    currency: "USD",
    subtotal: 48750.0,
    tax: 4875.0,
    total: 53625.0,
    description: "Performance fee for March 2026 - Alpha Capital",
    issued_at: "2026-04-01T09:00:00Z",
    due_date: "2026-04-15",
    opening_aum: 12500000,
    closing_aum: 12987500,
    pnl: 487500,
    trader_hwm_before: 12400000,
    odum_hwm_before: 12300000,
    trader_fee: 24375.0,
    odum_fee: 24375.0,
    is_underwater: false,
    server_cost: 0,
    payment_txid: null,
    notes: "Standard 10% performance fee on profits above HWM",
  },
  {
    invoice_id: "INV-2026-0402",
    org_id: "org-alpha",
    type: "management_fee",
    period_month: "2026-03",
    status: "paid",
    currency: "USD",
    subtotal: 20833.33,
    tax: 2083.33,
    total: 22916.66,
    description: "Management fee for March 2026 - Alpha Capital",
    issued_at: "2026-04-01T09:00:00Z",
    due_date: "2026-04-15",
    opening_aum: 12500000,
    closing_aum: 12987500,
    pnl: 487500,
    trader_hwm_before: 12400000,
    odum_hwm_before: 12300000,
    trader_fee: 10416.67,
    odum_fee: 10416.67,
    is_underwater: false,
    server_cost: 0,
    payment_txid: "0xabc123def456",
    notes: "2% annual management fee (monthly: 1/12)",
  },
  {
    invoice_id: "INV-2026-0403",
    org_id: "org-beta",
    type: "performance_fee",
    period_month: "2026-03",
    status: "draft",
    currency: "USD",
    subtotal: 0,
    tax: 0,
    total: 0,
    description: "Performance fee for March 2026 - Beta Fund (underwater)",
    issued_at: "2026-04-02T10:30:00Z",
    due_date: "2026-04-16",
    opening_aum: 9800000,
    closing_aum: 9650000,
    pnl: -150000,
    trader_hwm_before: 10200000,
    odum_hwm_before: 10100000,
    trader_fee: 0,
    odum_fee: 0,
    is_underwater: true,
    server_cost: 1250.0,
    payment_txid: null,
    notes: "No performance fee - portfolio below HWM. Server cost applied.",
  },
];

const isMock = isMockDataMode();

// ── Hooks ──────────────────────────────────────────────────────────────────────

export function useInvoices(orgId: string | undefined) {
  const { user, token } = useAuth();
  const qs = orgId ? `?org_id=${encodeURIComponent(orgId)}` : "";

  return useQuery<Invoice[]>({
    queryKey: ["invoices", orgId, user?.id],
    queryFn: async () => {
      if (isMock) {
        const filtered = orgId ? MOCK_INVOICES.filter((inv) => inv.org_id === orgId) : MOCK_INVOICES;
        return filtered;
      }
      const result = await apiFetch(`/api/reporting/invoices${qs}`, token);
      const data = result as Record<string, unknown>;
      if (Array.isArray(data)) return data as Invoice[];
      if (Array.isArray(data.data)) return data.data as Invoice[];
      return [];
    },
    enabled: !!user,
  });
}

export function useInvoice(invoiceId: string | undefined) {
  const { user, token } = useAuth();

  return useQuery<Invoice | null>({
    queryKey: ["invoice", invoiceId, user?.id],
    queryFn: async () => {
      if (isMock) {
        return MOCK_INVOICES.find((inv) => inv.invoice_id === invoiceId) ?? null;
      }
      const result = await apiFetch(`/api/reporting/invoices/${invoiceId}`, token);
      return result as Invoice;
    },
    enabled: !!user && !!invoiceId,
  });
}

export function useGenerateInvoice() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<Invoice, Error, GenerateInvoiceParams>({
    mutationFn: async (params) => {
      if (isMock) {
        const newInvoice: Invoice = {
          invoice_id: `INV-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          org_id: params.org_id,
          type: params.invoice_type,
          period_month: params.period_month,
          status: "draft",
          currency: params.currency,
          subtotal: 15000,
          tax: 1500,
          total: 16500,
          description: `${params.invoice_type === "performance_fee" ? "Performance" : "Management"} fee for ${params.period_month}`,
          issued_at: new Date().toISOString(),
          due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0] ?? "",
          opening_aum: 10000000,
          closing_aum: 10300000,
          pnl: 300000,
          trader_hwm_before: 9900000,
          odum_hwm_before: 9800000,
          trader_fee: 7500,
          odum_fee: 7500,
          is_underwater: false,
          server_cost: 0,
          payment_txid: null,
          notes: "",
        };
        return newInvoice;
      }
      const result = await apiFetch("/api/reporting/invoices/generate", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      return result as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useTransitionInvoice() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<Invoice, Error, TransitionInvoiceParams>({
    mutationFn: async (params) => {
      if (isMock) {
        const existing = MOCK_INVOICES.find((inv) => inv.invoice_id === params.invoice_id);
        if (!existing) throw new Error("Invoice not found");
        const statusMap: Record<TransitionAction, InvoiceStatus> = {
          issue: "issued",
          accept: "accepted",
          pay: "paid",
          dispute: "disputed",
          void: "voided",
          reissue: "issued",
        };
        return { ...existing, status: statusMap[params.action] };
      }
      const result = await apiFetch(`/api/reporting/invoices/${params.invoice_id}/transition`, token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: params.action,
          note: params.note,
          payment_txid: params.payment_txid,
        }),
      });
      return result as Invoice;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", variables.invoice_id] });
    },
  });
}
