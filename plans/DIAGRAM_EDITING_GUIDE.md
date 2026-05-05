# 📐 Diagram Editing & Path Manipulation

> ⚠️ **For keyboard shortcuts, see [SHORTCUTS.md](./SHORTCUTS.md)** — the complete shortcut reference.
>
> This file documents pen tool workflow patterns for diagram editing.

---

## 1. ✂️ Breaking Paths (`Cmd + B`)

Split a connected path into separate segments or open a closed shape.

### Open a Closed Shape
1. **Double-click** the shape to enter Node Edit Mode.
2. Select the anchor point where you want the break.
3. Press **`Cmd + B`**.
4. The shape becomes an **Open Path** starting and ending at that node.

### Split an Open Path
1. Select an intermediate anchor point (not an endpoint).
2. Press **`Cmd + B`**.
3. The path splits into **two separate objects** at that location.
4. You can now move each segment independently.

---

## 2. 🔗 Joining Paths (`Cmd + J`)

Connect separate endpoints to form a single continuous path or close a loop.

1. Select **two endpoints** (from the same path or different paths).
2. Press **`Cmd + J`**.
3. Result:
   - Same path endpoints → becomes a **Closed Shape**.
   - Different paths → merged at their midpoint into one continuous path.

---

## 3. ➕ Adding Detail (On-Segment Insertion)

> ⚠️ **Not yet implemented** — planned for Phase 5 (see [ROADMAP.md](./ROADMAP.md)).

The planned workflow:
1. Enter Node Edit Mode.
2. Hover over any path segment.
3. When the **`+`** indicator appears, click to insert a new anchor.
4. Drag the new anchor to create a bend or branch.

---

## 4. 🎛️ Point Type Conversion (`Alt + Click`)

Change how a diagram curves or bends at any node:

| Point Type        | Behavior                                                  |
| :---------------- | :-------------------------------------------------------- |
| **Corner**        | Sharp angle, no handles. Good for boxes and sharp turns.  |
| **Smooth**        | Mirror-image handles. Good for organic curves.            |
| **Disconnected**  | Handles move independently. For complex transitions.      |

**Toggle shortcut:** Hold **`Alt`** and **Click** any anchor to switch between Corner ↔ Smooth.

To break handle symmetry: Hold **`Alt`** and **Drag** a handle circle on a smooth point.

---

## 5. 🔗 Connector Lines (Line Tool)

Create flowchart-style connected diagrams:

1. Select the **Line** tool from the sidebar.
2. Green **anchor helpers** appear on all shapes (top, right, bottom, left).
3. **Click** an anchor point to start a line.
4. **Drag** to another anchor point to connect.
5. When you move either shape, the connector line **follows automatically**.

> Connector data is stored in `line.data.connector`, `sourceId`, `targetId`, `sourceAnchor`, `targetAnchor`.

---

## 6. 💡 Workflow Tips

- **Break → Extend:** Use `Cmd+B` to break a closed shape, then draw from the open endpoint to extend the design.
- **Join → Close:** Use `Cmd+J` on two endpoints of the same open path to close it into a shape.
- **Connector chains:** Connect multiple shapes with connector lines to create flowcharts.
- **Convert corners:** Use `Alt+Click` to convert sharp corners to smooth curves and vice versa mid-editing.
