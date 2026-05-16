"use client";

/**
 * DART Manual Trade Form — extracted from manual-trading-panel.tsx.
 *
 * Fields per Phase C spec:
 *   archetype dropdown + venue dropdown (filtered by archetype capability) +
 *   side toggle + size_pct_nav + limit_price + algo dropdown + dry_run checkbox.
 *
 * Submit → calls POST /api/archetypes/{archetypeId}/preview, then routes to
 * /dart/terminal/manual/[instructionId]/ or stays on page for preview display.
 *
 * On successful preview the parent receives the preview payload and can
 * render <TradePreview /> inline or navigate to the full preview route.
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/dart_manual_trade_ux_refactor_2026_05_13.md
 *   Phase C.1 — components/dart/manual-trade-form.tsx.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ARCHETYPE_METADATA } from "@/lib/architecture-v2";
import type { PreviewResponse } from "@/lib/api/dart-client";
import { PreviewRiskBlockError, previewManualInstruction } from "@/lib/api/dart-client";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, Eye } from "lucide-react";
import * as React from "react";

// Supported venues per archetype (coarse list; server validates).
// SSOT: UAC CAPABILITY_DECLARATIONS registry.
const ARCHETYPE_SUPPORTED_VENUES: Readonly<Record<string, readonly string[]>> = {
  CARRY_STAKED_BASIS: ["BYBIT", "DERIBIT", "OKX", "BINANCE-FUTURES", "HYPERLIQUID", "ASTER"],
  CARRY_BASIS_PERP: ["BYBIT", "DERIBIT", "BINANCE-FUTURES", "OKX", "HYPERLIQUID", "ASTER"],
  CARRY_BASIS_DATED: ["BYBIT", "DERIBIT", "BINANCE-FUTURES", "OKX", "CME"],
  ML_DIRECTIONAL_CONTINUOUS: ["BYBIT", "DERIBIT", "BINANCE-FUTURES", "OKX", "HYPERLIQUID", "ASTER"],
  DEFAULT: ["BYBIT", "DERIBIT", "BINANCE-FUTURES", "OKX", "HYPERLIQUID", "ASTER"],
};

const ALGO_OPTIONS = ["MARKET", "LIMIT", "TWAP", "VWAP", "ICEBERG", "SOR", "BEST_PRICE"] as const;

export interface ManualTradeFormState {
  readonly archetype: string;
  readonly venue: string;
  readonly side: "buy" | "sell";
  readonly size_pct_nav: string;
  readonly limit_price: string;
  readonly algo: string;
  readonly dry_run: boolean;
}

const INITIAL_FORM: ManualTradeFormState = {
  archetype: "",
  venue: "",
  side: "buy",
  size_pct_nav: "5",
  limit_price: "",
  algo: "MARKET",
  dry_run: false,
};

export interface ManualTradeFormProps {
  /** Called after a successful preview. Parent can route or render TradePreview. */
  readonly onPreviewReady?: (preview: PreviewResponse, formState: ManualTradeFormState) => void;
  /** Called when user cancels. */
  readonly onCancel?: () => void;
  /** Allow pre-population from URL params. */
  readonly defaultArchetype?: string;
  readonly defaultVenue?: string;
}

