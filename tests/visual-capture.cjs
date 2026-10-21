const {chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs/promises'),path=require('node:path');
const {fixture}=require('./visual-fixture.cjs');
const base='http://127.0.0.1:3195',root=path.resolve(__dirname,'..');
let app,browser,log='';const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
 const env={...process.env,OKD_ACCESS_MODE:'public'};for(const k of Object.keys(env))if(/SUPABASE/.test(k))delete env[k];
 app=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','3195'],{cwd:root,env,stdio:['ignore','pipe','pipe']});app.stdout.on('data',d=>log+=d);app.stderr.on('data',d=>log+=d);
 for(let i=0;i<160;i++){try{if((await fetch(base)).ok)break;}catch{}if(app.exitCode!==null)throw Error(log);await wait(250);}
 browser=await chromium.launch({headless:true,executablePath:process.env.TEST_CHROMIUM_PATH,args:['--no-sandbox']});
 const context=await browser.newContext();await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 const p=await context.newPage(),out=process.env.VISUAL_OUTPUT;
 await fs.mkdir(out,{recursive:true});
 for(const theme of ['light','dark'])for(const width of [1440,390])for(const route of ['boq','query']){
  await p.setViewportSize({width,height:1000});await p.goto(base+'/'+route);
  await p.getByRole('combobox',{name:'Color theme'}).selectOption(theme);
  await p.locator('input[type=file]').setInputFiles({name:'demo_structure.xlsx',mimeType:'application/octet-stream',buffer:fixture()});
  await p.getByTestId('boq-source').filter({hasText:'6 accepted rows'}).waitFor();
  if(route==='query'){await p.getByRole('textbox',{name:'Search Description'}).fill('concrete');await p.getByRole('button',{name:'Search',exact:true}).click();}
  await p.evaluate(()=>document.fonts.ready);await wait(1400);
  await p.screenshot({path:path.join(out,route+'-'+theme+'-'+width+'.png'),fullPage:true});
  console.log('CAPTURE',route,theme,width);
 }
}
main().catch(e=>{console.error(e,log);process.exitCode=1}).finally(async()=>{await browser?.close();app?.kill();});
