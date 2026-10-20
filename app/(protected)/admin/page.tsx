import { requireActiveUser } from "@/lib/auth/requireActiveUser";
import AdminClient from "./AdminClient";

import { isPublicMode } from "@/config/access.config";
import { notFound } from "next/navigation";

export default async function AdminPage() {
  if (isPublicMode()) notFound();
  const me = await requireActiveUser({ requireAdmin: true });
  return <AdminClient meId={me.userId} />;
}
