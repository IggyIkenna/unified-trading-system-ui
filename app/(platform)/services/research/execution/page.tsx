"use client";

import { PageHeader } from "@/components/platform/page-header";
import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, GitCompare, Grid3X3, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { EXECUTION_BACKTESTS } from "@/lib/mocks/fixtures/build-data";
import type { ExecutionBacktest } from "@/lib/mocks/fixtures/build-data";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NewExecutionBacktestDialog, CandidateDialog } from "@/components/research/execution/new-execution-dialog";
import { ExecutionListPanel } from "@/components/research/execution/execution-list-panel";
import { ExecutionComparePanel, ExecutionDetailView } from "@/components/research/execution/execution-detail-view";
import { CandidateBasket, useCandidateBasket } from "@/components/platform/candidate-basket";
import { GridSearchDialog } from "@/components/research/shared";
import { formatNumber } from "@/lib/utils/formatters";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExecutionResearchPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [newBtOpen, setNewBtOpen] = React.useState(false);
  const [gridSearchOpen, setGridSearchOpen] = React.useState(false);
  const [selectedBt, setSelectedBt] = React.useState<ExecutionBacktest | null>(
    EXECUTION_BACKTESTS.find((b) => b.status === "complete") ?? null,
  );
  const [compareSelected, setCompareSelected] = React.useState<string[]>([]);
  const [showCompare, setShowCompare] = React.useState(false);
  const [candidateDialogBt, setCandidateDialogBt] = React.useState<ExecutionBacktest | null>(null);
  const basket = useCandidateBasket();
  // Backward-compat shim: child components still expect Set<string>
  const candidates = React.useMemo(() => new Set(basket.candidates.map((c) => c.id)), [basket.candidates]);

  const complete = EXECUTION_BACKTESTS.filter((b) => b.status === "complete");
  const running = EXECUTION_BACKTESTS.filter((b) => b.status === "running");

  const toggleCompare = (id: string) => {
    setCompareSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev,
    );
  };

  const handlePromote = (confirmed: boolean) => {
    if (confirmed && candidateDialogBt) {
      basket.addCandidate({
        id: candidateDialogBt.id,
        type: "execution_algo",
        name: candidateDialogBt.name,
        version: candidateDialogBt.algo,
        metrics: {
          sharpe: candidateDialogBt.results?.sharpe_ratio ?? 0,
          slippage_bps: candidateDialogBt.results?.avg_slippage_bps ?? 0,
        },
      });
      toast({
        title: "Strategy candidate created",
        description: `${candidateDialogBt.name} is now available in the Promote tab.`,
      });
    }
    setCandidateDialogBt(null);
  };

  const bestSharpe = complete.reduce((max, b) => Math.max(max, b.results?.sharpe_ratio ?? 0), 0);

  const fromStrategies = searchParams.get("from") === "strategies";
  const handoffSingle = searchParams.get("strategyBacktestId");
  const handoffMulti = searchParams.get("strategyBacktestIds");
  const showStrategiesHandoffBanner = fromStrategies && Boolean(handoffSingle || handoffMulti);

  return (
    <div className="space-y-6 p-6">
      {showStrategiesHandoffBanner && (
        <Alert className="border-primary/35 bg-primary/5">
          <Info className="size-4" />
          <AlertTitle>Handoff from Strategies</AlertTitle>
          <AlertDescription className="space-y-2">
            {handoffMulti ? (
              <p>
                Compare mode: {handoffMulti.split(",").filter(Boolean).length} strategy backtest(s). Primary selection:{" "}
                <span className="font-mono text-foreground">{handoffSingle ?? "—"}</span>. Connect to execution API when
                available.
              </p>
            ) : (
              <p>
                Single strategy backtest: <span className="font-mono text-foreground">{handoffSingle ?? "—"}</span>.
                Signals will attach here when the pipeline is wired.
              </p>
            )}
            <Link
              href="/services/research/strategies"
              className="inline-block text-primary underline underline-offset-2 text-sm font-medium hover:text-primary/90"
            >
              ← Strategy Backtests
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Execution Backtests"
          description="Simulate order execution using strategy signals — compare TWAP,
            VWAP, and other algos. Analyse slippage, fill rates, and P&amp;L."
        />
        <div className="flex gap-2">
          {compareSelected.length >= 2 && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowCompare(!showCompare)}>
              <GitCompare className="size-4" />
              Compare ({compareSelected.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setGridSearchOpen(true)}>
            <Grid3X3 className="size-4 mr-1" />
            Grid Search
          </Button>
          <Button size="sm" onClick={() => setNewBtOpen(true)}>
            <Plus className="size-4 mr-2" />
            New Backtest
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Backtests",
            value: String(EXECUTION_BACKTESTS.length),
            color: "text-foreground",
          },
          {
            label: "Complete",
            value: String(complete.length),
            color: "text-emerald-400",
          },
          {
            label: "Running",
            value: String(running.length),
            color: running.length > 0 ? "text-blue-400" : "text-muted-foreground",
          },
          {
            label: "Best Sharpe",
            value: formatNumber(bestSharpe, 2),
            color: "text-primary",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={cn("text-2xl font-bold tabular-nums", s.color)}>{s.value}</p>
              <p className="text-sm font-medium mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compare panel */}
      {showCompare && compareSelected.length >= 2 && (
        <ExecutionComparePanel
          selected={compareSelected}
          onClose={() => {
            setCompareSelected([]);
            setShowCompare(false);
          }}
        />
      )}

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Left: Backtest list */}
        <ExecutionListPanel
          selectedBt={selectedBt}
          onSelect={setSelectedBt}
          compareSelected={compareSelected}
          onToggleCompare={toggleCompare}
          candidates={candidates}
        />

        {/* Right: Results */}
        <div>
          <ExecutionDetailView
            selectedBt={selectedBt}
            candidates={candidates}
            onPromote={(bt) => setCandidateDialogBt(bt)}
          />
        </div>
      </div>

      {/* Dialogs */}
      <NewExecutionBacktestDialog open={newBtOpen} onClose={() => setNewBtOpen(false)} />
      <GridSearchDialog open={gridSearchOpen} onClose={() => setGridSearchOpen(false)} domain="execution" />
      {candidateDialogBt && <CandidateDialog bt={candidateDialogBt} open={true} onClose={handlePromote} />}

      {/* Shared Candidate Basket — same component across Strategy/ML/Execution */}
      <CandidateBasket
        platform="execution"
        candidates={basket.candidates}
        onRemove={basket.removeCandidate}
        onClearAll={basket.clearAll}
        onUpdateNote={basket.updateNote}
        onSendToReview={() => {
          /* navigate to promote pipeline */
        }}
        onPreparePackage={() => {
          /* generate promotion package */
        }}
      />
    </div>
  );
}
