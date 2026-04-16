# Module F — Widget Registry, Merging & Preset Audit

---

## Part 1: Widget Registry Inventory

Read `components/widgets/widget-registry.ts` for the registration API, then read every `components/widgets/*/register.ts` file.

For each registered widget, capture:

- Widget ID
- Domain (which `register.ts`)
- `defaultW`, `defaultH`, `minW`, `minH`
- `singleton` flag
- `availableOn` tabs
- Short description (from registry or inferred from widget name)

Output as a table grouped by domain.

## Part 2: Merge Candidate Analysis

For each domain, identify widgets that should be merged:

| Merge Pattern          | What to Look For                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **KPI + Table**        | `*-kpi-strip` or `*-kpi` widget registered alongside a `*-table` widget in the same domain                                   |
| **Controls + Surface** | `*-controls` or `*-control-bar` widget alongside a main content widget                                                       |
| **Master + Detail**    | `*-list`/`*-grid` widget alongside a `*-detail` widget                                                                       |
| **Multi-step flow**    | Multiple widgets that represent steps in a sequential process (e.g., book trade: hierarchy → form → algo → preview → submit) |

For each proposed merge:

- List the current widget IDs
- Describe the target merged widget
- Estimate the effort (lines to refactor, complexity)
- Note any `singleton: false` or `availableOn` constraints that affect the merge

## Part 3: Preset Coverage

Read `components/widgets/preset-registry.ts` (or wherever presets are defined).

For each tab that has presets:

- List the presets and which widgets they include
- Check: does the preset include all the "should merge" widgets separately? (If so, merging simplifies the preset)
- Check: are there tabs with NO presets that should have them?
- Check: do presets match what a user would reasonably expect as a default layout?

## Part 4: Widget Configuration Gaps

For each registered widget:

- Does it have proper `minW`/`minH` for its content?
- Does it render something useful at minimum size, or does it overflow/break?
- Is the `availableOn` list correct, or should the widget be available on more tabs?
- Does the widget handle the empty state gracefully (no data)?

## Output Expectations

- Full widget inventory table (all widgets, all domains)
- Merge candidates table with current IDs → target merged widget
- Preset coverage table
- Gap/issue list
