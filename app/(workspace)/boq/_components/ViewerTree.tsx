"use client";
import { useMemo } from "react";
import type { SessionRow, ViewerPath } from "@/lib/boq/session";

type Node={label:string;path:ViewerPath;children:Map<string,Node>;amount:number};
const keys=["wbs1","wbs2","wbs3","wbs4"] as const;
function Branch({nodes,onSelect,path}:{nodes:Map<string,Node>;onSelect:(path:ViewerPath)=>void;path:ViewerPath}) {
  return <ul>{Array.from(nodes,([key,node])=>{
    const selected=node.path.every((v,i)=>v===path[i]);
    const active=node.path.every((v,i)=>v===null||path[i]===v);
    return <li key={key}>
      <div className={selected?"wbs-node selected":"wbs-node"}>
        <button aria-current={selected?"true":undefined} onClick={()=>onSelect(node.path)}>{node.label||"Unassigned"}</button>
        <small>{node.amount.toLocaleString(undefined,{maximumFractionDigits:2})}</small>
      </div>
      {node.children.size>0&&<details open={active||undefined}><summary aria-label={`Expand ${node.label||"Unassigned"}`}>Sublevels</summary><Branch nodes={node.children} onSelect={onSelect} path={path}/></details>}
    </li>;
  })}</ul>;
}
export default function ViewerTree({rows,path,onSelect}:{rows:SessionRow[];path:ViewerPath;onSelect:(path:ViewerPath)=>void}) {
  const tree=useMemo(()=>{
    const root=new Map<string,Node>();
    for(const row of rows){let nodes=root;for(let level=0;level<4;level++){
      const label=row[keys[level]];let node=nodes.get(label);
      if(!node){node={label,path:keys.map((k,i)=>i<=level?row[k]:null),children:new Map(),amount:0};nodes.set(label,node);}
      node.amount+=row.amount;nodes=node.children;
    }}return root;
  },[rows]);
  return <section aria-label="WBS navigation" className="wbs-tree">
    <h2>Browse WBS</h2><button className="wbs-all" onClick={()=>onSelect([null,null,null,null])}>All BOQ</button>
    <Branch nodes={tree} onSelect={onSelect} path={path}/>
    <p className="workspace-note">Parent selection clears lower levels. Chart and rows share this scope. Unassigned means a blank WBS value.</p>
  </section>;
}
