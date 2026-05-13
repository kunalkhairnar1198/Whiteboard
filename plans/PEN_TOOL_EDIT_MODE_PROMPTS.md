# 🖊️ Pen Tool — Edit Mode Implementation Prompts

> ⚠️ **REFERENCE DOCUMENT** — This prompt library was used during pen tool edit mode development. The edit mode is now **implemented** in `src/features/editor/tools/pen/usePenTool.js`. For current architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).

> Original description: Copy-paste prompt guide for adding Figma-style edit mode to an existing project

---

## How to Use This File

1. Read the **Context Block** at the top of each prompt — fill in your actual values
2. Paste the full prompt into Claude
3. Review the output before moving to the next prompt
4. Each prompt builds on the previous — run them **in order**

> **Rule:** Never run Prompt N+1 until Prompt N output is working in your app.

---

## Pre-Flight Checklist

Before starting, answer these — you'll need them in every prompt:

```
My framework:         [ React / Vue / Svelte ]
My rendering layer:   [ SVG / Canvas / fabric.js / konva ]
My state manager:     [ Redux Toolkit / Zustand / Context / useState ]
My existing tool system file:   src/_______________
My existing canvas/stage file:  src/_______________
My path data currently lives:   src/_______________
TypeScript:           [ Yes / No ]
```

---

## Prompt 01 — Audit & Integration Point

> **When to use:** Before writing any code. Run this first.

```
CONTEXT:
- Framework: [your framework]
- I have an existing drawing/design app
- Current tools: [list your existing tools e.g. select, rectangle, text]
- Tool switching is handled in: [file path]
- Mouse events are handled in: [file path]
- Existing path/shape data lives in: [file path or state slice name]

TASK:
Audit my existing setup and tell me exactly where to add a Figma-style
pen tool edit mode. I need:

1. The exact file and function where I should hook in the double-click
   handler that activates edit mode

2. The exact place in state where I should add:
   - editingPathId: string | null
   - selectedAnchorIds: string[]
   - mode: 'draw' | 'edit' | 'select'

3. What I must NOT change or break in the existing code

4. The order of the 3 mouse event handlers I need to add:
   onMouseDown, onMouseMove, onMouseUp — and where each one goes

5. A list of existing functions I can reuse vs ones I need to build fresh

Give me a concrete integration plan with file paths, not a generic answer.
```

**Expected output:** A numbered list of exact files and functions to touch.

---

## Prompt 02 — Data Types

> **When to use:** After audit. Before writing any logic.

```
CONTEXT:
- Language: [TypeScript / JavaScript]
- State manager: [Redux Toolkit / Zustand / useState]
- Existing shape/path type (paste it here if you have one):
  [paste your current type or "none"]

TASK:
Define the complete TypeScript types for a Figma-style pen tool
with edit mode. I need these exact types:

1. PointType union:
   'corner' | 'smooth' | 'asymmetric' | 'disconnected'

2. AnchorPoint interface:
   - id: string
   - x, y: number (absolute position on canvas)
   - handleIn: { x: number; y: number } | null
     (stored RELATIVE to the anchor, not absolute)
   - handleOut: { x: number; y: number } | null
     (stored RELATIVE to the anchor, not absolute)
   - type: PointType
   - cornerRadius?: number

3. VectorPath interface:
   - id: string
   - points: AnchorPoint[]
   - closed: boolean
   - fill: string | null
   - stroke: string
   - strokeWidth: number
   - strokeCap: 'none' | 'round' | 'square'
   - strokeJoin: 'miter' | 'round' | 'bevel'
   - opacity: number
   - fillRule: 'nonzero' | 'evenodd'

4. PenToolState interface:
   - mode: 'draw' | 'edit' | 'select'
   - editingPathId: string | null
   - selectedAnchorIds: string[]
   - hoveredAnchorId: string | null
   - hoveredSegment: { pathId: string; segIndex: number; t: number } | null
   - isDraggingAnchor: boolean
   - isDraggingHandle: boolean
   - dragTarget: 'handleIn' | 'handleOut' | null
   - snapEnabled: boolean

5. A HitTestResult discriminated union covering every thing
   the cursor can land on: anchor, handleIn, handleOut, segment, canvas

Export all types from src/tools/pen/types.ts.
Explain each field in one line of comment.
```

**Expected output:** A complete `types.ts` file ready to import.

