const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const {createRequire}=require('module');const req=createRequire(root+'/package.json');const ts=req('typescript');const XLSX=req('xlsx');
require.extensions['.ts']=(m,f)=>{m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f)};
const q=require(root+'/lib/boq/query.ts'),tr=require(root+'/lib/boq/boqTransform.ts'),parse=require(root+'/lib/boq/boqParse.ts'),rp=require(root+'/lib/report/parseReportWorkbook.ts'),ag=require(root+'/lib/report/aggregateProgress.ts'),kp=require(root+'/lib/report/calculateKpi.ts'),ap=require(root+'/lib/report/calculateActivityProgress.ts');
let n=0;function check(name,fn){fn();n++;console.log('PASS',name)}
function ab(b){return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}
(async()=>{
check('ALL partial case insensitive',()=>assert(q.buildDescriptionRegex('concrete c30','all').test('Concrete grade C30 slab')));
check('ALL requires both words',()=>assert(!q.buildDescriptionRegex('concrete c30','all').test('Concrete slab')));
check('ANY matches either word',()=>assert(q.buildDescriptionRegex('concrete steel','any').test('steel bar')));
check('regex characters are literal',()=>assert(!q.buildDescriptionRegex('C+','any').test('CCC')));
check('Thai search',()=>assert(q.buildDescriptionRegex('คอนกรีต','all').test('งานคอนกรีตเสริมเหล็ก')));
check('blank query',()=>assert.equal(q.buildDescriptionRegex(' ','all'),null));
check('CSV BOM quotes CRLF',()=>{let s=q.toCSV([{description:'A,"B"',amount:12}]);assert(s.startsWith('\ufeff'));assert(s.includes('A,""B""'));assert(s.includes('\r\n'))});
check('CSV untrusted formula text neutralized, numbers unchanged',()=>{assert(q.toCSV([{description:'=1+1',qty:-2}]).includes('"\'=1+1"'));assert(q.toCSV([{description:'\t@SUM(A1)',qty:-2}]).includes('"\'\t@SUM(A1)"'));assert(q.toCSV([{qty:-2}]).includes('"-2"'))});
check('WBS exact filter',()=>assert.equal(tr.filterRows([{wbs1:'A'},{wbs1:'AA'}],{wbs1:'A'}).length,1));
check('sumBy preserves encounter order and ignores blank key',()=>assert.deepEqual(tr.sumBy([{wbs1:'B',amount:2},{wbs1:'A',amount:3},{wbs1:'B',amount:4},{wbs1:'',amount:9}],r=>r.wbs1),[{name:'B',value:6},{name:'A',value:3}]));
const header=['WBS-1','WBS-2','WBS-3','WBS-4','Description','Unit','Qty','Material','Labor','Amount'];
const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([header,['A','S','L1','Slab','Concrete','m3','1,000',10,20,100],['A','','','','Zero','m3',1,0,0,0],['A','','','','Credit','m3',1,0,0,-1],['A','','','','-','m3',1,0,0,5]]),'Valid');XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['Description'],['x']]),'Invalid');const b=XLSX.write(wb,{type:'array',bookType:'xlsx'});
check('only complete BOQ headers accepted',()=>{});assert.deepEqual(await parse.getValidSheetsFromBuffer(b),['Valid']);
const rows=await parse.parseBoqRowsFromBuffer(b,'Valid');check('positive amount and meaningful descriptions only',()=>assert.equal(rows.length,1));check('comma number coercion',()=>assert.equal(rows[0].qty,1000));
for(const f of ['boq/example_boq.xlsx']){const b=ab(fs.readFileSync(root+'/public/'+f));for(const s of await parse.getValidSheetsFromBuffer(b)){const r=await parse.parseBoqRowsFromBuffer(b,s);console.log('SAMPLE',s,'rows',r.length,'amount',r.reduce((a,x)=>a+x.amount,0));}}
const sample=rp.parseReportWorkbook(ab(fs.readFileSync(root+'/public/data/example_progress.xlsx')));console.log('REPORT SAMPLE',sample.progressRows.length,sample.activityRows.length);
check('report sample parses both required sheets',()=>assert(sample.progressRows.length&&sample.activityRows.length));
check('synthetic report exact 6 cutoffs and 4 activity rows',()=>{assert.equal(sample.progressRows.length,6);assert.equal(sample.activityRows.length,4);assert.equal(sample.progressRows.at(-1).actual,95)});
const demo=await parse.parseBoqRowsFromBuffer(ab(fs.readFileSync(root+'/public/boq/example_boq.xlsx')),'Synthetic Demo');
check('synthetic BOQ 25 rows and Amount 32500',()=>{assert.equal(demo.length,25);assert.equal(demo.reduce((n,r)=>n+r.amount,0),32500)});
check('missing report sheets throws (risk characterization)',()=>assert.throws(()=>rp.parseReportWorkbook(b)));
const progress=[{week_start:'2026-01-02',plan:10,actual:8},{week_start:'2026-01-30',plan:30,actual:20},{week_start:'2026-02-06',plan:40,actual:25}];
check('monthly takes latest week not sum',()=>assert.deepEqual(ag.getMonthlyRows(progress).map(x=>x.plan),[30,40]));
check('actual ends at cutoff; plan continues',()=>assert.deepEqual(ag.buildChartRows(progress,'weekly','2026-01-30').map(x=>[x.plan,x.actual]),[[10,8],[30,20],[40,null]]));
check('activity uses cumulative weekly increments',()=>assert.equal(ap.calculateActivityProgress([{amount:1000,weeks:[{date:'2026-01-02',value:10},{date:'2026-01-30',value:20},{date:'2026-02-06',value:30}]}],'2026-01-30')[0].amount,300));
check('KPI time impact is variance times duration',()=>assert.equal(kp.calculateKpi({project_start:'2026-01-01',project_finish:'2026-04-11',actual:20,plan:30}).days,-10));
for(const count of [10000,50000]){let data=Array.from({length:count},(_,i)=>({wbs1:'A',wbs2:'Structure',description:i%2?'Concrete C30':'Rebar',amount:100}));let st=performance.now();let found=q.filterByDescription(data,q.buildDescriptionRegex('concrete','all'));let groups=tr.sumBy(found,r=>r.wbs2);console.log('BENCH pure filtering+aggregation',count,'rows',(performance.now()-st).toFixed(2),'ms',found.length,'matches');assert.equal(groups[0].value,count/2*100)}
console.log('TOTAL',n,'checks passed. No browser, RLS, native Excel or deployment assertions.');
})().catch(e=>{console.error(e);process.exitCode=1});
