/** Server configuration. Missing preserves legacy authentication; invalid fails closed. */
export function getAccessMode(): "public" | "authenticated" {
  const mode = process.env.OKD_ACCESS_MODE;
  if (mode === undefined || mode === "authenticated") return "authenticated";
  if (mode === "public") return "public";
  throw new Error("OKD_ACCESS_MODE must be public or authenticated");
}

export function isPublicMode(): boolean {
  return getAccessMode() === "public";
}

export function isPrivatePath(pathname: string): boolean {
  return ["/admin", "/api/admin", "/login", "/logout"].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
