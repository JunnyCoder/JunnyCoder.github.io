const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const modules = require('./modules.cjs');
const markdown = require('./markdown-fixture.cjs');
const pdf = require('./app-fixture.cjs');
const repo = process.env.SITE_ROOT || path.resolve(__dirname, '../..');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function viewerWindow() {
  const dom = new JSDOM(fs.readFileSync(path.join(repo, 'tools/resume-viewer.html'), 'utf8'),
    {url: 'https://example.test/tools/resume-viewer.html', runScripts: 'outside-only', pretendToBeVisual: true});
  const w = dom.window;
  pdf.installLayout(w);
  for (const file of ['tools/libs/purify.min.js', 'tools/libs/highlight.min.js']) w.eval(fs.readFileSync(path.join(repo, file), 'utf8'));
  w.eval(fs.readFileSync(repo + '/tools/libs/katex/katex.min.js', 'utf8'));
  w.eval(fs.readFileSync(repo + '/tools/libs/katex/auto-render.min.js', 'utf8'));
  let storageCalls = 0, databaseCalls = 0, prints = 0;
  w.Storage.prototype.setItem = () => { storageCalls++; throw Error('Viewer attempted storage write'); };
  Object.defineProperty(w, 'indexedDB', {get() { databaseCalls++; throw Error('Viewer attempted IndexedDB access'); }});
  w.print = () => { prints++; };
  modules.load(w, modules.paths('resume-viewer').filter(file => file !== 'js/resume/viewer.js'));
  return {dom, w, storageCalls: () => storageCalls, databaseCalls: () => databaseCalls, prints: () => prints};
}

