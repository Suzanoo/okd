const {spawnSync}=require('node:child_process');
const path=require('node:path');
const suites=process.argv.includes('--browser')
  ? ['browser.cjs','r2-browser.cjs','r3-browser.cjs','r4-browser.cjs']
  : ['security.cjs','regression.cjs','report-contract.cjs','boq-session.cjs','theme.cjs','r4-feedback.cjs'];
for(const suite of suites){
  const result=spawnSync(process.execPath,[path.join(__dirname,suite)],{stdio:'inherit',env:process.env});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status||1);
}
console.log(`Completed ${suites.length} suites.`);
