# Module H — Accessibility (a11y) Audit

**Output:** `docs/UI-shared-components-Issues/08-ACCESSIBILITY-AUDIT.md`

## Search Patterns

1. Images without `alt` attributes: `<img` without `alt=`
2. Icons used as buttons without `aria-label`: icon-only `<button>` or clickable elements
3. Color-only indicators (no text/icon fallback for colorblind users)
4. Missing `role` attributes on interactive custom elements
5. Missing `aria-*` attributes on modals, dialogs, dropdowns, tooltips
6. Keyboard navigation: are all interactive elements focusable? Tab order logical?
7. `tabIndex` usage — overuse or misuse
8. Skip-to-content link: does one exist?
9. Focus trap: do modals/dialogs trap focus correctly?
10. Form labels: `<label htmlFor>` or `aria-labelledby` on all inputs?
11. Contrast: do status indicators rely solely on color?

## Primitive Checks

- Does `Button` have proper focus styles?
- Does `Dialog` / `Sheet` / `Drawer` have proper focus management?
- Does `Select` / `Combobox` have keyboard support?
- Does the sidebar have proper `nav` landmark?
