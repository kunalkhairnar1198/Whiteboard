
I want to implement a complete scalable theme system in my existing React + Vite + Tailwind CSS + shadcn/ui application.

Requirements:
0. add existng header inside theme button
1. Use shadcn/ui recommended architecture
2. Use next-themes for theme management
3. Support:
   - Light theme
   - Dark theme
   - System theme
   - Additional custom themes (corporate, brand themes)
4. Use CSS variables and semantic design tokens
5. Ensure all components automatically adapt to themes
6. Persist selected theme using localStorage
7. Avoid hydration/theme flashing issues
8. Add smooth theme transition animations
9. Use semantic Tailwind utility classes:
   - bg-background
   - text-foreground
   - border-border
   - bg-card
   - text-muted-foreground
   etc.
10. Avoid hardcoded colors like:
   - bg-blue-500
   - text-black
   - bg-white

Implementation Tasks:

- Install and configure next-themes
- Create reusable ThemeProvider component
- Wrap entire application with ThemeProvider
- Configure index.css with:
  - :root variables
  - .dark variables
  - additional custom theme variables
- Configure Tailwind to use CSS variable tokens
- Create reusable ThemeToggle component using shadcn Button
- Add dropdown/theme switcher for multiple themes
- Create scalable semantic color token system
- Add transition animations for theme changes
- Ensure all existing components are converted from hardcoded colors to semantic classes

Need:
- Production-ready folder structure
- Clean reusable architecture
- Reusable theme utilities/hooks
- Best practices for enterprise dashboard applications
- Responsive and accessible implementation
- Future scalability for white-label/client branding support

Also:
- Refactor sample existing components to use semantic theme tokens
- Show before/after examples
- Follow modern React best practices
- Use .jsx files (not TypeScript)
- Use Tailwind CSS + shadcn/ui conventions only

Please provide:
1. Complete setup
2. Folder structure
3. All required files
4. Tailwind configuration
5. Theme provider setup
6. Theme toggle component
7. Custom theme examples
8. Best practices
9. Common mistakes to avoid
10. Example reusable themed card/layout/button components
