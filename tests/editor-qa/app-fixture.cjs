const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const repo = require('node:path').resolve(__dirname,'../..');
const html = fs.readFileSync(repo + '/tools/pdf-maker.html', 'utf8');
const script = fs.readFileSync(repo + '/js/pdf-maker/script.js', 'utf8');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
function installLayout(window) {
  const proto = window.HTMLElement.prototype;
  const side = (name, page) => page?.classList.contains('cover-page-wrapper') ? 0 :
    Math.max(parseFloat(window.document.documentElement.style.getPropertyValue('--page-margin-' + name.toLowerCase())) * 3.7795,
      ['Top', 'Bottom'].includes(name) && page?.classList.contains('with-header-footer') ? 19 * 3.7795 : 0);
  const pageOf = node => node.closest('.pdf-page');
  function height(node) {
    if (!node || node.nodeType !== 1) return (node?.textContent.trim().length || 0) / 90 * 20;
    if (node.style?.display === 'none') return 0;
    if (node.classList.contains('pdf-page')) return 1123;
    if (node.classList.contains('pdf-document-background') || node.classList.contains('cover-image-layer') || node.classList.contains('cover-filter-layer')) return 0;
    if (node.classList.contains('scaled-block')) return parseFloat(node.style.height);
    if (node.classList.contains('cover-page')) return 1123;
    if (node.tagName === 'TR') return 40;
    if (node.tagName === 'TABLE') return Array.from(node.rows).length * 40;
    if (/^H[1-6]$/.test(node.tagName)) return 40;
    if (node.classList.contains('toc-item')) return 30;
    if (node.tagName === 'P' || node.tagName === 'PRE') return Math.max(20, Math.ceil(node.textContent.length / 90) * 20);
    return Array.from(node.childNodes).reduce((sum, child) => sum + height(child), 0);
  }
  Object.defineProperty(proto, 'clientHeight', { configurable: true, get() {
    if (this.classList.contains('pdf-page')) return 1123;
    if (this.classList.contains('pdf-content')) return parseFloat(this.style.height) || 0;
    return height(this);
  } });
  Object.defineProperty(proto, 'clientWidth', { configurable: true, get() {
    const page = pageOf(this);
    return 794 - side('Left', page) - side('Right', page);
  } });
  Object.defineProperty(proto, 'scrollWidth', { configurable: true, get() { return this.clientWidth; } });
  Object.defineProperty(proto, 'scrollHeight', { configurable: true, get() {
    return this.classList.contains('pdf-content') ?
      Math.max(this.clientHeight, Array.from(this.children).reduce((sum, node) => sum + height(node), 0)) : height(this);
  } });
  proto.getBoundingClientRect = function() { return { height: height(this), width: this.clientWidth, top: 0, left: 0, bottom: height(this), right: this.clientWidth }; };
  const nativeComputed = window.getComputedStyle.bind(window);
  window.getComputedStyle = node => ({ getPropertyValue: property => nativeComputed(node).getPropertyValue(property), paddingTop: side('Top', node) + 'px', paddingBottom: side('Bottom', node) + 'px', marginTop: '0px', marginBottom: '0px' });
  window.HTMLDialogElement.prototype.showModal = function() { this.open = true; };
  window.HTMLDialogElement.prototype.close = function() { this.open = false; };
}
async function app(draft) {
  const dom = new JSDOM(html, { url: 'https://example.test/tools/pdf-maker.html', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  installLayout(w);
  w.alert = message => { throw Error(message); };
  w.prompt = () => null;
  w.print = () => {};
  if (draft) w.localStorage.setItem('pdfmaker.draft.v1', draft);
  w.eval(fs.readFileSync(repo + '/tools/libs/marked.min.js', 'utf8'));
  w.eval(fs.readFileSync(repo + '/tools/libs/purify.min.js', 'utf8'));
  w.eval(fs.readFileSync(repo + '/js/shared/render-runtime.js', 'utf8'));
  w.eval(fs.readFileSync(repo + '/js/shared/markdown-options.js', 'utf8'));
  w.eval(fs.readFileSync(repo + '/tools/libs/highlight.min.js', 'utf8'));
  w.eval(fs.readFileSync(repo + '/js/shared/html-blocks.js', 'utf8'));
  w.eval(fs.readFileSync(repo + '/js/shared/code-blocks.js', 'utf8'));
  w.eval(fs.readFileSync(repo + '/js/pdf-maker/math.js','utf8'));
  w.eval(fs.readFileSync(require.resolve('katex/dist/katex.min.js'),'utf8'));
  w.eval(fs.readFileSync(require.resolve('katex/dist/contrib/auto-render.min.js'),'utf8'));
  w.eval(fs.readFileSync(repo + '/js/pdf-maker/templates.js', 'utf8'));
  w.eval(fs.readFileSync(repo + '/js/pdf-maker/html-styles.js', 'utf8'));
  w.eval(fs.readFileSync(repo + '/js/pdf-maker/document-state.js', 'utf8'));
  w.eval(fs.readFileSync(repo + '/js/pdf-maker/page-reflow.js', 'utf8'));
  w.eval(script);
  await wait(20);
  const $ = id => w.document.getElementById(id);
  return { w, $, dom,
    pages: () => Array.from($('pdfPreviewContainer').querySelectorAll('.pdf-page')),
    async load(content, name = 'test.html') {
      Object.defineProperty($('htmlFileInput'), 'files', { configurable: true, value: [{ name, text: async () => content }] });
      $('htmlFileInput').dispatchEvent(new w.Event('change', { bubbles: true }));
      await wait(5);
      if ($('confirmDocumentDialog').open) $('confirmDocumentActionBtn').click();
      await wait(20);
    },
    async input(id, value) { $(id).value = value; $(id).dispatchEvent(new w.Event('input', { bubbles: true })); await wait(130); }
  };
}

module.exports = app;
