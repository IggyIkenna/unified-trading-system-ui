# Module I — Responsive Design & Mobile Audit

## Search Patterns

1. Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:` — usage patterns
2. `hidden md:block` / `block md:hidden` — mobile vs desktop show/hide
3. Fixed widths: `w-[Npx]`, `min-w-[Npx]`, `max-w-[Npx]` — do they break on small screens?
4. Overflow: `overflow-x-auto`, `overflow-hidden`, `truncate` — are tables/grids horizontally scrollable?
5. Touch targets: are buttons/links large enough for touch (min 44x44px)?
6. `use-mobile.ts` hook — is it used consistently?
7. Viewport meta tag: is it set correctly?
8. Font sizes below 12px — problematic on mobile
