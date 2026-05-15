# Project Context for Claude

## Tech Stack
- **React** 19, **Vite** 7, **Tailwind CSS** 4 (config via `src/index.css`, no `tailwind.config.js`)
- **Fabric.js** 6.7.1 — canvas rendering engine
- **Redux Toolkit** — global UI state + engine sync bridge
- **dnd-kit** — layer drag-and-drop
- **next-themes** 0.4.6 — theme management (localStorage + system detection)
- **shadcn/ui** conventions — component patterns, CSS variable tokens

## Architecture
Engine-driven: a plain-JS `EditorEngine` owns the Fabric canvas. React components read state via Redux selectors and `EngineContext`. No direct canvas mutation from React — all changes go through the engine.

Key folders:
- `src/features/editor/engine/` — core logic (CanvasManager, LayerManager, ToolManager, HistoryManager, SelectionManager, RenderManager, PersistenceService, EventBus)
- `src/features/editor/engine/tools/` — tool classes (Tool base, SelectTool, BrushTool, PenTool, EraserTool, ShapeTool, TextTool, PanTool, PenToolBridge)
- `src/store/` — Redux slices and engine sync bridge
- `src/pages/` — Dashboard, Editor (FabricEditor)
- `src/components/ui/` — UI primitives (button, card, dialog, input, separator, sidebar)
- `src/components/theme/` — ThemeProvider, ThemeToggle, useTheme

## Theme System
- 4 themes: `light` (default orange/cream), `dark` (dark orange), `corporate` (navy/slate), `brand` (violet/purple)
- All tokens defined as CSS variables in `src/index.css` using `oklch()` color space
- Tailwind reads tokens via `@theme inline {}` block — no config file needed
- `ThemeProvider` uses `next-themes` with `attribute="class"` — adds class to `<html>`
- `ThemeToggle` uses `createPortal` + `fixed` positioning to escape stacking contexts (important: `backdrop-blur` on the header creates a stacking context)
- Toggle appears in: editor Header (compact/icon mode) and Dashboard header

## Styling Rules
- **Never** use hardcoded hex colors (`#FF6B00`, etc.) or Tailwind palette classes (`bg-white`, `text-black`, `bg-red-500`)
- **Always** use semantic tokens: `bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `bg-secondary`, `bg-muted`, `bg-destructive`, `border-border`, `text-muted-foreground`
- Raw `<input>`, `<select>`, `<textarea>` must have `bg-background text-foreground`
- Dropdowns/popovers inside `backdrop-blur` ancestors must use `createPortal` + `z-[9999]`
- Scrollbars hidden via `no-scrollbar` class (defined in `src/index.css`) on `SidebarContent` and canvas container

## File conventions
- `.jsx` only — no TypeScript
- Named exports for UI/utility, default exports for page/feature components
- `cn()` from `@/lib/utils` for conditional class merging

## Available Project Commands (`.claude/commands/`)
| Command | Purpose |
|---------|---------|
| `/project-status` | Show git status, build health, and current project state |
| `/add-theme` | Add a new custom theme with full token set |
| `/fix-colors` | Scan and replace all hardcoded colors with semantic tokens |
| `/new-component` | Scaffold a new component following project conventions |
| `/add-tool` | Add a new Fabric.js canvas tool end-to-end |
| `/update-context` | Re-scan project and refresh this context file |
| `/audit-ui` | Full UI audit: colors, z-index, scrollbars, theme toggle presence |
