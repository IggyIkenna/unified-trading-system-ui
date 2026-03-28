# Task 04 — Shared Component Extraction & Centralization

**Source:** Audit `04-SHARED-COMPONENT-REUSE-AUDIT.md`
**WORK_TRACKER:** §3 (Component Centralization), §4.x (Widget Merging prereqs)
**Priority:** P1 — every page refactored after this benefits from shared components

---

## Goal

Create missing shared components that are currently reimplemented ad-hoc across dozens of files. After this task, there is exactly ONE way to render a page header, one way to show an empty state, one shared nav-active helper, and unused UI primitives are cleaned up.

---

## Part 1 — Extract `isServiceTabActive` nav helper

**Problem:** Identical active-tab logic is duplicated byte-for-byte in 3 places:
- `components/shell/service-tabs.tsx` lines 150-153
- `components/shell/trading-vertical-nav.tsx` lines 141-147 (isFamilyActive)
- `components/shell/trading-vertical-nav.tsx` lines 160-163 (renderTabItem)
- Custom panel active check at lines 313-314 (partial duplicate)

**Deliverable:**

Create `lib/utils/nav-helpers.ts`:

```typescript
import type { ServiceTab } from "@/components/shell/service-tabs";

export function isServiceTabActive(pathname: string, tab: ServiceTab): boolean {
  const matchPath = tab.matchPrefix || tab.href;
  return tab.exact
    ? pathname === tab.href || pathname === `${tab.href}/`
    : pathname === tab.href || pathname.startsWith(matchPath + "/");
}

export function isPathActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
```

Then update:
- `components/shell/service-tabs.tsx` — replace inline logic with `isServiceTabActive(pathname, tab)`
- `components/shell/trading-vertical-nav.tsx` — replace all 3 duplicated blocks with the shared helpers
- Verify: `pnpm typecheck`, test in browser that active tab highlighting still works for lifecycle nav, service tabs, family groups, and custom panels.

**Files:** `lib/utils/nav-helpers.ts` (new), `components/shell/service-tabs.tsx`, `components/shell/trading-vertical-nav.tsx`

---

## Part 2 — Create `PageHeader` component

**Problem:** ~89 ad-hoc `<h1>` elements across `app/` pages. No consistent page header pattern. Some pages have title + description + actions, others have just a bare `<h1>`, and they all use different text sizes, padding, and layout.

**Deliverable:**

Create `components/platform/page-header.tsx`:

```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;  // actions slot (buttons, filters, etc.)
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h1 className="text-page-title font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-body text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}
```

**Migration priority (highest ad-hoc count first):**

| Priority | Files to Migrate | Notes |
|----------|-----------------|-------|
| First 10 | Platform pages with simple `<h1>` + description pattern | Straightforward replacement |
| Next 10 | Pages with `<h1>` + action buttons | Use `children` slot for buttons |
| Remaining | Pages with complex headers | May need `PageHeader` variants or just `title` + `children` |

**Do NOT migrate:**
- `app/(public)/` marketing pages — they have intentionally different, branded headers
- Pages where the heading is inside a Card or other container (those are section titles, not page titles)

**Files:** `components/platform/page-header.tsx` (new), then 20+ `page.tsx` files across `app/(platform)/` and `app/(ops)/`

---

## Part 3 — Consolidate `EmptyState`

**Problem:** Two `EmptyState` implementations exist:
- `components/ui/empty-state.tsx` — the canonical shared version (4 adopters)
- `components/trading/sports/shared.tsx` — exports its own `EmptyState` (used by sports components)

Plus ~10 files with inline "No data" / "No results" text that don't use either.

**Deliverable:**

1. Read both `EmptyState` implementations. Merge any missing features from the sports version into `components/ui/empty-state.tsx`.
2. Update all sports component imports to use `@/components/ui/empty-state`.
3. Delete the `EmptyState` export from `components/trading/sports/shared.tsx` (keep other exports if any).
4. Find all inline "No data" / "No results" patterns and replace with `<EmptyState>`.
5. Verify no duplicate `EmptyState` exists anywhere.

**Files:** `components/ui/empty-state.tsx`, `components/trading/sports/shared.tsx`, ~14 consumer files

---

## Part 4 — Promote `DataTable` adoption

**Problem:** 43 files use raw `<table>` elements. Only 9 import `DataTable`. Raw tables miss sorting, pagination, column resize, and consistent styling.

**Deliverable:**

This is a larger effort. For this task, do the **assessment only**:

