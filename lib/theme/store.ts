import { create } from "zustand";
export type ThemeMode = "light" | "dark";
export type ThemePreference = ThemeMode | "system";
export function resolveTheme(preference: ThemePreference, darkSystem: boolean): ThemeMode {
  return preference === "system" ? (darkSystem ? "dark" : "light") : preference;
}
export function readPreference(): ThemePreference {
  try { const value=localStorage.getItem("okmd_theme_mode"); if(value==="light" || value==="dark" || value==="system")return value; } catch {}
  return "system";
}
export const useThemeStore=create<{theme:ThemeMode;preference:ThemePreference;setTheme:(v:ThemePreference)=>void}>(set=>({
  theme:"light",preference:"system",
  setTheme:preference=>{
    try {localStorage.setItem("okmd_theme_mode",preference);} catch {}
    set({preference,theme:resolveTheme(preference,matchMedia("(prefers-color-scheme: dark)").matches)});
  }
}));
