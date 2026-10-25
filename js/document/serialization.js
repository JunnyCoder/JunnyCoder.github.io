// Portable display HTML and canonical source share cleanup rules.
window.DocumentSerialization = (() => {
  function exportHtml(root, { sourceOnly = false } = {}) {
    const copy = root.cloneNode(true);
    copy.querySelectorAll('[contenteditable]').forEach(node => node.removeAttribute('contenteditable'));
    copy.querySelectorAll('.selected-element').forEach(node => node.classList.remove('selected-element'));
    copy.querySelectorAll('.code-block-controls').forEach(node => node.remove());
    // Portable HTML retains display-only spans and calculated labels so static
    // exports still show the same designs. Their numbers are CSS-generated,
    // never part of the code text. Source consumers can request clean markup.
    if (!sourceOnly) return copy.innerHTML;
    copy.querySelectorAll('.code-display-line').forEach(node => node.replaceWith(...node.childNodes));
    copy.querySelectorAll('figure[data-style] > figcaption').forEach(node => { delete node.dataset.designNumber;delete node.dataset.designSource; });
    copy.querySelectorAll('[data-design-auto-number]').forEach(node => { delete node.dataset.designNumber;delete node.dataset.designAutoNumber; });
    copy.querySelectorAll('*').forEach(node => {
      ['data-design-display-label','data-design-step','data-design-checked','data-design-highlight','data-design-numeric','data-code-line-offset','data-design-continuation'].forEach(attr => node.removeAttribute(attr));
    });
    copy.querySelectorAll('[data-html-block]').forEach(node => { node.replaceChildren(); delete node.dataset.htmlScope; delete node.dataset.htmlRendered; });
    const html = DocumentMath.sourceHtml(copy);
    return window.DocumentAssets ? DocumentAssets.snapshotHtml(html, root.ownerDocument) : html;
  }
  function css(doc = document) {
    const text = Array.from(doc.querySelectorAll('link[data-document-style],link[data-code-block-style],link[data-element-style]')).map(link => {
      try { return Array.from(link.sheet?.cssRules || []).map(rule => rule.cssText).join('\n'); }
      catch { throw Error('문서 스타일을 읽지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.'); }
    }).join('\n');
    return text + '\n' + SharedHtmlBlocks.exportCss(doc);
  }
  function documentHtml(root, {theme, title = 'Markdown Export'} = {}) {
    const doc = root.ownerDocument;
    theme = theme || root.dataset.documentTheme || doc.documentElement.dataset.uiTheme || 'dark';
    theme = theme === 'light' ? 'light' : 'dark';
    const katex = doc.querySelector('link[href*="katex"]')?.dataset.exportHref || 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    const escape = SharedHtmlBlocks.escape;
    // Only document styles, never toolbar/layout CSS, are embedded in an export.
    return '<!doctype html>\n<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escape(title) +
      '</title><link rel="stylesheet" href="' + escape(katex) + '"><style>' + css(doc).replace(/<\/style/gi, '<\\/style') +
      '\nbody{margin:0;background:' + (theme === 'light' ? '#fff' : '#1b1c22') + '}article.preview-body{box-sizing:border-box;max-width:880px;margin:auto;padding:32px 30px 60px}</style></head><body><article class="preview-body" data-document-theme="' + theme + '">' + exportHtml(root) + '</article></body></html>';
  }
  return {html: exportHtml, css, document: documentHtml};
})();
