/* Execute the actual TS handlers/layouts with isolated auth dependencies.
   This proves guard ordering, not a live Supabase/RLS integration. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
let checks = 0;
function load(file, mocks = {}) {
  const filename = path.join(root, file);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const m = { exports: {} };
  const req = name => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith('@/config/')) return load(name.slice(2) + '.ts', mocks);
    throw new Error(`Unexpected dependency reached: ${name}`);
  };
  new Function('require', 'module', 'exports', code)(req, m, m.exports);
  return m.exports;
}
const next = { NextResponse: class extends Response {
  static next() { return new Response(null, { status: 200 }); }
  static json(body, init) { return Response.json(body, init); }
  static redirect(url) { return Response.redirect(url); }
} };
const jsx = { jsx: (...args) => args, jsxs: (...args) => args };
function check(name, fn) { return Promise.resolve().then(fn).then(() => { checks++; console.log('PASS', name); }); }
async function main() {
  const previous = process.env.OKD_ACCESS_MODE;
  try {
    delete process.env.OKD_ACCESS_MODE;
    const config = load('config/access.config.ts');
    await check('absent mode preserves authenticated behavior', () => assert.equal(config.getAccessMode(), 'authenticated'));
    for (const value of ['', 'PUBLIC', 'public ', 'invalid']) {
      process.env.OKD_ACCESS_MODE = value;
      await check(`invalid mode ${JSON.stringify(value)} fails closed`, () => assert.throws(config.getAccessMode));
    }
    process.env.OKD_ACCESS_MODE = 'public';
    const middleware = load('middleware.ts', { 'next/server': next }).middleware;
    for (const pathname of ['/', '/boq', '/report', '/media', '/boq/example_boq.xlsx']) {
      await check(`public middleware ${pathname} does not import auth`, async () => assert.equal((await middleware({nextUrl:{pathname}})).status, 200));
    }
    for (const pathname of ['/admin', '/admin/child', '/api/admin/users', '/api/admin/users/reset-password', '/login', '/logout']) {
      await check(`private middleware ${pathname} denies before auth`, async () => assert.equal((await middleware({nextUrl:{pathname}})).status, 404));
    }
    const fail = () => { throw new Error('Auth must not be called'); };
    const navigation = { notFound: () => { throw new Error('NOT_FOUND'); }, redirect: fail };
    const authMock = { requireActiveUser: fail };
    const common = { 'react/jsx-runtime': jsx, 'next/navigation': navigation, '@/lib/auth/requireActiveUser': authMock };
    await check('public workspace bypasses auth import', async () => await load('app/(workspace)/layout.tsx', common).default({children:'content'}));
    for (const file of ['app/(protected)/layout.tsx', 'app/(protected)/admin/page.tsx', 'app/login/page.tsx']) {
      const mocks = {...common, './AdminClient': () => null, './LoginForm': () => null, react: {Suspense: () => null}};
      await check(`${file} independent denial`, async () => assert.rejects(async () => load(file,mocks).default({children:null}), /NOT_FOUND/));
    }
    await check('public header skips Supabase import', async () => {
      const result = await load('app/_components/AppHeader.tsx', {'react/jsx-runtime':jsx,'./AppHeaderClient':()=>null}).default();
      assert.equal(result[1].publicMode,true);
    });
    const routes = ['app/api/admin/users/route.ts', 'app/api/admin/users/reset-password/route.ts'];
    for (const file of [...routes, 'app/logout/route.ts']) {
      await check(`${file} public direct handler denies stale sessions`, async () => {
        const handler = load(file, {'next/server':next,'@/lib/supabase/server':{supabaseServer:fail},'@/lib/supabase/admin':{supabaseAdmin:fail}});
        assert.equal((await handler.POST(new Request('http://localhost/test',{method:'POST',body:'invalid JSON',headers:{Cookie:'stale-admin-session'}}))).status,404);
      });
    }
    process.env.OKD_ACCESS_MODE = 'authenticated';
    let calls=0;
    await check('authenticated middleware still refreshes session',async()=>{
      const mw=load('middleware.ts',{'next/server':next,'@/lib/supabase/middleware':{updateSession:()=>{calls++;return 'refreshed';}}});
      assert.equal(await mw.middleware({}), 'refreshed');assert.equal(calls,1);
    });
    await check('authenticated workspace still requires active user',async()=>{
      await load('app/(workspace)/layout.tsx',{'react/jsx-runtime':jsx,'@/lib/auth/requireActiveUser':{requireActiveUser:()=>{calls++;}}}).default({children:null});
      assert.equal(calls,2);
    });
    for (const file of routes) for (const [user,profile,status] of [[null,null,401],[{id:'test'},null,403],[{id:'test'},{role:'viewer',is_active:true},403],[{id:'test'},{role:'admin',is_active:false},403],[{id:'test'},{role:'admin',is_active:true},200]]) {
      let mutations=0;
      const sb={auth:{getUser:async()=>({data:{user}})},from:()=>({select:()=>({eq:()=>({single:async()=>({data:profile})})})})};
      const admin={auth:{admin:{createUser:async()=>{mutations++;return {data:{user:{id:'created'}}};},updateUserById:async()=>{mutations++;return {};}}},from:()=>({upsert:async()=>({})})};
      await check(`${file} authenticated ${JSON.stringify(profile)} -> ${status}`,async()=>{
        const h=load(file,{'next/server':next,'@/lib/supabase/server':{supabaseServer:async()=>sb},'@/lib/supabase/admin':{supabaseAdmin:()=>admin}});
        const r=await h.POST(new Request('http://localhost/test',{method:'POST',body:JSON.stringify({email:'synthetic@example.invalid',password:'demo-only-password',userId:'test',newPassword:'demo-only-password'})}));
        assert.equal(r.status,status);assert.equal(mutations,status===200?1:0);
      });
    }
    console.log(`TOTAL ${checks} security checks passed (mocked auth).`);
  } finally { if(previous===undefined) delete process.env.OKD_ACCESS_MODE; else process.env.OKD_ACCESS_MODE=previous; }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
