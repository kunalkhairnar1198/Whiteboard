# Project Flow & Directory Structure

## 1. Project Overview

The **Template Editor** is a professional-grade, browser-based design tool. It leverages **Fabric.js** for canvas manipulation, **Redux Toolkit** for centralized state management, and a custom **Engine-based architecture** to decouple business logic from the UI.

---

## 2. Directory Structure (Standardized)

```text
/src
├── assets/             # Static assets (images, fonts)
├── components/         # Shared UI Components
│   └── ui/             # shadcn/ui primitives (Button, Card, Sidebar, etc.)
├── features/           # Feature-specific logic
│   └── editor/         # Core Editor logic
│       ├── engine/     # Fabric.js Integration (The "Engine")
│       │   ├── EditorEngine.js    # Central orchestrator
│       │   ├── LayerManager.js    # Layer & object lifecycle
│       │   ├── ToolManager.js     # Tool state & event routing
│       │   ├── HistoryManager.js  # Undo/Redo logic
│       │   └── PenRenderer.js     # Advanced drawing logic
│       ├── hooks/      # React hooks for engine interaction
│       ├── tools/      # Tool-specific implementations (Pen, etc.)
│       └── utils/      # Geometry and math helpers
├── pages/              # Page-level components (Routes)
│   ├── Dashboard/
│   │   └── Dashboard.jsx    # Project management & entry
│   └── Editor/
│       └── Editor.jsx       # Main workspace page
├── store/              # Global Redux state
│   ├── slices/         # State slices (editor, tool, layers, etc.)
│   ├── index.js        # Store configuration
│   └── engineSync.js   # Middleware for syncing Engine -> Store
├── lib/                # Third-party library configs (axios, utils)
├── App.jsx             # Routing & global providers
└── main.jsx            # Entry point
```

---

## 3. Application Flow

### A. Initialization & Routing

1.  **Entry**: `main.jsx` wraps the app in `ReduxProvider`, `BrowserRouter`, and `NuqsAdapter`.
2.  **Routing**: `App.jsx` defines three primary routes:
    - `/` (Dashboard): Fetches and displays saved diagrams.
    - `/editor`: Opens a new, empty workspace.
    - `/editor/:id`: Loads a specific diagram from persistence.

### B. The Engine Lifecycle

1.  **Mounting**: The `Editor` page initializes the `EditorEngine` via the `useEditor` hook.
2.  **Context**: The engine instance is placed in `EngineContext` for deep component access.
3.  **Syncing**: `engineSync.js` (bridge listener) ensures that changes in the Fabric.js canvas are reflected in the Redux store (e.g., updating the layer list or selection state).

### C. Interaction Flow

1.  **User Action**: User clicks a tool (e.g., Pen Tool) in the Toolbar.
2.  **Redux Update**: An action is dispatched to `toolSlice`, updating the `activeTool`.
3.  **Engine Reaction**: `ToolManager` listens to tool changes and reconfigures the Fabric.js canvas (e.g., enabling `isDrawingMode`).
4.  **Canvas Events**: Mouse movements on the canvas are captured by the Engine's event listeners, not React.
5.  **Persistence**: The `PersistenceService` (within the engine) auto-saves the canvas JSON to `localStorage` on every change.

### D. Layer Management (Drag & Drop)

1.  **Drag Start**: User drags a layer in the Right Sidebar.
2.  **UI Feedback**: `dnd-kit` provides a visual `DragOverlay` and reorders the list items.
3.  **Engine Sync**: On `onDragEnd`, the new order is sent to `engine.layers.setOrder()`.
4.  **Canvas Reorder**: `LayerManager` mutates the internal Fabric object stack and re-renders the canvas.
5.  **State Save**: The new order is persisted and dispatched to Redux.

---

## 4. Feature Modules

| Module          | Description                                                  |
| :-------------- | :----------------------------------------------------------- |
| **Engine**      | Manages the "Heavy" Fabric.js instance and imperative logic. |
| **Store**       | Manages the "Light" UI state and reactive metadata.          |
| **Persistence** | Handles serialization and storage (LocalStorage).            |
| **Tools**       | Modular tool implementations that hook into the Engine.      |

---

## 5. Technology Stack

- **Framework**: React 19 + Vite 7
- **State**: Redux Toolkit (Centralized Engine-UI bridge)
- **Canvas**: Fabric.js 6.7.1
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Icons**: Lucide React
- **URL State**: nuqs (for zoom, tool params)
- **Drag & Drop**: @dnd-kit (core, sortable)
