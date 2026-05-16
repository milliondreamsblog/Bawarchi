"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "bawarchie-landing-theme";
const DARK_CLASS = "landing-dark";
const LIGHT_CLASS = "landing-light";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove(DARK_CLASS, LIGHT_CLASS);
  root.classList.add(theme === "dark" ? DARK_CLASS : LIGHT_CLASS);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // SSR renders dark (matches :root in globals.css). The pre-hydration
  // script in <head> may have already flipped the class to light before this runs.
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const initial: Theme = document.documentElement.classList.contains(LIGHT_CLASS)
      ? "light"
      : "dark";
    setThemeState(initial);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage may be unavailable (privacy mode); fail silently.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { theme: "dark" as Theme, toggleTheme: () => {}, setTheme: () => {} };
  }
  return ctx;
}

// Inline script that runs before paint to prevent a flash of the wrong theme.
// Reads stored preference (falls back to system); writes landing-* class on <html>.
// Uses its own class names so the admin-side `html.dark` toggle stays untouched.
export const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.classList.add(theme === 'light' ? '${LIGHT_CLASS}' : '${DARK_CLASS}');
  } catch (e) {
    document.documentElement.classList.add('${DARK_CLASS}');
  }
})();
`;
