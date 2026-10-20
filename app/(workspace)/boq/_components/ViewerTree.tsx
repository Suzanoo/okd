"use client";
import { useMemo } from "react";
import type { SessionRow, ViewerPath } from "@/lib/boq/session";

type Node = {label:string;path:ViewerPath;children:Map<string,Node>;amount:number};
const keys = ["wbs1","wbs2","wbs3","wbs4"] as const;
function Branch({nodes,onSelect,path}:{nodes:Map<string,Node>;onSelect:(path:ViewerPath)=>void;path:ViewerPath}) {
  return <ul className="ml-4 space-y-1">{Array.from(nodes,([key,node])=><li key={key}>
    <details open={node.path.every((v,i)=>v===null || path[i]===v) || undefined}>
      <summary className="cursor-pointer"><button type="button" className="px-2 py-1 text-left underline" onClick={()=>onSelect(node.path)}>{node.label || "(blank)"}</button><span className="text-xs text-muted-foreground">{node.amount.toLocaleString(undefined,{maximumFractionDigits:2})}</span></summary>
      {node.children.size>0 && <Branch nodes={node.children} onSelect={onSelect} path={path}/>}
    </details>
  </li>)}</ul>;
}
export default function ViewerTree({rows,path,onSelect}:{rows:SessionRow[];path:ViewerPath;onSelect:(path:ViewerPath)=>void}) {
  const tree=useMemo(()=>{
    const root=new Map<string,Node>();
    for(const row of rows){let nodes=root;for(let level=0;level<4;level++){
      const label=row[keys[level]];
      let node=nodes.get(label);
      if(!node){node={label,path:keys.map((k,i)=>i<=level?row[k]:null),children:new Map(),amount:0};nodes.set(label,node);}
      node.amount+=row.amount;nodes=node.children;
    }}return root;
  },[rows]);
  return <section aria-label="WBS navigation" className="rounded-2xl border border-border bg-surface p-4 space-y-3">
    <nav aria-label="Viewer breadcrumbs" className="flex flex-wrap gap-2">
      <button type="button" className="underline" onClick={()=>onSelect([null,null,null,null])}>All BOQ</button>
      {path.map((value,i)=>value!==null && <span key={i}> / <button type="button" className="underline" onClick={()=>onSelect(path.map((v,j)=>j<=i?v:null))}>{value || "(blank)"}</button></span>)}
    </nav>
    <details><summary className="cursor-pointer font-semibold">Browse WBS tree</summary><Branch nodes={tree} onSelect={onSelect} path={path}/></details>
    <p className="text-xs text-muted-foreground">Select a WBS name to scope Viewer rows. Expand arrows to explore. Blank WBS values are available in the tree; existing summary charts omit blank labels.</p>
  </section>;
}
