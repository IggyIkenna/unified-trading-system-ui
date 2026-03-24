"use client";

import { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type {
  DeploymentRequest,
  ServiceDimensionsResponse,
} from "@/lib/types/deployment";

interface CLIPreviewProps {
  serviceName: string;
  dimensions: ServiceDimensionsResponse | null;
  formValues: Partial<DeploymentRequest>;
}

/**
 * Generates CLI command preview based on service config and form values.
 *
 * This accurately reflects how the backend builds CLI args via _build_args():
 * 1. Add cli_flags (--operation <op> and --mode batch|live per codex)
 * 2. Map dimensions to cli_args
 * 3. Handle special cases (date ranges, boolean flags)
 */
export function CLIPreview({
  serviceName,
  dimensions,
  formValues,
}: CLIPreviewProps) {
  const [copied, setCopied] = useState(false);

  const cliCommand = buildCLICommand(serviceName, dimensions, formValues);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cliCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[var(--color-accent-cyan)]" />
            CLI Command Preview
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-[var(--color-bg-primary)] rounded-lg p-3 border border-[var(--color-border-default)]">
          <pre className="text-xs font-mono text-[var(--color-text-secondary)] whitespace-pre-wrap break-all">
            <span className="text-[var(--color-accent-green)]">$</span>{" "}
            {cliCommand}
          </pre>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          This command is equivalent to what the deployment system executes
        </p>
      </CardContent>
    </Card>
  );
}

function buildCLICommand(
  serviceName: string,
  _dimensions: ServiceDimensionsResponse | null,
  formValues: Partial<DeploymentRequest>,
): string {
  const args: string[] = [];

  // Base deploy command
  args.push("python -m unified_trading_deployment.cli deploy");
  args.push(`--service ${serviceName}`);

  // Compute target
  if (formValues.compute) {
    args.push(`--compute ${formValues.compute}`);
  }

  // Date range
  if (formValues.start_date) {
    args.push(`--start-date ${formValues.start_date}`);
  }
  if (formValues.end_date) {
    args.push(`--end-date ${formValues.end_date}`);
  }

  // Category filter
  if (formValues.category && formValues.category.length > 0) {
    for (const cat of formValues.category) {
      args.push(`--category ${cat}`);
    }
  }

  // Venue filter (for services with venue dimension)
  if (formValues.venue && formValues.venue.length > 0) {
    for (const venue of formValues.venue) {
      args.push(`--venue ${venue}`);
    }
  }

  // Force flag
  if (formValues.force) {
    args.push("--force");
  }

  // Log level
  if (formValues.log_level && formValues.log_level !== "INFO") {
    args.push(`--log-level ${formValues.log_level}`);
  }

  // Dry run
  if (formValues.dry_run) {
    args.push("--dry-run");
  }

  // Skip venue sharding
  if (formValues.skip_venue_sharding) {
    args.push("--no-venue-sharding");
  }

  // Skip feature group sharding
  if (formValues.skip_feature_group_sharding) {
    args.push("--no-feature-group-sharding");
  }

  // Date granularity override
  if (formValues.date_granularity) {
    args.push(`--date-granularity ${formValues.date_granularity}`);
  }

  // Max workers
  if (formValues.max_workers) {
    args.push(`--max-workers ${formValues.max_workers}`);
  }

  // Extra CLI arguments (passed through to the container; quote so copy-paste works)
  if (formValues.extra_args && formValues.extra_args.trim()) {
    const quoted = formValues.extra_args.trim().includes(" ")
      ? `${formValues.extra_args.trim().replace(/"/g, '\\"')}`
      : formValues.extra_args.trim();

    const extraArgs = quoted
      .split("--")
      .filter((arg) => arg.trim())
      .map((arg) => `--${arg}`);
    args.push(...extraArgs);
  }

  return args.join(" \\\n  ");
}

/**
 * Shows what the actual container receives (after shard calculation).
 * This is the command passed to Docker container at runtime.
 */
export function ContainerCommandPreview({
  serviceName,
  dimensions,
  sampleShard,
}: {
  serviceName: string;
  dimensions: ServiceDimensionsResponse | null;
  sampleShard?: Record<string, string>;
}) {
  if (!dimensions || !sampleShard) return null;

  const args: string[] = [];
  const cliArgs = dimensions.cli_args || {};

  // Add operation + mode flags (per codex cli-standards: --operation <op> --mode batch|live)
  const containerFlags: Record<string, string[]> = {
    "instruments-service": ["--operation", "instrument", "--mode", "batch"],
    "market-tick-data-handler": ["--operation", "fetch", "--mode", "batch"],
    "market-data-processing-service": [
      "--operation",
      "process",
      "--mode",
      "batch",
    ],
    "features-calendar-service": ["--operation", "compute", "--mode", "batch"],
    "features-delta-one-service": ["--operation", "compute", "--mode", "batch"],
    "features-volatility-service": [
      "--operation",
      "compute",
      "--mode",
      "batch",
    ],
    "features-onchain-service": ["--operation", "compute", "--mode", "batch"],
    "ml-training-service": ["--operation", "train_phase1", "--mode", "batch"],
    "ml-inference-service": ["--operation", "infer", "--mode", "batch"],
    "strategy-service": ["--operation", "backtest", "--mode", "batch"],
    "execution-services": ["--operation", "execute", "--mode", "live"],
    "risk-and-exposure-service": ["--operation", "compute", "--mode", "batch"],
    "position-balance-monitor-service": [
      "--operation",
      "monitor",
      "--mode",
      "batch",
    ],
    "pnl-attribution-service": ["--operation", "compute", "--mode", "batch"],
  };

  const flags = containerFlags[serviceName];
  if (flags) {
    args.push(...flags);
  }

  // Add dimension args
  for (const dim of dimensions.dimensions) {
    const value = sampleShard[dim.name];
    if (!value) continue;

    const cliArg = cliArgs[dim.name];

    if (dim.name === "date") {
      // Date handling varies by service
      if (serviceName === "market-data-processing-service") {
        args.push(`--date ${value}`);
      } else if (serviceName === "execution-services") {
        args.push(`--start ${value}`);
        args.push(`--end ${value}`);
      } else {
        args.push(`--start-date ${value}`);
        args.push(`--end-date ${value}`);
      }
    } else if (
      dim.name === "category" &&
      serviceName === "market-data-processing-service"
    ) {
      // market-data-processing-service uses boolean flags
      args.push(`--${value}`);
    } else if (cliArg) {
      args.push(`${cliArg} ${value}`);
    }
  }

  return (
    <div className="mt-4">
      <h4 className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
        Container Command (per shard)
      </h4>
      <div className="bg-[var(--color-bg-primary)] rounded-lg p-3 border border-[var(--color-border-default)]">
        <pre className="text-xs font-mono text-[var(--color-text-secondary)] whitespace-pre-wrap">
          <span className="text-[var(--color-text-muted)]">
            # Inside container:
          </span>
          {"\n"}
          <span className="text-[var(--color-accent-purple)]">
            python -m {serviceName.replace(/-/g, "_")}
          </span>{" "}
          {args.join(" ")}
        </pre>
      </div>
    </div>
  );
}
