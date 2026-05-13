# Development Roadmap

> Last updated: 2026-04-02

---

## Phase 1: Core Stability ✅

- [x] Fabric.js canvas initialization with responsive sizing
- [x] Shape creation: Rectangle, Circle, Triangle, Star, Arrow, Line, Polygon, Frame
- [x] Interactive click-drag shape creation
- [x] Text tool with inline editing (IText)
- [x] Freehand brush drawing with multiple brush types
- [x] Eraser tool (persistent object deletion)
- [x] Image upload with brightness/contrast filters
- [x] Layer panel: visibility, lock, reorder, rename, delete, duplicate
- [x] Undo/Redo (50-step snapshot-based history)
- [x] LocalStorage persistence (auto-save/restore)
- [x] Canvas presets (Instagram, Facebook, Twitter, YouTube, A4)
- [x] Grid overlay with configurable size
- [x] Zoom in/out/reset
- [x] Pan tool with viewport scrolling
- [x] Export to PNG/JPG (2× multiplier)
- [x] Gradient fills (linear, radial) per object
- [x] Background color and background image support
- [x] Connector lines with shape anchor snapping

## Phase 2: Pen Tool ✅

- [x] Figma-style Bézier pen tool (draw mode)
- [x] Click to place corner points
- [x] Click+drag for smooth Bézier handles
- [x] Path closing detection (hover first point → close)
- [x] Live dashed preview while drawing
- [x] SVG overlay for anchor points and handles
- [x] Edit mode (double-click path to re-enter)
- [x] Drag anchor points
- [x] Drag Bézier handles (mirrored symmetry)
- [x] Alt+drag to break handle symmetry (disconnected)
- [x] Alt+click to toggle corner ↔ smooth
- [x] Delete selected points (Delete/Backspace)
- [x] Break path at selected node (Cmd+B)
- [x] Join selected endpoints (Cmd+J)
- [x] Path data preserved in `path.data.points` for re-editing
- [x] SVG path string builder (`buildSVGPath()`)
- [x] Integration with main canvas (pen paths become Fabric.js Path objects)

## Phase 3: Cleanup & Documentation ✅

- [x] Remove deprecated pen tool code paths
- [x] Standardize directory structure (Pages, Global Store)
- [x] Fix duplicate React instance errors via Vite deduplication
- [x] Restore and verify `syncElements`, `deleteSelected`
- [x] Implement professional Drag & Drop layer reordering (@dnd-kit)
- [x] Update all documentation (ARCHITECTURE, ROADMAP, PROJECT_FLOW, DEVELOPMENT)

---

## Phase 4: Performance & Polish 🔧 (Next)

- [ ] Optimize canvas rendering for high object counts (Fabric.js cache tuning)
- [ ] Implement debounced history saving (avoid thrashing on rapid changes)
- [ ] Smooth viewport zooming with scroll wheel support
- [ ] Fix canvas resizing edge cases in complex browser windows
- [ ] Add keyboard shortcut visual hints in toolbar tooltips
- [ ] Context menu (right-click) for common actions
- [ ] Improve brush/pen tool cursor icons (custom SVG cursors)
- [ ] Add on-canvas resize handles for the artboard itself

## Phase 5: Advanced Editing

- [ ] Grouping and ungrouping objects (`Cmd+G` / `Cmd+Shift+G`)
- [ ] Copy/paste objects (`Cmd+C` / `Cmd+V`)
- [ ] Alignment tools (align left/center/right, distribute evenly)
- [ ] Snap-to-object smart guides
- [ ] Multi-point shape manipulation (path editing for standard shapes)
- [ ] Google Fonts integration with font picker
- [ ] Rich text formatting (bold, italic, underline per character)
- [ ] Pen tool: add point on segment (click on path line)
- [ ] Pen tool: continue path from endpoint

## Phase 6: Collaboration & Export

- [ ] Export to SVG
- [ ] Export to high-quality PDF
- [ ] Asset library for icons and vector shapes
- [ ] Template gallery (save/load designs)
- [ ] Cloud-based persistence with user accounts
- [ ] Real-time multiplayer cursor synchronization
- [ ] Role-Based Access Control (RBAC) for collaboration

## Phase 7: Whiteboard Extension

- [ ] Wire Konva.js whiteboard into the main app as a separate mode
- [ ] Enhanced free-hand drawing in whiteboard mode
- [ ] Sticky notes and diagramming tools
- [ ] Hand-drawn style strokes and text (sketchy mode)
- [ ] Integration/sharing of objects between editor and whiteboard

---

## Legend

| Icon | Status |
| :--- | :----- |
| ✅   | Complete |
| 🔧   | In progress / next up |
| (no icon) | Planned |
