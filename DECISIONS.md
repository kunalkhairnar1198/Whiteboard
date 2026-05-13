# Project Decision Log & History

This document tracks all significant architectural decisions and feature implementations to ensure continuity and context preservation across development sessions.

| Date | Change Type | Rationale | Affected Components |
| :--- | :--- | :--- | :--- |
| 2026-05-11 | Feature | **Fine-grained URL State**: Implemented `nuqs` to synchronize zoom and active tool with the URL for better sharability. | `FabricEditor/index.jsx` |
| 2026-05-11 | Feature | **404 Error Handling**: Added an `EditorWrapper` to validate diagram existence and a `NotFound` component for invalid IDs. | `App.jsx` |
| 2026-05-11 | Architecture | **Routing Migration**: Replaced state-based navigation with React Router to support URL-driven state and browser history. | `App.jsx`, `main.jsx` |
| 2026-05-11 | Architecture | **Baseline Initialization**: Established a feature-based architecture centered around a Fabric.js editor with Workspace management. | `src/features/editor`, `src/App.jsx`, `src/lib/persistence.js` |
| 2026-05-11 | Feature | **Infinite Canvas & Navigation**: Implemented spacebar-panning, wheel-zoom, and infinite grid to support large-scale diagrams. | `FabricEditor/index.jsx`, `lib/canvasUtils.js` |
| 2026-05-11 | Feature | **Workspace Persistence**: Added named workspace support with auto-save (debounced) and Dashboard entry point. | `Dashboard/index.jsx`, `lib/persistence.js`, `App.jsx` |
| 2026-05-11 | Feature | **Canvas Actions**: Added "Flush Canvas" functionality to clear all layers while preserving the system grid. | `Header/index.jsx`, `FabricEditor/index.jsx` |
| 2026-05-11 | Architecture | **Routing Constants**: Refactored view management to use a central `ROUTES` constant for cleaner navigation logic. | `constants/routes.js`, `App.jsx` |
| 2026-05-11 | Configuration | **Agent Governance**: Created `.agents/rules/` to enforce documentation standards and decision logging. | `.agents/rules/history-management.md`, `DECISIONS.md` |

## Technical Baseline

- **Framework**: React 19 (Vite)
- **Canvas Library**: Fabric.js 6.7.1
- **Styling**: Tailwind CSS + Shadcn/UI
- **Icons**: Lucide-React
- **Persistence Strategy**: LocalStorage with workspace-key prefixing and debounced auto-save (1s).
- **Navigation**: State-based switching between Dashboard and Editor views.
