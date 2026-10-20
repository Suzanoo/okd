// Run after a build with synthetic Supabase public configuration (see docs/R1.md).
// No real accounts or backend are contacted. Role/RLS acceptance remains separate.
const {spawn}=require('node:child_process');
const http=require('node:http');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
let app,backend,log='',requests=0;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
  backend=http.createServer((_req,res)=>{requests++;res.writeHead(503);res.end();});
  await new Promise(r=>backend.listen(43999,'127.0.0.1',r));
  app=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','3188'],{cwd:root,env:{...process.env,OKD_ACCESS_MODE:'authenticated',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:43999',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-test-anon'},stdio:['ignore','pipe','pipe']});
  app.stdout.on('data',d=>log+=d);app.stderr.on('data',d=>log+=d);
  let ready=false;
  for(let i=0;i<160;i++){try{if((await fetch('http://127.0.0.1:3188')).ok){ready=true;break;}}catch{}if(app.exitCode!==null)throw new Error(log);await delay(250);}
  assert(ready,log);
  for(const url of ['/boq','/query','/report','/admin']){
    const r=await fetch('http://127.0.0.1:3188'+url,{redirect:'manual'});
    const body=await r.text();
    // App Router may stream the redirect in a 200 response after its shell.
    assert((r.status===307&&r.headers.get('location')==='/login')||(r.status===200&&body.includes('NEXT_REDIRECT')&&body.includes('/login')),url);
    console.log('PASS authenticated anonymous route redirects',url);
  }
  for(const url of ['/api/admin/users','/api/admin/users/reset-password']){
    const r=await fetch('http://127.0.0.1:3188'+url,{method:'POST',body:'{}'});
    assert.equal(r.status,401);console.log('PASS authenticated anonymous API 401',url);
  }
  assert.equal((await fetch('http://127.0.0.1:3188/login')).status,200);
  assert.equal(requests,0);console.log('PASS login route available; no backend request with no session');
  console.log('TOTAL 7 authenticated HTTP smoke checks passed; no live session/RLS test.');
}
main().catch(e=>{console.error(e,log);process.exitCode=1;}).finally(()=>{app?.kill();backend?.close();});
