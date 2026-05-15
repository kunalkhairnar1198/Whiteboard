# Color Architecture

## Stack

- **Tailwind CSS v4** — `@import 'tailwindcss'` (no `tailwind.config.js`)
- **Color space** — `oklch()` throughout (perceptually uniform, wide gamut safe)
- **Token layer** — CSS variables in `:root` → mapped to Tailwind via `@theme inline {}`
- **Dark mode** — `.dark` class override (add `class="dark"` to `<html>`)

---

## Design Tokens (`src/index.css`)

All tokens live in `:root`. Tailwind reads them through the `@theme inline` block, making every token available as a utility class (e.g. `bg-primary`, `text-muted-foreground`).

### Core Palette — Light Mode

| Token | oklch value | Hex approx. | Usage |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` | `#FFFFFF` | Page / canvas background |
| `--foreground` | `oklch(0.12 0 0)` | `#1A1A1A` | Body text |
| `--primary` | `oklch(0.66 0.22 42)` | `#FF6B00` | Buttons, active states, highlights |
| `--primary-foreground` | `oklch(1 0 0)` | `#FFFFFF` | Text on primary (orange) surfaces |
| `--secondary` | `oklch(0.98 0.02 70)` | `#FFF4EC` | Secondary buttons, subtle fills |
| `--secondary-foreground` | `oklch(0.12 0 0)` | `#1A1A1A` | Text on secondary surfaces |
| `--card` | `oklch(0.98 0.02 70)` | `#FFF4EC` | Cards, panels, sidebars |
| `--card-foreground` | `oklch(0.12 0 0)` | `#1A1A1A` | Text inside cards |
| `--popover` | `oklch(1 0 0)` | `#FFFFFF` | Dropdowns, tooltips |
| `--popover-foreground` | `oklch(0.12 0 0)` | `#1A1A1A` | Text inside popovers |
| `--muted` | `oklch(0.95 0.02 65)` | — | Disabled / subdued fills |
| `--muted-foreground` | `oklch(0.45 0.04 42)` | — | Placeholder text, captions |
| `--accent` | `oklch(0.96 0.04 60)` | — | Hover tints, accent fills |
| `--accent-foreground` | `oklch(0.54 0.19 42)` | `#CC5500` | Text on accent surfaces |
| `--destructive` | `oklch(0.6 0.2 25)` | — | Delete, error states |
| `--destructive-foreground` | `oklch(1 0 0)` | `#FFFFFF` | Text on destructive |
| `--border` | `oklch(0.90 0.06 58)` | `#FFD6B3` | All borders |
| `--input` | `oklch(0.90 0.06 58)` | `#FFD6B3` | Input borders |
| `--ring` | `oklch(0.66 0.22 42 / 0.4)` | `#FF6B00` @40% | Focus rings |

### Interactive States (Hardcoded where CSS variables are insufficient)

| State | Hex | Tailwind class |
|---|---|---|
| Default (primary) | `#FF6B00` | `bg-[#FF6B00]` |
| Hover | `#FF8C38` | `hover:bg-[#FF8C38]` |
| Active / pressed | `#CC5500` | `active:bg-[#CC5500]` or `hover:bg-[#CC5500]` |
| Light tint (fills) | `#FFF4EC` | `bg-[#FFF4EC]` |
| Border / outline | `#FFD6B3` | `border-[#FFD6B3]` |

> These five hex values are declared inline on components that need states (e.g. buttons, layer items) because Tailwind v4's arbitrary-value syntax makes them just as refactor-safe as a variable.

---

## Sidebar Tokens

Sidebar has its own token namespace so it can be themed independently.

| Token | Light value | Dark value |
|---|---|---|
| `--sidebar` | `#FFF4EC` | dark warm gray |
| `--sidebar-foreground` | `#1A1A1A` | near-white |
| `--sidebar-primary` | `#FF6B00` | `#FF8C38` |
| `--sidebar-primary-foreground` | `#FFFFFF` | near-black |
| `--sidebar-accent` | warm tint | dark warm |
| `--sidebar-accent-foreground` | `#CC5500` | near-white |
| `--sidebar-border` | `#FFD6B3` | dark orange-gray |
| `--sidebar-ring` | `#FF6B00` @20% | `#FF8C38` @40% |

---

## Dashboard Tokens

Dashboard uses a separate gradient background and glass-card effect. These tokens are **light-mode only** on the dashboard (warm cream gradient).

| Token | Light | Dark |
|---|---|---|
| `--dashboard-gradient-from` | `oklch(0.97 0.03 65)` — warm cream | very dark warm |
| `--dashboard-gradient-to` | `oklch(1 0 0)` — white | near-black |
| `--dashboard-card` | `#FFF4EC` @80% opacity | dark warm @80% |
| `--dashboard-card-hover` | slightly deeper cream @95% | darker warm @95% |

Used in `Dashboard.jsx` via: `bg-gradient-to-br from-dashboard-from to-dashboard-to`

---

## Dark Mode

Dark mode is activated by adding `class="dark"` to the `<html>` element. All tokens are overridden in the `.dark {}` block in `index.css`. The orange hue is preserved but brightened so it reads well on dark backgrounds.

| Token | Dark value | Hex approx. |
|---|---|---|
| `--primary` | `oklch(0.73 0.17 50)` | `#FF8C38` (lighter orange) |
| `--background` | `oklch(0.1 0.01 55)` | very dark warm |
| `--card` | `oklch(0.14 0.02 55)` | dark warm gray |
| `--border` | `oklch(0.28 0.06 48)` | dark orange-gray |
| `--foreground` | `oklch(0.97 0.01 60)` | near-white |

---

## `@theme inline` — Token → Tailwind Mapping

The `@theme inline {}` block in `index.css` exposes every CSS variable as a Tailwind utility. This means:

```css
/* index.css */
--color-primary: var(--primary);
```

Becomes usable as:

```jsx
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
```

No `tailwind.config.js` needed. Adding a new token is a two-step process:

1. Declare it in `:root {}` (and in `.dark {}` if needed)
2. Map it in `@theme inline {}`

---

## Changing the Theme

To switch the entire app to a different color palette, only `index.css` needs to change. Update the `--primary`, `--background`, `--card`, `--border`, and `--ring` variables in `:root` and `.dark`. All components that use semantic class names (`bg-primary`, `text-muted-foreground`, `border-border`, etc.) update automatically.

Components that use hardcoded hex values (`bg-[#FF6B00]`, `border-[#FFD6B3]`, etc.) will need a find-and-replace across the five values listed in the **Interactive States** table above.

---

## File Map

| File | Role |
|---|---|
| `src/index.css` | Single source of truth for all tokens |
| `src/components/ui/button.jsx` | Primary / secondary / destructive button variants |
| `src/components/ui/sidebar.jsx` | Sidebar shell, uses `bg-sidebar` token |
| `src/components/ui/card.jsx` | Card shell, uses `bg-card` token |
| `src/components/ui/dialog.jsx` | Modal shell, uses `bg-background` token |
| `src/components/ui/input.jsx` | Input border uses `border-input` token |
| `src/features/editor/components/sidebar/LeftSidebar/` | Settings panel |
| `src/features/editor/components/sidebar/RightSidebar/` | Inspector panels (Properties, Layers, Filters, Tools) |
| `src/features/editor/components/Toolbar/EditorToolbar.jsx` | Floating tool palette |
| `src/features/editor/components/layer-item/LayerItem.jsx` | Layer row with selection/hover states |
| `src/pages/Dashboard/Dashboard.jsx` | Landing page, uses dashboard-* tokens |
| `src/App.jsx` | 404 page |
