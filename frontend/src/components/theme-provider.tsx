import { ThemeProviderContext } from "@/hooks/use-theme";
import React, { useEffect, useState } from "react";

export type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export function ThemeProvider({
  children,
  defaultTheme = getSystemTheme(),
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = getSystemTheme();

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme | ((theme: Theme) => Theme)) => {
      if (typeof theme !== "string") {
        setTheme((theme_) => {
          const newTheme = theme(theme_);
          if (newTheme === "system") {
            return getSystemTheme();
          }
          return newTheme;
        });
        return;
      }
      if (theme === "system") {
        setTheme(getSystemTheme());
      } else {
        setTheme(theme);
      }
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}