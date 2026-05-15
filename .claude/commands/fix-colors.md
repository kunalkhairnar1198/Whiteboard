# Fix Hardcoded Colors

Scan the project for hardcoded colors and replace them with semantic Tailwind tokens.

## Steps

1. **Find all hardcoded colors** by running:
   ```
   grep -rn "#FF6B00\|#FF8C38\|#CC5500\|#FFF4EC\|#FFD6B3\|bg-white\b\|text-black\b\|bg-red-500\b\|bg-blue-500\b\|bg-gray-" src/ --include="*.jsx" --include="*.js"
   ```

2. **For each match**, open the file and replace using this mapping:

   | Hardcoded | Semantic token |
   |-----------|---------------|
   | `bg-[#FF6B00]` | `bg-primary` |
   | `hover:bg-[#FF8C38]` | `hover:bg-primary/80` |
   | `bg-[#CC5500]` / `hover:bg-[#CC5500]` | `hover:bg-primary/70` |
   | `bg-[#FFF4EC]` | `bg-secondary` |
   | `hover:bg-[#FFF4EC]` | `hover:bg-secondary` |
   | `border-[#FFD6B3]` | `border-border` |
   | `border-[#FF6B00]` | `border-primary` |
   | `hover:border-[#FF8C38]` | `hover:border-primary/50` |
   | `text-[#FF6B00]` | `text-primary` |
   | `text-[#CC5500]` | `text-accent-foreground` |
   | `text-white` (on primary bg) | `text-primary-foreground` |
   | `bg-white` | `bg-background` |
   | `bg-red-500` / `bg-red-600` | `bg-destructive` |
   | `text-red-500` / `text-red-600` | `text-destructive` |
   | `focus:ring-[#FF6B00]` | `focus:ring-ring` |
   | `text-[#FF6B00] rounded focus:ring-2 focus:ring-[#FF6B00]` | `accent-primary rounded focus:ring-2 focus:ring-ring` |

3. **Skip** these files (they are non-UI or intentional):
   - `src/features/whiteboard/` (legacy, not part of main editor)
   - Any `useState('#FF6B00')` — those are default color picker values, not style classes

4. **Run** `npm run build` after changes to confirm no errors.

## Rules
- Only replace class strings, not data/state values like `useState('#FF6B00')`.
- On `<input type="color">` elements, the `value` prop is a data value — leave it alone.
- Add `bg-background text-foreground` to any raw `<input>`, `<select>`, or `<textarea>` that lacked it.
