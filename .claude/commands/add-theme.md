# Add New Theme

Add a new custom theme to the template-editor project.

## Usage
/add-theme <theme-name> <hue-description>

Example: `/add-theme ocean "teal and cyan"`

## Steps

1. **Read** `src/index.css` to understand the existing token structure (`:root`, `.dark`, `.corporate`, `.brand`).

2. **Add the theme class** to `src/index.css` — place it after the `.brand {}` block. Define ALL of these tokens using `oklch()` color space:
   - `--background`, `--foreground`
   - `--card`, `--card-foreground`
   - `--popover`, `--popover-foreground`
   - `--primary`, `--primary-foreground`
   - `--secondary`, `--secondary-foreground`
   - `--muted`, `--muted-foreground`
   - `--accent`, `--accent-foreground`
   - `--destructive`, `--destructive-foreground`
   - `--border`, `--input`, `--ring`
   - `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`
   - `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`
   - `--dashboard-gradient-from`, `--dashboard-gradient-to`, `--dashboard-card`, `--dashboard-card-hover`

3. **Register the theme** in `src/components/theme/ThemeProvider.jsx` — add the new theme name to the `themes={[...]}` array.

4. **Add the theme entry** in `src/components/theme/ThemeToggle.jsx` — add an object to the `THEMES` array with `value`, `label`, and an appropriate `icon` from `lucide-react`.

5. **Verify** by running `npm run build` — confirm it exits cleanly.

## Rules
- Use `oklch()` for all color values (perceptually uniform, consistent with existing tokens).
- Every token must be defined — no missing variables.
- Choose a unique lucide-react icon that represents the theme's personality.
