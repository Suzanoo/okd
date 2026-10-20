// Read-only analysis of a user-supplied BOQ workbook and Progress workbook.
// Inputs are never copied into public assets or changed. Output contains counts,
// sheet names, hashes and totals; keep that report private if project totals are private.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ts=require('typescript'),XLSX=require('xlsx');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const boq=require('../lib/boq/boqParse.ts'),report=require('../lib/report/parseReportWorkbook.ts'),query=require('../lib/boq/query.ts');
async function main(){
  const [boqPath,reportPath]=process.argv.slice(2);
  if(!boqPath||!reportPath) throw new Error('Usage: node tests/workbook-compatibility.cjs BOQ.xlsx PROGRESS.xlsx');
  const result={timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,inputs:[]};
  for(const [kind,file] of [['boq',boqPath],['progress',reportPath]]){
    const b=fs.readFileSync(file),w=XLSX.read(b,{type:'buffer'});
    const item={file:path.basename(file),bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex'),sheets:w.SheetNames};
    if(kind==='boq'){
      item.parsed=[];
      for(const name of await boq.getValidSheetsFromBuffer(b)){
        const rows=await boq.parseBoqRowsFromBuffer(b,name),s=w.Sheets[name];
        const data=XLSX.utils.sheet_to_json(s,{header:1,defval:''});const h=data[0];
        const errorCells=Object.entries(s).filter(([a,c])=>!a.startsWith('!')&&c.t==='e').map(([address,c])=>({address,error:c.w}));
        const rawPositive=data.slice(1).filter(r=>typeof r[h.indexOf('Amount')]==='number'&&r[h.indexOf('Amount')]>0);
        const csv=query.toCSV(rows);
        item.parsed.push({name,rows:rows.length,amount:rows.reduce((a,r)=>a+r.amount,0),rawPositiveRows:rawPositive.length,rawPositiveAmount:rawPositive.reduce((a,r)=>a+r[h.indexOf('Amount')],0),errorCells,blankUnits:rows.filter(r=>!r.unit).length,csvHasBom:csv.startsWith('\ufeff'),csvBytes:Buffer.byteLength(csv),thaiMatches:query.filterByDescription(rows,query.buildDescriptionRegex('คอนกรีต','all')).length});
      }
    }else{
      let parsed;
      try { parsed=report.parseReportWorkbook(b); } catch(e) { item.validationError=e.message; }
      if(parsed)
      item.parsed={progressRows:parsed.progressRows.length,activityRows:parsed.activityRows.length,firstDate:parsed.activityRows[0]?.weeks[0]?.date,lastEntry:parsed.activityRows[0]?.weeks.at(-1),activityAmountSum:parsed.activityRows.reduce((a,r)=>a+r.amount,0)};
      const data=XLSX.utils.sheet_to_json(w.Sheets.progress_table,{header:1,defval:''}),kindIndex=data[0].indexOf('_Kind');
      item.rowKinds={};
      for(const r of data.slice(1)){const key=String(r[kindIndex]??'unspecified');item.rowKinds[key]??={rows:0,positiveAmount:0};item.rowKinds[key].rows++;if(r[2]>0)item.rowKinds[key].positiveAmount++;}
    }
    result.inputs.push(item);
  }
  console.log(JSON.stringify(result,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
