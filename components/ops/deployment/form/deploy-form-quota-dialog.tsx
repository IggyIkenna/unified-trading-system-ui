"use client";

import { Spinner } from "@/components/shared/spinner";

import { useDeployFormContext } from "@/components/ops/deployment/form/deploy-form-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DeployFormQuotaDialog() {
  const { quotaOpen, setQuotaOpen, quotaLoading, quotaError, quotaInfo, setMaxConcurrent } = useDeployFormContext();

  return (
    <Dialog
      open={quotaOpen}
      onOpenChange={(open) => {
        if (!open) setQuotaOpen(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quota requirements</DialogTitle>
        </DialogHeader>
        <div>
          {quotaLoading && (
            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
              <Spinner className="h-4 w-4" />
              Loading quota info...
            </div>
          )}

          {!quotaLoading && quotaError && <div className="text-sm text-[var(--color-accent-red)]">{quotaError}</div>}

          {!quotaLoading &&
            !quotaError &&
            quotaInfo &&
            (() => {
              const rq = quotaInfo.required_quota as unknown as Record<string, Record<string, unknown>> | undefined;
              const worst = (rq?.worst_case || {}) as Record<string, Record<string, number>>;
              const perShard = (worst?.per_shard || {}) as Record<string, number>;
              const totals = (worst?.totals_at_max_concurrent || {}) as Record<string, number>;

              const cpuMetric = Object.keys(perShard).find((k) => k.endsWith("_CPUS")) || Object.keys(perShard)[0];
              const metrics = [cpuMetric, "IN_USE_ADDRESSES", "SSD_TOTAL_GB"].filter(Boolean) as string[];

              const lq = quotaInfo.live_quota as Record<string, Record<string, unknown>> | null | undefined;
              const liveRegion = lq?.regions?.[quotaInfo.region ?? ""] as Record<string, unknown> | undefined;
              const liveMetrics = (liveRegion?.metrics || {}) as Record<string, Record<string, unknown>>;

              const recommended = quotaInfo.recommended_max_concurrent;

              return (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)]">
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      <div>
                        <span className="text-[var(--color-text-muted)]">Service:</span> {quotaInfo.service}
                      </div>
                      <div>
                        <span className="text-[var(--color-text-muted)]">Compute:</span> {quotaInfo.compute}
                      </div>
                      <div>
                        <span className="text-[var(--color-text-muted)]">Region:</span> {quotaInfo.region}
                      </div>
                      <div>
                        <span className="text-[var(--color-text-muted)]">Total shards:</span>{" "}
                        {quotaInfo.total_shards?.toLocaleString()}
                      </div>
                      <div>
                        <span className="text-[var(--color-text-muted)]">Effective max_concurrent:</span>{" "}
                        {(
                          quotaInfo.effective_settings as Record<string, number> | undefined
                        )?.max_concurrent?.toLocaleString()}
                      </div>
                      {recommended !== null && recommended !== undefined && (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[var(--color-text-muted)]">Recommended max_concurrent:</span>{" "}
                            <span className="text-[var(--color-accent-yellow)] font-semibold">
                              {recommended.toLocaleString()}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setMaxConcurrent(String(recommended))}
                          >
                            Apply
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {metrics.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                        VM quota (worst-case)
                      </div>
                      <div className="overflow-hidden rounded-lg border border-[var(--color-border-default)]">
                        <div className="grid grid-cols-4 gap-0 text-xs bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-default)]">
                          <div className="p-2 font-semibold">Metric</div>
                          <div className="p-2 font-semibold">Per shard</div>
                          <div className="p-2 font-semibold">Total @ max_concurrent</div>
                          <div className="p-2 font-semibold">Live remaining</div>
                        </div>
                        {metrics.map((m) => {
                          const live = liveMetrics?.[m];
                          const remaining = live?.remaining;
                          return (
                            <div
                              key={m}
                              className="grid grid-cols-4 gap-0 text-xs border-b border-[var(--color-border-subtle)] last:border-b-0"
                            >
                              <div className="p-2 font-mono text-[var(--color-text-secondary)]">{m}</div>
                              <div className="p-2 text-[var(--color-text-secondary)]">{perShard[m] ?? "-"}</div>
                              <div className="p-2 text-[var(--color-text-secondary)]">{totals[m] ?? "-"}</div>
                              <div className="p-2 text-[var(--color-text-secondary)]">
                                {remaining !== undefined && remaining !== null ? (
                                  Number(remaining).toLocaleString()
                                ) : (
                                  <span className="text-[var(--color-text-muted)]">n/a</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {!liveRegion && (
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Live remaining shows n/a when the quota-broker is not configured or unreachable. Set{" "}
                          <code className="text-[var(--color-text-secondary)]">QUOTA_BROKER_URL</code> on the dashboard
                          and ensure the quota-broker service is deployed and reachable.
                        </p>
                      )}
                      {!!liveRegion?.error && (
                        <p className="text-xs text-[var(--color-accent-red)]">
                          Live quota unavailable for this region: {String(liveRegion.error)}
                        </p>
                      )}
                      {quotaInfo.live_quota_error && (
                        <p className="text-xs text-[var(--color-accent-red)]">
                          Live quota error: {quotaInfo.live_quota_error}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
