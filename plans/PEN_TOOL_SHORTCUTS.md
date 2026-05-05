# 🖊️ Pen Tool Keyboard Shortcuts

> ⚠️ **This file is superseded by [SHORTCUTS.md](./SHORTCUTS.md)** — which contains the complete shortcut reference for all tools in the editor.
>
> This file is kept for quick pen-tool-specific reference.

---

## 🛠️ Tool Modes

| Shortcut | Action | Context |
| :--- | :--- | :--- |
| **`P`** | **Activate Pen Tool** | Anywhere |
| **`V`** | **Exit Pen Tool (to Select mode)** | During Draw / Edit |
| **Double-Click**  | **Enter Node Edit Mode** | On a pen path in Select Mode |
| **`Esc`** | **Finish Path / Exit Edit Mode** | During Draw / Edit |

---

## 🖌️ Drawing (Draw Mode)

| Action | Result |
| :--- | :--- |
| **Click** | Place a **Corner** anchor point |
| **Click + Drag** | Place a **Smooth** Bézier anchor point with mirrored handles |
| **`Enter`** | Complete the current path as an **Open Path** |
| **Click Start Point** | Complete the current path as a **Closed Path** |
| **`Ctrl/Cmd + Z`** | Global undo |

---

## 📐 Point Manipulation (Edit Mode)

| Action | Result |
| :--- | :--- |
| **Drag Anchor** | Move the anchor point (and its associated handles) |
| **`Shift` + Click** | Select multiple anchor points |
| **Drag Selected** | Move all selected anchor points together |
| **Drag Handle Circle** | Reshape the curve |
| **`Alt` + Click Anchor** | Toggle anchor type between **Corner** and **Smooth** |
| **`Alt` + Drag Handle** | Break symmetry of a smooth point → **Disconnected** |
| **`Delete` / `Backspace`** | Remove all currently selected anchor points |
| **`Cmd + B`** | **Break Path**: Split at selected node (open closed path or split into sub-paths) |
| **`Cmd + J`** | **Join Path**: Connect two selected endpoints (or close an open path) |

---

## ⚙️ Settings & Snapping

| Shortcut | Action | Context |
| :--- | :--- | :--- |
| **`Ctrl/Cmd + Shift + '`** | **Toggle Grid Snap** | During Draw / Edit |

---

## 💡 Tips

- **Smooth Curves:** Pull handles out in the direction you want the curve to flow.
- **Sharp Corners:** Place a corner point (Click), then Click+Drag for the next point.
- **Node Editing:** Double-click any pen path to enter edit mode at any time.
- **Break + Extend:** Use `Cmd+B` to break a closed shape, then draw from the endpoint.
