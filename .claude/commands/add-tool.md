# Add Canvas Tool

Add a new drawing/interaction tool to the Fabric.js canvas editor.

## Usage
/add-tool <ToolName> <description>

Example: `/add-tool LineTool "draw straight lines between two points"`

## Architecture Overview

The editor uses an engine-based architecture:
- `src/features/editor/engine/tools/Tool.js` — base class all tools extend
- `src/features/editor/engine/ToolManager.js` — registers and activates tools
- `src/store/slices/toolSlice.js` — Redux slice for tool state and settings
- `src/features/editor/engine/EngineContext.jsx` — provides engine to React components

## Steps

### 1. Create the tool class
Create `src/features/editor/engine/tools/<ToolName>.js`:
```js
import { Tool } from './Tool.js';

export class ToolName extends Tool {
  constructor(canvas) {
    super(canvas);
    this.name = 'toolname'; // lowercase, matches route/Redux key
  }

  activate() {
    super.activate();
    // setup canvas event listeners
  }

  deactivate() {
    // remove event listeners
    super.deactivate();
  }
}
```

### 2. Register in ToolManager
Read `src/features/editor/engine/ToolManager.js` and add the new tool to the tools map in `initTools()`.

### 3. Add Redux settings (if the tool has configurable options)
Read `src/store/slices/toolSlice.js` — add default settings to `initialState.toolSettings` and handle them in reducers if needed.

### 4. Add UI entry point
- Add a button in `src/features/editor/components/DrawingToolsPanel/index.jsx` (or the Toolbar) with the tool's icon and label.
- Use `bg-primary` / `border-primary` for active state, `border-border hover:border-primary/50` for inactive.

### 5. Add tool settings panel (optional)
If the tool has settings, add a `<ToolNameSettings>` component inside `src/features/editor/components/sidebar/RightSidebar/ToolSettingsPanel.jsx` following the pattern of `BrushSettings` / `PenSettings`.

### 6. Verify
Run `npm run build` to confirm no errors.

## Rules
- Tool classes are plain JS — no React, no JSX.
- Keep canvas event setup in `activate()` and teardown in `deactivate()`.
- All UI for the tool must use semantic tokens (no hardcoded hex colors).
