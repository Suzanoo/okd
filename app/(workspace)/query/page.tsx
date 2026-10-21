"use client";

import BoqWorkspaceSource from "@/app/_components/BoqWorkspaceSource";
import { useBoqState } from "@/app/_providers/BoqSessionProvider";
import QuerySection from "./_components/QuerySection";

export default function QueryPage() {
  const s = useBoqState();
  return <main className="boq-workspace">
    <div className="workspace-title"><p className="workspace-eyebrow">OKD / Workbook workspace</p><h1>Query Workspace</h1><p>Find, filter and export items from the selected sheet. Viewer WBS navigation does not restrict Query.</p></div>
    <BoqWorkspaceSource />
    {s.sheet && !s.loading && <QuerySection rows={s.rows} />}
  </main>;
}
