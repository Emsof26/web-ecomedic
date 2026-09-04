import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { ThemeContext } from "./theme";
import type { Theme } from "./theme";

const THEME_STORAGE_KEY = "ecomedic_theme";

function getInitialTheme(): Theme {
  return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((currentTheme) => (
    currentTheme === "dark" ? "light" : "dark"
  ));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}