---

## Prompt 03 — Activate & Exit Edit Mode

> **When to use:** Types are defined. Nothing else is built yet.

```
CONTEXT:
- My PenToolState type is defined at: [file path]
- My state manager is: [Redux Toolkit / Zustand / useState]
- My canvas component is: [file path]
- Double-click events currently: [handled / not handled]

TASK:
Implement edit mode activation and exit. Specifically:

ACTIVATION:
When the user double-clicks a VectorPath shape:
- Set state.mode = 'edit'
- Set state.editingPathId = the clicked path's id
- Clear state.selectedAnchorIds = []
- The cursor should change to the default arrow cursor

EXIT (all three cases):
1. User presses Escape key
2. User clicks outside the active path's bounding box
3. User switches to a different tool

On exit:
- Set state.mode = 'select'
- Set state.editingPathId = null
- Clear state.selectedAnchorIds

RENDERING change when in edit mode vs not:
- The active path stroke changes from [PATH_COLOR] to a blue highlight
- All anchor points become visible as 8x8px squares
- All bezier handles become visible as 6px circles with connecting lines
- The path fill becomes slightly transparent (opacity 0.08)

Show me:
1. The reducer actions / store mutations
2. The onDoubleClick handler to attach to path elements
3. The useEffect for Escape key listener (cleanup included)
4. The click-outside detection logic
5. The conditional rendering in the SVG overlay component

My existing canvas/overlay component looks like this:
[paste your current canvas component or write "I'll add it"]
```

**Expected output:** Reducer actions + event handlers + conditional render logic.

---

## Prompt 04 — Render Anchor Points & Handles

> **When to use:** Edit mode activates/exits correctly.

```
CONTEXT:
- My SVG overlay component is at: [file path]
- My AnchorPoint type is at: [file path]
- In edit mode, state.editingPathId = the active path id
- My paths array is accessed via: [store selector / prop name]

TASK:
Build the visual layer for edit mode. When state.mode === 'edit',
render the following on top of the active path:

ANCHOR POINT SQUARES:
- Shape: 8x8px <rect> centered on the anchor's (x, y)
- Default state: white fill, blue (#378ADD) stroke, 1.5px
- Selected state: blue (#185FA5) fill, blue stroke
- Hovered state: light blue fill, blue stroke
- Cursor: 'move' on hover

HANDLE CIRCLES:
- Shape: 6px radius <circle> at (anchor.x + handle.x, anchor.y + handle.y)
- handleIn color: pink (#D4537E)
- handleOut color: teal (#1D9E75)
- Only show a handle circle if the handle is not null
- Cursor: 'crosshair' on hover

HANDLE LINES:
- A 1px dashed line from anchor center to each handle circle
- Color: rgba(136,135,128,0.4)
- Dash pattern: [3, 3]
- Pointer-events: none (not clickable)

Z-ORDER (back to front):
1. Path fill + stroke (existing)
2. Handle lines (dashed)
3. Handle circles
4. Anchor squares (on top of everything)

Show me the complete SVG overlay component with these sub-components:
- <AnchorPointSquare> with selected/hovered props
- <HandleCircle> with type ('in'|'out') prop
- <HandleLine> — non-interactive
- The parent <EditModeOverlay> that maps over all points

Use React + TypeScript. No inline styles for colors — use the
color constants I define at the top of the file.
```

**Expected output:** 4 React components ready to drop into the overlay.

---

## Prompt 05 — Drag Anchor Points

> **When to use:** Anchor points and handles are visible.

