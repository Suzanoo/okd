"use client";
import { buttonClass } from "./WorkspaceControls";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBoqSession,useBoqState } from "@/app/_providers/BoqSessionProvider";
import { fetchWorkbookBuffer } from "@/lib/boq/boqParse";

export default function BoqWorkspaceSource(){
  const s=useBoqState(),session=useBoqSession(),path=usePathname();
  return <>
    <nav aria-label="BOQ workflows" className="boq-route-tabs">
      <Link href="/boq" aria-current={path==="/boq"?"page":undefined}>Viewer</Link>
      <Link href="/query" aria-current={path==="/query"?"page":undefined}>Query</Link>
    </nav>
    <section aria-label="Shared BOQ workbook" className="workspace-panel boq-source">
      <div className="boq-source-main">
        <span aria-hidden="true" className="source-icon">▤</span>
        <div className="source-identity"><strong>{s.sourceName||"No BOQ workbook loaded"}</strong><p data-testid="boq-source">{s.sourceName?`Current: ${s.sourceName} (${s.sourceType==="default"?"synthetic demo":"uploaded"}) • ${s.sheet} • ${s.rows.length.toLocaleString()} accepted rows`:"No BOQ workbook loaded. Select a workbook or use the synthetic demo."}</p></div>
        <label className={buttonClass}>Upload Excel<input className="sr-only" type="file" accept=".xlsx,.xls" onChange={e=>{const file=e.target.files?.[0];if(file)void session.load(file.name,"upload",()=>file.arrayBuffer());e.target.value="";}}/></label>
        <label className="source-sheet">Sheet<select aria-label="BOQ sheet" value={s.sheet} disabled={s.loading||!s.sheets.length} onChange={e=>session.selectSheet(e.target.value)}>
          {!s.sheet&&<option value="">Select workbook first</option>}{s.sheets.map(name=><option key={name}>{name}</option>)}
        </select></label>
      </div>
      <div className="source-secondary"><p>Local to this tab · Refresh clears the workbook: select it again. No file is uploaded or saved online.</p><button className={buttonClass} onClick={()=>void session.load("example_boq.xlsx","default",()=>fetchWorkbookBuffer("/boq/example_boq.xlsx"))}>Use synthetic demo</button><a className={buttonClass} href="/boq/example_boq.xlsx" download>Download Demo</a></div>
      {s.loading&&<p role="status">Loading {s.pendingName}… Previous data is paused until loading finishes. You can choose another file.</p>}
      {s.error&&<p role="alert">{s.error}</p>}
    </section>
  </>;
}
