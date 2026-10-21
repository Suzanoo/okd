const {chromium}=require('playwright'),{spawn}=require('node:child_process'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),X=require('xlsx');
const {fixture}=require('./visual-fixture.cjs');
const root=path.resolve(__dirname,'..'),base='http://127.0.0.1:3196';
let app,browser,log='',checks=0;const errors=[],wait=ms=>new Promise(r=>setTimeout(r,ms));
const pass=n=>{checks++;console.log('PASS',n);};
async function main(){
 const env={...process.env,OKD_ACCESS_MODE:'public'};for(const k of Object.keys(env))if(/SUPABASE/.test(k))delete env[k];
 app=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','3196'],{cwd:root,env,stdio:['ignore','pipe','pipe']});app.stdout.on('data',d=>log+=d);app.stderr.on('data',d=>log+=d);
 for(let i=0;i<160;i++){try{if((await fetch(base)).ok)break;}catch{}if(app.exitCode!==null)throw Error(log);await wait(250);}
 browser=await chromium.launch({headless:true,...(process.env.TEST_CHROMIUM_PATH?{executablePath:process.env.TEST_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 console.log('Browser',browser.version());
 const ctx=await browser.newContext({viewport:{width:1440,height:1000}});await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
 const upload=async(buffer=fixture(),name='demo_structure.xlsx')=>{await p.locator('input[type=file]').setInputFiles({name,mimeType:'application/octet-stream',buffer});await p.getByTestId('boq-source').filter({hasText:name}).waitFor();await p.waitForFunction(()=>!document.querySelector('main [role=status]')?.textContent.startsWith('Loading'));};
 const box=s=>p.locator(s).boundingBox();
 const shot=async name=>{if(process.env.VISUAL_OUTPUT){await fs.mkdir(process.env.VISUAL_OUTPUT,{recursive:true});await p.screenshot({path:path.join(process.env.VISUAL_OUTPUT,name+'.png'),fullPage:!name.endsWith('-390')});}};
 await p.goto(base+'/boq');await upload();
 for(const theme of ['light','dark'])for(const width of [1024,1440]){
  await p.getByRole('combobox',{name:'Color theme'}).selectOption(theme);await p.setViewportSize({width,height:1000});
  const rail=await box('.wbs-rail'),content=await box('.structured-content'),source=await box('.boq-source'),stats=await box('.scope-stats'),chart=await box('.scope-chart'),table=await box('.boq-items');
  assert(rail&&content&&rail.x+rail.width<=content.x);assert(source.y+source.height<=rail.y);
  assert(stats.y+stats.height<=chart.y);assert(chart.y+chart.height<=table.y);
  assert.equal(await p.locator('.scope-chart').count(),1);assert.equal(await p.locator('.scope-stats > .workspace-panel').count(),3);
  assert.equal(await p.locator('.wbs-rail').evaluate(el=>getComputedStyle(el).position),'sticky');
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  pass(theme+' '+width+' Viewer matches A: persistent rail / source / three KPIs / one chart / table');
 }
 await p.setViewportSize({width:1440,height:1000});await p.getByRole('combobox',{name:'Color theme'}).selectOption('light');
 const rail=p.locator('.wbs-rail');
 await rail.getByRole('button',{name:'Building A',exact:true}).click();await rail.getByRole('button',{name:'Structure',exact:true}).click();
 assert.match(await p.getByRole('navigation',{name:'Viewer breadcrumbs'}).innerText(),/Building A.*Structure/s);
 assert.equal(await p.getByTestId('scope-amount').innerText(),'2,400,000');
 assert.match(await p.locator('.scope-chart').innerText(),/Amount by WBS-3.*Level 01/s);
 await rail.getByRole('button',{name:'Level 01',exact:true}).click();
 const chartRows=await p.locator('[data-chart-value]').evaluateAll(els=>els.map(el=>({value:Number(el.dataset.chartValue),percent:Number(el.querySelector('.scope-percent').textContent.replace('%',''))})));
 assert.equal(chartRows.reduce((n,r)=>n+r.value,0),2400000);assert(Math.abs(chartRows.reduce((n,r)=>n+r.percent,0)-100)<=0.2);
 pass('selected scope / stored amounts / six chart groups / rounded shares reconcile');
 await shot('viewer-selected-light-1440');
 await rail.getByRole('button',{name:'01.01 Slab',exact:true}).click();
 assert.equal(await p.getByTestId('scope-amount').innerText(),'900,000');assert.match(await p.getByTestId('viewer-summary').innerText(),/1 rows/);
 assert.match(await p.locator('.scope-chart').innerText(),/Amount by Description.*Concrete C30/s);
 await p.getByRole('link',{name:'Open Query →',exact:true}).click();await p.waitForURL(base+'/query');
 assert.equal(await p.getByTestId('query-total').innerText(),'2,400,000');pass('deep WBS selection leaves Query whole-sheet amount unchanged with one workbook');
 for(const theme of ['light','dark'])for(const width of [1024,1440]){
  await p.getByRole('combobox',{name:'Color theme'}).selectOption(theme);await p.setViewportSize({width,height:1000});
  const search=await box('.query-search'),totals=await box('.query-totals'),result=await box('.query-results'),source=await box('.boq-source');
  assert(search.x+search.width<=totals.x);assert(Math.abs(search.y-totals.y)<1);assert(result.y>=search.y+search.height);assert(source.y+source.height<=search.y);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  pass(theme+' '+width+' Query matches A: search+totals above full-width results');
 }
 await p.getByRole('textbox',{name:'Search Description'}).fill('concrete');await p.getByRole('button',{name:'Search',exact:true}).click();
 assert.equal(await p.getByTestId('query-total').innerText(),'1,200,000');assert.equal(await p.getByTestId('query-quantities').innerText(),'400 m³');
 pass('R0 concrete example reconciles 2 rows / 400 m³ / 1,200,000');
 for(const width of [360,390,768]){
  await p.setViewportSize({width,height:900});
  const trigger=p.getByRole('button',{name:'Filters (0)',exact:true});await trigger.focus();await p.keyboard.press('Enter');
  const dialog=p.getByRole('dialog',{name:'Query filters'});await dialog.waitFor();
  assert.equal(await dialog.locator('fieldset').count(),5);
  const first=dialog.getByRole('button',{name:'Close Query filters'}),last=dialog.getByRole('button',{name:'View results'});
  await first.focus();await p.keyboard.press('Shift+Tab');assert(await last.evaluate(e=>e===document.activeElement));await p.keyboard.press('Tab');assert(await first.evaluate(e=>e===document.activeElement));
  await p.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert(await trigger.evaluate(e=>e===document.activeElement));
  await p.waitForFunction(()=>document.body.style.overflow==='');
  pass(width+' filter sheet has all fields, keyboard trap/Escape/focus return/scroll cleanup');
 }
 await p.setViewportSize({width:390,height:900});
 await p.getByRole('button',{name:'Filters (0)',exact:true}).click();
 let dialog=p.getByRole('dialog',{name:'Query filters'});
 await dialog.locator('fieldset').nth(0).getByRole('checkbox',{name:'Building A',exact:true}).check();
 await dialog.locator('fieldset').nth(4).getByRole('checkbox',{name:'m³',exact:true}).check();
 await shot('query-filters-dark-390');
 await dialog.getByRole('button',{name:'View results'}).click();
 assert.equal(await p.getByTestId('query-total').innerText(),'1,200,000');assert.equal(await p.locator('.filter-chip').count(),2);
 await p.getByRole('button',{name:'Remove Unit filter m³'}).click();assert.equal(await p.locator('.filter-chip').count(),1);
 await p.getByRole('button',{name:'Clear filters',exact:true}).click();pass('filter sheet and chips share existing WBS+Unit state and clear behavior');
 for(const theme of ['light','dark'])for(const width of [360,390]){
  await p.getByRole('combobox',{name:'Color theme'}).selectOption(theme);await p.setViewportSize({width,height:900});
  assert(await p.locator('.boq-item-cards').isVisible());assert.equal(await p.locator('.boq-item-cards article').count(),2);
  assert(!await p.locator('.responsive-data-table').isVisible());
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const search=await box('.query-search'),totals=await box('.query-totals');assert(totals.y>=search.y+search.height);
  pass(theme+' '+width+' mobile Query stacked search/totals, readable cards, no overflow');
 }
 const firstCard=p.locator('.boq-item-cards article').first();await firstCard.getByText('All item fields',{exact:true}).click();
 for(const field of ['WBS-1','WBS-2','WBS-3','WBS-4','Unit','Qty','Material','Labor','Amount'])assert(await firstCard.locator('dt').filter({hasText:new RegExp('^'+field+'$')}).isVisible());
 await firstCard.getByRole('checkbox',{name:'Exclude from results',exact:true}).check();assert.equal(await p.getByTestId('query-total').innerText(),'1,200,000');
 await p.getByRole('button',{name:'Apply',exact:true}).click();assert.equal(await p.getByTestId('query-total').innerText(),'300,000');
 pass('mobile cards expose every detail field; exclusion changes total only after Apply');
 await p.getByRole('button',{name:'Summary by Description',exact:true}).click();
 assert.equal(await p.locator('[data-summary-card]').count(),1);assert.match(await p.locator('[data-summary-card]').innerText(),/Material.*250,000.*Labor.*50,000.*Source rows.*1/s);
 await p.locator('.summary-card-sort').getByRole('button',{name:'amount',exact:false}).click();
 await p.getByRole('button',{name:'Show full table',exact:true}).click();assert(await p.locator('.responsive-data-table').isVisible());
 const scroll=p.getByRole('region',{name:'Query results — scroll horizontally for all columns'});await scroll.focus();await p.keyboard.press('ArrowRight');await wait(150);assert(await scroll.evaluate(e=>e.scrollLeft>0));
 pass('mobile Summary retains Material/Labor/source counts/sort and keyboard full-table access');
 await p.getByRole('navigation',{name:'BOQ workflows'}).getByRole('link',{name:'Viewer',exact:true}).click();await p.waitForURL(base+'/boq');
 assert.equal(await p.getByTestId('scope-amount').innerText(),'900,000');pass('Viewer scope survives Query exclusions and return navigation');
 for(const theme of ['light','dark'])for(const width of [360,390,768]){
  await p.setViewportSize({width,height:900});await p.getByRole('combobox',{name:'Color theme'}).selectOption(theme);
  assert(!await p.locator('.wbs-rail').isVisible());assert(await p.getByRole('button',{name:'Browse WBS',exact:true}).isVisible());
  if(width<=700){assert(await p.locator('.boq-item-cards').isVisible());assert(!await p.locator('.responsive-data-table').isVisible());}
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  pass(theme+' '+width+' mobile/tablet Viewer has WBS sheet and bounded content');
 }
 await p.setViewportSize({width:390,height:900});await p.getByRole('button',{name:'Browse WBS',exact:true}).click();
 dialog=p.getByRole('dialog',{name:'Browse WBS'});await dialog.waitFor();await shot('viewer-wbs-dark-390');
 await dialog.getByRole('button',{name:'Structure',exact:true}).click();await dialog.getByRole('button',{name:'View selected scope'}).click();
 assert.equal(await p.getByTestId('scope-amount').innerText(),'2,400,000');
 const trigger=p.getByRole('button',{name:'Browse WBS',exact:true});await trigger.click();dialog=p.getByRole('dialog',{name:'Browse WBS'});
 await dialog.getByRole('button',{name:'Close Browse WBS'}).focus();await p.keyboard.press('Shift+Tab');assert(await dialog.getByRole('button',{name:'View selected scope'}).evaluate(e=>e===document.activeElement));
 await p.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert(await trigger.evaluate(e=>e===document.activeElement));
 await trigger.click();await p.setViewportSize({width:1440,height:1000});await dialog.waitFor({state:'hidden'});await p.waitForFunction(()=>document.body.style.overflow==='');
 pass('WBS sheet changes scope, traps focus, returns focus and closes at desktop breakpoint');
 // Existing blank-label chart exclusion must not lose its source row or amount.
 const w=X.read(fixture(),{type:'buffer'});w.Sheets.Structure.A2={t:'s',v:''};
 await upload(X.write(w,{type:'buffer',bookType:'xlsx'}),'blank.xlsx');
 assert.equal(await p.getByTestId('scope-amount').innerText(),'2,400,000');assert.match(await p.locator('.scope-chart').innerText(),/Unassigned labels are omitted/);
 await p.locator('.wbs-rail').getByRole('button',{name:'Unassigned',exact:true}).click();assert.equal(await p.getByTestId('scope-amount').innerText(),'900,000');
 pass('blank WBS remains selectable; chart omission disclosed without dropping totals');
 const many=X.utils.book_new();const header=['WBS-1','WBS-2','WBS-3','WBS-4','Description','Unit','Qty','Material','Labor','Amount'];
 X.utils.book_append_sheet(many,X.utils.aoa_to_sheet([header,...Array.from({length:26},(_,i)=>['A','B','C','D','Concrete '+i,'m³',1,8,2,10])]),'BOQ');
 await p.setViewportSize({width:390,height:900});await upload(X.write(many,{type:'buffer',bookType:'xlsx'}),'pages.xlsx');
 assert.equal(await p.locator('.boq-item-cards article').count(),20);
 const ids=await p.locator('[data-card-id]').evaluateAll(els=>els.map(e=>e.dataset.cardId));
 await p.getByRole('button',{name:'Next rows',exact:true}).click();assert.equal(await p.locator('.boq-item-cards article').count(),6);
 assert((await p.locator('[data-card-id]').evaluateAll(els=>els.map(e=>e.dataset.cardId))).every(id=>!ids.includes(id)));
 assert.equal(await p.getByTestId('scope-amount').innerText(),'260');
 await p.getByRole('navigation',{name:'BOQ workflows'}).getByRole('link',{name:'Query',exact:true}).click();
 await p.getByTestId('query-total').waitFor();
 assert.equal(await p.locator('.boq-item-cards article').count(),20);await p.getByRole('button',{name:'Next',exact:true}).click();
 assert.equal(await p.locator('.boq-item-cards article').count(),6);assert.equal(await p.getByTestId('query-total').innerText(),'260');
 pass('mobile Viewer/Query pagination: 20+6 stable item identities, whole-result totals unchanged');
 assert.deepEqual(errors,[]);pass('no uncaught browser errors');
 console.log('TOTAL',checks,'visual closure checks passed; R0 composition verified, not pixel identity or native-device acceptance.');
}
main().catch(e=>{console.error(e,log);process.exitCode=1}).finally(async()=>{await browser?.close();app?.kill();});
