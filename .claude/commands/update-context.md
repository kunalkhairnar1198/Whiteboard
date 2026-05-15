# Update Project Context

Re-scan the project and update the `.claude/project-context.md` file to reflect the current state.

## Steps

1. Read the current `src/package.json` for dependency versions.
2. List all files in:
   - `src/features/editor/engine/` (engine modules)
   - `src/features/editor/engine/tools/` (registered tools)
   - `src/components/ui/` (UI primitives)
   - `src/components/theme/` (theme system)
   - `src/store/slices/` (Redux slices)
   - `src/pages/` (pages)
3. Read `src/index.css` — list the theme classes defined (`:root`, `.dark`, and any custom themes).
4. Read `src/features/editor/engine/EngineContext.jsx` — summarize what the engine context exposes.
5. Run `git log --oneline -10` to capture recent significant changes.

Then **rewrite** `.claude/project-context.md` with:
- Updated tech stack versions
- Current engine module list
- Current tool list
- Current theme list
- Current Redux slices
- Current page routes
- Key architectural patterns (engine-based, CSS variable tokens, portal-based dropdowns, etc.)
- Any recent notable changes from git log

Also update `memory/project-overview.md` and `memory/theme-system.md` in the project's memory folder if the content has changed significantly.
