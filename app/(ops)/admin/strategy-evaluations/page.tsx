"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { firebaseDb } from "@/lib/admin/firebase";

const PATH_LABELS: Record<string, string> = {
  A: "Path A — DART Full",
  B: "Path B — Signals-In",
  C: "Path C — Reg Umbrella",
};

const ENTITY_LABELS: Record<string, string> = {
  prop: "Proprietary",
  sma: "SMA",
  fund: "Pooled fund",
  other: "Open / TBD",
};

interface EvalDoc {
  readonly id: string;
  readonly strategyName?: string;
  readonly leadResearcher?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly entityStructure?: string;
  readonly planToRaiseExternalCapital?: string;
  readonly performanceFee?: string;
  readonly managementFee?: string;
  readonly commercialPath?: string;
  readonly commercialPathSecondary?: readonly string[];
  readonly commercialPathTertiary?: readonly string[];
  readonly assetGroups?: readonly string[];
  readonly instrumentTypes?: readonly string[];
  readonly strategyFamily?: string;
  readonly archetypeMarkers?: readonly string[];
  readonly sharpeRatio?: string;
  readonly calmarRatio?: string;
  readonly maxDrawdown?: string;
  readonly totalReturn?: string;
  readonly winRate?: string;
  readonly feeSensitivity?: string;
  readonly treasuryManagement?: string;
  readonly depositWithdrawal?: string;
  readonly riskManagement?: string;
  readonly executionRiskControls?: string;
  readonly strategyOverview?: string;
  readonly alphaTesis?: string;
  readonly paperTradedAtLeast7Days?: boolean;
  readonly liveTradedAtLeastOneWeek?: boolean;
  readonly pathBSignalMapping?: string;
  readonly pathBExecutionWorkflow?: string;
  readonly pathCApiKeyOwnership?: string;
  readonly deploymentContinuity?: string;
  readonly reportingReadiness?: string;
  readonly submittedAt?: { toDate: () => Date } | null;
}