(async () => {
  const original = '<!-- keep comment -->\n\n[ref]: https://example.test\n\n> ```  js filename="src/a.js"  \n> const value = "$x$";\n> ```\n\nAfter  \nline\n';
  const md = await markdown(original), {w, cm, $} = md;
  const pre = $('previewHost').querySelector('pre');
  const adapter = w.MarkdownCodeEditing.create(cm);
  adapter.bind($('previewHost'), original, w.DocumentMarkdown.lexer(original));
  assert(w.DocumentCommands.setCodeLanguage(pre, 'java', adapter));
  assert.equal(cm.getValue(), original.replace('```  js ', '```  java '));
  cm.undo(); assert.equal(cm.getValue(), original);
  adapter.bind($('previewHost'), original, w.DocumentMarkdown.lexer(original));
  cm.replaceRange(' changed', {line: 4, ch: cm.getLine(4).length});
  const newer = cm.getValue();
  assert.equal(w.DocumentCommands.setCodeLanguage(pre, 'python', adapter), false);
  assert.equal(cm.getValue(), newer, 'stale mappings must not overwrite new source');
  const rawHtml = '<!-- exact -->\n<pre class="literal" data-code-language="java"><code>a &lt; b</code></pre>\n';
  cm.setValue(rawHtml); await wait(220);
  const rawPre = $('previewHost').querySelector('pre');
  adapter.bind($('previewHost'), rawHtml, w.DocumentMarkdown.lexer(rawHtml));
  assert(w.DocumentCommands.setCodeLanguage(rawPre, 'python', adapter));
  assert.equal(cm.getValue(), rawHtml.replace('data-code-language="java"', 'data-code-language="python"'));
  cm.undo(); assert.equal(cm.getValue(), rawHtml);
  cm.setValue('```linenums start=8\none\n```\n'); await wait(220);
  adapter.bind($('previewHost'), cm.getValue(), w.DocumentMarkdown.lexer(cm.getValue()));
  w.DocumentCommands.setCodeLanguage($('previewHost').querySelector('pre'), 'java', adapter);
  assert.equal(cm.getValue(), '```java linenums start=8\none\n```\n');
  assert.equal(md.errors.length, 0);
  console.log('PASS: shared code commands preserve Markdown/HTML source and Undo; stale mappings are rejected.');

  // A live import iframe owns its scoped styles and document nodes.
  const frame = w.document.createElement('iframe'); w.document.body.append(frame);
  const frameRoot = frame.contentDocument.body; frameRoot.className = 'preview-body';
  frameRoot.innerHTML = w.SharedHtmlBlocks.renderFence('<style>p{color:rgb(1,2,3)}</style><p>Isolated</p>');
  w.DocumentContent.prepare(frameRoot);
  const block = frameRoot.querySelector('[data-html-scope]');
  assert(frame.contentDocument.getElementById('style-' + block.dataset.htmlScope));
  assert(w.SharedHtmlBlocks.exportCss(frame.contentDocument).includes('rgb(1,2,3)'));
  const first = frameRoot.firstChild; w.DocumentContent.prepare(frameRoot); assert.equal(frameRoot.firstChild, first);
  // Use the actual shared style contents when serializing a standalone export.
  for (const link of w.document.querySelectorAll('link[data-document-style],link[data-code-block-style],link[data-element-style]')) {
    const style = w.document.createElement('style');
    style.textContent = fs.readFileSync(path.join(repo, link.getAttribute('href').split('?')[0].replace('../', '')), 'utf8');
    w.document.head.append(style); Object.defineProperty(link, 'sheet', {value: style.sheet});
  }
  const exported = w.DocumentSerialization.document($('previewHost'), {theme: 'light'});
  assert(exported.includes('data-document-theme="light"'));
  assert(exported.includes('.preview-body h1'));
  assert(!exported.includes('<select'));
  assert(exported.includes('data-design-start="8"'));
  assert.equal(w.getComputedStyle($('previewHost').querySelector('.code-display-line')).boxSizing, 'border-box', 'line-number padding must fit inside the code width in every consumer');
  md.dom.window.close();
  console.log('PASS: iframe-local HTML styles and export typography/theme use the shared document rules.');

  const app = await pdf();
  const longCode = Array.from({length: 90}, (_, i) => 'int row' + i + ' = ' + i + ';').join('\n');
  await app.load('# Chapter\n\nReference $x^2$\n\n```java linenums start=8\n' + longCode + '\n```\n\n## End\n\nComplete.', 'sample.md');
  app.$('generateTocBtn').click();
  app.$('enableHeaderFooter').checked = true; app.$('enableHeaderFooter').dispatchEvent(new app.w.Event('input', {bubbles:true}));
  await wait(300);
  app.w.dispatchEvent(new app.w.Event('pagehide'));
  const state = JSON.parse(app.w.localStorage.getItem('pdfmaker.draft.v1'));
  const project = {format:'junny-pdf-project', version:1, state, assets:[]};
  const view = viewerWindow(), v = view.w;
  const settings = v.DocumentSettings.normalize({fontSize: '999', marginTop: -1, colorTheme: 'tech', enableHeaderFooter: 'false'});
  assert.equal(settings.fontSize, 36); assert.equal(settings.marginTop, 0); assert.equal(settings.colorTheme, 'dev'); assert.equal(settings.enableHeaderFooter, false);
  assert.throws(() => v.DocumentProject.parse('{broken'), /JSON/);
  assert.throws(() => v.DocumentProject.validate({...project, version:2}), /지원/);
  assert.throws(() => v.DocumentProject.validate({...project, assets:[{id:'a'}]}), /이미지/);
  assert.throws(() => v.DocumentProject.validate({...project, state:{...state, html:'<img data-image-asset="missing">'}}), /이미지/);
  const parsed = v.DocumentProject.parse(JSON.stringify(project));
  assert(v.DocumentProject.serialize(parsed.state, parsed.assets).size > 0);
  const viewer = v.DocumentViewer.create({source: v.document.getElementById('resume-source'), container: v.document.getElementById('resume-pages')});
  const result = await viewer.load(parsed);
  assert.equal(result.pages.length, app.pages().length);
  const text = page => page.querySelector('.pdf-content').textContent;
  const editorTexts = app.pages().map(page => {
    const clone = page.cloneNode(true); clone.querySelectorAll('.code-block-controls').forEach(n => n.remove()); return text(clone);
  });
  assert.deepEqual(Array.from(result.pages, text), editorTexts);
  const pages = v.document.getElementById('resume-pages');
  assert.equal(pages.querySelectorAll('select,.code-block-controls,[contenteditable],.selected-element').length, 0);
  assert(pages.querySelector('.toc-item[href^="#"]'));
  assert(pages.querySelector('.katex'));
  assert.equal(Array.from(pages.querySelectorAll('pre code'), node => node.textContent).join(''), longCode+'\n');
  assert(viewer.print()); assert.equal(view.prints(), 1);
  assert.equal(view.storageCalls(), 0); assert.equal(view.databaseCalls(), 0);
  viewer.dispose(); assert.equal(pages.children.length, 0); assert.equal(viewer.ready, false);
  // rowspan=0 must remain atomic when it extends through the row group.
  const table = '<table><tbody><tr><td rowspan="0">Group</td><td>A</td></tr>' + '<tr><td>B</td></tr>'.repeat(35) + '</tbody></table>';
  await viewer.load({...project, state:{...state, html:table}});
  assert.equal(pages.querySelectorAll('table').length, 1); assert.equal(pages.querySelectorAll('.scaled-block').length, 1);
  app.dom.window.close();
  console.log('PASS: editor/viewer page parity, long code fidelity, math, TOC, rowspan=0, print and zero storage access.');

  let created = 0, revoked = 0;
  v.URL.createObjectURL = () => 'blob:test-' + (++created);
  v.URL.revokeObjectURL = () => { revoked++; };
  v.Image = class { constructor() { this.naturalWidth = 1; this.naturalHeight = 1; } set src(value) { queueMicrotask(() => this.onload?.()); } };
  const image = {id:'pixel', name:'pixel.png', type:'image/png', data:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII='};
  const memory = v.DocumentAssets.memory(); await memory.load([image]);
  const root = v.document.createElement('div'); root.innerHTML = '<img data-image-asset="pixel">';
  await memory.restore(root); assert.equal(root.firstChild.getAttribute('src'), 'blob:test-1');
  assert(!v.DocumentAssets.snapshotHtml(root.innerHTML).includes('blob:'));
  memory.dispose(); memory.dispose(); assert.equal(created, 1); assert.equal(revoked, 1);
  assert.throws(() => v.DocumentAssets.validateList([image,image]), /이미지/);
  await assert.rejects(v.DocumentAssets.memory().load([{...image,data:btoa('invalid')}]), /형식/);
  assert.equal(view.storageCalls(), 0); assert.equal(view.databaseCalls(), 0);
  viewer.dispose(); view.dom.window.close();
  console.log('PASS: memory assets validate binary content and release object URLs without opening IndexedDB.');
})().catch(error => { console.error(error); process.exit(1); });
