# Architecture Overview

> Last updated: 2026-05-13

This project is a professional-grade design editor built with React 19 and Fabric.js 6, utilizing a centralized Redux store and an imperative "Engine" for canvas operations.

---

## Core Technologies

| Layer             | Technology                                       |
| :---------------- | :----------------------------------------------- |
| **UI Framework**  | React 19 (Functional components, hooks)          |
| **Build Tool**    | Vite 7                                           |
| **Canvas Engine** | Fabric.js 6.7.1 — object-based canvas management |
| **State**         | Redux Toolkit — Reactive UI state                |
| **Drag & Drop**   | `@dnd-kit/core` + `@dnd-kit/sortable`            |
| **URL State**     | `nuqs` — URL-driven view parameters              |
| **Persistence**   | LocalStorage auto-save via PersistenceService    |

---

## Application Entry Flow

```
main.jsx → App.jsx → [Route] → Dashboard OR Editor
```

- `App.jsx` manages workspace routing.
- `Dashboard.jsx` handles project listing and entry.
- `Editor.jsx` initializes the engine and provides the workspace UI.

---

## Directory Structure (Standardized)

```
src/
├── pages/                         # Page-level route components
│   ├── Dashboard/                 # Projects list & creation
│   └── Editor/                    # The primary workspace page
├── store/                         # Global Redux state management
│   ├── slices/                    # editor, tool, layer, selection slices
│   ├── index.js                   # Store configuration
│   └── engineSync.js              # Sync bridge: Engine events → Redux dispatch
├── components/ui/                 # shadcn UI primitives
└── features/
    └── editor/                    # CORE EDITOR MODULE
        ├── engine/                # Imperative Fabric.js logic (The "Engine")
        │   ├── EditorEngine.js    # Central orchestrator
        │   ├── CanvasManager.js   # Canvas lifecycle & size
        │   ├── LayerManager.js    # Visibility, z-index, reordering
        │   ├── ToolManager.js     # Tool state & event routing
        │   ├── SelectionManager.js # Selection & group management
        │   ├── HistoryManager.js  # Undo/Redo stack
        │   └── PersistenceService.js # LocalStorage sync
        ├── hooks/                 # React hooks (useEditor, useSelection)
        ├── tools/                 # Modular tools (Shape, Pen, Text, etc.)
        └── utils/                 # Pure helper functions
```

---

## Key Components

### Editor Page (`src/pages/Editor/Editor.jsx`)

The main container for the workspace. It orchestrates the lifecycle of the `EditorEngine`:

- Initializes the engine via `useEditor`.
- Provides `EngineContext` to the sidebar and toolbar.
- Sets up the `engineSync` bridge to mirror engine state into Redux.
- Handles responsive layouts for sidebars and the canvas area.

### Layers Panel (`src/features/editor/components/sidebar/RightSidebar/LayersPanel.jsx`)

A high-performance layer list using `@dnd-kit`:

- **State Source**: Reads from Redux `selectLayerList`.
- **Interactions**: Drag-and-drop reordering, visibility toggle, locking, and renaming.
- **Engine Sync**: Reordering events are sent directly to `engine.layers.setOrder()`.

---

## Data Flow

### The "Engine-as-Brain" Pattern

We use a one-way synchronization bridge (`engineSync.js`) to keep the UI reactive without bloating the engine with React dependencies.

```text
1. User Action (UI) → Engine Manager Call (e.g. engine.layers.move())
2. Engine Manager   → Mutates Fabric.js Canvas
3. Engine Manager   → Emits Event on Engine Bus (e.g. 'layer:updated')
4. engineSync.js    → Listens for Event → Dispatches Redux Action
5. Redux Store      → Updates State
6. UI Components    → Re-render via useSelector()
```

### Undo/Redo Flow

The `HistoryManager` maintains a snapshot buffer.

1. `safeSaveState()` serializes the canvas JSON.
2. The snapshot is pushed to the buffer and written to `localStorage`.
3. On `undo()`, the previous snapshot is loaded back into the canvas, and all managers are `refresh()`ed to sync state.

---

## Design System

- **Theme:** Modern dark mode with custom curated color palettes.
- **Components:** Built on top of shadcn/ui and Radix UI primitives.
- **Layout:** Fluid workspace with collapsable sidebars using `SidebarProvider`.
- **Canvas:** Glassmorphism-inspired container with subtle gradients.