```
CONTEXT:
- My edit mode overlay is at: [file path]
- My AnchorPoint type: handleIn and handleOut are RELATIVE to anchor
- My state update function: [dispatch(action) / setState / store.set]
- Snap grid size: [20]px — [enabled by default / disabled by default]

TASK:
Implement drag-to-move for anchor points in edit mode.

THE KEY RULE:
handleIn and handleOut are stored RELATIVE to the anchor position.
When the anchor moves, DO NOT adjust handles — they follow automatically
because they are relative. This is the most common mistake.

MOUSEDOWN on anchor square:
- Set isDraggingAnchor = true
- Record dragStartMouse = { x: e.clientX, y: e.clientY }
- Record dragStartPositions = Map<anchorId, {x,y}> for all selected anchors
- If the clicked anchor is NOT in selectedAnchorIds and Shift is NOT held:
  clear selectedAnchorIds and select only this anchor
- If Shift is held: add to selectedAnchorIds (toggle if already selected)
- e.stopPropagation() to prevent canvas click-outside from firing

MOUSEMOVE (when isDraggingAnchor):
- delta = { x: e.clientX - dragStartMouse.x, y: e.clientY - dragStartMouse.y }
- For each id in selectedAnchorIds:
  newX = dragStartPositions[id].x + delta.x
  newY = dragStartPositions[id].y + delta.y
  if snapEnabled: newX = Math.round(newX / 20) * 20, same for Y
  Update point.x = newX, point.y = newY (handles unchanged)
- Call rebuildPathString() and update the SVG path d attribute

MOUSEUP:
- Set isDraggingAnchor = false
- Clear dragStartMouse and dragStartPositions
- Push current state to undo stack

Show me:
1. The three event handlers as pure functions that take state + event
2. How to attach them to the SVG overlay (onMouseDown on anchor rects)
3. The global mousemove/mouseup listeners with proper cleanup
4. The rebuildPathString() function that converts AnchorPoint[] to SVG d string
```

**Expected output:** 3 event handlers + path builder function.

---

## Prompt 06 — Drag Bezier Handles

> **When to use:** Anchor drag is working correctly.

```
CONTEXT:
- My AnchorPoint handles are stored RELATIVE to anchor position
- Point types in my codebase: 'corner' | 'smooth' | 'asymmetric' | 'disconnected'
- State update: [how you update state]

TASK:
Implement bezier handle dragging in edit mode.

THE MIRROR RULES (critical — get these exactly right):

smooth point:
  dragging handleOut → set handleOut = mouse - anchor (relative)
                        set handleIn  = -(handleOut)  [mirror both direction AND length]

asymmetric point:
  dragging handleOut → set handleOut = mouse - anchor (relative)
                        set handleIn  = -normalize(handleOut) * length(handleIn)
                        [mirror DIRECTION only — preserve handleIn's original length]

disconnected point:
  dragging handleOut → set handleOut = mouse - anchor (relative)
                        handleIn stays completely unchanged

ALT KEY BEHAVIOR during drag:
  If point type is 'smooth' and user presses Alt mid-drag:
  → Convert point to 'disconnected'
  → Stop mirroring from this moment forward
  → The handleIn stays where it was when Alt was pressed
  → Show a visual indicator that symmetry is broken

MOUSEDOWN on handle circle:
  - Set isDraggingHandle = true
  - Set dragTarget = 'handleIn' or 'handleOut'
  - Record which anchorId this handle belongs to
  - Record the starting opposite handle value (for asymmetric mirror)

MOUSEMOVE (when isDraggingHandle):
  - Compute new handle = { x: mouse.x - anchor.x, y: mouse.y - anchor.y }
  - Apply mirror rule based on point type
  - Check for Alt key → convert to disconnected if needed
  - Rebuild path string

MOUSEUP:
  - Clear isDraggingHandle, dragTarget
  - Push to undo stack

Show me:
1. The applyMirrorRule(point, side, newHandle, altKey) pure function
2. The normalize(v) and length(v) vector helpers
3. The full handle mousedown/mousemove/mouseup handlers
4. How to detect which handle was clicked in the hit test

TypeScript. Show types for all function parameters.
```

**Expected output:** Mirror logic + 3 handle drag handlers + vector utils.

---

## Prompt 07 — Add Point on Segment

> **When to use:** Anchor and handle drag both work.

