# Module A — Typography & Type Scale Audit

---

## SSOT Principle

**Can we change a font size in ONE place and have it propagate everywhere?**

**Current state:** `globals.css` now defines semantic typography tokens in the `@theme` block:

```
--text-page-title: 1.25rem    (20px — page h1)
--text-section-title: 1rem    (16px — h2, card titles)
--text-body: 0.875rem         (14px — default body, table cells)
--text-label: 0.75rem         (12px — labels, nav items, badges)
--text-caption: 0.6875rem     (11px — captions, timestamps)
--text-data: 0.8125rem        (13px — monospace data values)
```

These create Tailwind utilities: `text-page-title`, `text-section-title`, `text-body`, `text-label`, `text-caption`, `text-data`.

**This audit checks:** Are components using these semantic tokens, or are they still using raw Tailwind classes (`text-xs`, `text-sm`, `text-lg`) that bypass the token system?

---

## Part 1: Token Adoption Check

Search for raw Tailwind text size classes in `app/` and `components/`. For each, count occurrences:

| Class                        | Occurrences | Semantic Equivalent               | Migration Needed? |
| ---------------------------- | ----------- | --------------------------------- | ----------------- |
| `text-xs`                    | ?           | `text-label` or `text-caption`    | Yes               |
| `text-sm`                    | ?           | `text-body` or `text-data`        | Yes               |
| `text-base`                  | ?           | `text-section-title`              | Yes               |
| `text-lg`                    | ?           | `text-page-title`                 | Yes               |
| `text-xl`                    | ?           | `text-page-title` (or too large?) | Yes               |
| `text-2xl`                   | ?           | Only for marketing/public pages   | Check context     |
| `text-3xl`+                  | ?           | Only for marketing/public pages   | Check context     |
| `text-[Npx]` / `text-[Nrem]` | ?           | Arbitrary — worst offender        | Yes               |
| `fontSize:` in style objects | ?           | Charts/canvas exceptions OK       | Check context     |

**Exclude:** `app/(public)/` pages (marketing can use the full Tailwind scale). The token system targets `(platform)` and `(ops)` only.

Then count semantic token adoption:

| Token                | Occurrences |
| -------------------- | ----------- |
| `text-page-title`    | ?           |
| `text-section-title` | ?           |
| `text-body`          | ?           |
| `text-label`         | ?           |
| `text-caption`       | ?           |
| `text-data`          | ?           |

Adoption ratio = semantic tokens / (semantic + raw classes in platform+ops).

## Part 2: Semantic Level Consistency

For each semantic level, check: do all instances use the same text size + weight combo?

| Semantic Level    | Expected Token                       | Search For                                         | Consistent? |
| ----------------- | ------------------------------------ | -------------------------------------------------- | ----------- |
| Page title (`h1`) | `text-page-title font-semibold`      | All `<h1>`, top-level headings in `page.tsx` files | ?           |
| Section title     | `text-section-title font-semibold`   | `<h2>`, `<h3>`, CardTitle usage                    | ?           |
| Card title        | Uses CardTitle primitive?            | `<CardTitle>` vs ad-hoc card headings              | ?           |
| Table header      | Uses Table primitive defaults?       | `<TableHead>` vs custom header styling             | ?           |
| Body text         | `text-body`                          | Primary content in pages                           | ?           |
| Label text        | `text-label font-medium`             | `<Label>`, `<label>`, ad-hoc labels                | ?           |
| Caption/helper    | `text-caption text-muted-foreground` | Small helper text patterns                         | ?           |
| Badge text        | Uses Badge primitive defaults?       | `<Badge>` sizes                                    | ?           |
| Nav items         | `text-label`                         | Lifecycle nav, service tabs, vertical nav          | ?           |
| Data cells        | `text-data font-mono`                | Prices, quantities, P&L values                     | ?           |

## Part 3: Parallel Type Systems

Search for files that define their own typography constants outside `globals.css`:

- `const FONT_SIZE =`, `const TEXT_SIZE =`, or similar
- `lib/config/` files with font size definitions
- Any Tailwind config override for font sizes
- Components with inline `style={{ fontSize: ... }}` (except charts)

These are parallel sources of truth to consolidate.

## Part 4: Migration Plan

For each finding, propose the fix:

- Which raw class → which semantic token
- Effort estimate per file group
- Priority order (most-used classes first)

## Output Expectations

- Token adoption ratio (% of text sizes going through semantic tokens)
- Raw usage count table
- Semantic consistency table
- Parallel type systems list
- Migration effort estimate
