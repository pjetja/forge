# Design Tokens — Forge

Source of truth: `src/app/globals.css` `@theme inline` block.
These tokens drive all UI styling across the application. Update this file whenever `globals.css` changes.

---

## Colors

| Token | CSS Variable | Hex | Swatch | Usage |
|-------|-------------|-----|--------|-------|
| bg-page | `--color-bg-page` | `#0f172a` | <span style="display:inline-block;width:20px;height:20px;background-color:#0f172a;border:1px solid #fff;vertical-align:middle;"></span> | Page background (dark navy) |
| bg-surface | `--color-bg-surface` | `#1e293b` | <span style="display:inline-block;width:20px;height:20px;background-color:#1e293b;border:1px solid #fff;vertical-align:middle;"></span> | Card/panel surface |
| border | `--color-border` | `#334155` | <span style="display:inline-block;width:20px;height:20px;background-color:#334155;border:1px solid #fff;vertical-align:middle;"></span> | Borders and dividers |
| accent | `--color-accent` | `#10b981` | <span style="display:inline-block;width:20px;height:20px;background-color:#10b981;border:1px solid #fff;vertical-align:middle;"></span> | Primary CTA (emerald) |
| accent-hover | `--color-accent-hover` | `#34d399` | <span style="display:inline-block;width:20px;height:20px;background-color:#34d399;border:1px solid #fff;vertical-align:middle;"></span> | Hover state (lighter emerald) |
| text-primary | `--color-text-primary` | `#e2e8f0` | <span style="display:inline-block;width:20px;height:20px;background-color:#e2e8f0;border:1px solid #fff;vertical-align:middle;"></span> | Body and heading text (near-white) |
| error | `--color-error` | `#ef4444` | <span style="display:inline-block;width:20px;height:20px;background-color:#ef4444;border:1px solid #fff;vertical-align:middle;"></span> | Error background/border (red) |
| error-light | `--color-error-light` | `#f87171` | <span style="display:inline-block;width:20px;height:20px;background-color:#f87171;border:1px solid #fff;vertical-align:middle;"></span> | Error text (lighter red) |

---

## Typography

**Font family:** Lato (loaded via `next/font`, injected as `--font-lato` CSS variable, applied via `--font-sans` in `@theme inline`)

**Weights used:** 400 (Regular), 700 (Bold)

**Scale (Tailwind default):**

| Class | Size | Sample |
|-------|------|--------|
| `text-xs` | 12px | <span style="font-size:12px">The quick brown fox jumps over the lazy dog</span> |
| `text-sm` | 14px | <span style="font-size:14px">The quick brown fox jumps over the lazy dog</span> |
| `text-base` | 16px | <span style="font-size:16px">The quick brown fox jumps over the lazy dog</span> |
| `text-lg` | 18px | <span style="font-size:18px">The quick brown fox jumps over the lazy dog</span> |
| `text-xl` | 20px | <span style="font-size:20px">The quick brown fox jumps over the lazy dog</span> |
| `text-2xl` | 24px | <span style="font-size:24px">The quick brown fox jumps over the lazy dog</span> |

**Usage in codebase:**
- `text-sm` / `text-base` — body copy, form labels, table rows
- `text-lg` / `text-xl` — section headings, card titles
- `text-2xl` — page headings
- `font-medium` / `font-semibold` / `font-bold` — heading hierarchy

---

## ForgeLogo Brand Colors

Note: These are hard-coded in the `ForgeLogo` component (not CSS variables) — use these exact values when placing the logo in Figma.

| Element | Hex | Notes |
|---------|-----|-------|
| Icon fill (emerald) | `#10b981` | Same as `--color-accent` |
| Text/wordmark fill (slate) | `#e2e8f0` | Same as `--color-text-primary` |

Logo variants:
- **Horizontal** (`ForgeLogo` default) — icon + wordmark side by side, used in nav (height: `h-7`)
- **Icon only** (`ForgeLogo variant="icon"`) — icon only, used in favicon (`icon.svg`) and auth pages (height: `h-10`)

---

## Figma Sync Note

These tokens are manually synced — update this file and Figma token swatches whenever `src/app/globals.css` `@theme inline` changes.

There is no automated token bridge. When changing a color:
1. Update `src/app/globals.css` `@theme inline`
2. Update the matching row in this table
3. Update the corresponding color swatch fill in the Figma file (Tokens page)
