const fs = require('node:fs'), assert = require('node:assert/strict');
const ts = require('typescript'), X = require('xlsx');
require.extensions['.ts'] = (m,f) => m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const {parseReportWorkbook:parse} = require('../lib/report/parseReportWorkbook.ts');
const {calculateActivityProgress} = require('../lib/report/calculateActivityProgress.ts');
const {calculateKpi} = require('../lib/report/calculateKpi.ts');
const {getCutoffOptions} = require('../lib/report/aggregateProgress.ts');
let n=0; function test(name,fn){fn();n++;console.log('PASS',name)}
function fixture(){
 const w=X.utils.book_new();
 X.utils.book_append_sheet(w,X.utils.aoa_to_sheet([
 ['project_start','project_finish','week_start','plan','actual'],
 [46297,46304,46297,20,10],[46297,46304,46304,100,80]]),'progress');
 const r=[['WBS','Activities','Amount','P/A','%Progress',46297,46304,'_Kind']];
 for(const kind of ['project','wbs','activity'])for(const type of ['P','A'])r.push([kind,'Synthetic '+kind,kind==='activity'?0:1,type,type==='P'?100:80,type==='P'?20:10,type==='P'?80:70,kind]);
 X.utils.book_append_sheet(w,X.utils.aoa_to_sheet(r),'progress_table');
 X.utils.book_append_sheet(w,X.utils.aoa_to_sheet([['Amount Initialization Source','manual_placeholder']]),'Info');
 return w;
}
const bytes=w=>X.write(w,{type:'array',bookType:'xlsx'});
const run=w=>parse(bytes(w));
const good=run(fixture());
test('dates and _Kind metadata',()=>{assert.equal(good.progressRows[0].week_start,'2026-10-02');assert.deepEqual(good.activityRows[0].weeks.map(x=>x.date),['2026-10-02','2026-10-09']);assert.equal(getCutoffOptions(good.progressRows,'weekly')[0].label,'2/10')});
test('hierarchy, zero-weight milestones and P/A retained',()=>{assert.equal(good.activityRows.length,6);assert.equal(good.activityRows[4].amount,0);assert.equal(good.activityRows[0].kind,'project')});
test('placeholder label is not money',()=>assert.equal(good.amountLabel,'Weight (placeholder)'));
test('snapshot increments and cumulative live agree',()=>assert.equal(calculateActivityProgress(good.activityRows,'2026-10-09')[1].progress,80));
test('valid formula caches accepted',()=>{const w=fixture();w.Sheets.progress.D2.f='20';assert.equal(run(w).progressRows[0].plan,20)});
test('missing formula cache rejected with Excel action',()=>{const w=fixture();w.Sheets.progress.D2={t:'n',f:'20'};assert.throws(()=>run(w),/formula has no saved result.*desktop Excel/)});
test('missing required sheet actionable',()=>{const w=fixture();delete w.Sheets.progress;w.SheetNames=w.SheetNames.filter(n=>n!=='progress');assert.throws(()=>run(w),/required sheet: progress/)});
test('missing header actionable',()=>{const w=fixture();w.Sheets.progress.A1.v='wrong';assert.throws(()=>run(w),/project_start column/)});
test('invalid date rejected',()=>{const w=fixture();w.Sheets.progress.C2={t:'s',v:'2026-02-30'};assert.throws(()=>run(w),/invalid.*date/)});
test('duplicate date rejected',()=>{const w=fixture();w.Sheets.progress.C3.v=46297;assert.throws(()=>run(w),/duplicate week/)});
test('1904 Excel epoch supported',()=>{const w=fixture();w.Workbook={WBProps:{date1904:true}};for(const a of ['A2','B2','C2','A3','B3','C3'])w.Sheets.progress[a].v-=1462;for(const a of ['F1','G1'])w.Sheets.progress_table[a].v-=1462;assert.equal(run(w).progressRows[0].week_start,'2026-10-02')});
test('unknown metadata cannot become date',()=>{const w=fixture();w.Sheets.progress_table.H1.v='NotADate';assert.throws(()=>run(w),/unsupported column/)});
test('Excel error rejected',()=>{const w=fixture();w.Sheets.progress.D2={t:'e',v:23};assert.throws(()=>run(w),/Excel error/)});
test('non numeric plan rejected',()=>{const w=fixture();w.Sheets.progress.D2={t:'s',v:'oops'};assert.throws(()=>run(w),/invalid number/)});
test('out-of-range percent rejected',()=>{const w=fixture();w.Sheets.progress.D2.v=101;assert.throws(()=>run(w),/0–100/)});
test('blank Actual stays unavailable in KPI and table',()=>{const w=fixture();delete w.Sheets.progress.E2;delete w.Sheets.progress.E3;delete w.Sheets.progress_table.F3;delete w.Sheets.progress_table.G3;const r=run(w);assert.equal(r.progressRows[0].actual,null);assert.equal(calculateKpi(r.progressRows[0]),null);assert.equal(calculateActivityProgress(r.activityRows,'2026-10-02')[1].progress,null)});
test('zero Actual is valid',()=>{const w=fixture();w.Sheets.progress.E2.v=0;w.Sheets.progress_table.F3.v=0;w.Sheets.progress_table.G3.v=80;assert.equal(calculateKpi(run(w).progressRows[0]).actual,0)});
test('stale snapshot withheld, live data retained',()=>{const w=fixture();w.Sheets.progress.E2.v=11;const r=run(w);assert.equal(r.progressRows[0].actual,11);assert.equal(r.activityRows.length,0);assert.match(r.warnings[0],/withheld/)});
test('inconsistent snapshot timeline withheld',()=>{const w=fixture();w.Sheets.progress_table.G1.v=46305;assert.equal(run(w).activityRows.length,0)});
test('invalid P/A rejected',()=>{const w=fixture();w.Sheets.progress_table.D2.v='X';assert.throws(()=>run(w),/P\/A/)});
test('duplicate pair rejected',()=>{const w=fixture();w.Sheets.progress_table.D3.v='P';assert.throws(()=>run(w),/P\/A pair/)});
test('mismatched pair amount rejected',()=>{const w=fixture();w.Sheets.progress_table.C3.v=2;assert.throws(()=>run(w),/P\/A pair/)});
test('incremental sum above 100 rejected',()=>{const w=fixture();w.Sheets.progress_table.G2.v=90;assert.throws(()=>run(w),/increments exceed/)});
test('corrupt input gives useful error',()=>assert.throws(()=>parse(new Uint8Array([0,1,2,3]).buffer),/workbook|sheet/));
test('oversize input rejected before parsing',()=>assert.throws(()=>parse(new ArrayBuffer(21*1024*1024)),/20 MiB/));
if(process.env.PRIVATE_PROGRESS_FILE)test('real uncalculated Studio input rejected truthfully',()=>assert.throws(()=>parse(fs.readFileSync(process.env.PRIVATE_PROGRESS_FILE)),/formula has no saved result/));
console.log(`TOTAL ${n} report contract checks passed; TZ=${process.env.TZ||'system'}`);
if(process.env.REPORT_FIXTURE_OUTPUT)X.writeFile(fixture(),process.env.REPORT_FIXTURE_OUTPUT);
