const {spawnSync} = require('node:child_process');
const path = require('node:path');
for (const suite of ['correctness.cjs', 'document-layer.cjs', 'editor-workflows.cjs', 'site.cjs']) {
  const start = Date.now();
  const result = spawnSync(process.execPath, [path.join(__dirname, suite)], {stdio:'inherit', env:process.env, timeout:90000});
  if (result.error || result.status !== 0) {
    console.error(`FAIL: ${suite}`, result.error?.message || `exit ${result.status}, signal ${result.signal}`);
    process.exit(1);
  }
  console.log(`PASS: ${suite} (${((Date.now()-start)/1000).toFixed(1)}s)`);
}
