import { BarChart3, FileText, Zap } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { InstructionsDetailPanelWidget } from "./instructions-detail-panel-widget";
import { InstructionsPipelineTableWidget } from "./instructions-pipeline-table-widget";
import { InstructionsSummaryWidget } from "./instructions-summary-widget";

registerPresets("instructions", [
  {
    id: "instructions-default",
    name: "Default",
    tab: "instructions",
    isPreset: true,
    layouts: [
      { widgetId: "instr-summary", instanceId: "instr-summary-1", x: 0, y: 0, w: 24, h: 1 },
      { widgetId: "instr-pipeline-table", instanceId: "instr-pipeline-table-1", x: 0, y: 1, w: 24, h: 11 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "instructions-with-detail",
    name: "With detail panel",
    tab: "instructions",
    isPreset: true,
    layouts: [
      { widgetId: "instr-summary", instanceId: "instr-summary-2", x: 0, y: 0, w: 24, h: 1 },
      { widgetId: "instr-pipeline-table", instanceId: "instr-pipeline-table-2", x: 0, y: 1, w: 16, h: 11 },
      { widgetId: "instr-detail-panel", instanceId: "instr-detail-panel-1", x: 16, y: 1, w: 8, h: 11 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "instructions-full",
    name: "Full",
    tab: "instructions",
    isPreset: true,
    layouts: [
      { widgetId: "instr-summary", instanceId: "instr-summary-full", x: 0, y: 0, w: 24, h: 1 },
      { widgetId: "instr-pipeline-table", instanceId: "instr-pipeline-table-full", x: 0, y: 1, w: 24, h: 11 },
      { widgetId: "instr-detail-panel", instanceId: "instr-detail-panel-full", x: 0, y: 12, w: 24, h: 3 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "instr-summary",
  label: "Pipeline Summary",
  description: "Total instructions, filled, partial, pending, average slippage.",
  icon: BarChart3,
  minW: 8,
  minH: 1,
  defaultW: 24,
  defaultH: 1,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Instructions",
  availableOn: ["instructions"],
  singleton: true,
  component: InstructionsSummaryWidget,
});

registerWidget({
  id: "instr-pipeline-table",
  label: "Instruction Pipeline",
  description: "Signal, instruction, and fill columns with integrated filters and expandable discrepancy detail.",
  icon: Zap,
  minW: 12,
  minH: 6,
  defaultW: 24,
  defaultH: 11,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Instructions",
  availableOn: ["instructions"],
  singleton: true,
  component: InstructionsPipelineTableWidget,
});

registerWidget({
  id: "instr-detail-panel",
  label: "Instruction Detail",
  description: "Persistent detail for the selected instruction (master-detail).",
  icon: FileText,
  minW: 8,
  minH: 3,
  defaultW: 24,
  defaultH: 3,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Instructions",
  availableOn: ["instructions"],
  singleton: false,
  component: InstructionsDetailPanelWidget,
});
