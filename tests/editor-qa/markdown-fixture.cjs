const fs = require('node:fs');
const {JSDOM, VirtualConsole} = require('jsdom');
const repo = process.env.SITE_ROOT || require('node:path').resolve(__dirname, '../..');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function markdown(draft, options = {}) {
  const errors = [], vc = new VirtualConsole(); vc.on('jsdomError', error => errors.push(error));
  const dom = new JSDOM(fs.readFileSync(repo + '/tools/markdown-editor.html', 'utf8'), {
    url:'https://example.test/tools/markdown-editor.html', runScripts:'outside-only', pretendToBeVisual:true, virtualConsole:vc
  });
  const w = dom.window;
  w.TextEncoder = TextEncoder; w.focus = () => {}; w.confirm = () => true;
  w.alert = () => {throw Error('Unexpected alert');};
  w.Range.prototype.getBoundingClientRect = () => ({top:0,bottom:20,left:0,right:10,width:10,height:20});
  w.Range.prototype.getClientRects = () => [{top:0,bottom:20,left:0,right:10,width:10,height:20}];
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.HTMLDialogElement.prototype.showModal = function(){this.open=true;};
  w.HTMLDialogElement.prototype.close = function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  if (draft !== undefined) w.localStorage.setItem('mdeditor.autosave.v1', draft);
  options.setup?.(w);
  for (const file of ['katex/katex.min.js','katex/auto-render.min.js','codemirror.min.js','marked.min.js','highlight.min.js','purify.min.js']) {
    w.eval(fs.readFileSync(repo + '/tools/libs/' + file, 'utf8'));
  }
  const modules = require('./modules.cjs'); modules.load(w, modules.paths('markdown-editor'));
  await wait(260);
  return {w,dom,errors,cm:w.document.querySelector('.CodeMirror').CodeMirror,$:id=>w.document.getElementById(id)};
}
module.exports = markdown;