```
CONTEXT:
- My VectorPath has points: AnchorPoint[] with handleIn/handleOut (relative)
- Segment i goes from points[i] to points[i+1]
- The bezier for segment i uses:
    P0 = points[i].position
    H0 = points[i].handleOut  (relative, can be null → treat as {x:0,y:0})
    H1 = points[i+1].handleIn (relative, can be null → treat as {x:0,y:0})
    P1 = points[i+1].position

TASK:
Implement click-on-segment to insert a new anchor point.

STEP 1 — Hover detection on mousemove:
  For each segment i (0 to points.length - 2, +last-to-first if closed):
    Sample the bezier at t = 0, 0.05, 0.1 ... 1.0 (21 samples)
    Find the sample closest to the mouse cursor
    If distance < 6px:
      Store hoverSegment = { segIndex: i, t: closestT }
      Change cursor to 'cell' (shows + cursor)
      Break — only highlight one segment at a time
  If no segment within 6px: clear hoverSegment, reset cursor

STEP 2 — On click at hovered segment:
  Call splitBezierAtT(segIndex, t) which does De Casteljau:

  Given: P0, P0_out, P1_in, P1 and parameter t

  De Casteljau level 1:
    A = lerp(P0,         P0 + P0_out, t)   [all in absolute coords]
    B = lerp(P0 + P0_out, P1 + P1_in,  t)
    C = lerp(P1 + P1_in,  P1,          t)

  De Casteljau level 2:
    D = lerp(A, B, t)
    E = lerp(B, C, t)

  De Casteljau level 3:
    M = lerp(D, E, t)   ← this is the new anchor position

  New point at M:
    handleIn  = D - M   [relative]
    handleOut = E - M   [relative]
    type = 'smooth'

  Update existing neighbors:
    points[segIndex].handleOut     = A - points[segIndex].position   [relative]
    points[segIndex+1].handleIn    = C - points[segIndex+1].position [relative]

  Insert new point at index segIndex+1

STEP 3 — After insertion:
  Rebuild path string
  The visible curve must not change — verify this

Show me:
1. The lerp(a, b, t) helper
2. The splitBezierAtT(path, segIndex, t) function — pure, returns updated points array
3. The hover detection logic inside onMouseMove
4. The segment-click handler
5. The SVG highlight for the hovered segment (blue dashed overlay)

TypeScript. All intermediate calculations in absolute coords,
convert to relative only when storing in AnchorPoint.
```

**Expected output:** De Casteljau split + hover detection + segment click handler.

---

## Prompt 08 — Delete Points

> **When to use:** Add point is working.

```
CONTEXT:
- selectedAnchorIds: string[] — IDs of currently selected anchors
- My path.points: AnchorPoint[] with indices 0 to n-1
- path.closed: boolean

TASK:
Implement anchor point deletion on Delete / Backspace key.

CASES TO HANDLE:

Case 1 — Delete mid-point from open path (most common):
  Remove the point from the array
  The neighbors are now adjacent — connect them
  Do NOT try to preserve the original curve shape
  Just connect neighbors naturally (their existing handles remain)

Case 2 — Delete first or last point of open path:
  Simply remove it — no reconnection needed
  The path now starts/ends at the next point

Case 3 — Delete a point from a closed path:
  Remove it from the array
  Path stays closed — the remaining points reconnect
  If only 2 points remain, open the path (set closed = false)

Case 4 — Deleting multiple selected points:
  Sort IDs by index DESCENDING before deleting
  (Delete from end to start to preserve indices)
  Handle each case above for each deletion

Case 5 — Too few points:
  If points.length < 2 after deletion → delete the entire path
  Remove it from the paths array entirely

AFTER DELETION:
  Clear selectedAnchorIds
  Rebuild path string
  Push to undo stack

Show me:
1. The deleteSelectedPoints(path, selectedIds) pure function
   Returns: { updatedPath: VectorPath | null }
   Returns null if the path should be deleted entirely

2. The keyboard event listener (attach to window, active only in edit mode)
   Cleanup on edit mode exit

3. How to dispatch the result — update path or remove it from paths array

TypeScript. Cover all 5 cases with comments.
```

**Expected output:** `deleteSelectedPoints()` + keyboard handler.

---

## Prompt 09 — Convert Point Types

> **When to use:** Add and delete both work.