1. List all 43 files with raw `<table>`.
2. For each, classify: (a) should use `DataTable` — standard tabular data with sortable columns, (b) should stay as raw `<table>` — intentionally custom (e.g., options chain grid, comparison matrix), (c) ambiguous.
3. Migrate the top 5 most straightforward cases to `DataTable`.
4. Document the remaining candidates for a follow-up task.

**Files:** `components/ui/data-table.tsx` (reference), 43 files with raw `<table>`

---

## Part 5 — Clean up unused `components/ui/` files

**Problem:** ~28 `components/ui/*.tsx` files have zero imports. They were scaffolded from shadcn but never wired up. They add confusion and bundle noise.

**Deliverable:**

1. For each of the ~28 files, verify it truly has zero imports: `rg "from.*@/components/ui/<filename>" app/ components/ hooks/ lib/`
2. Classify each: (a) delete — we don't use it and don't plan to, (b) keep — we'll need it soon for a planned feature, (c) wire up — it should be used but isn't.
3. Delete category (a) files.
4. Document category (b) and (c) with a one-line justification.

**Files:** ~28 files in `components/ui/`

---

## Rules

1. **One canonical implementation per pattern.** After this task, there must be exactly ONE `PageHeader`, ONE `EmptyState`, ONE `isServiceTabActive`. No duplicates, no "V2", no shims.
2. **Use the new semantic tokens.** `PageHeader` should use `text-page-title`, `text-body`, etc. from `globals.css`. Not raw `text-xl`, `text-sm`.
3. **Update all consumers.** After creating a shared component, find every file that has the ad-hoc version and migrate it. Don't leave half the codebase on the old pattern.
4. **Delete the old code.** No `// deprecated` comments. No re-export wrappers. The old implementation is gone.
5. **Test in browser.** Load at least 3 different platform pages to verify `PageHeader` renders correctly. Check the trading tabs to verify `isServiceTabActive` works. Check sports page to verify `EmptyState` works.

---

## Acceptance Criteria

- [ ] `lib/utils/nav-helpers.ts` exists with `isServiceTabActive` and `isPathActive`
- [ ] `service-tabs.tsx` and `trading-vertical-nav.tsx` use the shared helpers (zero inline active logic)
- [ ] `components/platform/page-header.tsx` exists and is used by 10+ platform pages
- [ ] No duplicate `<h1>` + description patterns in migrated pages
- [ ] Single `EmptyState` in `components/ui/empty-state.tsx` — zero duplicates
- [ ] All inline "No data" / "No results" in platform pages use `EmptyState`
- [ ] Top 5 raw `<table>` files migrated to `DataTable`
- [ ] Unused `components/ui/` files deleted (with justification for any kept)
- [ ] `pnpm typecheck` passes
- [ ] App loads and renders correctly

---

## Self-Evaluation Checklist

When you finish, stop and honestly answer these before claiming done:

1. **Is the `PageHeader` component actually good?** Does it handle the real-world variations you saw across pages — title only, title + description, title + description + action buttons, title + badge? Or did you build something so simple it only works for 3 pages and the rest need workarounds? A shared component that doesn't fit most use cases is worse than no shared component.

2. **Did I migrate enough consumers to prove the pattern?** Creating `PageHeader` and using it in 2 pages proves nothing. If you migrated 10+ pages and they all look right, the pattern is validated. If you stopped at 3 because "the others are more complex", go back and handle the complex ones — that's where the real value is.

3. **Is the nav helper actually correct?** Did you test it with: (a) exact match tabs, (b) prefix match tabs, (c) family group tabs with `exact: true`, (d) custom panels? All four cases must work. If you only tested case (a), the others might be broken.

4. **Did I actually delete the duplicate code?** Check: `rg "EmptyState" components/trading/sports/` should return zero after migration. Check: the inline active-tab logic in `service-tabs.tsx` is gone, not commented out. If you left "just in case" code, delete it now.

5. **Would I be proud to show this to a senior engineer?** Not "does it work" but "is it well-crafted". Are the component props intuitive? Is the API flexible enough for future use cases but not over-engineered? Are the file names clear? Is the code clean?

6. **Did I create future debt?** Examples of debt: `PageHeader` that doesn't support breadcrumbs (when we'll clearly need it). `isServiceTabActive` that doesn't handle nested routes (when we clearly have them). `EmptyState` that can't show a CTA button (when half the "No data" screens need one). Think about what the NEXT developer will need, not just what you need right now.

**If the answer to any of these is "no" — go fix it before marking done.**
