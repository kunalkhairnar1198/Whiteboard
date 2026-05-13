# ⌨️ Keyboard Shortcuts & Interactions

> Complete reference for all keyboard shortcuts and mouse interactions in the Template Editor.

---

## 🔧 Tool Selection

| Shortcut | Action                    |
| :------- | :------------------------ |
| `V`      | Switch to **Select** tool |
| `P`      | Switch to **Pen** tool    |

> Other tools (Brush, Eraser, Text, Shapes) are selected from the left sidebar.

---

## 📐 General (All Tools)

| Shortcut               | Action                        |
| :--------------------- | :---------------------------- |
| `Ctrl/Cmd + Z`         | **Undo**                      |
| `Ctrl/Cmd + Y`         | **Redo**                      |
| `Ctrl/Cmd + Shift + Z` | **Redo** (alternative)        |
| `Ctrl/Cmd + D`         | **Duplicate** selected object |
| `Delete` / `Backspace` | **Delete** selected objects   |
| `Ctrl/Cmd + Shift + '` | **Toggle grid snap**          |

---

## 🖱️ Select Tool (`V`)

| Action                  | Result                                |
| :---------------------- | :------------------------------------ |
| **Click object**        | Select it — shows in properties panel |
| **Click empty area**    | Deselect all                          |
| **Drag object**         | Move it — connector lines follow      |
| **Drag handles**        | Scale / rotate                        |
| **Double-click text**   | Enter inline text editing mode        |
| **Double-click path**   | Enter **Pen Edit Mode** for that path |
| **Right-click / Btn 2** | Start panning (drag to pan viewport)  |

---

## 🖌️ Brush Tool

| Action           | Result                             |
| :--------------- | :--------------------------------- |
| **Click + drag** | Freehand drawing with active brush |

> Configure brush type, color, width, opacity, and shadow from the right sidebar.

---

## 🧹 Eraser Tool

| Action           | Result                                    |
| :--------------- | :---------------------------------------- |
| **Click object** | Delete it instantly                       |
| **Click + drag** | Delete all objects the cursor passes over |

---

## ✏️ Text Tool

| Action                | Result                                      |
| :-------------------- | :------------------------------------------ |
| **Click canvas**      | Place a new editable text object            |
| **Click existing**    | Select existing text                        |
| **Double-click text** | Enter inline editing mode (select all text) |

---

## 🔷 Shape Tools (Rectangle, Circle, Triangle, Star, Arrow, Line, Polygon, Frame)

| Action                 | Result                                         |
| :--------------------- | :--------------------------------------------- |
| **Click + drag**       | Create shape by dragging from corner to corner |
| **Click existing obj** | Select it instead of creating new shape        |

> Shapes smaller than 5×5px are discarded.

---

## 🔗 Line / Connector Tool

| Action                          | Result                               |
| :------------------------------ | :----------------------------------- |
| **Click anchor point on shape** | Start line from that anchor          |
| **Drag to another anchor**      | Connect two shapes with a line       |
| **Move connected shape**        | Connector line follows automatically |

> When the Line tool is active, green anchor helpers appear on all shapes (top, right, bottom, left).

---

## ✋ Pan Tool

| Action           | Result                  |
| :--------------- | :---------------------- |
| **Click + drag** | Pan the canvas viewport |

> Panning is also available by right-click/button-2 drag in any tool.

---

## 🖊️ Pen Tool — Draw Mode

| Action                 | Result                                                 |
| :--------------------- | :----------------------------------------------------- |
| **Click**              | Place a **corner** anchor point                        |
| **Click + drag**       | Place a **smooth** anchor with mirrored Bézier handles |
| **Hover first point**  | Shows close indicator                                  |
| **Click first point**  | **Close** the path (make it a loop)                    |
| `Enter`                | Complete path as an **open path**                      |
| `Escape`               | Finish path and exit to Select tool                    |
| `Delete` / `Backspace` | Delete selected points (in edit mode)                  |

---

## 🖊️ Pen Tool — Edit Mode

> Enter edit mode by **double-clicking** any pen path in Select mode.

### Anchor Point Manipulation

| Action                    | Result                                              |
| :------------------------ | :-------------------------------------------------- |
| **Drag anchor square**    | Move the anchor (handles follow — they're relative) |
| **Shift + Click anchor**  | Add/remove from multi-selection                     |
| **Drag selected anchors** | Move all selected anchors together                  |
| `Alt + Click anchor`      | Toggle between **corner** ↔ **smooth** point type   |
| `Delete` / `Backspace`    | Remove all selected anchors from the path           |

### Handle / Curve Manipulation

| Action                 | Result                                                      |
| :--------------------- | :---------------------------------------------------------- |
| **Drag handle circle** | Reshape curve — mirrored for smooth, independent for broken |
| `Alt + Drag handle`    | **Break symmetry** — convert smooth point to disconnected   |

### Path Operations

| Shortcut  | Action                                                                    |
| :-------- | :------------------------------------------------------------------------ |
| `Cmd + B` | **Break Path** — Split at selected node (open closed shape or split path) |
| `Cmd + J` | **Join Path** — Connect two selected endpoints (or close an open path)    |

### Exiting Edit Mode

| Action                     | Result                        |
| :------------------------- | :---------------------------- |
| `Escape`                   | Save edits and exit to Select |
| **Switch to another tool** | Auto-save edits and exit      |

---

## 🔍 Zoom & Navigation

| Shortcut / Action   | Result                              |
| :------------------ | :---------------------------------- |
| **Zoom In button**  | Zoom × 1.2 (max 5×)                 |
| **Zoom Out button** | Zoom × 0.8 (min 0.1×)               |
| **Reset Zoom**      | Reset to 1× with identity transform |

---

## 📋 Layer Panel

| Action                    | Result                             |
| :------------------------ | :--------------------------------- |
| **Click layer row**       | Select that object on canvas       |
| **Eye icon toggle**       | Show/hide the object               |
| **Lock icon toggle**      | Lock/unlock movement & editing     |
| **Up/Down arrows**        | Reorder layer (bring forward/back) |
| **Delete icon**           | Remove object                      |
| **Drag & drop** (dnd-kit) | Reorder layers visually            |

---

## 💡 Tips & Tricks

- **Smooth Curves:** Pull handles in the direction you want the curve to flow.
- **Sharp Corners:** Place a corner point (click), then click+drag for the next smooth point.
- **Node Editing:** Double-click any pen path anytime to re-enter edit mode.
- **Break + Extend:** Use `Cmd+B` to break a path, then continue drawing from the endpoint.
- **Connector Lines:** Use the Line tool with anchor points to create flowchart-style diagrams.
- **Quick Export:** Use the export button in the header for 2× resolution PNG/JPG downloads.
