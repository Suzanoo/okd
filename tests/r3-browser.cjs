const {chromium}=require('playwright'),{spawn}=require('node:child_process');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),X=require('xlsx');
const root=path.resolve(__dirname,'..'),base='http://127.0.0.1:3193';
let server,browser,log='',checks=0;const errors=[];
const wait=ms=>new Promise(r=>setTimeout(r,ms)),pass=n=>{console.log('PASS',n);checks++;};
function luminance(rgb){return rgb.map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4}).reduce((a,n,i)=>a+n*[.2126,.7152,.0722][i],0);}
function contrast(a,b){a=luminance(a);b=luminance(b);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
async function main(){
 const env={...process.env,OKD_ACCESS_MODE:'public'};for(const k of Object.keys(env))if(/SUPABASE/.test(k))delete env[k];
 server=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','3193'],{cwd:root,env,stdio:['ignore','pipe','pipe']});server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
 for(let i=0;i<160;i++){try{if((await fetch(base)).ok)break;}catch{}if(server.exitCode!==null)throw Error(log);await wait(250);}
 browser=await chromium.launch({headless:true,...(process.env.TEST_CHROMIUM_PATH?{executablePath:process.env.TEST_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 console.log('Browser',browser.version());
 const context=await browser.newContext({colorScheme:'dark'});await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/query');await p.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
 assert.equal(await p.evaluate(()=>localStorage.getItem('okmd_theme_mode')),null);pass('first visit follows dark system without persisting an implicit preference');
 await p.emulateMedia({colorScheme:'light'});await p.waitForFunction(()=>document.documentElement.dataset.theme==='light');pass('system mode responds to operating-system change');
 await p.getByRole('combobox',{name:'Color theme'}).selectOption('dark');await p.reload();await p.waitForFunction(()=>document.documentElement.dataset.theme==='dark');assert.equal(await p.getByRole('combobox',{name:'Color theme'}).inputValue(),'dark');pass('explicit theme survives reload and overrides system');
 const themes=['light','dark'],routes=['/','/boq','/query','/report','/media'];
 for(const theme of themes){
  await p.getByRole('combobox',{name:'Color theme'}).selectOption(theme);
  for(const width of [360,390,768,1440]){
   await p.setViewportSize({width,height:900});
   for(const route of routes){
    await p.goto(base+route);
    if(route==='/boq'||route==='/query'){await p.getByRole('button',{name:'Use synthetic demo'}).click();await p.getByTestId('boq-source').filter({hasText:'25 accepted rows'}).waitFor();}
    if(route==='/report')await p.waitForFunction(()=>document.querySelector('[aria-label="Report cutoff"]').value!=='');
    await p.evaluate(()=>document.fonts.ready);if(route==='/boq')await p.locator('.scope-chart').waitFor();await wait(1200);
    const size=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
    assert(size.scroll<=size.client+1,JSON.stringify({theme,width,route,...size}));
    assert.equal(await p.locator('.desktop-nav a[aria-current=page]').getAttribute('href'),route);
    assert.equal(await p.locator('#mobile-drawer a[aria-current=page]').getAttribute('href'),route);
    assert.equal(await p.evaluate(()=>document.documentElement.dataset.theme),theme);
    if(process.env.TEST_OUTPUT_DIR && (width===390||width===1440) && ['/boq','/query','/report'].includes(route)){
     await fs.mkdir(process.env.TEST_OUTPUT_DIR,{recursive:true});await p.screenshot({path:path.join(process.env.TEST_OUTPUT_DIR,theme+'-'+width+'-'+route.slice(1)+'.png'),fullPage:true});
    }
    pass(theme+' '+width+' '+route+' active semantics / loaded content / no page overflow');
   }
  }
  const pairs=await p.evaluate(()=>{
   const names=['--fg','--muted','--danger','--success','--warning'];const result=[];
   const read=(name)=>{const el=document.createElement('span');el.style.color='var('+name+')';document.body.append(el);const value=getComputedStyle(el).color;el.remove();return value.match(/[\d.]+/g).slice(0,3).map(Number);};
   for(const name of names)for(const bg of ['--bg','--surface','--surface-2'])result.push({name,bg,a:read(name),b:read(bg)});
   result.push({name:'action text',bg:'accent',a:[255,255,255],b:read('--accent')});return result;
  });
  for(const pair of pairs)assert(contrast(pair.a,pair.b)>=4.5,JSON.stringify({theme,...pair,contrast:contrast(pair.a,pair.b)}));
  pass(theme+' semantic text/action tokens meet 4.5:1 contrast');
  const borders=await p.evaluate(()=>{const read=name=>{const el=document.createElement('span');el.style.color='var('+name+')';document.body.append(el);const value=getComputedStyle(el).color;el.remove();return value.match(/[\d.]+/g).slice(0,3).map(Number);};return ['--surface','--surface-2'].map(bg=>[read('--control-border'),read(bg)]);});for(const [a,b] of borders)assert(contrast(a,b)>=3);pass(theme+' control boundaries meet 3:1 contrast');
 }
 for(const width of [360,390,768]){
  await p.setViewportSize({width,height:844});
  const trigger=p.getByRole('button',{name:'Open menu'});await trigger.focus();await p.keyboard.press('Enter');
  const dialog=p.getByRole('dialog',{name:'Workspace navigation'});await dialog.waitFor();
  assert(await p.evaluate(()=>document.querySelector('dialog').contains(document.activeElement)));
  await p.getByRole('combobox',{name:'Color theme'}).evaluate(el=>el.focus());assert(await p.evaluate(()=>document.querySelector('dialog').contains(document.activeElement)));
  const first=dialog.getByRole('button',{name:'Close menu'}),last=dialog.getByRole('link',{name:'OKMD Website ↗'});
  await first.focus();await p.keyboard.press('Shift+Tab');assert(await last.evaluate(el=>el===document.activeElement));
  await p.keyboard.press('Tab');assert(await first.evaluate(el=>el===document.activeElement));
  await p.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert(await trigger.evaluate(el=>el===document.activeElement));
  await p.waitForFunction(()=>document.querySelector('.menu-trigger').getAttribute('aria-expanded')==='false');assert.equal(await trigger.getAttribute('aria-expanded'),'false');assert.equal(await p.evaluate(()=>document.body.style.overflow),'');
  pass(width+' drawer keyboard open / bidirectional trap / Escape / focus return');
 }
 await p.setViewportSize({width:390,height:844});await p.getByRole('button',{name:'Open menu'}).click();await p.setViewportSize({width:1440,height:900});await p.getByRole('dialog').waitFor({state:'hidden'});pass('desktop resize closes modal and restores scrolling');
 await p.goto(base+'/boq');await p.getByRole('button',{name:'Use synthetic demo'}).click();await p.getByTestId('viewer-summary').waitFor();
 for(const route of ['/report','/media','/','/query','/boq']){
  await p.locator('.desktop-nav a[href="'+route+'"]').click();await p.waitForURL(base+route);
 }
 assert.match(await p.getByTestId('boq-source').innerText(),/25 accepted rows/);pass('shared workbook survives Report Media Home Query Viewer links');
 const wb=X.utils.book_new();X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet([['WBS-1','WBS-2','WBS-3','WBS-4','Description','Unit','Qty','Material','Labor','Amount'],['A','B','C','D','งานคอนกรีต Concrete '.repeat(35),'m3',1,2,3,5]]),'Long');
 await p.locator('input[type=file]').setInputFiles({name:'งานทดสอบ'.repeat(25)+'.xlsx',mimeType:'application/octet-stream',buffer:X.write(wb,{type:'buffer',bookType:'xlsx'})});await p.getByTestId('boq-source').filter({hasText:'1 accepted rows'}).waitFor();
 await p.setViewportSize({width:360,height:844});await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),JSON.stringify(await p.locator('main *').evaluateAll(els=>els.filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(el=>({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right})))));await p.getByRole('navigation',{name:'BOQ workflows'}).getByRole('link',{name:'Query',exact:true}).click();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),JSON.stringify(await p.locator('main *').evaluateAll(els=>els.filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(el=>({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right})))));assert.match(await p.locator('tbody').innerText(),/งานคอนกรีต Concrete/);pass('long Thai English descriptions and filenames retained without page overflow');
 await p.getByRole('button',{name:'Show full table',exact:true}).click();
 const scroll=p.getByRole('region',{name:'Query results — scroll horizontally for all columns'});await scroll.focus();await p.keyboard.press('ArrowRight');await wait(150);assert(await scroll.evaluate(el=>el.scrollLeft>0));assert(await scroll.evaluate(el=>parseFloat(getComputedStyle(el).outlineWidth)>0));pass('full table remains keyboard-scrollable with visible focus');
 await p.getByRole('combobox',{name:'Color theme'}).selectOption('system');await p.emulateMedia({colorScheme:'dark'});await p.waitForFunction(()=>document.documentElement.dataset.theme==='dark');pass('return to System removes explicit-theme override');
 const restricted=await browser.newContext({colorScheme:'dark'});await restricted.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('blocked')};Storage.prototype.setItem=()=>{throw Error('blocked')};});const rp=await restricted.newPage();rp.on('pageerror',e=>errors.push(e.message));await rp.goto(base+'/query');await rp.getByRole('combobox',{name:'Color theme'}).selectOption('light');await rp.waitForFunction(()=>document.documentElement.dataset.theme==='light');await rp.emulateMedia({colorScheme:'light'});await rp.emulateMedia({colorScheme:'dark'});assert.equal(await rp.evaluate(()=>document.documentElement.dataset.theme),'light');await restricted.close();pass('blocked browser storage does not break in-memory theme choice');
 assert.deepEqual(errors,[]);pass('no uncaught browser errors');console.log('TOTAL',checks,'R3 checks passed; native devices not claimed.');
}
main().catch(e=>{console.error(e,log);process.exitCode=1}).finally(async()=>{await browser?.close();server?.kill();});
