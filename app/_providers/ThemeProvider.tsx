"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/theme/store";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === "dark";

    root.classList.toggle("dark", isDark);
    root.dataset.theme = theme;
    root.style.colorScheme = isDark ? "dark" : "light";

    localStorage.setItem("okmd_theme_mode", theme);
  }, [theme]);

  return <>{children}</>;
}
