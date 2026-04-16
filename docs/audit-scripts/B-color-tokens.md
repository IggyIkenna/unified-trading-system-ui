# Module B — Color Tokens, Theming & Theme-Readiness Audit

---

## SSOT Principle

**Can we switch between light and dark themes and have all colors update automatically?**

**Current state:** `globals.css` defines a full color token system in `:root` (light) and `.dark` (dark), wired through `next-themes`. Components using Tailwind semantic classes (`text-foreground`, `bg-card`, `text-pnl-positive`, `border-border`) switch automatically. Components using raw Tailwind palette colors (`text-zinc-400`, `bg-green-500`, `text-white`) or hardcoded hex values **will NOT switch** and will look broken in the alternate theme.

**This audit checks:** Are there colors that bypass the token system and will break theme switching?

---

## Part 1: Theme-Breaking Violations (Critical)

Search in `app/` and `components/` (NOT `globals.css`, NOT `node_modules/`) for:

### 1a. Raw Tailwind palette neutrals (bypass theme background/foreground)

| Pattern          | Replacement                                                    | Count |
| ---------------- | -------------------------------------------------------------- | ----- |
| `text-zinc-*`    | `text-foreground`, `text-muted-foreground`, or opacity variant | ?     |
| `text-gray-*`    | Same                                                           | ?     |
| `text-slate-*`   | Same                                                           | ?     |
| `text-neutral-*` | Same                                                           | ?     |
| `text-stone-*`   | Same                                                           | ?     |
| `bg-zinc-*`      | `bg-background`, `bg-card`, `bg-muted`, `bg-secondary`         | ?     |
| `bg-gray-*`      | Same                                                           | ?     |
| `bg-slate-*`     | Same                                                           | ?     |
| `border-zinc-*`  | `border-border` or `border-input`                              | ?     |
| `border-gray-*`  | Same                                                           | ?     |

### 1b. Raw Tailwind palette colors (bypass theme semantic colors)

| Pattern                          | Replacement                               | Count |
| -------------------------------- | ----------------------------------------- | ----- |
| `text-green-*`                   | `text-pnl-positive` or `text-status-live` | ?     |
| `text-red-*`                     | `text-pnl-negative` or `text-destructive` | ?     |
| `text-blue-*`                    | `text-status-running` or `text-primary`   | ?     |
| `text-cyan-*`                    | `text-primary`                            | ?     |
| `text-amber-*` / `text-yellow-*` | `text-status-warning`                     | ?     |
| `text-emerald-*`                 | `text-pnl-positive` or `text-status-live` | ?     |
| `text-rose-*`                    | `text-destructive`                        | ?     |
| `bg-green-*`                     | `bg-pnl-positive` (with opacity)          | ?     |
| `bg-red-*`                       | `bg-destructive` or `bg-pnl-negative`     | ?     |
| `bg-blue-*`                      | `bg-status-running` (with opacity)        | ?     |
| `bg-emerald-*`                   | `bg-status-live` (with opacity)           | ?     |
| `bg-amber-*`                     | `bg-status-warning` (with opacity)        | ?     |

### 1c. Absolute black/white (never appropriate in a themed app)

| Pattern      | Replacement                                                | Count |
| ------------ | ---------------------------------------------------------- | ----- |
| `text-white` | `text-foreground` or `text-primary-foreground`             | ?     |
| `text-black` | `text-foreground` or `text-background` (context-dependent) | ?     |
| `bg-white`   | `bg-background` or `bg-card`                               | ?     |
| `bg-black`   | `bg-background`                                            | ?     |

### 1d. Hardcoded hex values

| Pattern                                                         | Where Found | Replacement                        | Count |
| --------------------------------------------------------------- | ----------- | ---------------------------------- | ----- |
| `#hex` in className (arbitrary values like `text-[#22d3ee]`)    | ?           | Use semantic token                 | ?     |
| `color:` or `backgroundColor:` in inline `style={{}}`           | ?           | Use CSS variable or Tailwind class | ?     |
| `fill:` or `stroke:` with hardcoded hex in SVG/chart components | ?           | Use `var(--foreground)` etc.       | ?     |

### 1e. Hardcoded `rgb()`/`rgba()`/`hsl()`/`hsla()` in styles

Same treatment as hex — should reference CSS variables.

## Part 2: Token Coverage

Verify all token families from `globals.css` have Tailwind `@theme` mappings and are actually used:

| Token Family                                    | `:root` (light) | `.dark` | `@theme` mapping | Used in components? |
| ----------------------------------------------- | --------------- | ------- | ---------------- | ------------------- |
| Core (background, foreground, card, etc.)       | Yes             | Yes     | Yes              | ?                   |
| P&L (pnl-positive, pnl-negative)                | Yes             | Yes     | Yes              | ?                   |
| Status (live, warning, critical, idle, running) | Yes             | Yes     | Yes              | ?                   |
| Surface nav (trading, strategy, markets, etc.)  | Yes             | Yes     | Yes              | ?                   |
| Risk (healthy, warning, critical)               | Yes             | Yes     | Yes              | ?                   |
| Chart (chart-1 through chart-6)                 | Yes             | Yes     | Yes              | ?                   |
| Surface hierarchy (surface-1 through surface-4) | Yes             | Yes     | Yes              | ?                   |
| Sidebar                                         | Yes             | Yes     | Yes              | ?                   |
| Shadows (shadow-sm, shadow-md, shadow-lg)       | Yes             | Yes     | Yes              | ?                   |

## Part 3: Cross-Reference with branding.ts

Read `lib/config/branding.ts`. Check:

- Does it define any color values that diverge from `globals.css` tokens?
- Are its values used anywhere that bypasses the token system?
- Should it be deleted in favor of pure CSS token references?

## Part 4: Component Primitive Token Compliance

For each shadcn primitive in `components/ui/`, check:

- Does it use theme tokens exclusively? (most should already)
- Any hardcoded colors in: Badge, StatusBadge, Button variants, Select, Dialog, Tooltip

## Output Expectations

- Theme-breaking violation count by category (1a–1e)
- Top 10 worst offending files
- Token coverage table
- branding.ts divergence report
- Effort estimate to reach 100% theme-readiness
