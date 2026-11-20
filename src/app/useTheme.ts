import { useContext } from 'react';
import { ThemeContext } from './theme-context';

/** A custom hook: a function starting with `use` that calls other hooks. */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
