# Project Context for Claude

This folder contains project-specific instructions and context for Claude.

## Current State

- **Architecture**: Engine-driven architecture with specialized managers (LayerManager, ToolManager, etc.).
- **State Management**: Redux Toolkit with a reactive engine-UI bridge.
- **Key Features**:
  - Advanced Pen Tool with path breaking and continuation.
  - Professional Layers Panel with Drag & Drop reordering.
  - Robust LocalStorage persistence.
- **Tech Stack**: React 19, Vite 7, Fabric.js 6.7.1, Redux, dnd-kit, Tailwind CSS 4.

## Key Files

- `src/features/editor/engine/`: Core logic (The "Brain").
- `src/store/`: Redux slices and engine sync bridge.
- `src/pages/Editor/`: Main editor interface.
- `PROJECT_FLOW.md`: Detailed flow of the application.
- `plans/ARCHITECTURE.md`: Technical architectural decisions.
