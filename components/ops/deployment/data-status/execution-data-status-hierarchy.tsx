"use client";

import {
  ChevronDown,
  ChevronRight,
  Database,
  FileCode,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useExecutionDataStatusContext } from "@/components/ops/deployment/data-status/execution-data-status-context";
import {
  getCompletionBadgeClass,
  getCompletionColor,
  renderDatesList,
} from "@/components/ops/deployment/data-status/execution-data-status-utils";

export function ExecutionDataStatusHierarchy() {
  const {
    data,
    viewMode,
    expandedStrategies,
    expandedModes,
    expandedTimeframes,
    expandedConfigs,
    toggleStrategy,
    toggleMode,
    toggleTimeframe,
    toggleConfig,
  } = useExecutionDataStatusContext();

  if (!data || viewMode !== "hierarchy") return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Strategy Hierarchy
        </CardTitle>
        <CardDescription>Drill down: Strategy → Mode → Timeframe → Config files</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[var(--color-border-subtle)]">
          {data.strategies.map((strategy) => {
            const strategyKey = strategy.strategy;
            const isStrategyExpanded = expandedStrategies.has(strategyKey);
            const isComplete = strategy.completion_pct >= 100;

            return (
              <div key={strategyKey}>
                <Button
                  variant="ghost"
                  onClick={() => toggleStrategy(strategyKey)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--color-bg-secondary)] transition-colors h-auto"
                >
                  <div className="flex items-center gap-3">
                    {isStrategyExpanded ? (
                      <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                    )}
                    <Database className="h-4 w-4 text-[var(--color-accent-purple)]" />
                    <span className="font-medium font-mono text-sm">{strategy.strategy}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      ({strategy.modes.length} modes, {strategy.total} configs)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {!isComplete && (
                      <Badge variant="outline" className="status-error">
                        {strategy.total - strategy.with_results} missing
                      </Badge>
                    )}
                    <Badge variant="outline" className={getCompletionBadgeClass(strategy.completion_pct)}>
                      {strategy.completion_pct.toFixed(0)}%
                    </Badge>
                    <div className="w-20 h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${strategy.completion_pct}%`,
                          backgroundColor: getCompletionColor(strategy.completion_pct),
                        }}
                      />
                    </div>
                  </div>
                </Button>

                {isStrategyExpanded && (
                  <div className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-subtle)]">
                    {strategy.modes.map((mode) => {
                      const modeKey = `${strategyKey}/${mode.mode}`;
                      const isModeExpanded = expandedModes.has(modeKey);
                      void (mode.completion_pct >= 100);

                      return (
                        <div key={modeKey}>
                          <Button
                            variant="ghost"
                            onClick={() => toggleMode(modeKey)}
                            className="w-full px-6 py-2 flex items-center justify-between hover:bg-[var(--color-bg-tertiary)] transition-colors h-auto"
                          >
                            <div className="flex items-center gap-3">
                              {isModeExpanded ? (
                                <ChevronDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-[var(--color-text-muted)]" />
                              )}
                              <FileCode className="h-3 w-3 text-[var(--color-accent-cyan)]" />
                              <span className="font-mono text-sm">{mode.mode}</span>
                              <span className="text-xs text-[var(--color-text-muted)]">
                                ({mode.timeframes.length} timeframes)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[var(--color-text-muted)]">
                                {mode.with_results}/{mode.total}
                              </span>
                              <span
                                className="text-xs font-mono"
                                style={{
                                  color: getCompletionColor(mode.completion_pct),
                                }}
                              >
                                {mode.completion_pct.toFixed(0)}%
                              </span>
                            </div>
                          </Button>

                          {isModeExpanded && (
                            <div className="bg-[var(--color-bg-tertiary)] divide-y divide-[var(--color-border-subtle)]">
                              {mode.timeframes.map((tf) => {
                                const tfKey = `${modeKey}/${tf.timeframe}`;
                                const isTfExpanded = expandedTimeframes.has(tfKey);
                                const isTfComplete = tf.completion_pct >= 100;

                                return (
                                  <div key={tfKey}>
                                    <Button
                                      variant="ghost"
                                      onClick={() => toggleTimeframe(tfKey)}
                                      className="w-full px-8 py-2 flex items-center justify-between hover:bg-[var(--color-bg-primary)] transition-colors h-auto"
                                    >
                                      <div className="flex items-center gap-3">
                                        {isTfExpanded ? (
                                          <ChevronDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                                        ) : (
                                          <ChevronRight className="h-3 w-3 text-[var(--color-text-muted)]" />
                                        )}
                                        <Clock className="h-3 w-3 text-[var(--color-accent-amber)]" />
                                        <span className="font-mono text-sm">{tf.timeframe}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {!isTfComplete && tf.missing_configs.length > 0 && (
                                          <Badge
                                            variant="outline"
                                            className="text-[10px] bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)] border-[var(--color-status-error-border-strong)]"
                                          >
                                            {tf.missing_configs.length} missing
                                          </Badge>
                                        )}
                                        <span className="text-xs text-[var(--color-text-muted)]">
                                          {tf.with_results}/{tf.total}
                                        </span>
                                        {isTfComplete ? (
                                          <CheckCircle2 className="h-3 w-3 text-[var(--color-accent-green)]" />
                                        ) : (
                                          <span
                                            className="text-xs font-mono"
                                            style={{
                                              color: getCompletionColor(tf.completion_pct),
                                            }}
                                          >
                                            {tf.completion_pct.toFixed(0)}%
                                          </span>
                                        )}
                                      </div>
                                    </Button>

                                    {isTfExpanded && (
                                      <div className="bg-[var(--color-bg-primary)] px-10 py-3 space-y-2">
                                        {tf.missing_configs.length > 0 && (
                                          <>
                                            <p className="text-xs font-medium text-[var(--color-accent-red)] mb-2">
                                              Missing configs ({tf.missing_configs.length}):
                                            </p>
                                            {tf.missing_configs.map((cfg, i) => {
                                              const fullConfig = tf.configs.find(
                                                (c) => c.config_file === cfg.config_file,
                                              );
                                              const configKey = `${tfKey}/missing/${cfg.config_file}`;
                                              const isConfigExpanded = expandedConfigs.has(configKey);
                                              const hasDayBreakdown =
                                                fullConfig &&
                                                (fullConfig.dates_found_count !== undefined ||
                                                  fullConfig.dates_missing_count !== undefined);

                                              return (
                                                <div
                                                  key={i}
                                                  className="border border-[var(--color-status-error-border)] rounded overflow-hidden"
                                                >
                                                  <Button
                                                    variant="ghost"
                                                    onClick={() => hasDayBreakdown && toggleConfig(configKey)}
                                                    className={cn(
                                                      "w-full flex items-center gap-2 text-xs font-mono bg-[var(--color-status-error-bg-subtle)] px-2 py-1.5 h-auto",
                                                      hasDayBreakdown && "hover:bg-[var(--color-status-error-bg)]",
                                                    )}
                                                  >
                                                    {hasDayBreakdown &&
                                                      (isConfigExpanded ? (
                                                        <ChevronDown className="h-3 w-3 text-[var(--color-text-muted)] shrink-0" />
                                                      ) : (
                                                        <ChevronRight className="h-3 w-3 text-[var(--color-text-muted)] shrink-0" />
                                                      ))}
                                                    <XCircle className="h-3 w-3 text-[var(--color-accent-red)] shrink-0" />
                                                    <span className="text-[var(--color-accent-amber)] font-medium shrink-0">
                                                      {cfg.algo_name}
                                                    </span>
                                                    <span
                                                      className="truncate text-[var(--color-text-muted)]"
                                                      title={cfg.config_file}
                                                    >
                                                      {cfg.config_file}
                                                    </span>
                                                    {fullConfig?.dates_missing_count !== undefined && (
                                                      <span className="text-[10px] text-[var(--color-accent-red)] ml-auto shrink-0 flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {fullConfig.dates_missing_count} days missing
                                                      </span>
                                                    )}
                                                  </Button>

                                                  {isConfigExpanded && hasDayBreakdown && fullConfig && (
                                                    <div className="bg-[var(--color-bg-secondary)] px-3 py-2 border-t border-[var(--color-status-error-border)]">
                                                      {renderDatesList(
                                                        fullConfig.dates_found_list,
                                                        fullConfig.dates_found_list_tail,
                                                        fullConfig.dates_found_truncated,
                                                        fullConfig.dates_found_count,
                                                        "text-[var(--color-accent-green)]",
                                                        "Available Days",
                                                      )}
                                                      {renderDatesList(
                                                        fullConfig.dates_missing_list,
                                                        fullConfig.dates_missing_list_tail,
                                                        fullConfig.dates_missing_truncated,
                                                        fullConfig.dates_missing_count,
                                                        "text-[var(--color-accent-red)]",
                                                        "Missing Days",
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </>
                                        )}

                                        {tf.configs.filter((c) => c.has_results).length > 0 && (
                                          <>
                                            <p className="text-xs font-medium text-[var(--color-accent-green)] mt-3 mb-2">
                                              Completed ({tf.configs.filter((c) => c.has_results).length}
                                              ):
                                            </p>
                                            {tf.configs
                                              .filter((c) => c.has_results)
                                              .map((cfg, i) => {
                                                const configKey = `${tfKey}/${cfg.config_file}`;
                                                const isConfigExpanded = expandedConfigs.has(configKey);
                                                const hasDayBreakdown =
                                                  cfg.dates_found_count !== undefined ||
                                                  cfg.dates_missing_count !== undefined;

                                                return (
                                                  <div
                                                    key={i}
                                                    className="border border-[var(--color-status-success-border)] rounded overflow-hidden"
                                                  >
                                                    <Button
                                                      variant="ghost"
                                                      onClick={() => hasDayBreakdown && toggleConfig(configKey)}
                                                      className={cn(
                                                        "w-full flex items-center gap-2 text-xs font-mono bg-[var(--color-status-success-bg-subtle)] px-2 py-1.5 h-auto",
                                                        hasDayBreakdown && "hover:bg-[var(--color-status-success-bg)]",
                                                      )}
                                                    >
                                                      {hasDayBreakdown &&
                                                        (isConfigExpanded ? (
                                                          <ChevronDown className="h-3 w-3 text-[var(--color-text-muted)] shrink-0" />
                                                        ) : (
                                                          <ChevronRight className="h-3 w-3 text-[var(--color-text-muted)] shrink-0" />
                                                        ))}
                                                      <CheckCircle2 className="h-3 w-3 text-[var(--color-accent-green)] shrink-0" />
                                                      <span className="text-[var(--color-accent-cyan)] font-medium shrink-0">
                                                        {cfg.algo_name}
                                                      </span>
                                                      <span
                                                        className="truncate text-[var(--color-text-muted)]"
                                                        title={cfg.config_file}
                                                      >
                                                        {cfg.config_file}
                                                      </span>
                                                      <span className="text-[10px] text-[var(--color-text-muted)] ml-auto shrink-0 flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {cfg.dates_found_count ?? cfg.result_dates.length}/
                                                        {(cfg.dates_found_count ?? 0) +
                                                          (cfg.dates_missing_count ?? 0) ||
                                                          cfg.result_dates.length}{" "}
                                                        days
                                                        {cfg.completion_pct !== undefined && (
                                                          <span
                                                            className={
                                                              cfg.completion_pct >= 100
                                                                ? "text-[var(--color-accent-green)]"
                                                                : "text-[var(--color-accent-amber)]"
                                                            }
                                                          >
                                                            ({cfg.completion_pct}
                                                            %)
                                                          </span>
                                                        )}
                                                      </span>
                                                    </Button>

                                                    {isConfigExpanded && hasDayBreakdown && (
                                                      <div className="bg-[var(--color-bg-secondary)] px-3 py-2 border-t border-[var(--color-status-success-border)]">
                                                        {renderDatesList(
                                                          cfg.dates_found_list,
                                                          cfg.dates_found_list_tail,
                                                          cfg.dates_found_truncated,
                                                          cfg.dates_found_count,
                                                          "text-[var(--color-accent-green)]",
                                                          "Available Days",
                                                        )}
                                                        {renderDatesList(
                                                          cfg.dates_missing_list,
                                                          cfg.dates_missing_list_tail,
                                                          cfg.dates_missing_truncated,
                                                          cfg.dates_missing_count,
                                                          "text-[var(--color-accent-red)]",
                                                          "Missing Days",
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
