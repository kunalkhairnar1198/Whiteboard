import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Moon, Palette, Sun, SunMoon } from 'lucide-react';

import { Button } from '@/components/ui/button';

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: SunMoon },
  { value: 'corporate', label: 'Corporate', icon: Building2 },
  { value: 'brand', label: 'Brand', icon: Palette },
];

export function ThemeToggle({ compact = false, className }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((o) => !o);
  };

  if (!mounted) {
    return <Button variant="outline" size="icon" className="w-9 h-9" disabled />;
  }

  const current = THEMES.find((t) => t.value === theme) ?? THEMES[0];
  const CurrentIcon = current.icon;

  return (
    <>
      <Button
        ref={btnRef}
        variant="outline"
        size={compact ? 'icon' : 'sm'}
        onClick={handleOpen}
        title="Switch theme"
        className={`gap-2 ${className}`}
      >
        <CurrentIcon className="w-4 h-4" />
        {!compact && <span className="hidden sm:inline">{current.label}</span>}
      </Button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[9999] min-w-[9rem] rounded-lg border border-border bg-popover p-1 shadow-md"
            style={{ top: coords.top, right: coords.right }}
          >
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => {
                  setTheme(value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                  theme === value ? 'bg-accent text-accent-foreground font-medium' : 'text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {theme === value && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
