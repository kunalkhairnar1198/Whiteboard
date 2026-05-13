# 🎨 Template Editor & Whiteboard Workspace

A professional-grade, browser-based design tool built with **React 19**, **Fabric.js 6**, and **Vite 7**. Features a full Figma-style Bézier pen tool, interactive shape creation, freehand drawing, layer management, and a centralized Redux state architecture.

---

## Quick Start

```bash
# Install dependencies
yarn install

# Start local dev server (default: http://localhost:5173)
yarn dev
```

**Other scripts:**

| Command        | Description                    |
| :------------- | :----------------------------- |
| `yarn build`   | Production build               |
| `yarn preview` | Preview production build       |
| `yarn lint`    | Run ESLint checks              |
| `yarn test`    | Run unit tests (`node --test`) |

---

## Tech Stack

| Layer           | Technology                                        |
| :-------------- | :------------------------------------------------ |
| **Framework**   | React 19 + Vite 7                                 |
| **Canvas**      | Fabric.js 6.7.1 (primary editor)                  |
| **State**       | Redux Toolkit (Centralized Engine-UI bridge)      |
| **Drag & Drop** | `@dnd-kit/core` + `@dnd-kit/sortable`             |
| **Styling**     | Tailwind CSS 4 + shadcn/ui + Lucide React         |
| **URL State**   | `nuqs` (URL-driven zoom, panning, and tool state) |
| **Persistence** | LocalStorage (auto-save with JSON serialization)  |

---

## Features

### Core Editor (Fabric.js)

- **Engine-Driven Architecture** — Decoupled Fabric.js logic from React components.
- **Shape Tools** — Rectangle, Circle, Triangle, Star, Arrow, Line, Polygon, Frame.
- **Interactive Creation** — Click-and-drag to size shapes on the canvas.
- **Pen Tool** — Full Figma-style Bézier pen tool with edit mode support.
- **Freehand Drawing** — Brush tool with multiple brush types (Pencil, Pattern, etc.).
- **Eraser** — Fast object deletion with single-click interaction.
- **Connector Lines** — Anchor-snapped lines that follow objects during movement.
- **Gradient Fills** — Linear and radial gradient support for all shapes.
- **Layers Panel** — Visibility, lock, rename, duplicate, and **professional drag-and-drop reordering**.
- **Zoom & Pan** — Infinite workspace feel with viewport navigation.
- **Undo / Redo** — Snapshot-based history stack managed by the engine.
- **Persistence** — Automatic workspace state saving to LocalStorage.
- **Export** — High-resolution PNG or JPG downloads.

---

## Project Structure

```
template-editor/
├── src/
│   ├── pages/                       # Route-level components
│   │   ├── Dashboard/               # Project management & entry
│   │   └── Editor/                  # Main Fabric.js workspace
│   ├── store/                       # Global Redux state
│   │   ├── slices/                  # State slices (editor, tool, layers)
│   │   └── engineSync.js            # Engine-to-Store synchronization bridge
│   ├── features/
│   │   └── editor/                  # Core Editor Feature logic
│   │       ├── engine/              # Fabric.js Integration (The "Engine")
│   │       ├── hooks/               # React hooks for engine interaction
│   │       ├── tools/               # Modular tool implementations
│   │       └── utils/               # Geometry & math helpers
│   ├── components/ui/               # shadcn UI primitives
├── package.json
├── vite.config.js
└── eslint.config.js
```

---

## Documentation Index

| Document                                 | Description                                         |
| :--------------------------------------- | :-------------------------------------------------- |
| [ARCHITECTURE.md](plans/ARCHITECTURE.md) | System architecture, component hierarchy, data flow |
| [PROJECT_FLOW.md](PROJECT_FLOW.md)       | Visual and technical flow of the application        |
| [SHORTCUTS.md](plans/SHORTCUTS.md)       | Complete keyboard shortcut reference                |

---

## License

Private project — not licensed for redistribution.
