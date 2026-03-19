import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  CLIPreview,
  ContainerCommandPreview,
} from "../../../src/components/CLIPreview";
import type { ServiceDimensionsResponse } from "../../../src/types";

// CLIPreview uses navigator.clipboard - mock it
Object.defineProperty(navigator, "clipboard", {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  writable: true,
});

const mockDimensions: ServiceDimensionsResponse = {
  service: "instruments-service",
  dimensions: [
    { name: "venue", type: "enum", values: ["binance", "okx"] },
    { name: "date", type: "date", values: [] },
  ],
  cli_args: { venue: "--venue" },
  turbo_mode: false,
};

describe("CLIPreview", () => {
  it("renders CLI Command Preview heading", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{}}
      />,
    );
    expect(screen.getByText("CLI Command Preview")).toBeInTheDocument();
  });

  it("renders base deploy command for service", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{}}
      />,
    );
    expect(
      screen.getByText(/python -m unified_trading_deployment.cli deploy/),
    ).toBeInTheDocument();
  });

  it("includes --compute flag when compute is set", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{ compute: "vm" }}
      />,
    );
    expect(screen.getByText(/--compute vm/)).toBeInTheDocument();
  });

  it("includes --start-date flag when start_date is set", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{ start_date: "2026-01-01" }}
      />,
    );
    expect(screen.getByText(/--start-date 2026-01-01/)).toBeInTheDocument();
  });

  it("includes --end-date flag when end_date is set", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{ end_date: "2026-01-31" }}
      />,
    );
    expect(screen.getByText(/--end-date 2026-01-31/)).toBeInTheDocument();
  });

  it("includes --category flags for each category", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{ category: ["cefi", "defi"] }}
      />,
    );
    expect(screen.getByText(/--category cefi/)).toBeInTheDocument();
    expect(screen.getByText(/--category defi/)).toBeInTheDocument();
  });

  it("does not include --category when category is empty array", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{ category: [] }}
      />,
    );
    expect(screen.queryByText(/--category/)).not.toBeInTheDocument();
  });

  it("includes --venue flags for each venue", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{ venue: ["binance", "okx"] }}
      />,
    );
    expect(screen.getByText(/--venue binance/)).toBeInTheDocument();
    expect(screen.getByText(/--venue okx/)).toBeInTheDocument();
  });

  it("does not include --venue when venue is empty array", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{ venue: [] }}
      />,
    );
    expect(screen.queryByText(/--venue/)).not.toBeInTheDocument();
  });

  it("includes --force flag when force is true", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{ force: true }}
      />,
    );
    expect(screen.getByText(/--force/)).toBeInTheDocument();
  });

  it("does not include --force when force is false", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{ force: false }}
      />,
    );
    expect(screen.queryByText(/--force/)).not.toBeInTheDocument();
  });

  it("includes --log-level flag when log_level is not INFO", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{ log_level: "DEBUG" }}
      />,
    );
    expect(screen.getByText(/--log-level DEBUG/)).toBeInTheDocument();
  });

  it("does not include --log-level when log_level is INFO", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{ log_level: "INFO" }}
      />,
    );
    expect(screen.queryByText(/--log-level/)).not.toBeInTheDocument();
  });

  it("includes --dry-run flag when dry_run is true", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{ dry_run: true }}
      />,
    );
    expect(screen.getByText(/--dry-run/)).toBeInTheDocument();
  });

  it("includes --no-venue-sharding flag when skip_venue_sharding is true", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{ skip_venue_sharding: true }}
      />,
    );
    expect(screen.getByText(/--no-venue-sharding/)).toBeInTheDocument();
  });

  it("includes --no-feature-group-sharding flag when skip_feature_group_sharding is true", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{ skip_feature_group_sharding: true }}
      />,
    );
    expect(screen.getByText(/--no-feature-group-sharding/)).toBeInTheDocument();
  });

  it("includes --date-granularity flag when date_granularity is set", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{ date_granularity: "month" }}
      />,
    );
    expect(screen.getByText(/--date-granularity month/)).toBeInTheDocument();
  });

  it("includes --max-workers flag when max_workers is set", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{ max_workers: 4 }}
      />,
    );
    expect(screen.getByText(/--max-workers 4/)).toBeInTheDocument();
  });

  it("includes extra_args in CLI command", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{ extra_args: "--custom-flag value" }}
      />,
    );
    // extra_args gets split and rejoined with -- prefix
    expect(screen.getByText(/--custom-flag value/)).toBeInTheDocument();
  });

  it("renders Copy button", () => {
    render(
      <CLIPreview
        serviceName="instruments-service"
        dimensions={null}
        formValues={{}}
      />,
    );
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
  });
});

