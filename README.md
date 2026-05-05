# 🎨 Template Editor & Whiteboard Workspace

A professional-grade, browser-based design tool built with **React 19**, **Fabric.js 6**, and **Vite 7**. Features a full Figma-style Bézier pen tool, interactive shape creation, freehand drawing, layer management, and a secondary Konva.js whiteboard.

---

## Quick Start

```bash
# Install dependencies
yarn install

# Start local dev server (default: http://localhost:5173)
yarn dev
```

**Other scripts:**

| Command          | Description                     |
| :--------------- | :------------------------------ |
| `yarn build`     | Production build                |
| `yarn preview`   | Preview production build        |
| `yarn lint`      | Run ESLint checks               |
| `yarn test`      | Run unit tests (`node --test`)  |

---

## Tech Stack

| Layer           | Technology                                          |
| :-------------- | :-------------------------------------------------- |
| **Framework**   | React 19 + Vite 7                                   |
| **Canvas**      | Fabric.js 6.7.1 (primary editor)                    |
| **Whiteboard**  | Konva 10 + react-konva 19 (secondary module)        |
| **Styling**     | Tailwind CSS 4 + shadcn/ui + Lucide React           |
| **Drag & Drop** | `@dnd-kit/core` + `@dnd-kit/sortable`               |
| **IDs**         | `uuid` v13                                          |
| **State**       | React hooks + custom history store                  |
| **Persistence** | LocalStorage (auto-save)                            |

---

## Features

### Core Editor (Fabric.js)
- **Shape Tools** — Rectangle, Circle, Triangle, Star, Arrow, Line, Polygon, Frame
- **Interactive Creation** — Click-and-drag to size shapes on the canvas
- **Text** — Click-to-place editable text (IText) with font/color controls
- **Freehand Drawing** — Brush tool with multiple brush types (Pencil, Pattern, etc.)
- **Eraser** — Click/drag to delete objects instantly
- **Image Upload** — Add images as objects with brightness/contrast filters
- **Pen Tool** — Full Figma-style Bézier pen tool (see [Pen Tool Shortcuts](plans/PEN_TOOL_SHORTCUTS.md))
- **Connector Lines** — Snap lines to shape anchor points; lines follow when shapes move
- **Gradient Fills** — Linear and radial gradient support per object
- **Background** — Color or image backgrounds with auto-fill scaling
- **Canvas Presets** — Instagram, Facebook, Twitter, YouTube, A4, and custom sizes
- **Grid Overlay** — Toggleable snap grid with configurable size
- **Zoom & Pan** — Zoom in/out, reset, and hand-tool panning
- **Undo / Redo** — 50-step snapshot-based history stack
- **Persistence** — Auto-save/restore via LocalStorage
- **Layers Panel** — Visibility toggle, lock, reorder (drag-and-drop), rename, delete, duplicate
- **Export** — Download as PNG or JPG (2× resolution)

### Pen Tool (Fabric.js-integrated)
- **Draw Mode** — Click to place corner points, click+drag for smooth Bézier handles
- **Edit Mode** — Double-click any pen path to re-enter edit mode
- **Node Manipulation** — Drag anchors, drag handles (mirrored/broken symmetry)
- **Path Operations** — Break path (`Cmd+B`), Join path (`Cmd+J`), delete points
- **Point Type Conversion** — `Alt+Click` toggles corner ↔ smooth
- **Live Preview** — Real-time dashed preview line while drawing
- **SVG Overlay** — Anchor squares, handle circles, connecting dash lines

### Whiteboard (Konva.js — secondary)
- Freehand drawing canvas with separate hooks architecture
- Standalone from the primary editor

---

## Project Structure

```
template-editor/
├── public/                          # Static assets
├── plans/                           # Architecture docs, roadmaps, shortcuts
│   ├── ARCHITECTURE.md              # System architecture overview
│   ├── DEVELOPMENT.md               # Dev workflow & best practices
│   ├── ROADMAP.md                   # Feature roadmap (phased)
│   ├── SHORTCUTS.md                 # All keyboard shortcuts
│   ├── PEN_TOOL_DEV_PLAN.md         # Pen tool implementation plan (reference)
│   └── PEN_TOOL_EDIT_MODE_PROMPTS.md # Pen tool edit mode prompt library (reference)
├── tests/                           # Unit tests (node --test)
│   ├── editorState.test.js
│   ├── historyStore.test.js
│   └── layerOrder.test.js
├── src/
│   ├── App.jsx                      # Entry → renders FabricEditor
│   ├── main.jsx                     # React root mount
│   ├── index.css                    # Global styles (Tailwind)
│   ├── components/ui/               # shadcn UI primitives
│   ├── lib/                         # Shared util (cn helper)
│   └── features/
│       ├── editor/                  # ★ Primary Fabric.js editor
│       │   ├── components/
│       │   │   ├── FabricEditor/    # Main editor component (~1800 lines)
│       │   │   ├── Canvas/          # CanvasArea wrapper
│       │   │   ├── sidebar/         # Header, LeftSidebar, RightSidebar
│       │   │   ├── DrawingToolsPanel/
│       │   │   ├── filters/         # Image filter UI
│       │   │   └── layer-item/      # Layer row component
│       │   ├── hooks/
│       │   │   ├── useHistory.js    # Undo/redo hook
│       │   │   └── useFabricDrawing.js
│       │   ├── lib/
│       │   │   ├── canvasUtils.js   # Shape creation, grid, backgrounds, anchors
│       │   │   ├── editorState.js   # Element counter recovery
│       │   │   ├── historyStore.js  # History stack (50-entry ring buffer)
│       │   │   ├── persistence.js   # LocalStorage save/load
│       │   │   ├── layerOrder.js    # Layer reorder logic
│       │   │   ├── shapeUtils.js    # Shape helpers
│       │   │   └── filterUtils.js   # Filter helpers
│       │   ├── constants/
│       │   │   ├── canvasPresets.js  # Canvas size presets
│       │   │   └── filterIndices.js  # Filter type indices
│       │   └── tools/
│       │       └── pen/             # Pen tool subsystem
│       │           ├── usePenTool.js      # Core pen tool hook (draw/edit modes)
│       │           ├── usePathRenderer.js # SVG path string builder
│       │           ├── PenToolOverlay.jsx  # SVG overlay rendering
│       │           └── types.js           # Pen tool data types
│       └── whiteboard/              # Secondary Konva.js whiteboard
│           ├── Whiteboard.jsx
│           ├── WhiteboardExample.jsx
│           ├── components/
│           └── hooks/
├── package.json
├── vite.config.js
└── eslint.config.js
```

---

## Documentation Index

| Document | Description |
| :------- | :---------- |
| [ARCHITECTURE.md](plans/ARCHITECTURE.md) | System architecture, component hierarchy, data flow |
| [DEVELOPMENT.md](plans/DEVELOPMENT.md) | Dev setup, best practices, debugging, testing |
| [ROADMAP.md](plans/ROADMAP.md) | Phased feature roadmap with status |
| [SHORTCUTS.md](plans/SHORTCUTS.md) | Complete keyboard shortcut reference |
| [PEN_TOOL_DEV_PLAN.md](plans/PEN_TOOL_DEV_PLAN.md) | Detailed pen tool implementation plan (reference) |
| [PEN_TOOL_EDIT_MODE_PROMPTS.md](plans/PEN_TOOL_EDIT_MODE_PROMPTS.md) | Pen tool edit mode prompt library (reference) |

---

## License

Private project — not licensed for redistribution.
