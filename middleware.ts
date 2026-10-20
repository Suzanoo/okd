import { NextResponse, type NextRequest } from "next/server";
import { isPrivatePath, isPublicMode } from "@/config/access.config";

export async function middleware(req: NextRequest) {
  if (isPublicMode()) {
    if (isPrivatePath(req.nextUrl.pathname)) {
      return new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.next();
  }
  const { updateSession } = await import("@/lib/supabase/middleware");
  return updateSession(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