function fmt(d: EvalDoc["submittedAt"]): string {
  if (!d) return "—";
  try {
    return d.toDate().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function DetailRow({ label, value }: { label: string; value: string | undefined | null }) {
  if (!value) return null;
  return (
    <div className="py-1.5 grid grid-cols-[160px_1fr] gap-4 text-xs border-b border-border/40 last:border-0">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="text-foreground whitespace-pre-wrap">{value}</span>
    </div>
  );
}

function DetailBool({ label, value }: { label: string; value: boolean | undefined }) {
  if (value === undefined) return null;
  return (
    <div className="py-1.5 grid grid-cols-[160px_1fr] gap-4 text-xs border-b border-border/40 last:border-0">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span>{value ? "Yes" : "No"}</span>
    </div>
  );
}

function buildCodexEntry(row: EvalDoc): string {
  const path = PATH_LABELS[row.commercialPath ?? ""] ?? row.commercialPath ?? "—";
  const entity = ENTITY_LABELS[row.entityStructure ?? ""] ?? row.entityStructure ?? "—";
  const submitted = row.submittedAt ? fmt(row.submittedAt) : "—";

  const section = (heading: string, content: string | undefined | null) =>
    content?.trim() ? `\n## ${heading}\n\n${content.trim()}\n` : "";

  const list = (heading: string, items: readonly string[] | undefined) =>
    items?.length ? `\n## ${heading}\n\n${items.map((i) => `- ${i}`).join("\n")}\n` : "";

  const bool = (label: string, value: boolean | undefined) =>
    value !== undefined ? `- **${label}:** ${value ? "Yes" : "No"}\n` : "";

  return `---
title: "${row.strategyName ?? "Unnamed Strategy"}"
source: strategy-evaluation-ddq
submission_id: "${row.id}"
submitted: "${submitted}"
commercial_path: "${row.commercialPath ?? ""}"
entity_structure: "${entity}"
status: under_review
---

# ${row.strategyName ?? "Unnamed Strategy"}

**Lead researcher:** ${row.leadResearcher ?? "—"}
**Email:** ${row.email ?? "—"}
**Commercial path:** ${path}
**Capital structure:** ${entity}
**Submitted:** ${submitted}
${section("Strategy Overview", row.strategyOverview)}
${section("Alpha Thesis", row.alphaTesis)}
${list("Asset Groups", row.assetGroups)}
${list("Instrument Types", row.instrumentTypes)}
${row.strategyFamily ? `\n## Strategy Family\n\n${row.strategyFamily}\n` : ""}
${list("Archetype Markers", row.archetypeMarkers)}

## Performance Metrics

${row.sharpeRatio ? `- **Sharpe ratio:** ${row.sharpeRatio}\n` : ""}${row.calmarRatio ? `- **Calmar ratio:** ${row.calmarRatio}\n` : ""}${row.maxDrawdown ? `- **Max drawdown:** ${row.maxDrawdown}\n` : ""}${row.totalReturn ? `- **Total return / CAGR:** ${row.totalReturn}\n` : ""}${row.winRate ? `- **Win rate:** ${row.winRate}\n` : ""}
${section("Risk Management — Strategy Level", row.riskManagement)}
${section("Risk Management — Execution Level", row.executionRiskControls)}
${section("Fee Sensitivity", row.feeSensitivity)}
${section("Treasury Management", row.treasuryManagement)}
${section("Deposit / Withdrawal Requirements", row.depositWithdrawal)}

## Validation

${bool("Paper traded 7+ days", row.paperTradedAtLeast7Days)}${bool("Live traded 1+ week", row.liveTradedAtLeastOneWeek)}
${section("Deployment and Operational Continuity", row.deploymentContinuity)}
${section("Reporting and Analytics Readiness", row.reportingReadiness)}
${row.commercialPath === "B" ? section("Signal Format and Delivery", row.pathBSignalMapping) : ""}
${row.commercialPath === "B" ? section("Execution and Analytics Workflow", row.pathBExecutionWorkflow) : ""}
${row.commercialPath === "C" ? `\n## Regulatory Umbrella — API Key Ownership\n\n${row.pathCApiKeyOwnership ?? "—"}\n` : ""}
---
*Generated from Odum Strategy Evaluation DDQ — ${submitted}*
`.replace(/\n{3,}/g, "\n\n");
}

function DetailPanel({ row, onClose }: { row: EvalDoc; onClose: () => void }) {
  const pathLabel = PATH_LABELS[row.commercialPath ?? ""] ?? row.commercialPath ?? "—";
  const secondary = (row.commercialPathSecondary ?? [])
    .map((v) => PATH_LABELS[v] ?? v)
    .join(", ");
  const tertiary = (row.commercialPathTertiary ?? [])
    .map((v) => PATH_LABELS[v] ?? v)
    .join(", ");

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close"
      />
      <aside className="relative ml-auto h-full w-full max-w-2xl overflow-y-auto bg-background shadow-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{row.strategyName || "Unnamed"}</h2>
            <p className="text-sm text-muted-foreground">{pathLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg leading-none ml-4"
          >
            ✕
          </button>
        </div>

        <section className="space-y-0 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Submission details
          </h3>
          <DetailRow label="Strategy name" value={row.strategyName} />
          <DetailRow label="Lead researcher" value={row.leadResearcher} />
          <DetailRow label="Email" value={row.email} />
          <DetailRow label="Phone / Telegram" value={row.phone} />
          <DetailRow label="Capital structure" value={ENTITY_LABELS[row.entityStructure ?? ""] ?? row.entityStructure} />
          <DetailRow label="Plans to raise" value={row.planToRaiseExternalCapital} />
          <DetailRow label="Performance fee" value={row.performanceFee} />
          <DetailRow label="Management fee" value={row.managementFee} />
          <DetailRow label="Primary path" value={pathLabel} />
          <DetailRow label="Secondary" value={secondary || undefined} />
          <DetailRow label="Tertiary" value={tertiary || undefined} />
          <DetailRow label="Submitted" value={fmt(row.submittedAt)} />
          <DetailRow label="Submission ID" value={row.id} />
        </section>

        <section className="space-y-0 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Taxonomy
          </h3>
          <DetailRow label="Asset groups" value={(row.assetGroups ?? []).join(", ") || undefined} />
          <DetailRow label="Instrument types" value={(row.instrumentTypes ?? []).join(", ") || undefined} />
          <DetailRow label="Strategy family" value={row.strategyFamily} />
          <DetailRow label="Archetypes" value={(row.archetypeMarkers ?? []).join(", ") || undefined} />
        </section>

        <section className="space-y-0 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Performance metrics
          </h3>
          <DetailRow label="Sharpe" value={row.sharpeRatio} />
          <DetailRow label="Calmar" value={row.calmarRatio} />
          <DetailRow label="Max drawdown" value={row.maxDrawdown} />
          <DetailRow label="Total return / CAGR" value={row.totalReturn} />
          <DetailRow label="Win rate" value={row.winRate} />
        </section>

        <section className="space-y-0 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Strategy documentation
          </h3>
          <DetailRow label="Overview" value={row.strategyOverview} />
          <DetailRow label="Alpha thesis" value={row.alphaTesis} />
        </section>

        <section className="space-y-0 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Risk management
          </h3>
          <DetailRow label="Strategy-level controls" value={row.riskManagement} />
          <DetailRow label="Execution-level controls" value={row.executionRiskControls} />
          <DetailRow label="Fee sensitivity" value={row.feeSensitivity} />
        </section>

        <section className="space-y-0 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Treasury and operational flows
          </h3>
          <DetailRow label="Treasury management" value={row.treasuryManagement} />
          <DetailRow label="Deposit / withdrawal" value={row.depositWithdrawal} />
        </section>

        <section className="space-y-0 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Validation
          </h3>
          <DetailBool label="Paper traded 7+ days" value={row.paperTradedAtLeast7Days} />
          <DetailBool label="Live traded 1+ week" value={row.liveTradedAtLeastOneWeek} />
          <DetailRow label="Deployment continuity" value={row.deploymentContinuity} />
          <DetailRow label="Reporting readiness" value={row.reportingReadiness} />
        </section>

        {row.commercialPath === "B" && (
          <section className="space-y-0 mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Path B — DART Signals-In
            </h3>
            <DetailRow label="Signal format / delivery" value={row.pathBSignalMapping} />
            <DetailRow label="Execution & analytics" value={row.pathBExecutionWorkflow} />
          </section>
        )}

        {row.commercialPath === "C" && (
          <section className="space-y-0 mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Path C — Regulatory Umbrella
            </h3>
            <DetailRow label="API key ownership" value={row.pathCApiKeyOwnership} />
          </section>
        )}

        <div className="pt-4 border-t border-border flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([JSON.stringify(row, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `eval-${row.id.slice(0, 8)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            Download full JSON
          </button>
          <button
            type="button"
            onClick={() => {
              const md = buildCodexEntry(row);
              const blob = new Blob([md], { type: "text/markdown" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              const slug = (row.strategyName ?? "strategy")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
              a.download = `codex-${slug}.md`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="text-xs text-blue-600 underline hover:text-blue-800"
          >
            Export codex entry (Markdown)
          </button>
        </div>
      </aside>
    </div>
  );
}

export default function StrategyEvaluationsAdminPage() {
  const [rows, setRows] = useState<EvalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EvalDoc | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        if (firebaseDb === null) {
          setError("Firebase not configured (mock mode)");
          return;
        }
        const q = query(
          collection(firebaseDb, "strategy_evaluations"),
          orderBy("submittedAt", "desc"),
        );
        const snap = await getDocs(q);
        setRows(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<EvalDoc, "id">),
          })),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Strategy evaluations</h1>
      <p className="mt-1 text-slate-500 text-sm">
        Submissions from <code>/strategy-evaluation</code>. Click a row to see the full DDQ.
        On prod, data lands in the Firestore <code>strategy_evaluations</code> collection and
        an internal notification is sent to <code>info@odum-research.com</code>.
      </p>

      {loading && <p className="mt-8 text-muted-foreground">Loading submissions…</p>}
      {error !== null && <p className="mt-8 text-red-700">Error: {error}</p>}
      {!loading && error === null && rows.length === 0 && (
        <p className="mt-8 text-muted-foreground">
          No submissions yet. When researchers submit <code>/strategy-evaluation</code>, their
          evaluation packs appear here.
        </p>
      )}

      {rows.length > 0 && (
        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Strategy</th>
              <th className="py-2 pr-4 font-medium">Researcher</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Structure</th>
              <th className="py-2 pr-4 font-medium">Path</th>
              <th className="py-2 pr-4 font-medium">Strategy family</th>
              <th className="py-2 pr-4 font-medium">Sharpe</th>
              <th className="py-2 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b align-top hover:bg-muted/40 cursor-pointer"
                onClick={() => setSelected(row)}
              >
                <td className="py-2 pr-4 font-medium max-w-[180px] truncate">
                  {row.strategyName || <span className="text-muted-foreground italic">Unnamed</span>}
                </td>
                <td className="py-2 pr-4 text-xs text-muted-foreground">{row.leadResearcher || "—"}</td>
                <td className="py-2 pr-4 text-xs text-muted-foreground">{row.email || "—"}</td>
                <td className="py-2 pr-4 text-xs">
                  {ENTITY_LABELS[row.entityStructure ?? ""] ?? row.entityStructure ?? "—"}
                </td>
                <td className="py-2 pr-4">
                  {row.commercialPath ? (
                    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold bg-muted">
                      {row.commercialPath}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-2 pr-4 text-xs text-muted-foreground">{row.strategyFamily || "—"}</td>
                <td className="py-2 pr-4 text-xs tabular-nums">{row.sharpeRatio || "—"}</td>
                <td className="py-2 text-xs text-muted-foreground tabular-nums">{fmt(row.submittedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected !== null && <DetailPanel row={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}
