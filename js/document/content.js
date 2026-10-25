// Document preparation knows neither editor controls nor persistence.
window.DocumentContent = (() => {
  function renderMath(root) {
    window.renderMathInElement?.(root, {
      delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false},
        {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true}],
      ignoredClasses: ['pdf-math', 'katex', 'katex-display'], throwOnError: false
    });
    DocumentMath.render(root);
  }
  function prepare(root, {designs = true, math = true, forcePlain = false} = {}) {
    SharedHtmlBlocks.hydrate(root);
    SharedCodeBlocks.normalize(root, {forcePlain});
    if (math) renderMath(root);
    window.DocumentAssets?.decorate(root);
    if (designs) DocumentDesigns.prepareDesign(root);
    return root;
  }
  function safeHtml(html) {
    const staging = document.createElement('div');
    staging.innerHTML = html;
    return DOMPurify.sanitize(DocumentMath.sourceHtml(staging), {FORBID_ATTR: ['contenteditable']});
  }
  function hidden(node, root) {
    for (let current = node; current && current !== root; current = current.parentElement) {
      if (current.hidden || current.style.display === 'none') return true;
    }
    return false;
  }
  function normalizeSource(root, uid) {
    const doc = root.ownerDocument;
    prepare(root, {designs: false, math: false});
    root.querySelectorAll('[data-design-auto-number]').forEach(node => { delete node.dataset.designAutoNumber; delete node.dataset.designNumber; });
    root.querySelectorAll('[data-style] > figcaption').forEach(node => { delete node.dataset.designNumber; delete node.dataset.designSource; });
    root.querySelectorAll('[data-style]').forEach(node => {
      if (DocumentDesigns.designIds.has(node.dataset.style) && !DocumentDesigns.validDesign(node, node.dataset.style)) DocumentDesigns.writeDesign(node, 'default');
    });
    const exported = root.querySelector(':scope > article.preview-body');
    if (exported) exported.replaceWith(...exported.childNodes);
    Array.from(root.childNodes).forEach(node => {
      if (node.nodeType === 3 && node.textContent.trim()) {
        const paragraph = doc.createElement('p'); paragraph.textContent = node.textContent; node.replaceWith(paragraph);
      }
    });
    const assign = (nodes, key) => {
      const used = new Set();
      nodes.forEach(node => {
        if (!node.dataset[key] || used.has(node.dataset[key])) node.dataset[key] = uid(key);
        used.add(node.dataset[key]);
      });
    };
    assign(Array.from(root.children), 'blockId');
    const elements = Array.from(root.querySelectorAll(DocumentDesigns.selector + ',[data-html-block]')).filter(node => {
      if (node.closest('[data-html-block]') && !node.matches('[data-html-block]')) { delete node.dataset.elementId; return false; }
      return true;
    });
    assign(elements, 'elementId');
    assign(Array.from(root.querySelectorAll('h1,h2,h3,h4,h5,h6')).filter(node => !node.closest('.cover-page,.toc-wrapper,[data-html-block]')), 'headingId');
    return root;
  }
  return {prepare, renderMath, safeHtml, hidden, normalizeSource};
})();
