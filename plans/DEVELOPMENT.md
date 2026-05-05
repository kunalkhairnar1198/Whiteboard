# Development Guide

> Last updated: 2026-04-02

---

## Local Development

| Item            | Value                              |
| :-------------- | :--------------------------------- |
| **Start**       | `yarn dev`                         |
| **Port**        | `http://localhost:5173` (Vite)     |
| **Build**       | `yarn build`                       |
| **Preview**     | `yarn preview`                     |
| **Lint**        | `yarn lint`                        |
| **Test**        | `yarn test` (`node --test`)        |
| **Node.js**     | 18+ recommended                    |

---

## Project Conventions

### Code Style

- **React:** Functional components with hooks only — no class components.
- **State:** `useState` + `useCallback` + `useRef` for local state. No global store (Redux/Zustand).
- **Canvas Access:** Use `canvas.current` (ref) for all Fabric.js API calls.
- **Fabric.js Imports:** Prefer named imports from `'fabric'` for types (`Canvas`, `Rect`, `Circle`, etc.). Use `import * as fabric from 'fabric'` for dynamic access (filters, brush classes).
- **File Structure:** Feature code lives in `src/features/<feature>/`. UI primitives in `src/components/ui/`.

### Important Functions

| Function              | Location                      | Purpose                                            |
| :-------------------- | :---------------------------- | :------------------------------------------------- |
| `safeSaveState()`     | FabricEditor                  | Save canvas to history stack + localStorage        |
| `syncElements()`      | FabricEditor                  | Sync canvas objects → React state for sidebar      |
| `drawGrid()`          | `lib/canvasUtils.js`          | Render/remove grid overlay                         |
| `addShape()`          | `lib/canvasUtils.js`          | Add a shape to canvas by type                      |
| `createInteractiveShape()` | `lib/canvasUtils.js`     | Create a shape for interactive click-drag creation |
| `updateInteractiveShape()` | `lib/canvasUtils.js`     | Resize shape during drag                           |
| `getShapeAnchors()`   | `lib/canvasUtils.js`          | Get connector anchor points for a shape            |
| `updateConnections()` | `lib/canvasUtils.js`          | Update connector lines when shapes move            |
| `persistCanvasState()`| `lib/persistence.js`          | Write JSON to localStorage                         |
| `loadCanvasState()`   | `lib/persistence.js`          | Read JSON from localStorage                        |
| `moveLayerInOrder()`  | `lib/layerOrder.js`           | Reorder objects array for layer moves              |
| `buildSVGPath()`      | `tools/pen/usePathRenderer.js`| Convert AnchorPoint[] → SVG `d` string             |

### After Mutating Canvas

Always follow this pattern after changing canvas objects:

```javascript
// 1. Make your changes
canvas.current.add(newObject);
// or obj.set({ fill: 'red' });

// 2. Re-render
canvas.current.requestRenderAll();

// 3. Sync sidebar
syncElements();

// 4. Save state (for undo + persistence)
safeSaveState();
```

---

## Adding a New Tool

1. **Add tool to LeftSidebar** — Add a button/icon that sets `currentTool` to your tool name.
2. **Handle in FabricEditor event wiring** — In the `useEffect` that sets up mouse events (~line 1034), add your tool's mouse handlers.
3. **Add cursor style** — Update `cursorStyle` computed value (~line 758).
4. **Add keyboard shortcuts** — Update the `handleKeyDown` function (~line 1561).
5. **Update `SHAPE_TOOLS` if applicable** — In `canvasUtils.js`, add to the `SHAPE_TOOLS` array if the tool creates shapes.

---

## Adding a New Shape

1. **Add case in `addShape()`** — `lib/canvasUtils.js`, add a `case 'yourShape':` that creates the Fabric object.
2. **Add case in `createInteractiveShape()`** — For click-drag creation support.
3. **Add case in `updateInteractiveShape()`** — For live resizing during drag.
4. **Register in `SHAPE_TOOLS`** — Add `'yourShape'` to the array.
5. **Add icon in LeftSidebar** — Add a button that calls the shape creation.

---

## Debugging

| Scenario                  | Technique                                                     |
| :------------------------ | :------------------------------------------------------------ |
| Canvas object inspection  | `canvas.current.getObjects()` in console                      |
| Object properties         | `canvas.current.getActiveObject()` → inspect in DevTools      |
| Persistence issues        | Check `localStorage.getItem('fabric_editor_state')`           |
| History state              | Inspect `historyStore` via breakpoints in `useHistory.js`     |
| Pen tool state            | `penTool.state` in FabricEditor — log `activePath`, `selectedPoints` |
| Rendering glitches        | Call `canvas.current.requestRenderAll()` manually             |
| Event handler issues      | Add `console.log` in mouse event handlers; check cleanup      |

---

## Testing

### Unit Tests

Tests are in `/tests/` and run with Node's built-in test runner:

```bash
yarn test
# or
node --test tests/**/*.test.js
```

**Current test files:**

| File                      | Covers                           |
| :------------------------ | :------------------------------- |
| `editorState.test.js`     | Element counter recovery         |
| `historyStore.test.js`    | Undo/redo stack operations       |
| `layerOrder.test.js`      | Layer reorder logic              |

### Manual Testing Checklist

- [ ] Create each shape type (rect, circle, triangle, star, arrow, line, polygon, frame)
- [ ] Interactive click-drag shape creation
- [ ] Text placement and inline editing
- [ ] Freehand brush drawing (all brush types)
- [ ] Eraser tool on shapes and drawings
- [ ] Pen tool: draw open path, draw closed path
- [ ] Pen tool: edit mode (double-click path)
- [ ] Pen tool: drag anchors, drag handles, delete points
- [ ] Undo × 5, Redo × 3 sequence
- [ ] Layer visibility toggle, lock, reorder, delete
- [ ] Image upload with filter adjustments
- [ ] Canvas preset switching
- [ ] Grid toggle on/off
- [ ] Zoom in/out/reset
- [ ] Pan tool navigation
- [ ] Export PNG and JPG
- [ ] Page refresh → state restored from localStorage
- [ ] Connector lines follow moving shapes

---

## Git Workflow

- Create feature branches for new major features.
- PRs should be reviewed for architecture consistency.
- Update `plans/ARCHITECTURE.md` if structural changes occur.
- Update `plans/ROADMAP.md` when features are completed.
- Update `plans/SHORTCUTS.md` when adding new keyboard shortcuts.
