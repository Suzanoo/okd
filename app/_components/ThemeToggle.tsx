"use client";
import { useThemeStore, type ThemePreference } from "@/lib/theme/store";
export default function ThemeToggle() {
  const preference=useThemeStore(s=>s.preference), setTheme=useThemeStore(s=>s.setTheme);
  return <label className="theme-control"><span className="sr-only">Color theme</span><select aria-label="Color theme" value={preference} onChange={e=>setTheme(e.target.value as ThemePreference)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>;
}
