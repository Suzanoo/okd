import { isPublicMode } from "@/config/access.config";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  if (!isPublicMode()) {
    const { requireActiveUser } = await import("@/lib/auth/requireActiveUser");
    await requireActiveUser();
  }
  return <>{children}</>;
}
