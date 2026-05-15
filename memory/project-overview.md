---
name: project-overview
description: Core stack and architecture of the template-editor project
metadata:
  type: project
---

React + Vite + Tailwind CSS v4 + shadcn/ui template editor with Fabric.js canvas.

**Why:** Personal project — a whiteboard/canvas design tool with layer management, drawing tools, image filters, and diagram persistence via localStorage.

**How to apply:** Reference when choosing libraries or patterns — no Next.js, no TypeScript. Use .jsx files. Tailwind v4 config lives entirely in index.css via `@theme inline {}` (no tailwind.config.js).

Key paths:
- Entry: `src/main.jsx` → `src/App.jsx`
- Editor page: `src/pages/Editor/Editor.jsx` (called FabricEditor)
- Dashboard: `src/pages/Dashboard/Dashboard.jsx`
- Engine: `src/features/editor/engine/` (CanvasManager, EditorEngine, LayerManager, etc.)
- UI components: `src/components/ui/` (shadcn-style)
- Theme components: `src/components/theme/` (ThemeProvider, ThemeToggle, useTheme)
