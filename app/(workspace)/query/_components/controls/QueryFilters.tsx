import WorkspaceSheet from "@/app/_components/WorkspaceSheet";
import { buttonClass } from "@/app/_components/WorkspaceControls";

type Filters={wbs1:string[];wbs2:string[];wbs3:string[];wbs4:string[];unit:string[]};
const keys=["wbs1","wbs2","wbs3","wbs4","unit"] as const;
const labels=["WBS-1","WBS-2","WBS-3","WBS-4","Unit"];
export default function QueryFilters({filters,options,onChange,onClear}:{filters:Filters;options:string[][];onChange:(patch:Partial<Filters>)=>void;onClear:()=>void}) {
  const count=keys.reduce((n,k)=>n+filters[k].length,0);
  const update=(index:number,next:string[])=>{
    const patch:Partial<Filters>={[keys[index]]:next};
    if(index<4)for(let i=index+1;i<4;i++)patch[keys[i]]=[];
    onChange(patch);
  };
  return <div className="query-filter-chips">
    {keys.flatMap((key,i)=>filters[key].map(value=><button key={key+value} className="filter-chip" aria-label={`Remove ${labels[i]} filter ${value}`} onClick={()=>update(i,filters[key].filter(v=>v!==value))}>{labels[i]}: {value} ×</button>))}
    <WorkspaceSheet title="Query filters" trigger={`Filters (${count})`} doneLabel="View results">
      <p className="workspace-note">Applied after the keyword search. OR within each field; AND across fields. Changes update the results immediately.</p>
      <div className="query-filter-fields">{keys.map((key,i)=><fieldset key={key}><legend>{labels[i]}</legend>
        {Array.from(new Set([...options[i],...filters[key]])).map(value=><label key={value}><input type="checkbox" checked={filters[key].includes(value)} onChange={e=>update(i,e.target.checked?[...filters[key],value]:filters[key].filter(v=>v!==value))}/>{value||"Unassigned"}</label>)}
        {!options[i].length&&!filters[key].length&&<p>No options in the current search.</p>}
      </fieldset>)}</div>
      <div className="sheet-actions"><button className={buttonClass} onClick={onClear}>Clear filters</button></div>
    </WorkspaceSheet>
  </div>;
}
