import { useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";

import { ThemeContext } from "./theme";
import type { Theme } from "./theme";

const THEME_STORAGE_KEY = "ecomedic_theme";

function getInitialTheme(): Theme {
  return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((currentTheme) => {
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    // Actualiza el atributo antes del siguiente pintado para que el cambio sea inmediato.
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    return nextTheme;
  }); 

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}