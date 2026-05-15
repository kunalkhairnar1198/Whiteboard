# UI Audit

Audit the editor UI for theme compliance, accessibility issues, and consistency problems.

## Steps

### 1. Hardcoded color check
Run:
```
grep -rn "#[0-9a-fA-F]\{3,6\}\|bg-white\b\|text-black\b\|bg-red-[0-9]\|bg-blue-[0-9]\|bg-gray-[0-9]" src/ --include="*.jsx" | grep -v "node_modules\|whiteboard\|useState\|type=\"color\""
```
List any violations. For each one, state the file, line, and the correct semantic replacement.

### 2. Missing bg-background / text-foreground on raw inputs
Run:
```
grep -rn '<input\|<select\|<textarea' src/ --include="*.jsx" | grep -v "type=\"color\"\|type=\"file\"\|type=\"range\"\|type=\"checkbox\"\|className.*bg-background"
```
List any raw form elements missing `bg-background text-foreground` classes.

### 3. Z-index stacking issues
Check for any dropdown, popover, or modal that uses `z-50` or lower inside a component that has `backdrop-blur` or `transform` on an ancestor (these create stacking contexts). The fix is always `createPortal` + `fixed` positioning with `z-[9999]`.

### 4. No-scrollbar compliance
Confirm that `SidebarContent` (in `src/components/ui/sidebar.jsx`) and the canvas container (`src/features/editor/components/Canvas/index.jsx`) both have `no-scrollbar`.

### 5. Theme toggle presence
Confirm `ThemeToggle` appears in both:
- `src/features/editor/components/sidebar/Header/index.jsx` (editor)
- `src/pages/Dashboard/Dashboard.jsx` (dashboard)

### Report format
Return a report with sections:
- ✅ Passing checks
- ⚠️ Issues found (file:line — description — fix)
- Summary: total issues count
