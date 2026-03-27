# Instructions tab — widgets

Workspace tab: `instructions` (`/services/trading/instructions`).

## Data

- **Provider:** `components/widgets/instructions/instructions-data-context.tsx`
- **Fixtures:** `lib/mocks/fixtures/strategy-instructions.ts` (`MOCK_STRATEGY_INSTRUCTIONS`)
- **Types:** `lib/types/instructions.ts`
- **Config:** `lib/config/services/instructions.config.ts` (strategy types), `lib/config/services/trading.config.ts` (operation types)
- **Formatting helpers:** `lib/utils/instructions.ts` (non-React); fill status icons in `instruction-fill-status-icon.tsx`

## Widgets

| id                     | Component                                | Notes                                                                                                 |
| ---------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `instr-filter-bar`     | `instructions-filter-widget.tsx`         | Uses shared `FilterBar` (two selects).                                                                |
| `instr-summary`        | `instructions-summary-widget.tsx`        | Uses shared `KpiStrip` (five metrics).                                                                |
| `instr-pipeline-table` | `instructions-pipeline-table-widget.tsx` | Refresh + `InstructionPipelineRows` (`h-full` scroll).                                                |
| `instr-detail-panel`   | `instructions-detail-panel-widget.tsx`   | Shared `CollapsibleSection` + `InstructionDetailGrid`; driven by row selection in the pipeline table. |

## Presets

Registered in `components/widgets/instructions/register.ts`:

- **Default:** full-width filter, summary, pipeline table.
- **With detail panel:** pipeline `w:8`, detail `w:4` alongside.

## Standalone viewer

`components/trading/strategy-instruction-viewer.tsx` composes filter, summary, and pipeline widgets inside one card for reuse outside the workspace grid.
