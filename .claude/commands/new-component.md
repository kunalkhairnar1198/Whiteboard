# New Component

Scaffold a new React component for the template-editor project following project conventions.

## Usage
/new-component <ComponentName> <location> <description>

Examples:
- `/new-component ColorPicker src/components/ui "reusable color picker with label"`
- `/new-component ToolButton src/features/editor/components "icon button for toolbar"`

## Rules

### File conventions
- Use `.jsx` (not `.tsx`) — project does not use TypeScript.
- Named exports for utility/UI components, default export for feature components.
- Place in the path given. Create the folder if it doesn't exist.

### Styling conventions
- **Never** use hardcoded hex colors (`#FF6B00`, `bg-white`, etc.).
- **Always** use semantic Tailwind tokens:
  - Backgrounds: `bg-background`, `bg-card`, `bg-secondary`, `bg-muted`, `bg-primary`
  - Text: `text-foreground`, `text-muted-foreground`, `text-primary`, `text-primary-foreground`
  - Borders: `border-border`, `border-primary`
  - Interactive: `hover:bg-accent`, `hover:text-accent-foreground`, `focus:ring-ring`
  - Danger: `bg-destructive`, `text-destructive-foreground`
- Use `cn()` from `@/lib/utils` for conditional class merging.
- Accept a `className` prop and spread it via `cn()`.

### Component structure
```jsx
import { cn } from '@/lib/utils';

export function ComponentName({ className, ...props }) {
  return (
    <div className={cn('base-classes', className)} {...props}>
      {/* content */}
    </div>
  );
}
```

### Imports
- Icons: `lucide-react`
- UI primitives: `@/components/ui/button`, `@/components/ui/card`, etc.
- Engine context (if editor feature): `@/features/editor/engine/EngineContext`
- Redux (if needed): `useSelector`, `useDispatch` from `react-redux`

## Steps
1. Create the component file at the given location.
2. Implement the component following the rules above.
3. If it's a UI primitive, also export it from the file (named export).
4. Run `npm run build` to confirm no errors.
