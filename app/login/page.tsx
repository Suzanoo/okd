import { isPublicMode } from "@/config/access.config";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  if (isPublicMode()) notFound();
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
