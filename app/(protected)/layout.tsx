import { requireActiveUser } from "@/lib/auth/requireActiveUser";
import { isPublicMode } from "@/config/access.config";
import { notFound } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isPublicMode()) notFound();
  await requireActiveUser();

  return <>{children}</>;
}
