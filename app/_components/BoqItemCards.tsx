import type { SessionRow } from "@/lib/boq/session";
import { highlightText } from "@/lib/boq/highlight";

export default function BoqItemCards({rows,keywords=[],pending,onToggle}:{
  rows:SessionRow[];keywords?:string[];pending?:Set<string>;onToggle?:(id:string)=>void;
}) {
  const fmt=(n:number)=>n.toLocaleString(undefined,{maximumFractionDigits:2});
  return <div className="boq-item-cards">{rows.map(row=><article key={row._id} data-card-id={row._id} className={pending?.has(row._id)?"item-pending":""}>
    <p className="workspace-eyebrow">{row.wbs4||"Unassigned"} · {row.wbs3||"Unassigned"}</p>
    <h3>{highlightText(row.description,keywords)}</h3>
    <div className="item-measures"><span>{fmt(row.qty)} {row.unit||"—"}</span><strong>Amount {fmt(row.amount)}</strong></div>
    <details><summary>All item fields</summary><dl className="item-fields">
      {[["WBS-1",row.wbs1||"Unassigned"],["WBS-2",row.wbs2||"Unassigned"],["WBS-3",row.wbs3||"Unassigned"],["WBS-4",row.wbs4||"Unassigned"],["Unit",row.unit||"—"],["Qty",fmt(row.qty)],["Material",fmt(row.material)],["Labor",fmt(row.labor)],["Amount",fmt(row.amount)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl></details>
    {onToggle && <label className="item-exclusion"><input type="checkbox" checked={pending?.has(row._id)||false} onChange={()=>onToggle(row._id)}/>Exclude from results{pending?.has(row._id)?" (pending Apply)":""}</label>}
  </article>)}</div>;
}
