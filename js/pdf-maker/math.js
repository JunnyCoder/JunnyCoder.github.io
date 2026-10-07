// Preserve TeX before Markdown and regenerate KaTeX after sanitization/restoration.
window.PdfMath = (() => {
  const escape = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\|/g, '&#124;').replace(/\n/g, '&#10;').replace(/\r/g, '&#13;');
  function match(text) {
    const pairs = [['$$', '$$', true], ['\\[', '\\]', true], ['\\(', '\\)', false], ['$', '$', false]];
    for (const [left, right, display] of pairs) {
      if (!text.startsWith(left)) continue;
      let cursor = left.length, depth = 0;
      while (cursor < text.length) {
        if (depth === 0 && text.startsWith(right, cursor)) {
          const tex = text.slice(left.length, cursor);
          if (!tex.trim() || (!display && /\n\s*\n/.test(tex))) return;
          return { raw: text.slice(0, cursor + right.length), tex, display };
        }
        if (text[cursor] === '\\') { cursor += 2; continue; }
        if (text[cursor] === '{') depth++;
        if (text[cursor] === '}') depth = Math.max(0, depth - 1);
        cursor++;
      }
      return;
    }
    const env = text.match(/^\\begin\{(equation\*?|align\*?|alignat\*?|gather\*?|CD)\}/);
    if (env) {
      const end = '\\end{' + env[1] + '}', index = text.indexOf(end, env[0].length);
      if (index >= 0) return { raw: text.slice(0, index + end.length), tex: text.slice(0, index + end.length), display: true };
    }
  }
  const markup = token => '<span class="pdf-math" data-math-source="' + escape(token.tex) + '" data-math-display="' + token.display + '"></span>';
  if (window.marked) marked.use({ extensions: ['block', 'inline'].map(level => ({
    name: 'pdfMath' + level, level,
    start: source => source.search(/\$|\\[([]|\\begin\{/),
    tokenizer(source) { const token = match(source); if (!token || (level === 'block' && !token.display)) return; return { type: this.name || 'pdfMath' + level, ...token }; },
    renderer: markup
  })) });
  function parse(markdown, links) {
    let protectedText = '', cursor = 0;
    while (cursor < markdown.length) {
      const rest = markdown.slice(cursor);
      // Preserve code fences, inline code and raw HTML tags before scanning TeX.
      if (cursor === 0 || markdown[cursor - 1] === '\n') {
        const fence = rest.match(/^([\t ]*(?:>[\t ]*)*(?:(?:[-+*]|\d+[.)])[\t ]+)?)(`{3,}|~{3,})[^\n]*(?:\n|$)/);
        if (fence) {
          const close = new RegExp('^[\\t ]*(?:>[\\t ]*)*' + fence[2][0] + '{' + fence[2].length + ',}[\\t ]*(?:\\n|$)', 'm');
          const end = rest.slice(fence[0].length).match(close);
          const size = end ? fence[0].length + end.index + end[0].length : rest.length;
          protectedText += rest.slice(0, size); cursor += size; continue;
        }
      }
      const code = rest.match(/^(`+)/);
      if (code) {
        let end = rest.indexOf(code[0], code[0].length);
        while (end >= 0 && (rest[end - 1] === '`' || rest[end + code[0].length] === '`')) end = rest.indexOf(code[0], end + code[0].length);
        if (end >= 0) { const size = end + code[0].length; protectedText += rest.slice(0, size); cursor += size; continue; }
      }
      const html = rest.match(/^<(pre|code|script|style|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>|^<!--[\s\S]*?-->|^<\/?[a-z][^>]*>/i);
      if (html) { protectedText += html[0]; cursor += html[0].length; continue; }
      const token = match(rest);
      if (token) { protectedText += markup(token); cursor += token.raw.length; continue; }
      if (rest[0] === '\\' && /[\\$]/.test(rest[1] || '')) { protectedText += rest.slice(0, 2); cursor += 2; continue; }
      protectedText += rest[0]; cursor++;
    }
    const lexer = new marked.Lexer();
    if (links) lexer.tokens.links = links;
    const tokens = lexer.lex(protectedText);
    return marked.parser(tokens);
  }
  function adopt(root) {
    root.querySelectorAll('.katex').forEach(node => {
      if (node.closest('.pdf-math')) return;
      const tex = node.querySelector('annotation[encoding="application/x-tex"]')?.textContent;
      if (tex == null) return;
      const outer = node.closest('.katex-display') || node;
      const wrapper = document.createElement('span');
      wrapper.className = 'pdf-math'; wrapper.dataset.mathSource = tex;
      wrapper.dataset.mathDisplay = String(outer.classList.contains('katex-display'));
      outer.replaceWith(wrapper); wrapper.append(outer);
    });
  }
  function sourceHtml(root) {
    const clone = root.cloneNode(true); adopt(clone);
    clone.querySelectorAll('.pdf-math[data-math-source]').forEach(node => node.replaceChildren());
    return clone.innerHTML;
  }
  function editable(root) {
    adopt(root);
    root.querySelectorAll('.pdf-math[data-math-source]').forEach(node => {
      const delimiter = node.dataset.mathDisplay === 'true' ? '$$' : '$';
      node.replaceWith(document.createTextNode(delimiter + node.dataset.mathSource + delimiter));
    });
  }
  const rendered = new WeakMap();
  const mathCache = window.EditorRuntime?.cache({entries: 256, bytes: 2 * 1024 * 1024});
  function render(root) {
    adopt(root);
    const macros = {};
    root.querySelectorAll('.pdf-math[data-math-source]').forEach(node => {
      if (!window.katex) return;
      const tex = node.dataset.mathSource, displayMode = node.dataset.mathDisplay === 'true';
      // Definitions mutate the shared macro context. Always execute them in order;
      // cache only formulas without a document macro context.
      const cacheable = Object.keys(macros).length === 0 && !/\\(?:gdef|def|newcommand|renewcommand|let|global)\b/.test(tex);
      const key = JSON.stringify([tex, displayMode]);
      if (cacheable && rendered.get(node) === key && node.childNodes.length) return;
      const cached = cacheable && mathCache?.get(key);
      if (cached !== undefined && cached !== false) node.innerHTML = cached;
      else {
        katex.render(tex, node, {displayMode, throwOnError: false, trust: false, macros});
        if (cacheable && Object.keys(macros).length === 0) mathCache?.set(key, node.innerHTML);
      }
      if (cacheable && Object.keys(macros).length === 0) rendered.set(node, key);
      else rendered.delete(node);
    });
  }
  return { parse, render, adopt, editable, sourceHtml };
})();
