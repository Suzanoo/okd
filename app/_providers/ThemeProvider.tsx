"use client";
import { useEffect } from "react";
import { readPreference, resolveTheme, useThemeStore } from "@/lib/theme/store";
export default function ThemeProvider({children}:{children:React.ReactNode}) {
  useEffect(()=>{
    const media=matchMedia("(prefers-color-scheme: dark)");
    const apply=()=>{
      const {theme}=useThemeStore.getState();
      document.documentElement.classList.toggle("dark",theme==="dark");
      document.documentElement.dataset.theme=theme;
      document.documentElement.style.colorScheme=theme;
    };
    const update=()=>{const preference=readPreference();useThemeStore.setState({preference,theme:resolveTheme(preference,media.matches)});};
    const unsubscribe=useThemeStore.subscribe(apply);
    update();apply();
    const systemChange=()=>{const {preference}=useThemeStore.getState();useThemeStore.setState({theme:resolveTheme(preference,media.matches)});};
    media.addEventListener("change",systemChange);
    const storage=(event:StorageEvent)=>{if(event.key==="okmd_theme_mode" || event.key===null)update();};
    window.addEventListener("storage",storage);
    return ()=>{unsubscribe();media.removeEventListener("change",systemChange);window.removeEventListener("storage",storage);};
  },[]);
  return <>{children}</>;
}