```
CONTEXT:
- PointType = 'corner' | 'smooth' | 'asymmetric' | 'disconnected'
- handleIn / handleOut are relative to anchor, null if no handle

TASK:
Implement point type conversion in edit mode.

TRIGGER 1 — Alt+click on anchor:
  If current type is 'smooth', 'asymmetric', or 'disconnected':
    → Convert to 'corner': set handleIn = null, handleOut = null
  If current type is 'corner':
    → Convert to 'smooth': compute default handles from neighbor directions
    → Default handle length = 0.33 × distance to nearest neighbor
    → handleOut direction = normalize(nextPoint - thisPoint)
    → handleIn  direction = -handleOut (mirrored)

TRIGGER 2 — Right-click context menu on anchor:
  Show a small context menu with 4 options:
  [ Make corner ] [ Make smooth ] [ Make asymmetric ] [ Make disconnected ]

CONVERSION LOGIC for each type:

To 'corner':
  handleIn = null, handleOut = null

To 'smooth':
  Compute tangent from neighbors (or use existing handle direction if any)
  Set handleOut =  tangent * defaultLength
  Set handleIn  = -tangent * defaultLength

To 'asymmetric':
  Keep existing handles if present
  If no handles: same as converting to 'smooth'
  Just change the type — the mirror rule changes at drag time

To 'disconnected':
  Keep existing handles if present
  If no handles: same as converting to 'smooth'
  Just change the type — handles now move independently

HELPER — computeDefaultHandles(point, prevPoint, nextPoint):
  Returns { handleIn, handleOut } as relative vectors
  Uses Catmull-Rom to Bezier conversion for a smooth default

Show me:
1. The convertPointType(point, newType, prev, next) pure function
2. The Alt+click handler on anchor squares
3. The right-click context menu component (simple, no library)
   Position it near the clicked anchor, dismiss on click-outside
4. The computeDefaultHandles() helper

TypeScript.
```

**Expected output:** Type conversion logic + context menu component.

---

## Prompt 10 — Hit Test Priority System

> **When to use:** All individual interactions work separately.
> **This is the integration glue — do not skip it.**

```
CONTEXT:
- My edit mode overlay handles mouse events
- Things the cursor can hit (in priority order):
  1. Handle circle (handleIn or handleOut)
  2. Anchor square
  3. Path segment (for adding a point)
  4. Canvas (deselect / pan)

TASK:
Build the unified hit test system that routes every mousedown
to the correct handler.

THE PRIORITY RULE:
Check in this exact order on every mousedown.
Stop at the first match. Never check lower priorities if a higher one hits.

Priority 1 — Handle circle (radius 8px):
  → isDraggingHandle = true, start handle drag

Priority 2 — Anchor square (±6px from center):
  → isDraggingAnchor = true, start anchor drag (or select)

Priority 3 — Path segment (within 6px of curve):
  → On mousedown: do nothing (just record)
  → On mouseup without mousemove: insert point (click, not drag)
  → On mousemove: treat as canvas pan

Priority 4 — Canvas (nothing hit):
  → Clear selectedAnchorIds
  → If outside path bounding box: exit edit mode

MOUSEMOVE priority:
  If isDraggingHandle: route to handle drag handler
  Else if isDraggingAnchor: route to anchor drag handler
  Else: run hover detection (highlight anchors, handles, segments)

ALSO HANDLE:
  Modifier keys tracked on mousemove:
  - Shift: add to selection (for anchor mousedown)
  - Alt: break handle symmetry (for handle mousemove)
  - Cmd/Ctrl+Z: undo (keydown, not mouse)

Show me:
1. The performHitTest(mouse, path, state) function
   Returns a HitTestResult discriminated union

2. The master onMouseDown(e) handler that calls performHitTest
   and routes to the right sub-handler

3. The master onMouseMove(e) handler with the routing logic

4. The master onMouseUp(e) handler with cleanup

5. How to attach all three to the SVG overlay component
   (with proper e.preventDefault() and e.stopPropagation())

TypeScript. The hit test must be a pure function (no side effects).
```

**Expected output:** `performHitTest()` + 3 master event handlers.

---

## Prompt 11 — Undo / Redo

> **When to use:** All interactions are working end-to-end.

```
CONTEXT:
- My state manager: [Redux Toolkit / Zustand / useState]
- Existing undo system: [yes, at file path / no]
- Actions that need undo:
  1. Move anchor point (mouseup)
  2. Drag handle (mouseup)
  3. Add point on segment (click)
  4. Delete point (keydown Delete)
  5. Convert point type (alt-click / context menu)
  6. Close path (while drawing)

TASK:
Add undo/redo to the pen tool edit mode.

IF existing undo system exists:
  Integrate with it — push a snapshot of the affected VectorPath
  on every action listed above. Show me exactly where to call
  the existing pushUndo() function in each of my 5 handlers.

IF no existing undo system:
  Create a pen-tool-specific history stack:

  interface HistoryEntry {
    pathId: string
    before: VectorPath   // deep clone before the action
    after:  VectorPath   // deep clone after the action
    label:  string       // e.g. "Move anchor", "Delete point"
  }

  Stack rules:
  - Max 50 entries (drop oldest when full)
  - Push ONLY on mouseup / keydown (not on every mousemove frame)
  - Undo: restore 'before', decrement pointer
  - Redo: restore 'after', increment pointer
  - Any new action clears the redo stack (entries after current pointer)

  Keyboard:
  - Cmd/Ctrl+Z: undo (active only when edit mode is on)
  - Cmd/Ctrl+Shift+Z: redo

Show me:
1. The HistoryStack class or hook (whichever fits my setup)
2. Where exactly to call pushHistory() in each of the 5 handlers
3. The undo() and redo() functions
4. The keyboard listener with cleanup

Deep clone VectorPath using structuredClone() — do not use JSON.parse/stringify.
```

