// Parse imported CSS with the browser and scope every selector to document content.
// It must never style the PDF Maker toolbar, pagination containers, or dialogs.
window.PdfHtmlStyles = (() => {
  const scope = ':is(.pdf-content,.block-edit-content)[data-imported-css="true"]';
  let activeStyle;
  let rootId = '', rootClasses = [], fontNames = new Map();
  function parse(css) {
    const style = document.createElement('style');
    style.media = 'not all';
    // Imports are fetched explicitly while loading, never left in the app stylesheet.
    style.textContent = css.replace(/@import\s+(?:url\([^)]*\)|["'][^"']*["'])[^;]*;/gi, '');
    document.head.append(style);
    const rules = Array.from(style.sheet?.cssRules || []);
    style.remove();
    return rules;
  }
  function selectors(text) {
    const result = [];
    let start = 0, depth = 0, quote = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '\\') { i++; continue; }
      if (quote) { if (char === quote) quote = ''; continue; }
      if (char === '"' || char === "'") { quote = char; continue; }
      if (char === '(' || char === '[') depth++;
      if (char === ')' || char === ']') depth--;
      if (char === ',' && depth === 0) { result.push(text.slice(start, i)); start = i + 1; }
    }
    result.push(text.slice(start));
    return result;
  }
  function scopedSelector(selector) {
    let value = selector.trim();
    if (rootId) value = value.replace(new RegExp('#' + rootId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w-])', 'g'),
      '[data-html-root-id=' + JSON.stringify(rootId) + ']');
    // Merge html/body/:root selectors into the content root. Preserve their classes.
    value = value.replace(/^(?:html|:root)(?=[\s.#[:>+~]|$)/i, scope);
    value = value.replace(/^body(?=[\s.#[:>+~]|$)/i, scope);
    if (value.startsWith(scope)) value = value.replace(/\s*(?:>\s*)?body(?=[\s.#[:>+~]|$)/i, '');
    if (value.startsWith(scope)) {
      // A sibling of the content root would be outside the imported document.
      if (/^[^>]*\s[+~]/.test(value.slice(scope.length))) return scope + ' :not(*)';
      return value;
    }
    const leading = value.match(/^\.([\w-]+)|^\[data-html-root-id=/);
    const rootVariant = leading && (!leading[1] || rootClasses.includes(leading[1])) ? scope + value + ',' : '';
    return rootVariant + scope + ':is(' + value + '),' + scope + ' ' + value;
  }
  function compile(rules) {
    return rules.map(rule => {
      if (rule.type === 1 && !rule.selectorText.startsWith('@')) {
        const rootSize = /(^|,)\s*(?:html|:root)(?:\s*[,]|\s*$)/.test(rule.selectorText) && rule.style.getPropertyValue('font-size');
        return selectors(rule.selectorText).map(scopedSelector).map(value => selectors(value).map(selector => selector.replace(/(::[\w-]+.*)?$/, ':not(.katex):not(.katex *)$1')).join(',')).join(',') + '{' + fontDeclarations(rule.style) +
          (rootSize ? '--pdf-import-root-size:' + absoluteRootSize(rootSize) + ';' : '') + '}';
      }
      if (rule.type === 5) return '@font-face{' + fontDeclarations(rule.style) + '}';
      if (rule.type === 4) {
        // Print typography is also used in preview so page measurements agree.
        const media = rule.conditionText.replace(/\b(?:only\s+)?(?:print|screen)\b/gi, 'all');
        return '@media ' + media + '{' + compile(Array.from(rule.cssRules)) + '}';
      }
      if (rule.cssRules && rule.cssText.startsWith('@supports')) {
        return '@supports ' + rule.conditionText + '{' + compile(Array.from(rule.cssRules)) + '}';
      }
      if (rule.cssRules && rule.cssText.startsWith('@layer')) return compile(Array.from(rule.cssRules));
      // Global @page, animation, and imports cannot affect the app.
      return '';
    }).join('\n');
  }
  function fontDeclarations(style) {
    return Array.from({ length: style.length }, (_, i) => style[i]).map(property => {
      let value = style.getPropertyValue(property);
      if (property === 'font-family' || property === 'font' || property.startsWith('--')) {
        for (const [name, replacement] of fontNames) {
          const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          value = value.replace(new RegExp('(^|[\\s,])(["\\\']?)' + escaped + '\\2(?=\\s*(?:,|$))', 'g'),
            '$1' + JSON.stringify(replacement));
        }
      }
      // Units in literal strings and URLs are content, not lengths.
      value = value.replace(/url\([^)]*\)|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(-?\d*\.?\d+)rem\b/gi,
        (match, number) => number === undefined ? match : 'calc(' + number + ' * var(--pdf-import-root-size, 16px))');
      return property + ':' + value + (style.getPropertyPriority(property) ? ' !important' : '') + ';';
    }).join('');
  }
  function absoluteRootSize(size) {
    const relative = size.match(/^([\d.]+)(rem|em|%)$/);
    return relative ? (Number(relative[1]) * (relative[2] === '%' ? .16 : 16)) + 'px' : size;
  }
  function resolveUrls(css, base) {
    if (!base) return css;
    return css.replace(/url\(\s*(["']?)([^)'"\s]+)\1\s*\)/gi, (match, quote, url) => {
      if (/^(?:data:|#)/i.test(url)) return match;
      try { return 'url(' + JSON.stringify(new URL(url, base).href) + ')'; } catch { return match; }
    });
  }
  async function extract(html, files = []) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const css = [], missing = [], visited = new Set();
    const companions = files.filter(file => /\.css$/i.test(file.name));
    async function loadCss(text, base, depth = 0) {
      if (depth > 4) return;
      const imports = Array.from(text.matchAll(/@import\s+(?:url\(\s*["']?([^)'"\s]+)["']?\s*\)|["']([^"']+)["'])[^;]*;/gi));
      for (const match of imports) await loadLink(match[1] || match[2], base, depth + 1);
      css.push(resolveUrls(text, base));
    }
    async function loadLink(href, base, depth = 0) {
      const name = href.split(/[?#]/)[0].split('/').pop();
      const file = companions.find(item => item.name === name);
      const key = file ? file.name : href;
      if (visited.has(key)) return;
      visited.add(key);
      if (file) { await loadCss(await file.text(), null, depth); return; }
      try {
        const url = new URL(href, base || undefined);
        if (!['http:', 'https:'].includes(url.protocol)) throw Error('Unsupported URL');
        const response = await fetch(url.href, { signal: AbortSignal.timeout(5000), credentials: 'omit' });
        if (!response.ok) throw Error('Stylesheet unavailable');
        await loadCss(await response.text(), url.href, depth);
      } catch { missing.push(name || href); }
    }
    const base = doc.querySelector('base[href]')?.getAttribute('href');
    for (const node of doc.querySelectorAll('style,link[rel~="stylesheet" i]')) {
      if (node.tagName === 'STYLE') await loadCss(node.textContent, base);
      else await loadLink(node.getAttribute('href') || '', base);
      node.remove();
    }
    for (const file of companions) if (!visited.has(file.name)) await loadCss(await file.text(), null);
    const attributes = {};
    if (doc.documentElement.style.fontSize) attributes.rootFontSize = absoluteRootSize(doc.documentElement.style.fontSize);
    const exported = doc.body.querySelector(':scope > article.preview-body');
    for (const root of [doc.documentElement, doc.body, exported].filter(Boolean)) {
      for (const attr of root.attributes) {
        if (attr.name === 'class') attributes.class = [attributes.class, attr.value].filter(Boolean).join(' ');
        else if (['style', 'id', 'lang', 'dir'].includes(attr.name)) attributes[attr.name] = attr.value;
      }
    }
    if (exported) exported.replaceWith(...exported.childNodes);
    return { html: doc.body.innerHTML, styles: { css, attributes, missing,
      available: css.length > 0 || Boolean(doc.querySelector('[style]')) } };
  }
  function mount(styles, enabled) {
    activeStyle?.remove();
    activeStyle = document.createElement('style');
    activeStyle.id = 'importedDocumentStyles';
    rootId = styles.attributes?.id || '';
    rootClasses = (styles.attributes?.class || '').split(/\s+/);
    fontNames = new Map();
    if (enabled) {
      const sheets = (styles.css || []).map(parse);
      const collectFonts = rules => rules.forEach(rule => {
        if (rule.type === 5) {
          const name = rule.style.getPropertyValue('font-family').replace(/^["']|["']$/g, '');
          if (name && !fontNames.has(name)) fontNames.set(name, 'pdf-import-' + (fontNames.size + 1));
        }
        if (rule.cssRules) collectFonts(Array.from(rule.cssRules));
      });
      sheets.forEach(collectFonts);
      activeStyle.textContent = sheets.map(compile).join('\n');
    }
    document.head.append(activeStyle);
  }
  function decorateRoot(root, styles, enabled) {
    root.dataset.importedCss = String(enabled);
    if (!enabled) return;
    const attrs = styles.attributes || {};
    (attrs.class || '').split(/\s+/).filter(Boolean).forEach(name => root.classList.add(name));
    // An ID is retained for original #id selectors, even across page fragments.
    if (attrs.id) root.dataset.htmlRootId = attrs.id;
    ['lang', 'dir'].forEach(name => { if (attrs[name]) root.setAttribute(name, attrs[name]); });
    if (attrs.style) root.style.cssText += ';' + attrs.style;
    if (attrs.rootFontSize) root.style.setProperty('--pdf-import-root-size', attrs.rootFontSize);
    root.style.cssText = fontDeclarations(root.style);
    // The paper controls geometry; original body typography and colors remain.
    ['height', 'min-height', 'width', 'min-width', 'position', 'margin', 'padding'].forEach(name => root.style.removeProperty(name));
  }
  function pageBackground(page, root, remove) {
    const computed = getComputedStyle(root);
    const background = document.createElement('div');
    background.className = 'pdf-document-background';
    background.setAttribute('aria-hidden', 'true');
    const properties = ['background-color', 'background-image', 'background-size', 'background-position',
      'background-repeat', 'background-origin', 'background-clip', 'background-blend-mode'];
    if (!remove) properties.forEach(property => {
      const value = computed.getPropertyValue(property);
      if (value) background.style.setProperty(property, value);
    });
    page.prepend(background);
    root.style.setProperty('background', 'transparent', 'important');
  }
  function prepare(node, enabled) {
    if (!enabled) [node, ...node.querySelectorAll('[style]')].forEach(element => {
      // KaTeX's inline offsets/struts are generated layout, not imported presentation.
      if (element.closest('.katex')) return;
      const hidden = element.style.display === 'none';
      const lineHeight = element.dataset.pdfLineHeight;
      if (element.hasAttribute('style') && !element.dataset.htmlStyle) element.dataset.htmlStyle = element.getAttribute('style');
      element.removeAttribute('style');
      if (hidden) element.style.display = 'none';
      if (lineHeight) element.style.lineHeight = lineHeight;
    });
    else [node, ...node.querySelectorAll('[style]')].forEach(element => {
      if (element.closest('.katex')) return;
      if (element.hasAttribute('style')) element.style.cssText = fontDeclarations(element.style);
    });
    return node;
  }
  function restoreInline(node) {
    node.querySelectorAll('[data-html-style]').forEach(element => {
      element.setAttribute('style', element.dataset.htmlStyle);
      delete element.dataset.htmlStyle;
    });
  }
  return { extract, mount, decorateRoot, prepare, restoreInline, pageBackground };
})();
