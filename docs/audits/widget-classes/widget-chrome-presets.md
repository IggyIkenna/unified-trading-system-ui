# Widget Chrome Presets — Visual Separation Options

**Date:** 2026-04-16
**Status:** TESTING — pick one after team review
**Related:** BP-2 (widget foundation), widget-wrapper.tsx, widget-grid.tsx

---

## Problem

On custom panels with many widgets (e.g., the Forms panel with 16 form widgets), all widgets share the same `bg-card` background and a barely-visible `border-border` edge. It's hard to tell where one widget ends and the next begins, especially in dark mode where `--border: #27272a` is nearly invisible against `--card: #111113`.

## How to Test

Open `components/widgets/widget-chrome-presets.ts` and change one letter:

```ts
export const ACTIVE_PRESET: PresetKey = "A"; // change to A–T
```

Refresh the dev server — all widgets update globally.

## Phase 2 Plan

Once a few top-level letters are shortlisted, we add sub-variants under each winner:

```
A  → A1, A2, A3  (tweak shadow intensity, border opacity, gap)
Q  → Q1, Q2, Q3  (tweak header tint, shadow weight, gap)
```

This keeps the first pass fast (just letters) and the second pass focused (only refine what looked promising).

---

## Quick Reference (A–T)

| Key | Group        | Shadow    | Border          | Header tint | Gap | Notes                             |
| --- | ------------ | --------- | --------------- | ----------- | --- | --------------------------------- |
| A   | 1 — Shadow   | none      | border          | card/80     | 2px | Current production baseline       |
| B   | 1 — Shadow   | shadow-sm | border          | card/80     | 2px | Lightest shadow                   |
| C   | 1 — Shadow   | shadow-md | border          | card/80     | 2px | Medium shadow                     |
| D   | 1 — Shadow   | shadow-lg | border          | card/80     | 2px | Heavy shadow                      |
| E   | 2 — Border   | none      | muted-fg/15     | card/80     | 2px | Subtle stronger border            |
| F   | 2 — Border   | none      | muted-fg/25     | card/80     | 2px | Medium stronger border            |
| G   | 2 — Border   | none      | muted-fg/35     | card/80     | 2px | Prominent border                  |
| H   | 2 — Border   | none      | border + ring-1 | card/80     | 2px | Double-layer edge (border + ring) |
| I   | 3 — Gap      | none      | border          | card/80     | 4px | Medium gap only                   |
| J   | 3 — Gap      | none      | border          | card/80     | 6px | Wide gap only                     |
| K   | 3 — Gap      | none      | border          | card/80     | 8px | Widest gap                        |
| L   | 4 — Header   | none      | border          | muted/30    | 2px | Light header tint                 |
| M   | 4 — Header   | none      | border          | muted/50    | 2px | Medium header tint                |
| N   | 4 — Header   | none      | border          | muted/70    | 2px | Strong header tint                |
| O   | 5 — Combined | shadow-sm | muted-fg/20     | card/80     | 2px | Shadow + bold border              |
| P   | 5 — Combined | shadow-sm | border          | card/80     | 6px | Shadow + wide gap                 |
| Q   | 5 — Combined | shadow-sm | border          | muted/40    | 4px | Shadow + tinted header + gap      |
| R   | 5 — Combined | none      | muted-fg/20     | muted/40    | 4px | Bold border + tinted header + gap |
| S   | 5 — Combined | shadow-md | muted-fg/15     | muted/30    | 4px | Full card (shadow-md)             |
| T   | 5 — Combined | shadow-lg | muted-fg/20     | muted/40    | 6px | Full card (shadow-lg) heaviest    |

---

## Group Details

### Group 1 — Shadow Only (A–D)

Tests shadow in isolation. Border and gap stay at baseline. Lets you judge how much depth alone helps.

- **A**: No shadow. Current look.
- **B**: `shadow-sm` — barely visible lift.
- **C**: `shadow-md` — clear card depth.
- **D**: `shadow-lg` — heavy floating effect.

### Group 2 — Border Strength Only (E–H)

Tests border contrast in isolation. No shadow, 2px gap. Lets you judge how much border visibility matters.

- **E**: `muted-foreground/15` — subtle bump from baseline.
- **F**: `muted-foreground/25` — clearly visible edges.
- **G**: `muted-foreground/35` — prominent, almost wire-frame feel.
- **H**: `border` + `ring-1 ring-muted-foreground/10` — double-layer outline.

### Group 3 — Gap / Spacing Only (I–K)

Tests whitespace in isolation. Baseline border, no shadow. Lets you judge how much gap alone helps.

- **I**: 4px — slightly more room than baseline.
- **J**: 6px — noticeable whitespace gutters.
- **K**: 8px — wide gutters, ~4.6% density loss on 1920px.

### Group 4 — Header Tint Only (L–N)

Tests header background in isolation. Baseline border, no shadow, 2px gap. Lets you judge whether a tinted header anchors widget boundaries.

- **L**: `muted/30` — barely there.
- **M**: `muted/50` — clearly different from body.
- **N**: `muted/70` — strong contrast header.

### Group 5 — Combined (O–T)

Best-of combinations from groups 1–4. These are the likely winners.

- **O**: Shadow + bold border (tight, no gap change).
- **P**: Shadow + wide gap (no border change).
- **Q**: Shadow + tinted header + medium gap (balanced).
- **R**: Bold border + tinted header + medium gap (no shadow).
- **S**: Full card — shadow-md + bold border + tinted header + 4px gap.
- **T**: Heaviest — shadow-lg + bold border + tinted header + 6px gap.

---

## Testing Workflow

1. Start with Group 5 (O–T) — these are the most likely final choices.
2. If one feels close but not perfect, go back to its ingredient groups to isolate which axis to tune.
3. Shortlist 2–3 winners.
4. Phase 2: create sub-variants (O1, O2, Q1, Q2, etc.) with fine-tuned values.

## Files

| File                                          | Change                             |
| --------------------------------------------- | ---------------------------------- |
| `components/widgets/widget-chrome-presets.ts` | Preset definitions + single switch |
| `components/widgets/widget-wrapper.tsx`       | Uses preset for container + header |
| `components/widgets/widget-grid.tsx`          | Uses preset for grid margin        |
