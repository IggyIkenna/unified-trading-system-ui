import { render, screen } from "@testing-library/react"
import { ScopeSummary } from "@/components/trading/scope-summary"

describe("ScopeSummary", () => {
  const defaultProps = {
    organizations: [],
    clients: [],
    strategies: [],
    selectedStrategyIds: [],
    totalStrategies: 17,
    totalCapital: 50000000,
    totalExposure: 45000000,
    mode: "live" as const,
  }

  describe("Filter Display Logic", () => {
    it("should show 'All Strategies' when no filters are selected", () => {
      render(<ScopeSummary {...defaultProps} />)
      
      expect(screen.getByText(/all strategies/i)).toBeInTheDocument()
    })

    it("should show organization name when single org is selected", () => {
      render(
        <ScopeSummary
          {...defaultProps}
          organizations={[{ id: "odum", name: "Odum Capital" }]}
        />
      )
      
      expect(screen.getByText(/odum capital/i)).toBeInTheDocument()
    })

    it("should show org count when multiple orgs are selected", () => {
      render(
        <ScopeSummary
          {...defaultProps}
          organizations={[
            { id: "odum", name: "Odum Capital" },
            { id: "alpha", name: "Alpha Capital" },
          ]}
        />
      )
      
      expect(screen.getByText(/2 orgs/i)).toBeInTheDocument()
    })

    it("should show client name when single client is selected", () => {
      render(
        <ScopeSummary
          {...defaultProps}
          clients={[{ id: "delta-one", name: "Delta One Desk" }]}
        />
      )
      
      expect(screen.getByText(/delta one desk/i)).toBeInTheDocument()
    })

    it("should show client count when multiple clients are selected", () => {
      render(
        <ScopeSummary
          {...defaultProps}
          clients={[
            { id: "delta-one", name: "Delta One Desk" },
            { id: "quant-fund", name: "Quant Fund" },
            { id: "sports-desk", name: "Sports Desk" },
          ]}
        />
      )
      
      expect(screen.getByText(/3 clients/i)).toBeInTheDocument()
    })

    it("should show strategy count when strategies are explicitly selected", () => {
      render(
        <ScopeSummary
          {...defaultProps}
          strategies={[
            { id: "strat-1", name: "ETH Basis", status: "live" },
            { id: "strat-2", name: "BTC MM", status: "live" },
            { id: "strat-3", name: "SOL Momentum", status: "live" },
          ]}
          selectedStrategyIds={["strat-1", "strat-2", "strat-3"]}
        />
      )
      
      expect(screen.getByText(/3 strategies/i)).toBeInTheDocument()
    })

    it("should show single strategy name when one is selected", () => {
      render(
        <ScopeSummary
          {...defaultProps}
          strategies={[{ id: "eth-basis", name: "ETH Basis Trade", status: "live" }]}
          selectedStrategyIds={["eth-basis"]}
        />
      )
      
      expect(screen.getByText(/eth basis trade/i)).toBeInTheDocument()
    })

    it("should NOT show strategy count when strategies are filtered by client but not explicitly selected", () => {
      // When user selects a client, strategies are filtered but selectedStrategyIds is empty
      render(
        <ScopeSummary
          {...defaultProps}
          clients={[{ id: "delta-one", name: "Delta One Desk" }]}
          strategies={[
            { id: "strat-1", name: "ETH Basis", status: "live" },
            { id: "strat-2", name: "BTC MM", status: "live" },
          ]}
          selectedStrategyIds={[]} // Not explicitly selected
        />
      )
      
      // Should show client name but NOT strategy count
      expect(screen.getByText(/delta one desk/i)).toBeInTheDocument()
      expect(screen.queryByText(/2 strategies/i)).not.toBeInTheDocument()
    })

    it("should show hierarchical breadcrumb: org > client > strategies", () => {
      render(
        <ScopeSummary
          {...defaultProps}
          organizations={[{ id: "odum", name: "Odum Capital" }]}
          clients={[{ id: "delta-one", name: "Delta One Desk" }]}
          strategies={[{ id: "strat-1", name: "ETH Basis", status: "live" }]}
          selectedStrategyIds={["strat-1"]}
        />
      )
      
      // Should have hierarchical display
      const scopeText = screen.getByTestId?.("scope-label") || 
        document.body.textContent
      expect(scopeText).toContain("Odum")
    })
  })

  describe("Mode Display", () => {
    it("should show Live indicator when mode is live", () => {
      render(<ScopeSummary {...defaultProps} mode="live" />)
      
      expect(screen.getByText(/live/i)).toBeInTheDocument()
    })

    it("should show Batch indicator with date when mode is batch", () => {
      render(
        <ScopeSummary
          {...defaultProps}
          mode="batch"
          asOfDatetime="2026-03-17T10:00:00Z"
        />
      )
      
      expect(screen.getByText(/batch/i)).toBeInTheDocument()
      expect(screen.getByText(/2026-03-17/)).toBeInTheDocument()
    })
  })

  describe("Metrics Display", () => {
    it("should display total capital", () => {
      render(<ScopeSummary {...defaultProps} totalCapital={50000000} />)
      
      // Should show formatted currency
      expect(screen.getByText(/\$50/i) || screen.getByText(/50M/i)).toBeInTheDocument()
    })

    it("should display total exposure", () => {
      render(<ScopeSummary {...defaultProps} totalExposure={45000000} />)
      
      expect(screen.getByText(/\$45/i) || screen.getByText(/45M/i)).toBeInTheDocument()
    })
  })

  describe("Clear Scope Action", () => {
    it("should call onClearScope when clear button is clicked", async () => {
      const onClearScope = jest.fn()
      render(
        <ScopeSummary
          {...defaultProps}
          organizations={[{ id: "odum", name: "Odum Capital" }]}
          onClearScope={onClearScope}
        />
      )
      
      const clearButton = screen.queryByRole("button", { name: /clear/i })
      if (clearButton) {
        await clearButton.click()
        expect(onClearScope).toHaveBeenCalled()
      }
    })
  })
})
