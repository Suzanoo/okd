const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),Module=require('node:module');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const resolve=Module._resolveFilename;
Module._resolveFilename=function(id,...rest){return resolve.call(this,id.startsWith('@/')?path.join(__dirname,'..',id.slice(2)):id,...rest);};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const {PlaylistPlayer}=require('../app/media/PlaylistPlayer.tsx');
const {KPICards}=require('../app/(workspace)/report/_components/KPICards.tsx');
const {calculateKpi}=require('../lib/report/calculateKpi.ts');
const {getMonthlyRows,buildChartRows}=require('../lib/report/aggregateProgress.ts');
let n=0;const test=(name,f)=>{f();n++;console.log('PASS',name);};
const rows=[
 {project_start:'2026-01-01',project_finish:'2026-04-11',week_start:'2026-01-05',plan:20,actual:10},
 {project_start:'2026-01-01',project_finish:'2026-04-11',week_start:'2026-01-26',plan:50,actual:40},
 {project_start:'2026-01-01',project_finish:'2026-04-11',week_start:'2026-02-09',plan:100,actual:80}];
test('missing playlist renders honest empty status, no iframe',()=>{const s=renderToStaticMarkup(React.createElement(PlaylistPlayer,{playlistId:''}));assert.match(s,/No playlist is configured/);assert(!s.includes('iframe'));});
test('configured playlist starts loading with external fallback',()=>{const s=renderToStaticMarkup(React.createElement(PlaylistPlayer,{playlistId:'test-id'}));assert.match(s,/Loading YouTube player/);assert.match(s,/Watch on YouTube/);assert.match(s,/youtube-nocookie.com/);});
test('known variance and duration formulas unchanged',()=>assert.deepEqual(calculateKpi(rows[2]),{plan:100,actual:80,variance:-20,days:-20,status:'Delay'}));
test('presentation distinguishes pp and proxy without Delay claim',()=>{const s=renderToStaticMarkup(React.createElement(KPICards,{kpi:calculateKpi(rows[2])}));assert.match(s,/-20.00 pp/);assert.match(s,/-20 days/);assert.match(s,/not schedule delay/);assert(!s.includes('Delay'));});
test('monthly selects last weekly values, never sums cumulative percentages',()=>assert.deepEqual(getMonthlyRows(rows),[rows[1],rows[2]]));
test('weekly chart cutoff masks future Actual only',()=>{const r=buildChartRows(rows,'weekly','2026-01-05');assert.deepEqual(r.map(x=>x.actual),[10,null,null]);assert.deepEqual(r.map(x=>x.plan),[20,50,100]);});
test('zero and unavailable Actual remain distinct',()=>{assert.equal(calculateKpi({...rows[0],actual:null}),null);assert.equal(calculateKpi({...rows[0],actual:0}).actual,0);});
console.log('TOTAL',n,'R4 feedback checks passed.');
