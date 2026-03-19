---
name: presentations-2026-03-13
overview: >
  Consolidates all presentation and business plans: 10 existing board presentations updated with latest system state, 3
  new presentations created (analytics, financials, status quo), Elysium DeFi partnership presentation, and GCP credits
  application. Hard deadlines: Rehearsal 2 March 18, Board meeting March 31.
type: business
epic: epic-business
status: active

completion_gates:
  code: none
  deployment: none
  business: B6

depends_on:
  - cicd_code_rollout_master_2026_03_13
  # Soft blocker: Plan 1 Phase 4 provides demo data for presentations

supersedes:
  - board_presentations_update_2026_03_10
  - elysium_defi_presentation_2026_03_10
  - gcp_credits_elysium_application_2026_03_10

todos:
  - id: presentations-update-existing
    content: >
      - [ ] [HUMAN] P0. Update 10 existing board presentations with latest system state: current repo count (65), CI/CD
      pipeline status, version cascade, agent orchestration, coverage metrics, tier progression. Deadline: March 18
      (rehearsal 2).
    status: pending

  - id: presentations-create-new
    content: >
      - [ ] [HUMAN+AGENT] P0. Create 3 new presentations: (1) Analytics — data pipeline, feature engineering, ML
      inference, (2) Financials — cost structure, GCP spend, projected revenue, (3) Status quo — current system state,
      what works, what's in progress. Deadline: March 18.
    status: pending

  - id: presentations-elysium-defi
    content: >
      - [ ] [HUMAN+AGENT] P1. Elysium DeFi partnership presentation: architecture SVG showing 14-protocol coverage,
      backtest data from DeFi strategies, white-label fork capabilities, partnership terms. Deadline: March 31 (board
      meeting).
    status: pending

  - id: presentations-gcp-credits
    content: >
      - [ ] [HUMAN] P1. GCP credits application via Google Cloud for Startups. Use Elysium Capital as applicant entity.
      Target: $150k credits covering 2-3 years compute. Requires Elysium materials from presentations-elysium-defi.
      Deadline: March 31.
    status: pending
    depends_on: [presentations-elysium-defi]

  - id: presentations-rehearsal-2
    content: >
      - [ ] [HUMAN] P0. Rehearsal 2 delivery — all 13 presentations reviewed and polished. Date: March 18.
    status: pending
    depends_on: [presentations-update-existing, presentations-create-new]

  - id: presentations-board-meeting
    content: >
      - [ ] [HUMAN] P0. Board meeting delivery — final presentations. Date: March 31.
    status: pending
    depends_on: [presentations-rehearsal-2, presentations-elysium-defi]

  - id: presentations-elysium-defi-detail
    content: >
      - [ ] [HUMAN+AGENT] P1. Elysium DeFi presentation detail: (1) Create
      unified-trading-pm/presentations/10-defi-elysium.html following HTML/CSS of presentations 01-09. 9 slides: Title,
      DeFi Opportunity (3-8% annualised), 14-protocol table (Aave V3, Balancer, Curve, Ethena, Euler, Fluid, EtherFi,
      Lido, Morpho, Uniswap V2/V3/V4, Instadapp, DefiLlama with category/chain/use columns), 4 strategies (Basis,
      Lending Yield, Staked Basis, Recursive Basis) with yield ranges, Backtest Results with Chart.js PnL chart, Risk
      Management (circuit breakers, gas gating $50, max position, 0.5% slippage, paper_trading killswitch, 1% APY
      threshold), What Elysium Gets, Path to Live (M1 paper, M2 live $10k, M3+ scale), Next Steps. (2) Create
      presentations/assets/defi-architecture.svg data flow diagram. (3) Create
      presentations/assets/defi-backtest-data.json for Chart.js. (4) Update presentations/00-master.html nav index with
      Slide 10. (5) Playwright test test_elysium_presentation.spec.ts: slide loads, PnL canvas visible, protocol table
      has 14 rows. Cross-browser + PDF export.
    status: pending
    depends_on: [presentations-elysium-defi]

  - id: presentations-gcp-credits-detail
    content: >
      - [ ] [HUMAN+AGENT] P1. GCP credits application detail: (1) Research 4 programs (Cloud for Startups $200k, AI
      Accelerator $200k, Partner Credits, Research Credits). Create
      unified-trading-pm/business/gcp-credits-elysium/program-research.md. (2) Eligibility checklist: Elysium
      registered, not already receiving credits, AI/ML qualifies for Accelerator, pre-revenue status, funding status.
      (3) Create 6 files: gcp-spend-estimate.md (monthly breakdown ~$3,620: Cloud Run $400, GCS $2,000, BigQuery $500,
      Pub/Sub $200, Cloud Build $100, others $320; annual $43k; 3-year $130k; request $150k), technical-summary.md (60
      microservices, 100TB storage, 500M+ events/month), use-case.md (AI-powered systematic DeFi trading across 14
      protocols), elysium-profile.md (template for Elysium to fill: legal name, jurisdiction, AUM, team, funding),
      application-draft.md (credits split 60% GCS / 25% compute / 15% analytics). (4) Share with Elysium for review by
      March 24. (5) Submit at cloud.google.com/startups before March 31. (6) Follow-up: Week 1 confirm receipt, Week 2-4
      weekly check. (7) AWS bridge plan in gcp-spend-estimate.md.
    status: pending
    depends_on: [presentations-gcp-credits]
---
