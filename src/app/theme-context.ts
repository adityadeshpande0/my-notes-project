import { createContext } from 'react';

export type Theme = 'dark' | 'light';

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

/**
 * Context lets any component read the theme without passing it down as a prop
 * through every layer ("prop drilling"). The value is provided by <ThemeProvider>.
 * It lives in its own file so Fast Refresh keeps working for the component files.
 */
export const ThemeContext = createContext<ThemeContextValue | null>(null);
