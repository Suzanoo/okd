"use client";
import { useBoqSession, useBoqState } from "@/app/_providers/BoqSessionProvider";
import type { SessionRow } from "@/lib/boq/session";
import { PAGE_SIZE } from "@/config/boq.config";

export default function ViewerRows({ rows }: { rows: SessionRow[] }) {
  const session = useBoqSession(), {viewerPage:page} = useBoqState();
  const pages = Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
  const fmt = (n: number) => n.toLocaleString(undefined,{maximumFractionDigits:2});
  const total = rows.reduce((sum,r) => sum+r.amount,0);
  return <section aria-label="Read-only BOQ rows" className="rounded-2xl border border-border bg-surface p-4 space-y-3">
    <h2 className="text-lg font-semibold">BOQ rows — read only</h2>
    <p data-testid="viewer-summary">{rows.length.toLocaleString()} rows • Amount: {fmt(total)} • totals cover all rows in the current Viewer scope</p>
    <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-xs">
      <thead><tr>{["WBS-1","WBS-2","WBS-3","WBS-4","Description","Unit","Qty","Material","Labor","Amount"].map(h=><th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
      <tbody>{rows.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE).map(row=><tr key={row._id} data-row-id={row._id} className="border-t border-border">
        {[row.wbs1,row.wbs2,row.wbs3,row.wbs4,row.description,row.unit].map((v,i)=><td key={i} className="p-2">{v || "—"}</td>)}
        {[row.qty,row.material,row.labor,row.amount].map((v,i)=><td key={i} className="p-2 text-right tabular-nums">{fmt(v)}</td>)}
      </tr>)}</tbody>
    </table></div>
    {!rows.length && <p>No accepted BOQ rows in this scope.</p>}
    <div className="flex items-center gap-4">
      <button type="button" disabled={page<=1} onClick={()=>session.setState({viewerPage:page-1})}>Previous rows</button>
      <span>Page {page} / {pages}</span>
      <button type="button" disabled={page>=pages} onClick={()=>session.setState({viewerPage:page+1})}>Next rows</button>
    </div>
  </section>;
}
