"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useBoqSession, useBoqState } from "@/app/_providers/BoqSessionProvider";
import BoqWorkspaceSource from "@/app/_components/BoqWorkspaceSource";
import WorkspaceSheet from "@/app/_components/WorkspaceSheet";
import { buttonClass } from "@/app/_components/WorkspaceControls";
import { sumBy } from "@/lib/boq/boqTransform";
import { filterViewerRows } from "@/lib/boq/session";
import ViewerRows from "./ViewerRows";
import ViewerTree from "./ViewerTree";
import ScopeChart from "./ScopeChart";

const keys=["wbs1","wbs2","wbs3","wbs4"] as const;
export default function BOQClient() {
  const state=useBoqState(),session=useBoqSession();
  const {rows,viewerPath,sheet,loading}=state;
  const scopeRows=useMemo(()=>filterViewerRows(rows,viewerPath),[rows,viewerPath]);
  const total=scopeRows.reduce((n,r)=>n+r.amount,0);
  const nextLevel=viewerPath.findIndex(v=>v===null);
  const groups=useMemo(()=>sumBy(scopeRows,r=>nextLevel<0?r.description:r[keys[nextLevel]]),[scopeRows,nextLevel]);
  const select=(level:number,value:string)=>session.setViewerPath(viewerPath.map((v,i)=>i<level?v:i===level?value:null));
  const current=viewerPath.filter(v=>v!==null).at(-1);
  return <main className="boq-workspace">
    <div className="workspace-title"><p className="workspace-eyebrow">OKD / Workbook workspace</p><h1>BOQ Viewer</h1><p>Explore quantities and amounts through the work breakdown structure.</p></div>
    <BoqWorkspaceSource />
    {sheet && !loading && <div className="structured-viewer">
      <aside className="wbs-rail"><ViewerTree rows={rows} path={viewerPath} onSelect={session.setViewerPath}/></aside>
      <div className="structured-content">
        <nav aria-label="Viewer breadcrumbs" className="scope-breadcrumbs">
          <button onClick={()=>session.setViewerPath([null,null,null,null])}>All BOQ</button>
          {viewerPath.map((value,i)=>value!==null&&<span key={i}> / <button onClick={()=>session.setViewerPath(viewerPath.map((v,j)=>j<=i?v:null))}>{value||"Unassigned"}</button></span>)}
        </nav>
        <WorkspaceSheet title="Browse WBS" trigger="Browse WBS" mobileOnly doneLabel="View selected scope"><ViewerTree rows={rows} path={viewerPath} onSelect={session.setViewerPath}/></WorkspaceSheet>
        <section className="scope-stats" aria-label="Selected scope">
          <div className="workspace-panel"><span>Selected Amount</span><strong data-testid="scope-amount">{total.toLocaleString(undefined,{maximumFractionDigits:2})}</strong><small>Stored Amount · {scopeRows.length.toLocaleString()} included rows</small></div>
          <div className="workspace-panel"><span>Source rows</span><strong>{scopeRows.length.toLocaleString()}</strong><small>Positive Amount items</small></div>
          <div className="workspace-panel"><span>Current scope</span><strong>{current===undefined?"All BOQ":current||"Unassigned"}</strong><small>{nextLevel<0?"WBS-4 selected":"All lower levels"}</small></div>
        </section>
        <div className="scope-overview">
          <ScopeChart data={groups} title={nextLevel<0?"Amount by Description":`Amount by WBS-${nextLevel+1}`} scopeTotal={total} onSelect={nextLevel<0?undefined:name=>select(nextLevel,name)}/>
          <section className="workspace-panel query-invitation"><p className="workspace-eyebrow">One workbook, two workspaces</p><h2>Need to find an item?</h2><p>Search descriptions, combine filters and export a result in Query.</p><Link className={buttonClass} href="/query">Open Query →</Link><p className="workspace-note">Query uses the whole selected sheet.</p></section>
        </div>
        <ViewerRows rows={scopeRows}/>
      </div>
    </div>}
  </main>;
}
