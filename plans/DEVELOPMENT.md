# Development Guide

> Last updated: 2026-05-13

---

## Local Development

| Item        | Value                          |
| :---------- | :----------------------------- |
| **Start**   | `yarn dev`                     |
| **Port**    | `http://localhost:5173` (Vite) |
| **Build**   | `yarn build`                   |
| **Preview** | `yarn preview`                 |
| **Lint**    | `yarn lint`                    |
| **Test**    | `yarn test` (`node --test`)    |
| **Node.js** | 18+ recommended                |

---

## Project Conventions

### Architecture: The "Engine-as-Brain" Pattern

We use a decoupled architecture where the heavy lifting (Fabric.js, state mutation) is done in the **Engine**, while the **UI** (React/Redux) remains a reactive projection of that state.

- **Engine Managers**: Logic lives in specialized managers (e.g., `LayerManager`, `ToolManager`) inside `src/features/editor/engine/`.
- **Global State**: Redux Toolkit manages UI metadata (layer list, active tool, selection IDs).
- **Synchronization**: `src/store/engineSync.js` acts as a bridge, listening for engine events and dispatching Redux actions.
- **Canvas Access**: Never access the `fabric` canvas directly in components. Use the `engine` instance from `useEngineContext()`.

### Code Style

- **React:** Functional components with hooks only.
- **State:** Prefer Redux for state shared between sidebars and the engine.
- **Hooks:** Use `useEditor` to initialize the workspace and feature-specific hooks (like `useSelection`) for engine interaction.

### Important Engine Methods

| Method                              | Manager              | Purpose                                      |
| :---------------------------------- | :------------------- | :------------------------------------------- |
| `engine.layers.setOrder()`          | `LayerManager`       | Reorder objects on the canvas (supports Dnd) |
| `engine.tools.activate()`           | `ToolManager`        | Switch the active canvas interaction tool    |
| `engine.selection.clear()`          | `SelectionManager`   | Deselect all objects                         |
| `engine.render.schedule()`          | `RenderManager`      | Batch a canvas re-render for the next frame  |
| `engine.persistence.scheduleSave()` | `PersistenceService` | Debounced save to LocalStorage               |

---

## Adding a New Tool

1. **Create Tool Class** — Extend a base class or implement the tool interface in `src/features/editor/engine/tools/`.
2. **Register Tool** — Add the tool to `EditorEngine.js` in the `_registerBuiltinTools()` method.
3. **Add UI Button** — Add a button to the LeftSidebar that dispatches `toolActions.setActiveTool('yourTool')`.
4. **Handle Context** — If the tool needs React callbacks (like `saveState`), add them to the tool context in `Editor.jsx`.

---

## Debugging

| Scenario                 | Technique                                                      |
| :----------------------- | :------------------------------------------------------------- |
| Canvas object inspection | `window.engine.canvas.fabric.getObjects()` in console          |
| Redux State              | Use Redux DevTools to track actions dispatched by `engineSync` |
| Persistence issues       | Check `localStorage.getItem('fabric_editor_state')`            |
| Engine Bus Events        | Log events in `engine.bus` to see communication flow           |
| Rendering glitches       | Call `engine.render.flush()` manually to force immediate draw  |

---

## Manual Testing Checklist

- [x] **Project Navigation**: Dashboard → Create Workspace → Editor.
- [x] **Shape Tools**: Create and resize all basic shapes.
- [x] **Pen Tool**: Draw, close path, and re-enter edit mode via double-click.
- [x] **Layers**: Toggle visibility, lock, and **drag-and-drop reorder**.
- [x] **History**: Verify Undo/Redo doesn't break layer ordering.
- [x] **Persistence**: Refresh page and verify all objects and their order are restored.
- [x] **Export**: Verify PNG/JPG export at 2× resolution.
- [x] **Responsive**: Verify sidebars collapse and canvas resizes correctly.

---

## Git Workflow

- **Branching**: `feature/` or `fix/` prefixes.
- **Documentation**: Update `ARCHITECTURE.md` for structural changes and `PROJECT_FLOW.md` for logic changes.
- **Commits**: Use descriptive messages following conventional commits.