**Expected output:** Full undo/redo system integrated into all 5 handlers.

---

## Prompt 12 — Final Integration & Cleanup

> **When to use:** Everything above is implemented and individually tested.

```
CONTEXT:
- All edit mode features are built:
  [x] Activation / exit
  [x] Render anchors + handles
  [x] Drag anchors
  [x] Drag handles with mirror rules
  [x] Add point on segment
  [x] Delete points
  [x] Convert point types
  [x] Hit test priority system
  [x] Undo / redo

TASK:
Final integration review. Check and fix:

1. EVENT LISTENER CLEANUP
   Every addEventListener in edit mode must have a corresponding
   removeEventListener when edit mode exits.
   Find any leaks in my implementation and fix them.
   Show me the cleanup pattern for React useEffect.

2. CURSOR MANAGEMENT
   Define a getCursor(hitTestResult, mode) function that returns
   the correct CSS cursor string for every possible state:
   - Pen tool active, draw mode, canvas: 'crosshair'
   - Edit mode, hovering anchor: 'move'
   - Edit mode, hovering handle: 'crosshair'
   - Edit mode, hovering segment: 'cell'
   - Edit mode, dragging: 'grabbing'
   - Edit mode, canvas (no hover): 'default'
   Apply it by setting canvas.style.cursor each onMouseMove.

3. PERFORMANCE
   The path string is rebuilt on every mousemove frame during drag.
   Make sure buildPathString() is NOT called during hover detection
   (only during active drag). Add a check:
   if (!isDraggingAnchor && !isDraggingHandle) return — skip rebuild.

4. TOUCH SUPPORT (basic)
   Map touch events to mouse equivalents for single-finger:
   touchstart → mousedown, touchmove → mousemove, touchend → mouseup
   Use e.touches[0].clientX/Y. No multi-touch needed.

5. EXIT SAFETY
   When the user switches tool while mid-drag:
   - Cancel the drag (don't commit the half-moved point)
   - Restore from dragStartPositions (or dragStartHandleValue)
   - Then exit edit mode cleanly

Show me all 5 fixes as surgical edits to the specific functions
that need changing — not a full rewrite.
```

**Expected output:** Cleanup patches for each of the 5 issues.

---

## Quick Reference — Prompt Order

| #   | Prompt                      | Builds on |
| --- | --------------------------- | --------- |
| 01  | Audit & integration point   | —         |
| 02  | Data types                  | 01        |
| 03  | Activate / exit edit mode   | 02        |
| 04  | Render anchors + handles    | 03        |
| 05  | Drag anchor points          | 04        |
| 06  | Drag bezier handles         | 05        |
| 07  | Add point on segment        | 06        |
| 08  | Delete points               | 07        |
| 09  | Convert point types         | 08        |
| 10  | Hit test priority system    | 05–09     |
| 11  | Undo / redo                 | 10        |
| 12  | Final integration & cleanup | 11        |

---

## Key Rules to Remember

```
1. handleIn and handleOut are RELATIVE to anchor position — never absolute

2. Hit test priority is always: handle → anchor → segment → canvas
   Never reverse this order

3. Push to undo stack on mouseUP, never on mouseMove

4. On type 'smooth': mirror BOTH direction and length
   On type 'asymmetric': mirror DIRECTION only, preserve opposite length
   On type 'disconnected': touch NOTHING on the opposite side

5. De Casteljau split: work in ABSOLUTE coords, convert to relative
   only when storing back into AnchorPoint.handleIn / handleOut

6. buildPathString() runs on drag frames only — NOT on hover detection

7. Every addEventListener needs a removeEventListener on edit mode exit
```

---

_12 prompts · run in order · fill in [brackets] before pasting_