export function ManualTradeForm({
  onPreviewReady,
  onCancel,
  defaultArchetype = "",
  defaultVenue = "",
}: ManualTradeFormProps) {
  const { token } = useAuth();
  const [form, setForm] = React.useState<ManualTradeFormState>({
    ...INITIAL_FORM,
    archetype: defaultArchetype,
    venue: defaultVenue,
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const archetypeOptions = React.useMemo(() => Object.keys(ARCHETYPE_METADATA), []);

  const venueOptions = React.useMemo(() => {
    if (!form.archetype) return ARCHETYPE_SUPPORTED_VENUES.DEFAULT ?? [];
    return ARCHETYPE_SUPPORTED_VENUES[form.archetype] ?? ARCHETYPE_SUPPORTED_VENUES.DEFAULT ?? [];
  }, [form.archetype]);

  // Auto-select first venue when archetype changes.
  React.useEffect(() => {
    if (form.archetype && !venueOptions.includes(form.venue)) {
      setForm((prev) => ({ ...prev, venue: venueOptions[0] ?? "" }));
    }
  }, [form.archetype, form.venue, venueOptions]);

  const sizePctNum = parseFloat(form.size_pct_nav) || 0;
  const limitPriceNum = parseFloat(form.limit_price) || 0;
  const canSubmit =
    form.archetype.length > 0 &&
    form.venue.length > 0 &&
    sizePctNum > 0 &&
    sizePctNum <= 100 &&
    (form.algo === "MARKET" || limitPriceNum > 0);

  const handlePreview = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const preview = await previewManualInstruction(
        form.archetype,
        {
          archetype: form.archetype,
          venue: form.venue,
          side: form.side,
          size_pct_nav: sizePctNum,
          limit_price: form.algo !== "MARKET" && limitPriceNum > 0 ? limitPriceNum : undefined,
          algo: form.algo,
          dry_run: form.dry_run,
        },
        token,
      );
      onPreviewReady?.(preview, form);
    } catch (err) {
      if (err instanceof PreviewRiskBlockError) {
        const labels = err.failed_checks.map((c) => `${c.rule}: ${c.reason ?? "blocked"}`).join("; ");
        setErrorMessage(`Risk check failed — ${labels}`);
      } else {
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  function setField<K extends keyof ManualTradeFormState>(key: K, value: ManualTradeFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void handlePreview();
      }}
      data-testid="manual-trade-form"
    >
      {/* Archetype */}
      <div className="space-y-1.5">
        <Label htmlFor="mtf-archetype">Archetype</Label>
        <Select
          value={form.archetype}
          onValueChange={(v) => setField("archetype", v)}
        >
          <SelectTrigger id="mtf-archetype" data-testid="manual-trade-form-archetype">
            <SelectValue placeholder="Select archetype…" />
          </SelectTrigger>
          <SelectContent>
            {archetypeOptions.map((a) => (
              <SelectItem key={a} value={a}>
                {ARCHETYPE_METADATA[a as keyof typeof ARCHETYPE_METADATA]?.label ?? a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Venue */}
      <div className="space-y-1.5">
        <Label htmlFor="mtf-venue">Venue</Label>
        <Select
          value={form.venue}
          onValueChange={(v) => setField("venue", v)}
          disabled={!form.archetype}
        >
          <SelectTrigger id="mtf-venue" data-testid="manual-trade-form-venue">
            <SelectValue placeholder="Select venue…" />
          </SelectTrigger>
          <SelectContent>
            {venueOptions.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Side */}
      <div className="space-y-1.5">
        <Label>Side</Label>
        <div className="flex gap-2" data-testid="manual-trade-form-side">
          {(["buy", "sell"] as const).map((s) => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={form.side === s ? "default" : "outline"}
              className="flex-1"
              onClick={() => setField("side", s)}
              data-testid={`manual-trade-form-side-${s}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Size % NAV */}
      <div className="space-y-1.5">
        <Label htmlFor="mtf-size">
          Size (% NAV)
          {sizePctNum > 15 && (
            <Badge variant="destructive" className="ml-2 text-[10px]">
              &gt;15% — risk check likely blocked
            </Badge>
          )}
        </Label>
        <Input
          id="mtf-size"
          type="number"
          min="0.01"
          max="100"
          step="0.01"
          placeholder="5"
          value={form.size_pct_nav}
          onChange={(e) => setField("size_pct_nav", e.target.value)}
          data-testid="manual-trade-form-size"
        />
      </div>

      {/* Algo */}
      <div className="space-y-1.5">
        <Label htmlFor="mtf-algo">Algorithm</Label>
        <Select value={form.algo} onValueChange={(v) => setField("algo", v)}>
          <SelectTrigger id="mtf-algo" data-testid="manual-trade-form-algo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALGO_OPTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Limit price — shown only for limit algos */}
      {form.algo !== "MARKET" && (
        <div className="space-y-1.5">
          <Label htmlFor="mtf-limit">Limit Price</Label>
          <Input
            id="mtf-limit"
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 42000.00"
            value={form.limit_price}
            onChange={(e) => setField("limit_price", e.target.value)}
            data-testid="manual-trade-form-limit-price"
          />
        </div>
      )}

      {/* Dry-run */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="mtf-dry-run"
          checked={form.dry_run}
          onCheckedChange={(checked) => setField("dry_run", checked === true)}
          data-testid="manual-trade-form-dry-run"
        />
        <Label htmlFor="mtf-dry-run" className="text-sm cursor-pointer">
          Dry run (validate only, no execution)
        </Label>
      </div>

      {/* Error */}
      {errorMessage ? (
        <div
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive"
          data-testid="manual-trade-form-error"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onCancel}
            data-testid="manual-trade-form-cancel"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          className="flex-1"
          disabled={!canSubmit || submitting}
          data-testid="manual-trade-form-preview-btn"
        >
          <Eye className="mr-1.5 size-3" aria-hidden />
          {submitting ? "Checking…" : "Preview trade"}
        </Button>
      </div>
    </form>
  );
}