describe("ContainerCommandPreview", () => {
  it("returns null when dimensions is null", () => {
    const { container } = render(
      <ContainerCommandPreview
        serviceName="instruments-service"
        dimensions={null}
        sampleShard={undefined}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns null when sampleShard is undefined", () => {
    const { container } = render(
      <ContainerCommandPreview
        serviceName="instruments-service"
        dimensions={mockDimensions}
        sampleShard={undefined}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders container command when dimensions and sampleShard are provided", () => {
    render(
      <ContainerCommandPreview
        serviceName="instruments-service"
        dimensions={mockDimensions}
        sampleShard={{ venue: "binance", date: "2026-01-15" }}
      />,
    );
    expect(screen.getByText(/Container Command/)).toBeInTheDocument();
    expect(
      screen.getByText(/python -m instruments_service/),
    ).toBeInTheDocument();
  });

  it("renders correct service module name with dashes converted to underscores", () => {
    render(
      <ContainerCommandPreview
        serviceName="market-tick-data-handler"
        dimensions={mockDimensions}
        sampleShard={{ venue: "binance" }}
      />,
    );
    expect(
      screen.getByText(/python -m market_tick_data_handler/),
    ).toBeInTheDocument();
  });

  it("handles instruments-service with --operation and --mode batch flags", () => {
    render(
      <ContainerCommandPreview
        serviceName="instruments-service"
        dimensions={mockDimensions}
        sampleShard={{ venue: "binance" }}
      />,
    );
    const pre = screen
      .getByText(/python -m instruments_service/)
      .closest("pre");
    expect(pre?.textContent).toContain("--operation");
    expect(pre?.textContent).toContain("instrument");
    expect(pre?.textContent).toContain("--mode");
    expect(pre?.textContent).toContain("batch");
  });

  it("applies venue dimension via cli_args mapping", () => {
    render(
      <ContainerCommandPreview
        serviceName="instruments-service"
        dimensions={mockDimensions}
        sampleShard={{ venue: "binance", date: "2026-01-15" }}
      />,
    );
    const pre = screen
      .getByText(/python -m instruments_service/)
      .closest("pre");
    // venue has cli_arg "--venue" so it should appear
    expect(pre?.textContent).toContain("--venue");
    expect(pre?.textContent).toContain("binance");
  });

  it("handles date dimension with start-date and end-date for default services", () => {
    const dimsWithDate: ServiceDimensionsResponse = {
      ...mockDimensions,
      dimensions: [{ name: "date", type: "date", values: [] }],
      cli_args: {},
    };
    render(
      <ContainerCommandPreview
        serviceName="instruments-service"
        dimensions={dimsWithDate}
        sampleShard={{ date: "2026-01-15" }}
      />,
    );
    const pre = screen
      .getByText(/python -m instruments_service/)
      .closest("pre");
    expect(pre?.textContent).toContain("--start-date");
    expect(pre?.textContent).toContain("--end-date");
    expect(pre?.textContent).toContain("2026-01-15");
  });

  it("handles date dimension with --date for market-data-processing-service", () => {
    const dimsWithDate: ServiceDimensionsResponse = {
      ...mockDimensions,
      dimensions: [{ name: "date", type: "date", values: [] }],
      cli_args: {},
    };
    render(
      <ContainerCommandPreview
        serviceName="market-data-processing-service"
        dimensions={dimsWithDate}
        sampleShard={{ date: "2026-01-15" }}
      />,
    );
    const pre = screen
      .getByText(/python -m market_data_processing_service/)
      .closest("pre");
    expect(pre?.textContent).toContain("--date");
    expect(pre?.textContent).toContain("2026-01-15");
  });

  it("handles date dimension with --start and --end for execution-services", () => {
    const dimsWithDate: ServiceDimensionsResponse = {
      ...mockDimensions,
      dimensions: [{ name: "date", type: "date", values: [] }],
      cli_args: {},
    };
    render(
      <ContainerCommandPreview
        serviceName="execution-services"
        dimensions={dimsWithDate}
        sampleShard={{ date: "2026-01-15" }}
      />,
    );
    const pre = screen.getByText(/python -m execution_services/).closest("pre");
    expect(pre?.textContent).toContain("--start");
    expect(pre?.textContent).toContain("--end");
  });

  it("handles category dimension as boolean flag for market-data-processing-service", () => {
    const dimsWithCategory: ServiceDimensionsResponse = {
      ...mockDimensions,
      dimensions: [{ name: "category", type: "enum", values: ["cefi"] }],
      cli_args: {},
    };
    render(
      <ContainerCommandPreview
        serviceName="market-data-processing-service"
        dimensions={dimsWithCategory}
        sampleShard={{ category: "cefi" }}
      />,
    );
    const pre = screen
      .getByText(/python -m market_data_processing_service/)
      .closest("pre");
    expect(pre?.textContent).toContain("--cefi");
  });

  it("skips dimensions where shard value is missing", () => {
    render(
      <ContainerCommandPreview
        serviceName="instruments-service"
        dimensions={mockDimensions}
        sampleShard={{}}
      />,
    );
    const pre = screen
      .getByText(/python -m instruments_service/)
      .closest("pre");
    // No venue or date in shard, so no --venue or date flags
    expect(pre?.textContent).not.toContain("--venue");
  });

  it("handles service with no known container flags", () => {
    render(
      <ContainerCommandPreview
        serviceName="unknown-service"
        dimensions={mockDimensions}
        sampleShard={{ venue: "binance" }}
      />,
    );
    // Should still render (no flags, just dimension args)
    expect(screen.getByText(/Container Command/)).toBeInTheDocument();
  });
});
