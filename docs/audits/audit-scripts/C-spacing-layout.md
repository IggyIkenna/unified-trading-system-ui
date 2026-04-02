# Module C — Spacing, Layout & Structural Consistency Audit

**Output:** `docs/UI-shared-components-Issues/03-SPACING-LAYOUT-AUDIT.md`

---

## SSOT Principle

**Can we change page padding / section gaps / card padding in ONE place?**

**Current state:** `globals.css` `@theme` block now defines semantic spacing tokens:

```
--spacing-page: 1.5rem       (24px — page-level padding)
--spacing-section: 1rem      (16px — gap between page sections)
--spacing-card: 1rem         (16px — card internal padding)
--spacing-widget: 0.75rem    (12px — widget internal padding)
--spacing-cell: 0.5rem       (8px — table cell padding, tight gaps)
--spacing-tight: 0.25rem     (4px — minimal gaps)
```

These create Tailwind utilities: `p-page`, `gap-section`, `p-card`, `p-widget`, `p-cell`, `gap-tight` etc.

Additionally, theme-aware shadow tokens exist: `shadow-sm`, `shadow-md`, `shadow-lg` (different values for light and dark).

**This audit checks:** Are components using semantic spacing tokens, or raw Tailwind values? Is the page structure consistent?

---

## Part 1: Spacing Token Adoption

Search `app/(platform)/` and `app/(ops)/` page files for padding/gap patterns:

### Page-level padding

| Pattern                        | Occurrences | Expected                                | Status |
| ------------------------------ | ----------- | --------------------------------------- | ------ |
| `p-4` (16px)                   | ?           | Should be `p-page` (24px)               | ?      |
| `p-6` (24px)                   | ?           | Should be `p-page`                      | ?      |
| `p-8` (32px)                   | ?           | Too much — should be `p-page`           | ?      |
| `px-4`, `px-6`, `py-4`, `py-6` | ?           | Should use `p-page` or semantic variant | ?      |
| `p-page`                       | ?           | Correct usage                           | --     |

### Section gaps

| Pattern       | Occurrences | Expected                                     | Status |
| ------------- | ----------- | -------------------------------------------- | ------ |
| `space-y-4`   | ?           | Should be `space-y-section` or `gap-section` | ?      |
| `space-y-6`   | ?           | Same                                         | ?      |
| `gap-4`       | ?           | Should be `gap-section`                      | ?      |
| `gap-6`       | ?           | Same                                         | ?      |
| `gap-section` | ?           | Correct usage                                | --     |

### Card/widget padding

| Pattern                        | Occurrences | Expected                       | Status |
| ------------------------------ | ----------- | ------------------------------ | ------ |
| Card primitive default padding | ?           | Should use `p-card` internally | ?      |
| Ad-hoc `p-3`, `p-4` on cards   | ?           | Should use `p-card`            | ?      |
| Widget wrapper padding         | ?           | Should use `p-widget`          | ?      |
| `p-card` / `p-widget`          | ?           | Correct usage                  | --     |

### Tight spacing

| Pattern                     | Occurrences | Expected                              | Status        |
| --------------------------- | ----------- | ------------------------------------- | ------------- |
| `gap-1`, `gap-1.5`, `gap-2` | ?           | `gap-tight` (4px) or `gap-cell` (8px) | Check context |
| `space-y-1`, `space-y-2`    | ?           | Same                                  | Check context |

Adoption ratio = semantic tokens / (semantic + raw values in platform+ops).

## Part 2: Page Structure Consistency

For every `page.tsx` in `app/(platform)/`:

| Page | Root wrapper | Padding | Max-width | Gap pattern | Consistent? |
| ---- | ------------ | ------- | --------- | ----------- | ----------- |

Check:

1. Do all pages use `platform-page-width` class (or `container`)?
2. Do all pages use consistent padding?
3. Is there a shared `PageWrapper` / `PageShell` component? If not, should there be?
4. Are responsive breakpoints used consistently (`sm:`, `md:`, `lg:`)

## Part 3: Shadow Token Adoption

Search for shadow usage:

| Pattern                        | Occurrences | Expected                         | Status |
| ------------------------------ | ----------- | -------------------------------- | ------ |
| `shadow-sm` (Tailwind default) | ?           | Should match `globals.css` token | Check  |
| `shadow-md`                    | ?           | Same                             | Check  |
| `shadow-lg`                    | ?           | Same                             | Check  |
| `shadow-[...]` arbitrary       | ?           | Should use token                 | Fix    |
| `boxShadow:` in inline styles  | ?           | Should use `var(--shadow-*)`     | Fix    |

Note: since the `@theme` block defines `--shadow-sm/md/lg`, using Tailwind's `shadow-sm`/`shadow-md`/`shadow-lg` classes **is correct** — they already reference the tokens.

## Part 4: Container / Max-Width Consistency

| Pattern                          | Occurrences | Expected                               |
| -------------------------------- | ----------- | -------------------------------------- |
| `max-w-7xl`                      | ?           | Should use `platform-page-width` class |
| `max-w-[1800px]` / `max-w-[Npx]` | ?           | Same                                   |
| `max-w-screen-2xl`               | ?           | Same                                   |
| `platform-page-width` class      | ?           | Correct                                |
| `container` class                | ?           | Correct (uses same token)              |

## Part 5: Parallel Layout Systems

Search for:

- `const PAGE_PADDING =` or similar constants
- Wrapper components that set their own max-width
- Multiple different responsive patterns across pages

## Output Expectations

- Spacing token adoption ratio
- Page structure consistency table (every platform page)
- Shadow token adoption table
- Container/max-width consistency table
- Parallel layout systems list
- Migration effort estimate
