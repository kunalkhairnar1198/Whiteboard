import { useEffect } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';

function TransitionEnabler() {
  useEffect(() => {
    const t = setTimeout(() => document.documentElement.classList.add('theme-transitions'), 100);
    return () => clearTimeout(t);
  }, []);
  return null;
}

export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={['light', 'dark', 'corporate', 'brand']}
      {...props}
    >
      <TransitionEnabler />
      {children}
    </NextThemesProvider>
  );
}
