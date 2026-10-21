import type { ChartDatum } from "@/lib/boq/boqTransform";

/** Compact presentation of existing sumBy groups; no regrouping or top-N truncation. */
export default function ScopeChart({data,title,scopeTotal,onSelect}:{data:ChartDatum[];title:string;scopeTotal:number;onSelect?:(name:string)=>void}) {
  const total=data.reduce((n,d)=>n+d.value,0);
  return <section className="workspace-panel scope-chart" aria-label={title}>
    <h2>{title}</h2>
    <div className="scope-chart-rows" tabIndex={0} role="region" aria-label="Amount breakdown">
      {data.map(d=><div key={d.name} className="scope-bar" data-chart-name={d.name} data-chart-value={d.value}>
        {onSelect?<button onClick={()=>onSelect(d.name)}>{d.name}</button>:<span>{d.name}</span>}
        <span className="scope-track" aria-hidden="true"><i style={{width:`${total?d.value/total*100:0}%`}}/></span>
        <span className="scope-percent">{total?(d.value/total*100).toFixed(1):"0.0"}%</span>
        <small>{d.value.toLocaleString(undefined,{maximumFractionDigits:2})}</small>
      </div>)}
      {!data.length && <p>No named groups at this level. Included items remain in the table.</p>}
    </div>
    <p className="workspace-note">Share of {Math.abs(total-scopeTotal)<0.005?"selected scope":"named groups"} · Rounded percentages. Amounts shown as supplied.</p>
    {Math.abs(total-scopeTotal)>=0.005 && <p className="workspace-note">Unassigned labels are omitted from the existing chart grouping. Scope total still includes them: {scopeTotal.toLocaleString(undefined,{maximumFractionDigits:2})}.</p>}
  </section>;
}
