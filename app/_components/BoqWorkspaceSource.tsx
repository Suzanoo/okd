"use client";

import { SourcePanel, buttonClass } from "./WorkspaceControls";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBoqSession, useBoqState } from "@/app/_providers/BoqSessionProvider";
import { fetchWorkbookBuffer } from "@/lib/boq/boqParse";

export default function BoqWorkspaceSource() {
  const s = useBoqState(), session = useBoqSession(), path = usePathname();
  const button = buttonClass;
  return <SourcePanel label="Shared BOQ workbook">
    <nav aria-label="BOQ workflows" className="flex flex-wrap gap-3">
      <Link className={button} href="/boq" aria-current={path === "/boq" ? "page" : undefined}>Viewer</Link>
      <Link className={button} href="/query" aria-current={path === "/query" ? "page" : undefined}>Query</Link>
    </nav>
    <div className="flex flex-wrap items-center gap-3">
      <label className={button}>Upload Excel<input className="sr-only" type="file" accept=".xlsx,.xls" onChange={e => {
        const file=e.target.files?.[0];
        if(file) void session.load(file.name,"upload",() => file.arrayBuffer());
        e.target.value="";
      }}/></label>
      <button className={button} type="button" onClick={() => void session.load("example_boq.xlsx","default",() => fetchWorkbookBuffer("/boq/example_boq.xlsx"))}>Use synthetic demo</button>
      <a className={button} href="/boq/example_boq.xlsx" download>Download Demo</a>
      <label className="text-sm">Sheet <select aria-label="BOQ sheet" className={button} value={s.sheet} disabled={s.loading || !s.sheets.length} onChange={e => session.selectSheet(e.target.value)}>
        {!s.sheet && <option value="">Select workbook first</option>}
        {s.sheets.map(name => <option key={name}>{name}</option>)}
      </select></label>
    </div>
    <p data-testid="boq-source" className="text-sm">{s.sourceName ? `Current: ${s.sourceName} (${s.sourceType === "default" ? "synthetic demo" : "uploaded"}) • ${s.sheet} • ${s.rows.length.toLocaleString()} accepted rows` : "No BOQ workbook loaded. Select a workbook or use the synthetic demo."}</p>
    <p className="text-xs text-muted-foreground">Viewer and Query share the selected sheet in this tab. Refresh clears the workbook: select it again. No file is uploaded or saved online.</p>
    {s.loading && <p role="status">Loading {s.pendingName}… Previous data is paused until loading finishes. You can choose another file.</p>}
    {s.error && <p role="alert" className="text-danger">{s.error}</p>}
  </SourcePanel>;
}
