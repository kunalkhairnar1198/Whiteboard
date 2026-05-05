# 🖊️ Figma-Style Pen Tool — Development Plan

> ⚠️ **REFERENCE DOCUMENT** — This plan was used during initial pen tool development. The pen tool is now **implemented and integrated** into the FabricEditor. For current architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md). For shortcuts, see [SHORTCUTS.md](./SHORTCUTS.md).

> Original description: Adding a fully-featured vector pen tool to an existing application

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 01 — Foundation & Architecture](#phase-01--foundation--architecture)
3. [Phase 02 — Core Pen Tool Engine](#phase-02--core-pen-tool-engine)
4. [Phase 03 — Edit Mode & Node Manipulation](#phase-03--edit-mode--node-manipulation)
5. [Phase 04 — Visual Rendering & Properties](#phase-04--visual-rendering--properties)
6. [Phase 05 — Polish & UX](#phase-05--polish--ux)
7. [Phase 06 — Testing & Ship](#phase-06--testing--ship)
8. [Prompt Library](#prompt-library)
9. [Pre-Ship Checklist](#pre-ship-checklist)

---

## Overview

### What We're Building

A browser-based SVG pen tool that mirrors Figma's core pen tool behavior — anchor point placement, bezier curve handles, path closing, and a full node-edit mode — integrated into an existing React/Canvas application.

### Key Behaviors to Replicate

| Figma Behavior | Implementation Target |
|---|---|
| Click → corner point | `mousedown` on canvas, push `{x, y, type:'corner'}` to path |
| Click + drag → smooth point | Drag distance > 4px triggers handle pull |
| Alt + drag handle → break symmetry | Store `handleIn` and `handleOut` independently |
| Hover first point → close path | Distance check on `mousemove` near origin |
| Double-click shape → edit mode | Mode toggle, reveal all anchor points |
| Per-point corner radius | Store `cornerRadius` per anchor node |

### Tech Assumptions

- **Framework:** React (hooks-based)
- **Rendering:** SVG overlay on existing canvas
- **State:** Zustand or Redux Toolkit slice (adapt to your stack)
- **Styling:** Tailwind CSS
- **Testing:** Vitest + Playwright

---

## Phase 01 — Foundation & Architecture

### Step 01 · Audit Existing App

Before adding anything, understand the existing canvas/drawing system.

**Goal:** Know exactly where to hook in without breaking existing tools.

```
PROMPT 01-A · AUDIT
"I have an existing [drawing app]. It uses [SVG / Canvas / fabric.js].
I want to add a Figma-style pen tool. Audit the codebase and tell me:
1) Where tool modes are managed
2) How mouse events are currently handled
3) What the best integration point is for a new PenTool class/hook
4) What I should NOT touch"
```

**Deliverables:**
- [ ] Integration point identified
- [ ] Existing mouse event system documented
- [ ] Tool mode enum/system understood
- [ ] Risk areas flagged

---

### Step 02 · Data Model Design

Design the path data model before writing any rendering code.

**Core Types:**

```typescript
// anchor point types
type PointType = 'corner' | 'smooth' | 'asymmetric' | 'disconnected';

// a single anchor point on the path
interface AnchorPoint {
  id: string;
  x: number;
  y: number;
  type: PointType;
  handleIn:  { x: number; y: number } | null;   // incoming bezier handle
  handleOut: { x: number; y: number } | null;   // outgoing bezier handle
  cornerRadius?: number;                          // per-point corner radius
}

// a complete vector path
interface VectorPath {
  id: string;
  points: AnchorPoint[];
  closed: boolean;
  fill: string | null;
  stroke: string;
  strokeWidth: number;
  strokeCap: 'none' | 'round' | 'square';
  strokeJoin: 'miter' | 'round' | 'bevel';
  dashArray: number[];
  fillRule: 'nonzero' | 'evenodd';
  opacity: number;
}

// the two primary tool modes
type PenMode = 'draw' | 'edit';

// full pen tool state
interface PenToolState {
  mode: PenMode;
  activePath: VectorPath | null;
  selectedPoints: string[];           // anchor point IDs
  hoveredPoint: string | null;
  isDraggingHandle: boolean;
  previewPoint: { x: number; y: number } | null;
  snapEnabled: boolean;
}
```

```
PROMPT 02-A · DATA MODEL
"Design a TypeScript data model for a Figma-style pen tool.
It needs: anchor points with bezier handles (symmetric, asymmetric,
disconnected), open and closed paths, per-point corner radius,
and stroke/fill properties. Show me the full type definitions
and explain each field's purpose."
```

**Deliverables:**
- [ ] `AnchorPoint` type finalized
- [ ] `VectorPath` type finalized
- [ ] `PenToolState` type finalized
- [ ] Types exported from `types/pen-tool.ts`

---

### Step 03 · File Structure

```
src/
├── tools/
│   └── pen/
│       ├── index.ts                  ← public exports
│       ├── PenTool.tsx               ← main tool component
│       ├── usePenTool.ts             ← core logic hook
│       ├── useDrawMode.ts            ← draw mode mouse handlers
│       ├── useEditMode.ts            ← edit mode mouse handlers
│       ├── usePathRenderer.ts        ← SVG path string builder
│       ├── useSnapGrid.ts            ← snap-to-grid / snap-to-point
│       ├── PenToolOverlay.tsx        ← SVG overlay rendering
│       ├── AnchorPoint.tsx           ← individual anchor point UI
│       ├── HandleLine.tsx            ← bezier handle + line UI
│       ├── PathPreview.tsx           ← in-progress path preview
│       └── types.ts                  ← all TS types for this tool
├── store/
│   └── penToolSlice.ts               ← state slice
└── tests/
    └── pen/
        ├── usePenTool.test.ts
        ├── pathBuilder.test.ts
        └── pen-tool.e2e.ts
```

```
PROMPT 03-A · SCAFFOLD
"Generate the complete file structure for a Figma-style pen tool
feature inside an existing React app. The tool needs: draw mode,
edit mode, snap-to-grid, bezier handle manipulation, and an SVG
overlay. Show me the folder tree with a one-line comment per file."
```

**Deliverables:**
- [ ] All folders created
- [ ] All files stubbed with empty exports
- [ ] Index file with public API
- [ ] Types file populated from Step 02

---

## Phase 02 — Core Pen Tool Engine

### Step 04 · Tool Mode System

Integrate the pen tool into the existing tool mode manager.

```
PROMPT 04-A · TOOL MODE INTEGRATION
"My app has a tool system at [path]. It manages modes like
'select', 'rectangle', 'text'. Show me how to add a 'pen' tool
mode that: activates on pressing P, registers mouse event handlers,
deactivates cleanly when switching to another tool, and preserves
in-progress paths when accidentally switching."
```

**Deliverables:**
- [ ] `'pen'` added to tool enum
- [ ] Keyboard shortcut `P` activates pen tool
- [ ] Tool deactivation cleans up handlers
- [ ] In-progress path serialized on switch

---

### Step 05 · Draw Mode — Click to Place Points

The core placing behavior.

**Logic:**

```
on mousedown (draw mode):
  1. If first click → start new path, push point
  2. If subsequent click → append point to active path
  3. If click distance to point[0] < 8px → CLOSE PATH
  4. If mousedown + mousemove > 4px → switch to handle-drag mode
  5. Press Enter → finish as open path
  6. Press Escape → cancel last segment
```

```
PROMPT 05-A · DRAW MODE CLICK
"Build the mousedown handler for pen tool draw mode in React.
On each click: create an anchor point at the cursor position,
append it to the active path, and check if we're within 8px
of the first point (to close the path). Return the updated path.
Use TypeScript. No side effects — pure function."
```

```
PROMPT 05-B · CLOSE PATH DETECTION
"Write a function closePath(path: VectorPath, mousePos: Point): boolean
that returns true when the cursor is within a threshold distance of
the path's first anchor point. Also write getClosePath() which marks
path.closed = true and cleans up the last segment. Include the
visual hover indicator logic (show green circle on first point)."
```

**Deliverables:**
- [ ] `mousedown` places `AnchorPoint` correctly
- [ ] First-point hover detection works
- [ ] Path closes on first-point click
- [ ] Enter key finishes open path
- [ ] Escape cancels last unplaced segment

---

### Step 06 · Draw Mode — Drag for Bezier Handles

The hardest part — pulling smooth handles while placing a point.

**Logic:**

```
on mousedown + drag (in draw mode):
  1. On mousedown: tentatively place point (no handles yet)
  2. On mousemove: compute handleOut = dragPos - pointPos
                   compute handleIn  = pointPos - (dragPos - pointPos)  [mirror]
  3. On mouseup: commit the point with both handles
```

```
PROMPT 06-A · BEZIER HANDLE DRAG
"Implement the bezier handle drag behavior for a pen tool.
When the user clicks and drags while placing a point:
- handleOut = { x: dragX - pointX, y: dragY - pointY }
- handleIn = { x: -(dragX - pointX), y: -(dragY - pointY) } (mirrored)
Store these relative to the anchor point. Show me the full
mousemove and mouseup handlers. TypeScript, pure functions."
```

```
PROMPT 06-B · ALT KEY BREAK SYMMETRY
"During a handle drag, if the user holds Alt, break handle symmetry.
handleIn and handleOut should move independently from that moment.
The point type changes from 'smooth' to 'disconnected'.
Show me how to detect Alt key during drag and update the handle
state correctly."
```

**Deliverables:**
- [ ] Click + drag pulls symmetric handles
- [ ] `handleIn` and `handleOut` computed correctly
- [ ] Alt key breaks handle symmetry mid-drag
- [ ] Point type updates to `'disconnected'` on break
- [ ] Handles render as lines with circle endpoints

---

### Step 07 · SVG Path String Builder

Convert the `VectorPath` data model into an SVG `d` attribute string.

```
PROMPT 07-A · PATH BUILDER
"Write a function buildSVGPath(path: VectorPath): string that converts
an array of AnchorPoint objects (with optional handleIn/handleOut) into
a valid SVG path d string. Rules:
- No handles on either side → use L (line)
- Handle on one side only → use Q (quadratic bezier)
- Handles on both sides → use C (cubic bezier)
- If path.closed === true → append Z
Show unit tests for each case."
```

**Example output:**

```
M 100 100 C 120 80 180 80 200 100 L 300 200 Z
```

**Deliverables:**
- [ ] `buildSVGPath()` handles all 4 segment types
- [ ] Closed paths append `Z`
- [ ] Unit tests pass for corner, smooth, asymmetric, disconnected
- [ ] Function is pure (no side effects)

---

### Step 08 · Live Preview While Drawing

Show the path updating in real-time as the cursor moves — before the next point is placed.

```
PROMPT 08-A · LIVE PREVIEW
"Add a live path preview to the pen tool. As the cursor moves (before
the next click), draw a segment from the last placed point to the cursor.
If the last point has a handleOut, use it to draw a live bezier curve.
This should render in SVG as a dashed line. The preview disappears
when the next point is placed. Use React + SVG."
```

**Deliverables:**
- [ ] Dashed preview line follows cursor
- [ ] Preview uses `handleOut` of last point for curve shape
- [ ] Preview disappears on click (replaced by real segment)
- [ ] First-point hover shows close-path indicator

---

## Phase 03 — Edit Mode & Node Manipulation

### Step 09 · Enter Edit Mode

Double-click any vector shape to enter edit mode.

```
PROMPT 09-A · EDIT MODE ACTIVATION
"When the user double-clicks a vector path (in select mode),
switch to pen edit mode for that path. In edit mode:
- Show all anchor points as small squares
- Show bezier handles as circles connected by lines
- The path itself stays visible but is not selectable
- Escape exits edit mode and returns to select
Show me the full mode transition logic."
```

**Deliverables:**
- [ ] Double-click activates edit mode for clicked path
- [ ] All anchor points rendered as 8×8px squares
- [ ] Bezier handles rendered as 6px circles with lines
- [ ] Escape exits edit mode
- [ ] Clicking outside path exits edit mode

---

### Step 10 · Move Anchor Points

Click and drag any anchor to reposition it.

```
PROMPT 10-A · MOVE ANCHOR POINT
"In edit mode, implement drag-to-move for anchor points.
When dragging an anchor: move the point's x/y, and move its
handleIn and handleOut with it (keeping relative positions).
If snap is enabled, snap to the 20px grid. Support multi-select
(Shift+click) and move all selected points together."
```

**Deliverables:**
- [ ] Single anchor drag moves point + handles
- [ ] Shift+click adds to selection
- [ ] Multi-select drag moves all selected points
- [ ] Grid snap works when enabled
- [ ] Path re-renders live during drag

---

### Step 11 · Drag Bezier Handles

Reshape curves by dragging the handle circles.

```
PROMPT 11-A · HANDLE DRAG
"In edit mode, implement bezier handle dragging.
When the user drags a handleOut circle:
- For type 'smooth': mirror the change to handleIn (same length, opposite direction)
- For type 'asymmetric': mirror direction but preserve handleIn length
- For type 'disconnected': only move handleOut, handleIn stays
Alt-dragging a handle on a smooth point converts it to 'disconnected'.
Show the full implementation."
```

**Deliverables:**
- [ ] `smooth` handles mirror correctly
- [ ] `asymmetric` handles mirror direction only
- [ ] `disconnected` handles move independently
- [ ] Alt-drag converts smooth → disconnected
- [ ] Path updates live during handle drag

---

### Step 12 · Add / Remove Points

Click on a segment to add a point. Delete key removes selected points.

```
PROMPT 12-A · ADD POINT ON SEGMENT
"In pen edit mode, when the user hovers over a path segment
(not an anchor point), show a '+' cursor and allow clicking to
insert a new anchor point on that segment. The new point should
be placed exactly on the bezier curve at the clicked t-parameter.
Split the segment into two segments that maintain the original curve shape."
```

```
PROMPT 12-B · DELETE POINT
"When the user presses Delete in edit mode, remove all selected
anchor points from the path. If the removed point was between two
others, reconnect the path smoothly. If removing would leave < 2 points,
delete the entire path. Handle edge cases: deleting first/last point
of an open path."
```

**Deliverables:**
- [ ] Hover over segment shows `+` cursor
- [ ] Click on segment inserts point on curve
- [ ] New point preserves curve shape (correct bezier split)
- [ ] Delete key removes selected points
- [ ] Path reconnects correctly after deletion

---

### Step 13 · Convert Point Types

Right-click a point or use the toolbar to change its type.

```
PROMPT 13-A · POINT TYPE CONVERSION
"Add point type conversion to edit mode.
Alt-clicking a smooth anchor converts it to a corner (removes handles).
Alt-clicking a corner creates handles and makes it smooth.
Also add right-click context menu with options:
'Make corner', 'Make smooth', 'Make asymmetric', 'Make disconnected'.
Show the full conversion logic for each transition."
```

**Deliverables:**
- [ ] Alt-click toggles corner ↔ smooth
- [ ] Right-click context menu shows point type options
- [ ] Correct handles added/removed on conversion
- [ ] Point type badge updates in properties panel

---

### Step 14 · Join & Break Paths

Connect two open paths or break a closed path.

```
PROMPT 14-A · JOIN PATHS
"In edit mode, if the user selects two endpoints from different open paths
and presses Cmd+J (or uses a 'Join' button), merge them into one path.
The junction point should be placed at the midpoint of the two endpoints.
Handle: joining start-to-start, end-to-end, and start-to-end."
```

**Deliverables:**
- [ ] Select two endpoints from different paths
- [ ] Cmd+J joins them into one path
- [ ] Junction point placed at midpoint
- [ ] All 3 endpoint combinations handled

---

## Phase 04 — Visual Rendering & Properties

### Step 15 · SVG Overlay Renderer

The full rendering layer for the pen tool UI.

```
PROMPT 15-A · SVG OVERLAY
"Build a PenToolOverlay React component that renders:
1. All completed paths as SVG <path> elements
2. The in-progress path (dashed) while drawing
3. In edit mode: anchor point squares, handle circles, handle lines
4. Hover states: filled circle on first point (close indicator),
   highlighted anchor on hover
5. Selection highlight on selected anchors (blue outline)
The overlay sits on top of the main canvas as a full-size SVG."
```

**Deliverables:**
- [ ] Completed paths render with correct fill/stroke
- [ ] In-progress path renders as dashed preview
- [ ] Edit mode shows all anchor point UI elements
- [ ] Hover states render correctly
- [ ] Selection state renders on selected anchors

---

### Step 16 · Properties Panel Integration

Connect the selected path to the existing properties sidebar.

```
PROMPT 16-A · PROPERTIES PANEL
"Integrate the pen tool's active path with the app's properties panel.
When a path is selected, the sidebar should show: Fill (color picker),
Stroke (color, width slider), Stroke cap (None/Round/Square buttons),
Stroke join (Miter/Round/Bevel), Dash pattern (input), Opacity (slider),
and Fill rule (Non-zero/Even-odd). Two-way bind: panel changes update
the path, path selection updates the panel."
```

**Deliverables:**
- [ ] Fill color synced to properties panel
- [ ] Stroke width slider works
- [ ] Stroke cap buttons work (3 options)
- [ ] Stroke join buttons work (3 options)
- [ ] Dash pattern input works
- [ ] Opacity slider works
- [ ] Fill rule toggle works
- [ ] All properties update live on the canvas

---

### Step 17 · Per-Point Corner Radius

Allow individual anchor points to have rounded corners.

```
PROMPT 17-A · CORNER RADIUS PER POINT
"Add per-point corner radius to the pen tool. In edit mode,
when an anchor point is selected, show a corner radius input
in the properties panel. Rendering: apply the radius to that
specific corner using SVG arc commands, not CSS border-radius.
Show me: the data storage (per-point field), the UI (input),
and the SVG path generation with arcs."
```

**Deliverables:**
- [ ] `cornerRadius` stored per `AnchorPoint`
- [ ] Input shows in properties when anchor selected
- [ ] SVG path generates arc for rounded corners
- [ ] Live preview updates as radius is changed

---

## Phase 05 — Polish & UX

### Step 18 · Snap System

Snap to grid, snap to other points, snap to 45° angles.

```
PROMPT 18-A · SNAP TO GRID
"Add snap-to-grid to the pen tool. Toggle with Cmd+Shift+' (matching Figma).
Grid size: 20px (configurable). Snap: cursor position rounds to nearest
grid intersection. Show smart guides: a faint crosshair at the snap point.
Apply to: placing new points, dragging anchors, dragging handles."
```

```
PROMPT 18-B · SNAP TO POINTS
"Add snap-to-point: when placing or dragging a point within 8px of
another anchor point (on any path), snap to that exact position.
Show a highlight on the target point. Also snap to: canvas center,
canvas edges, and exact horizontal/vertical alignment with other points."
```

```
PROMPT 18-C · ANGLE SNAP
"When holding Shift while placing a point or dragging a handle,
constrain to 45° increments from the previous point or the handle origin.
Show the constrained angle as a faint guide line."
```

**Deliverables:**
- [ ] Grid snap with toggle (Cmd+Shift+')
- [ ] Visual crosshair at snap position
- [ ] Point-to-point snap within 8px
- [ ] Shift key constrains to 45° angles
- [ ] Snap applies to both draw and edit mode

---

### Step 19 · Keyboard Shortcuts

Full keyboard shortcut system matching Figma's pen tool.

| Shortcut | Action |
|---|---|
| `P` | Activate pen tool |
| `Enter` | Finish open path |
| `Escape` | Cancel segment / exit edit mode |
| `Delete` | Remove selected points |
| `Cmd+Z` | Undo last point |
| `Shift+click` | Multi-select anchors |
| `Alt+drag` | Break handle symmetry |
| `Alt+click anchor` | Toggle corner/smooth |
| `Shift+drag` | Constrain to 45° |
| `Cmd+J` | **Join Path**: Merge two selected endpoints. |
| `Cmd+B` | **Break Path**: Split a path at the selected node (opens closed shape or splits open path). |
| **Select Endpoint + Click Canvas** | **Continue Path**: Switches to Draw Mode and extends from that node. |
| `Cmd+Shift+'` | Toggle grid snap |

```
PROMPT 19-A · KEYBOARD SHORTCUTS
"Implement the full keyboard shortcut system for the pen tool.
Register handlers that are active only when pen tool is the active mode.
Shortcuts: P (activate), Enter (finish path), Escape (cancel/exit),
Delete (remove points), Cmd+Z (undo point), Cmd+J (join paths).
Modifier keys: Shift (multi-select, 45° snap), Alt (break symmetry,
toggle point type). Use a keydown event listener that cleans up on tool deactivation."
```

**Deliverables:**
- [ ] All shortcuts in table above implemented
- [ ] Shortcuts only fire when pen tool is active
- [ ] Modifier keys (Shift, Alt, Cmd) work correctly
- [ ] Keyboard handlers clean up on tool switch

---

### Step 20 · Undo / Redo

Full undo/redo for every pen tool action.

```
PROMPT 20-A · UNDO REDO
"Add undo/redo to the pen tool. Every action that mutates a path
should push a snapshot to the undo stack: placing a point, moving an anchor,
dragging a handle, changing point type, closing a path, deleting a point.
Integrate with the app's existing undo system if it exists, or create a
dedicated pen tool history stack. Cmd+Z undoes one action, Cmd+Shift+Z redoes."
```

**Deliverables:**
- [ ] Every mutation pushes to undo stack
- [ ] Cmd+Z undoes last action
- [ ] Cmd+Shift+Z redoes
- [ ] Undo across: place, move, delete, type-change, close
- [ ] Stack limited to 50 entries (configurable)

---

### Step 21 · Cursors & Visual Feedback

Match Figma's context-sensitive cursor behavior exactly.

| Context | Cursor |
|---|---|
| Pen tool active, hovering canvas | Pen cursor (custom SVG) |
| Hovering first point (close) | Pen with circle indicator |
| Hovering existing anchor (edit) | Arrow with move indicator |
| Over segment (add point) | Pen with `+` |
| Dragging handle | Crosshair |
| Edit mode, hovering segment | `+` cursor |

```
PROMPT 21-A · CURSOR SYSTEM
"Implement a context-sensitive cursor system for the pen tool.
Use CSS cursor + custom SVG cursor images. Map each context to its cursor.
Update cursor based on: current mode (draw/edit), what the cursor is
hovering (canvas, anchor, handle, segment, first-point), and active modifiers
(Alt, Shift). Show me the cursor update logic inside the mousemove handler."
```

**Deliverables:**
- [ ] Custom pen cursor SVG created
- [ ] All cursor states in table above implemented
- [ ] Cursor updates correctly on hover context change
- [ ] Cursor resets on tool deactivation

---

## Phase 06 — Testing & Ship

### Step 22 · Unit Tests

```
PROMPT 22-A · PATH BUILDER TESTS
"Write comprehensive unit tests for buildSVGPath().
Test cases: single point (just M), two points no handles (L),
two points with handles (C), quadratic (Q), closed path (Z),
mixed segments, empty path, single closed point."
```

```
PROMPT 22-B · HOOK TESTS
"Write unit tests for usePenTool hook using React Testing Library.
Test: placing a point, dragging to create handles, closing a path,
entering edit mode, moving an anchor, deleting a point, undo/redo."
```

**Test Coverage Targets:**

| Area | Target |
|---|---|
| `buildSVGPath()` | 100% branch coverage |
| `usePenTool` hook | 90%+ |
| Mouse event handlers | 85%+ |
| Point type conversions | 100% |

---

### Step 23 · E2E Tests

```
PROMPT 23-A · PLAYWRIGHT E2E
"Write Playwright E2E tests for the pen tool.
Scenarios to test:
1. Draw a triangle (3 clicks, close path)
2. Draw a curve (click + drag for handles)
3. Enter edit mode, move an anchor
4. Add a point on a segment
5. Delete a point
6. Undo/redo sequence
7. Close path with keyboard (Enter)
Use page.mouse for all interactions."
```

**Deliverables:**
- [ ] All 7 E2E scenarios passing
- [ ] Tests run in CI pipeline
- [ ] Visual regression snapshots for key states

---

### Step 24 · Performance

```
PROMPT 24-A · RENDER PERFORMANCE
"The pen tool SVG overlay re-renders on every mousemove.
Optimize: memoize the completed path renders (only update on path change),
use requestAnimationFrame for preview path updates, avoid re-rendering
anchor points that haven't moved. Target: 60fps during active drawing
with 50+ anchor points."
```

**Deliverables:**
- [ ] Completed paths memoized (no re-render on cursor move)
- [ ] Preview uses rAF
- [ ] 60fps maintained with 50+ points
- [ ] No memory leaks on tool deactivation

---

## Prompt Library

> Copy these directly into Claude. Fill `[brackets]` with your specifics.

### Foundation Prompts

```
INIT: "I'm adding a Figma-style pen tool to [existing app].
The app uses [React/SVG/Canvas]. Give me the full integration
plan: where to hook in, what to avoid, and the first 3 things to build."

DATA MODEL: "Design TypeScript types for a vector pen tool.
I need: anchor points (corner, smooth, asymmetric, disconnected),
bezier handles (handleIn/handleOut stored relative to point),
full path type (open/closed, fill, stroke properties), and tool state."

SCAFFOLD: "Create the file structure for a pen tool feature.
I need separate files for: draw mode logic, edit mode logic,
SVG rendering, snap system, keyboard shortcuts, and state management."
```

### Build Prompts

```
DRAW MODE: "Build the mousedown handler for pen tool draw mode.
Each click places an anchor. Click + drag creates bezier handles.
Hovering the first point within [8]px shows a close indicator.
Clicking the first point closes the path. TypeScript, pure function."

BEZIER HANDLES: "Implement bezier handle drag for the pen tool.
Click + drag: handleOut = dragDelta, handleIn = -dragDelta (mirrored).
Alt during drag: break symmetry — only move handleOut.
Point type changes: smooth → disconnected on Alt-break."

PATH BUILDER: "Convert VectorPath[] to SVG d-string.
Rules: no handles = L, one handle = Q, two handles = C, closed = Z.
Handles stored relative to anchor point — convert to absolute for SVG."

EDIT MODE: "Build edit mode for the pen tool.
Double-click activates. Shows: anchor squares, handle circles+lines.
Drag anchors to move. Drag handle circles to reshape curves.
Mirror handles based on point type (smooth/asymmetric/disconnected)."
```

### Polish Prompts

```
SNAP: "Add snap-to-grid ([20]px grid) and snap-to-point (within [8]px).
Snap applies to: placing points, moving anchors, dragging handles.
Show visual guide at snap position. Toggle with Cmd+Shift+'."

CURSORS: "Implement context-sensitive cursors for the pen tool.
Map: canvas hover → pen cursor, first-point hover → pen+circle,
segment hover → pen+plus, handle drag → crosshair, edit anchor hover → move."

UNDO: "Add undo/redo to the pen tool. Push snapshot on every mutation.
Integrate with existing app undo system or create pen-specific stack.
Stack limit: [50] entries. Cmd+Z undo, Cmd+Shift+Z redo."

PERFORMANCE: "Optimize the pen tool SVG overlay.
Memoize completed path elements. Use rAF for preview updates.
Goal: 60fps with [50]+ anchor points active during drawing."
```

---

## Pre-Ship Checklist

### Functionality

- [ ] Click places corner anchor point
- [ ] Click + drag creates smooth point with handles
- [ ] Alt + drag breaks handle symmetry
- [ ] Path closes when clicking first point
- [ ] Enter finishes open path
- [ ] Escape cancels in-progress segment
- [ ] Double-click enters edit mode
- [ ] Escape exits edit mode
- [ ] Anchor points draggable in edit mode
- [ ] Bezier handles draggable in edit mode
- [ ] Handle mirroring correct for all point types
- [ ] Add point on segment (click segment in edit mode)
- [ ] Delete point with Delete key
- [ ] Point type conversion (Alt+click, right-click menu)
- [ ] Join paths (Cmd+J on two selected endpoints)
- [ ] Break path (Cmd+B on selected point)
- [ ] Continue path (Select endpoint + click canvas)

### Properties

- [ ] Fill color synced to panel
- [ ] Stroke color, width working
- [ ] Stroke cap (None/Round/Square) working
- [ ] Stroke join (Miter/Round/Bevel) working
- [ ] Dash pattern working
- [ ] Opacity working
- [ ] Fill rule (Non-zero/Even-odd) working
- [ ] Per-point corner radius working

### UX & Polish

- [ ] Grid snap working + togglable
- [ ] Point snap working (within 8px)
- [ ] 45° angle snap (Shift key)
- [ ] All keyboard shortcuts working
- [ ] Context-sensitive cursors working
- [ ] Full undo/redo working
- [ ] Live preview while drawing
- [ ] Hover states on anchors and handles

### Quality

- [ ] Unit tests passing (90%+ coverage)
- [ ] E2E tests passing (all 7 scenarios)
- [ ] 60fps at 50+ anchor points
- [ ] No memory leaks on tool deactivation
- [ ] Works in Chrome, Firefox, Safari
- [ ] Mobile: basic touch support (place points, no handle drag)

---

*Generated plan for integrating a Figma-style pen tool into an existing application.*
*Adapt stack references to your actual setup. All prompts are copy-paste ready.*
