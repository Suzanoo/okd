const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.TEST_PORT || 3187);
const base = `http://127.0.0.1:${port}`;
const env = {...process.env, OKD_ACCESS_MODE:'public', NEXT_TELEMETRY_DISABLED:'1'};
for(const key of Object.keys(env)) if(/SUPABASE/.test(key)) delete env[key];
// No credentials are needed. A .env.local with secrets must not be used for this test.
let server, browser, serverLog='', checks=0;
const errors=[], authRequests=[], writes=[];
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const pass=name=>{checks++;console.log('PASS',name);};
async function download(page, button, filename) {
  const event=page.waitForEvent('download');
  await page.getByRole('button',{name:button,exact:true}).click();
  const result=await event;
  const file=await result.path();
  const data=await fs.readFile(file);
  if(process.env.TEST_OUTPUT_DIR) {await fs.mkdir(process.env.TEST_OUTPUT_DIR,{recursive:true});await fs.writeFile(path.join(process.env.TEST_OUTPUT_DIR,filename),data);}
  return data;
}
async function main(){
  server=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:root,env,stdio:['ignore','pipe','pipe']});
  server.stdout.on('data',d=>serverLog+=d);server.stderr.on('data',d=>serverLog+=d);
  let ready=false;
  for(let i=0;i<160;i++){if(server.exitCode!==null)throw new Error(serverLog);try{const r=await fetch(base);if(r.ok){ready=true;break;}}catch{}await wait(250);}
  assert(ready,serverLog);
  browser=await chromium.launch({headless:true,...(process.env.TEST_CHROMIUM_PATH?{executablePath:process.env.TEST_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
  console.log('Browser',browser.version());
  const context=await browser.newContext({viewport:{width:1440,height:1000},timezoneId:'Asia/Bangkok'});
  await context.route('**/*',async route=>{
    const r=route.request(),url=r.url();
    if(/supabase|\/auth\/v1|\/rest\/v1/.test(url)) {authRequests.push(url);return route.abort();}
    if(!url.startsWith(base) && !url.startsWith('data:') && !url.startsWith('blob:')) return route.abort();
    if(!['GET','HEAD'].includes(r.method())) writes.push({method:r.method(),url});
    return route.continue();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['/','/boq','/query','/report','/media']){
    const response=await page.goto(base+route);assert.equal(response.status(),200);
    assert.equal((await page.reload()).status(),200);
    assert(!/login|logout|stakeholder/i.test(await page.locator('header').first().innerText()));
    assert.equal(await page.locator('header a[href="/boq"]').count(),2);
    pass(`anonymous direct navigation + refresh + public nav ${route}`);
  }
  for(const route of ['/admin','/admin/child','/api/admin/users','/api/admin/users/reset-password','/login','/logout']){
    for(const method of ['GET','POST']){
      const r=await fetch(base+route,{method,headers:{Cookie:'sb-demo-auth-token=stale-admin-session','x-middleware-subrequest':'middleware:middleware:middleware:middleware:middleware'},redirect:'manual'});
      assert.equal(r.status,404,`${method} ${route}`);
    }pass(`private URL ${route} GET/POST denied with stale cookie`);
  }
  await page.goto(base+'/query');
  await page.getByRole('button',{name:'Use synthetic demo',exact:true}).click();
  await page.waitForFunction(()=>document.body.innerText.includes('32,500'));
  await page.getByRole('button',{name:'Search',exact:true}).click();
  await page.getByRole('button',{name:'Download CSV',exact:true}).waitFor();
  let csv=(await download(page,'Download CSV','detail.csv')).toString('utf8');
  assert.equal(csv.trim().split('\r\n').length,26);assert(csv.startsWith('\ufeff'));pass('BOQ demo 25 rows exported across pagination');
  await page.getByRole('button',{name:'Summary by Description',exact:true}).click();
  csv=(await download(page,'Download CSV','summary.csv')).toString('utf8');
  assert.equal(csv.trim().split('\r\n').length,4);pass('Query summary exports 3 Description/Unit groups');
  const pdf=await download(page,'Export PDF','summary.pdf');assert.equal(pdf.subarray(0,5).toString(),'%PDF-');assert(pdf.length>10000);pass('Summary PDF generated with embedded font');
  await page.getByRole('button',{name:'Detail by WBS',exact:true}).click();
  const search=page.getByPlaceholder('ค้นหา Description (Thai / English)');await search.fill('concrete');await page.getByRole('button',{name:'Search',exact:true}).click();
  csv=(await download(page,'Download CSV','concrete.csv')).toString('utf8');assert.equal(csv.trim().split('\r\n').length,10);pass('Query concrete search exports 9 matches');
  const detailPdf=await download(page,'Export PDF','detail.pdf');assert.equal(detailPdf.subarray(0,5).toString(),'%PDF-');pass('Detail PDF generated');
  await page.locator('input[type=file]').setInputFiles(path.join(root,'public/boq/example_boq.xlsx'));
  await page.getByText('(uploaded)',{exact:false}).waitFor();await page.getByRole('button',{name:'Search',exact:true}).click();
  await page.getByRole('button',{name:'Download CSV',exact:true}).waitFor();pass('BOQ file upload works locally');
  await page.goto(base+'/report');await page.getByText('Synthetic demo — example_progress.xlsx',{exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelectorAll('select')[1]?.value.length>0);
  assert.equal(await page.locator('select').nth(1).inputValue(),'2026-02-09');
  assert((await page.locator('main').innerText()).includes('95'));pass('Report demo cutoff and actual 95 loaded');
  await page.locator('select').nth(0).selectOption('monthly');assert.equal(await page.locator('select').nth(1).inputValue(),'2026-02-09');
  await page.locator('select').nth(1).selectOption('2026-01-26');pass('Report monthly latest-week cutoff works');
  await page.locator('input[type=file]').setInputFiles(path.join(root,'public/data/example_progress.xlsx'));
  await page.getByText('example_progress.xlsx',{exact:true}).waitFor();pass('Report workbook upload works locally');
  if(process.env.PRIVATE_BOQ_FILE) {
    await page.goto(base+'/query');
    await page.locator('input[type=file]').setInputFiles(process.env.PRIVATE_BOQ_FILE);
    await page.waitForFunction(()=>document.querySelector('select')?.value==='Project');
    await page.waitForFunction(()=>!document.querySelector('input[type=file]').disabled);
    await page.getByRole('button',{name:'Search',exact:true}).click();
    await page.getByRole('button',{name:'Download CSV',exact:true}).waitFor();
    const event=page.waitForEvent('download');await page.getByRole('button',{name:'Download CSV',exact:true}).click();
    const file=await (await event).path();const data=await fs.readFile(file);
    const X=require('xlsx');const csvWorkbook=X.read(data,{type:'buffer'});
    const exported=X.utils.sheet_to_json(csvWorkbook.Sheets[csvWorkbook.SheetNames[0]]);
    assert.equal(exported.length,Number(process.env.PRIVATE_BOQ_ROWS||1086));pass('Private BOQ filtered Project records exported consistently');
    const detailTotal=exported.reduce((n,r)=>n+Number(r.Amount),0);
    await page.getByRole('button',{name:'Summary by Description',exact:true}).click();
    const summaryEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Download CSV',exact:true}).click();
    const summaryBytes=await fs.readFile(await(await summaryEvent).path());
    const sw=X.read(summaryBytes,{type:'buffer'});const sr=X.utils.sheet_to_json(sw.Sheets[sw.SheetNames[0]]);
    assert(Math.abs(sr.reduce((n,r)=>n+Number(r.Amount),0)-detailTotal)<0.01);
    const pdfEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Export PDF',exact:true}).click();
    const privatePdf=await fs.readFile(await(await pdfEvent).path());assert.equal(privatePdf.subarray(0,5).toString(),'%PDF-');
    pass('Private BOQ summary CSV reconciles to detail; PDF export succeeds');
  }
  if(process.env.PRIVATE_PROGRESS_FILE) {
    await page.goto(base+'/report');
    await page.waitForFunction(()=>document.querySelectorAll('select')[1]?.value.length>0);
    await page.locator('input[type=file]').setInputFiles(process.env.PRIVATE_PROGRESS_FILE);
    await page.getByRole('alert').filter({hasText:'formula has no saved result'}).waitFor();
    assert.equal(await page.locator('select').nth(1).inputValue(),'2026-02-09');
    assert.match(await page.locator('main [role=alert]').innerText(),/previously loaded workbook/);
    pass('Private Progress missing caches rejected; previous data explicitly identified');
  }
  await page.goto(base+'/report');
  await page.waitForFunction(()=>document.querySelectorAll('select')[1]?.value.length>0);
  await page.locator('input[type=file]').setInputFiles({name:'invalid.xlsx',mimeType:'application/octet-stream',buffer:Buffer.from('invalid')});
  await page.locator('main [role=alert]').waitFor();
  assert.equal(await page.locator('select').nth(1).inputValue(),'2026-02-09');pass('Malformed report leaves valid data and actionable error');
  if(process.env.REPORT_FIXTURE_OUTPUT){
    await page.locator('input[type=file]').setInputFiles(process.env.REPORT_FIXTURE_OUTPUT);
    await page.waitForFunction(()=>document.querySelectorAll('select')[1]?.value==='2026-10-09');
    assert.equal(await page.locator('main [role=alert]').count(),0);
    assert.match(await page.locator('main').innerText(),/Weight \(placeholder\)/);
    assert.match(await page.locator('main').innerText(),/project: Synthetic project/);
    pass('Valid Studio-shaped fixture displays dates, hierarchy, placeholder weights and clears error');
  }
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/boq');
  await page.getByRole('button',{name:'Open menu',exact:true}).click();
  await page.locator('#mobile-drawer').getByRole('link',{name:'REPORT',exact:true}).click();
  await page.waitForURL(base+'/report');assert.equal(await page.getByRole('button',{name:'Open menu',exact:true}).getAttribute('aria-expanded'),'false');pass('390px mobile drawer links public tools and closes');
  assert.deepEqual(authRequests,[]);assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  assert(!/SUPABASE|supabaseUrl is required|Unhandled|Error:/.test(serverLog),serverLog);
  pass('zero browser auth requests, upload writes or uncaught page errors; no server auth errors');
  console.log(`TOTAL ${checks} browser checks passed. External media blocked; no native-device or live-auth acceptance.`);
}
main().catch(error=>{console.error(error);console.error(serverLog);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.kill();});
