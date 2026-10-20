"use client";

import BoqWorkspaceSource from "@/app/_components/BoqWorkspaceSource";
import { useBoqState } from "@/app/_providers/BoqSessionProvider";
import QuerySection from "./_components/QuerySection";

export default function QueryPage() {
  const s = useBoqState();
  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
    <h1 className="text-2xl font-semibold">BOQ Query</h1>
    <p className="text-sm text-muted-foreground">Search all accepted rows in the selected sheet. Viewer WBS navigation does not restrict Query.</p>
    <BoqWorkspaceSource />
    {s.sheet && !s.loading && <QuerySection rows={s.rows} />}
  </main>;
}
