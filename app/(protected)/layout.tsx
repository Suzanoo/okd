import { requireActiveUser } from "@/lib/auth/requireActiveUser";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireActiveUser();

  return <>{children}</>;
}
