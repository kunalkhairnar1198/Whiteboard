---
name: theme-system
description: next-themes theme system — 4 themes, CSS variable tokens, ThemeToggle in Header and Dashboard
metadata:
  type: project
---

Theme system implemented with `next-themes` (v0.4.6).

**Why:** User requested a scalable, enterprise-ready multi-theme system with no flash, smooth transitions, and semantic tokens throughout.

**How to apply:** When adding new components, always use semantic Tailwind tokens (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`, `bg-secondary`, `bg-muted`, `bg-destructive`, etc.). Never use hardcoded hex colors like `#FF6B00` or Tailwind palette classes like `bg-white`.

## Architecture

- `src/components/theme/ThemeProvider.jsx` — wraps NextThemesProvider with `attribute="class"`, `defaultTheme="system"`, 4 themes
- `src/components/theme/ThemeToggle.jsx` — dropdown button with Sun/Moon/SunMoon/Building2/Palette icons; `compact` prop for header use
- `src/components/theme/useTheme.js` — re-exports `useTheme` from next-themes
- `src/main.jsx` — ThemeProvider wraps the entire app (inside ReduxProvider > BrowserRouter > NuqsAdapter)

## Themes

All themes defined as CSS class overrides in `src/index.css`:
- `.dark` — dark orange (existing)
- `.corporate` — navy/slate blue
- `.brand` — violet/purple
- `light` (default, `:root`) — orange/cream

System theme resolves to light or dark via `prefers-color-scheme`.

## Token → Tailwind mapping

Tailwind v4: no `tailwind.config.js`. Tokens mapped via `@theme inline {}` block in `src/index.css`.

## Theme transitions

`.theme-transitions` class applied to `<html>` 100ms after mount (in ThemeProvider) to avoid flash on initial load. Provides 200ms transitions on background, border, color.

## ThemeToggle placement

- Editor header: `src/features/editor/components/sidebar/Header/index.jsx` (compact=true, icon-only)
- Dashboard: `src/pages/Dashboard/Dashboard.jsx` (full label visible on sm+)
