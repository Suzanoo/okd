const {chromium}=require('playwright'),{spawn}=require('node:child_process');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),X=require('xlsx');
const root=path.resolve(__dirname,'..'),base='http://127.0.0.1:3194';
let server,browser,log='',checks=0;const errors=[];
const wait=ms=>new Promise(r=>setTimeout(r,ms)),pass=n=>{console.log('PASS',n);checks++;};
function fixture(change=()=>{}){
 const w=X.utils.book_new();
 X.utils.book_append_sheet(w,X.utils.aoa_to_sheet([
 ['project_start','project_finish','week_start','plan','actual'],
 ['2026-01-01','2026-04-11','2026-01-05',20,10],
 ['2026-01-01','2026-04-11','2026-01-26',50,40],
 ['2026-01-01','2026-04-11','2026-02-09',100,80]]),'progress');
 X.utils.book_append_sheet(w,X.utils.aoa_to_sheet([
 ['WBS','Activities','Amount','P/A','%Progress','2026-01-05','2026-01-26','2026-02-09','_Kind'],
 ['A','งานคอนกรีต Concrete',100,'P',100,20,30,50,'activity'],
 ['A','งานคอนกรีต Concrete',100,'A',80,10,30,40,'activity']]),'progress_table');
 change(w);return X.write(w,{type:'buffer',bookType:'xlsx'});
}
async function main(){
 const env={...process.env,OKD_ACCESS_MODE:'public'};for(const k of Object.keys(env))if(/SUPABASE/.test(k))delete env[k];
 server=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','3194'],{cwd:root,env,stdio:['ignore','pipe','pipe']});
 server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
 for(let i=0;i<160;i++){try{if((await fetch(base)).ok)break;}catch{}if(server.exitCode!==null)throw Error(log);await wait(250);}
 browser=await chromium.launch({headless:true,...(process.env.TEST_CHROMIUM_PATH?{executablePath:process.env.TEST_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 console.log('Browser',browser.version());
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
 const status=p.locator('main [role=status]'),alert=p.locator('main [role=alert]');
 const upload=async(buffer,name='valid.xlsx')=>{
  await p.locator('input[type=file]').setInputFiles({name,mimeType:'application/octet-stream',buffer});
  await p.waitForFunction(()=>!document.querySelector('main [role=status]')?.textContent.startsWith('Loading workbook'));
 };
 await p.route('**/data/example_progress.xlsx',r=>r.fulfill({status:503,body:'unavailable'}));
 await p.goto(base+'/report');await alert.waitFor();
 assert.match(await status.innerText(),/No report data/);assert(!/Synthetic demo —/.test(await p.locator('main').innerText()));
 assert.equal(await p.getByText('Actual Progress',{exact:true}).count(),0);
 assert(await p.getByRole('combobox',{name:'Report cutoff'}).isDisabled());
 pass('failed initial sample is honest empty, no fictitious loaded source or zero KPI');
 await upload(Buffer.from('invalid'),'invalid.xlsx');assert.match(await alert.innerText(),/No workbook is loaded.*corrected/);
 pass('invalid first upload reports no previous workbook and actionable recovery');
 await upload(fixture());assert.equal(await alert.count(),0);assert.match(await status.innerText(),/Loaded: valid.xlsx.*2026-02-09/);
 assert.match(await p.locator('main').innerText(),/-20.00 pp/);assert.match(await p.locator('main').innerText(),/-20 days/);
 assert(!/Days Delay/.test(await p.locator('main').innerText()));
 pass('valid upload recovers and preserves known 100 plan / 80 actual / -20 pp / -20 day proxy');
 await p.getByRole('combobox',{name:'Report cutoff'}).selectOption('2026-01-05');
 assert.match(await p.locator('main').innerText(),/-10.00 pp/);assert.match(await p.locator('main').innerText(),/-10 days/);
 await p.getByRole('combobox',{name:'Reporting period'}).selectOption('monthly');
 assert.equal(await p.getByRole('combobox',{name:'Report cutoff'}).inputValue(),'2026-02-09');
 assert.deepEqual(await p.getByRole('combobox',{name:'Report cutoff'}).locator('option').evaluateAll(a=>a.map(x=>x.value)),['','2026-01-26','2026-02-09']);
 await p.getByRole('combobox',{name:'Report cutoff'}).selectOption('2026-01-26');assert.match(await p.locator('main').innerText(),/40.00%/);
 await p.getByRole('combobox',{name:'Reporting period'}).selectOption('weekly');
 assert.equal(await p.getByRole('combobox',{name:'Report cutoff'}).inputValue(),'2026-02-09');
 pass('weekly/monthly latest-week selection and cutoff reset preserve known values');
 const invalidCases=[
  ['missing-progress',w=>{delete w.Sheets.progress;w.SheetNames=w.SheetNames.filter(n=>n!=='progress');},/required sheet/],
  ['missing-table',w=>{delete w.Sheets.progress_table;w.SheetNames=w.SheetNames.filter(n=>n!=='progress_table');},/required sheet/],
  ['bad-header',w=>w.Sheets.progress.A1.v='bad',/project_start/],
  ['bad-date',w=>w.Sheets.progress.C2.v='2026-02-30',/invalid.*date/],
  ['bad-number',w=>w.Sheets.progress.D2={t:'s',v:'oops'},/invalid number/],
  ['missing-cache',w=>w.Sheets.progress.D2={t:'n',f:'20'},/desktop Excel/],
  ['empty-progress',w=>w.Sheets.progress['!ref']='A1:E1',/progress/],
 ];
 for(const [name,change,expected] of invalidCases){
  await upload(fixture(change),name+'.xlsx');assert.match(await alert.innerText(),expected);assert.match(await alert.innerText(),/previously loaded workbook: valid.xlsx/);
  assert.equal(await p.getByRole('combobox',{name:'Report cutoff'}).inputValue(),'2026-02-09');
  pass(name+' rejected with named previous source and unchanged cutoff');
 }
 await upload(fixture(w=>{for(const k of ['E2','E3','E4'])w.Sheets.progress[k].v=0;}),'zero.xlsx');
 assert.equal(await alert.count(),0);assert.match(await p.locator('main').innerText(),/0.00%/);
 assert.match(await p.locator('main').innerText(),/-100.00 pp/);pass('valid zero Actual is reported as zero, not unavailable');
 await upload(fixture(w=>{for(const k of ['E2','E3','E4'])delete w.Sheets.progress[k];}),'unavailable.xlsx');
 assert.match(await p.locator('main').innerText(),/Actual progress is unavailable.*Plan: 100.00%/);
 pass('missing Actual remains unavailable with known Plan, never fabricated zero');
 await upload(fixture(w=>{
  w.Sheets.progress_table.I2.v='project';w.Sheets.progress_table.I3.v='project';
  w.Sheets.progress.E4.v=81;
 }),'stale.xlsx');
 assert.match(await p.locator('main').innerText(),/withheld/);
 assert.match(await p.locator('main').innerText(),/No activity snapshot.*not zero progress/);
 pass('stale snapshot has explicit empty explanation while valid live data remains');
 await upload(fixture(),'recovered.xlsx');assert.equal(await alert.count(),0);
 const link=p.getByRole('link',{name:'Download synthetic sample'});
 assert.equal(await link.getAttribute('href'),'/data/example_progress.xlsx');
 assert.match(await p.locator('main').innerText(),/not your uploaded workbook/);
 await p.unroute('**/data/example_progress.xlsx');
 const event=p.waitForEvent('download');await link.click();
 const downloaded=await fs.readFile(await(await event).path());assert.deepEqual(downloaded,await fs.readFile(path.join(root,'public/data/example_progress.xlsx')));
 pass('sample download wording and exact bytes remain synthetic after private upload');
 // Delay the default request while a user chooses a newer workbook.
 let release,started,finished;const gate=new Promise(r=>release=r),start=new Promise(r=>started=r),done=new Promise(r=>finished=r);
 await p.route('**/data/example_progress.xlsx',async r=>{started();await gate;await r.fulfill({status:200,body:fixture()});finished();});
 await p.goto(base+'/report',{waitUntil:'domcontentloaded'});await start;
 assert.match(await status.innerText(),/Loading workbook/);
 await upload(fixture(),'race-winner.xlsx');release();await done;await wait(150);
 assert.match(await status.innerText(),/Loaded: race-winner.xlsx/);await p.unroute('**/data/example_progress.xlsx');
 pass('loading feedback and latest upload protect against stale default response');
 await p.goto(base+'/');const links=await p.locator('main a').evaluateAll(a=>a.map(x=>x.getAttribute('href')));
 assert.deepEqual([...new Set(links)].sort(),['/boq','/media','/query','/report']);
 for(const href of new Set(links))assert.equal((await fetch(base+href)).status,200);
 assert(!/72%|On Track|Stakeholder login|Project updates/.test(await p.locator('main').innerText()));
 assert.equal(await p.locator('main img').count(),7);pass('Home links resolve to existing workflows; seven images retained; unsupported status removed');
 let pending=[];await p.route('https://www.youtube-nocookie.com/**',r=>pending.push(r));
 await p.goto(base+'/media',{waitUntil:'domcontentloaded'});await status.filter({hasText:'Loading YouTube'}).waitFor();
 await status.filter({hasText:'Cannot confirm'}).waitFor({timeout:18000});
 assert.match(await p.getByRole('link',{name:'Watch on YouTube'}).getAttribute('href'),/PL0Rzid1eaNsJOTXtw5mUpFMSUtoprkN5O/);
 pass('Media stalled network gives honest timeout and existing external playlist fallback');
 await p.getByRole('button',{name:'Retry player'}).focus();await p.keyboard.press('Enter');
 await status.filter({hasText:'Loading YouTube'}).waitFor();
 for(const r of pending.splice(0))await r.abort().catch(()=>{});
 await p.unroute('https://www.youtube-nocookie.com/**');
 await p.route('https://www.youtube-nocookie.com/**',r=>r.fulfill({status:200,contentType:'text/html',body:'<p>Unavailable video</p>'}));
 await p.getByRole('button',{name:'Retry player'}).click();
 await status.filter({hasText:'Player frame loaded'}).waitFor();
 assert.match(await status.innerText(),/Playback availability is controlled by YouTube/);
 pass('Media keyboard retry recovers frame without falsely confirming playback');
 await p.goto(base+'/query');await p.getByRole('button',{name:'Use synthetic demo'}).click();
 await p.getByTestId('boq-source').filter({hasText:'25 accepted rows'}).waitFor();
 await p.route('**/fonts/*.ttf',r=>r.fulfill({status:503,body:'unavailable'}));
 await p.getByRole('button',{name:'Export PDF',exact:true}).click();await alert.filter({hasText:'PDF could not'}).waitFor();
 assert(await p.getByRole('button',{name:'Export PDF',exact:true}).isEnabled());pass('PDF font failure has actionable feedback and releases busy state');
 await p.unroute('**/fonts/*.ttf');const pdfEvent=p.waitForEvent('download');
 await p.getByRole('button',{name:'Export PDF',exact:true}).click();
 const pdf=await fs.readFile(await(await pdfEvent).path());assert.equal(pdf.subarray(0,5).toString(),'%PDF-');
 assert.equal(await alert.count(),0);assert.match(await status.innerText(),/Download requested/);pass('PDF retry succeeds without changing Query');
 await p.evaluate(()=>{window.originalCreateObjectURL=URL.createObjectURL;URL.createObjectURL=()=>{throw Error('simulated');};});
 await p.getByRole('button',{name:'Download CSV',exact:true}).click();await alert.filter({hasText:'CSV could not'}).waitFor();
 await p.evaluate(()=>{URL.createObjectURL=window.originalCreateObjectURL;});
 const csvEvent=p.waitForEvent('download');await p.getByRole('button',{name:'Download CSV',exact:true}).click();
 const csv=(await fs.readFile(await(await csvEvent).path())).toString('utf8');assert.equal(csv.trim().split('\r\n').length,26);
 assert.equal(await alert.count(),0);pass('CSV failure and retry preserve all 25 exported rows');
 await p.getByRole('textbox',{name:'Search Description'}).fill('no-such-description');await p.getByRole('button',{name:'Search',exact:true}).click();
 assert.match(await p.locator('main').innerText(),/No matching rows/);pass('empty Query explains filter recovery');
 if(process.env.TEST_OUTPUT_DIR){
  await fs.mkdir(process.env.TEST_OUTPUT_DIR,{recursive:true});
  for(const theme of ['light','dark'])for(const width of [390,1440])for(const route of ['/','/report','/media']){
   await p.setViewportSize({width,height:900});await p.goto(base+route);
   await p.getByRole('combobox',{name:'Color theme'}).selectOption(theme);
   if(route==='/report')await p.waitForFunction(()=>document.querySelector('[aria-label="Report cutoff"]').value!=='');
   await p.evaluate(()=>document.fonts.ready);await wait(500);
   await p.screenshot({path:path.join(process.env.TEST_OUTPUT_DIR,theme+'-'+width+'-'+(route.slice(1)||'home')+'.png'),fullPage:true});
  }
 }
 assert.deepEqual(errors,[]);pass('no uncaught browser errors across injected failures');
 console.log('TOTAL',checks,'R4 browser checks passed. Native devices and actual YouTube playback not claimed.');
}
main().catch(e=>{console.error(e,log);process.exitCode=1}).finally(async()=>{await browser?.close();server?.kill();});
