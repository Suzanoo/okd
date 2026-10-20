"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useStore } from "zustand";
import { createBoqSession, type QueryState } from "@/lib/boq/session";

const Context = createContext<ReturnType<typeof createBoqSession> | null>(null);
export default function BoqSessionProvider({ children }: {children: React.ReactNode}) {
  const [session] = useState(() => createBoqSession());
  return <Context.Provider value={session}>{children}</Context.Provider>;
}
export function useBoqSession() {
  const session = useContext(Context);
  if (!session) throw new Error("BOQ session provider is missing");
  return session;
}
export function useBoqState() { return useStore(useBoqSession()); }
export function useQueryState<K extends keyof QueryState>(key: K) {
  const session = useBoqSession();
  const value = useStore(session, s => s.query[key]);
  const set = useCallback((next: QueryState[K] | ((old: QueryState[K]) => QueryState[K])) => session.setQuery(key,next),[session,key]);
  return [value,set] as const;
}
