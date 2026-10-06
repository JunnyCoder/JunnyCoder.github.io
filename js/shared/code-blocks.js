// Shared code blocks: explicit languages only, safe highlighting, controls and export.
window.SharedCodeBlocks = (() => {
  const aliases = { text: 'plaintext', txt: 'plaintext', plain: 'plaintext', 'plain-text': 'plaintext',
    js: 'javascript', ts: 'typescript', py: 'python', sh: 'bash', shell: 'bash',
    html: 'xml', svg: 'xml', htm: 'xml', yml: 'yaml', md: 'markdown',
    cs: 'csharp', 'c#': 'csharp', 'c++': 'cpp', rb: 'ruby', kt: 'kotlin', rs: 'rust' };
  const labels = { plaintext: 'Plain text', javascript: 'JavaScript', typescript: 'TypeScript',
    python: 'Python', xml: 'HTML / XML', css: 'CSS', json: 'JSON', yaml: 'YAML', bash: 'Bash / Shell',
    sql: 'SQL', java: 'Java', kotlin: 'Kotlin', swift: 'Swift', go: 'Go', rust: 'Rust',
    cpp: 'C++', csharp: 'C#', c: 'C', ruby: 'Ruby', php: 'PHP', markdown: 'Markdown',
    diff: 'Diff', ini: 'INI', dockerfile: 'Dockerfile', powershell: 'PowerShell' };
  const escape = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  function languages() {
    const supported = window.hljs?.listLanguages() || [];
    return ['plaintext', ...Object.keys(labels).filter(id => id !== 'plaintext' && supported.includes(id)),
      ...supported.filter(id => !(id in labels)).sort()];
  }
  function resolve(info) {
    const word = String(info || '').trim().split(/\s+/)[0].toLowerCase();
    const id = aliases[word] || word;
    if (!id || id === 'plaintext') return 'plaintext';
    return languages().includes(id) ? id : languages().find(language =>
      window.hljs?.getLanguage(language)?.aliases?.includes(id)) || 'plaintext';
  }
  function highlighted(text, language) {
    if (language !== 'plaintext' && window.hljs?.getLanguage(language)) {
      try { return hljs.highlight(text, { language, ignoreIllegals: true }).value; } catch { /* Retain literal code. */ }
    }
    return escape(text);
  }
  function renderCode(text, info) {
    const language = resolve(info);
    const metadata = String(info || '');
    const filename = metadata.match(/\bfilename="([^"]*)"/)?.[1];
    const start = metadata.match(/\bstart=(\d+)/)?.[1];
    const output = metadata.match(/\boutput=(\d+)/)?.[1];
    const style = /(?:^|\s)linenums(?:\s|$)/.test(metadata) ? 'code-lines' : filename ? 'code-file' : output ? 'code-terminal' : language === 'diff' ? 'code-diff' : '';
    const attributes = (style ? ' data-style="' + style + '"' : '') +
      (filename ? ' data-design-filename="' + escape(filename.slice(0,500)) + '"' : '') +
      (start ? ' data-design-start="' + start + '"' : '') +
      (output ? ' data-design-output-from="' + output + '"' : '');
    return '<pre class="shared-code-block" data-code-origin="markdown" data-code-language="' + language +
      '"' + attributes + '><code class="hljs language-' + language + '">' + highlighted(text + (text.endsWith('\n') ? '' : '\n'), language) + '</code></pre>\n';
  }
  function configureRenderer(renderer) { renderer.code = renderCode; return renderer; }
  function codeText(root) {
    // HTML line breaks are structure, so textContent alone would concatenate lines.
    let result = '';
    const visit = node => {
      if (node.nodeType === Node.TEXT_NODE) { result += node.textContent; return; }
      if (node.nodeType !== Node.ELEMENT_NODE || node.classList.contains('code-block-controls')) return;
      if (node.tagName === 'BR') { result += '\n'; return; }
      const block = /^(DIV|P|LI)$/.test(node.tagName);
      if (block && result && !result.endsWith('\n')) result += '\n';
      node.childNodes.forEach(visit);
      if (block && node.nextSibling && !result.endsWith('\n')) result += '\n';
    };
    root.childNodes.forEach(visit);
    return result;
  }
  function setLanguage(pre, info) {
    const language = resolve(info);
    let code = pre.querySelector(':scope > code');
    const text = codeText(code || pre);
    if (!code) { code = document.createElement('code'); pre.replaceChildren(code); }
    code.className = code.className.replace(/(?:^|\s)(?:hljs|language-[\w+#-]+)(?=\s|$)/g, '').trim();
    code.classList.add('hljs', 'language-' + language);
    code.innerHTML = highlighted(text, language);
    pre.classList.add('shared-code-block');
    pre.dataset.codeLanguage = language;
    return pre;
  }
  function normalize(root, { forcePlain = false } = {}) {
    root.querySelectorAll('pre').forEach(pre => {
      setLanguage(pre, forcePlain ? 'plaintext' : pre.dataset.codeLanguage || 'plaintext');
      if (forcePlain || !pre.dataset.codeOrigin) pre.dataset.codeOrigin = 'html';
    });
  }
  function format(pre) {
    const code = pre.querySelector(':scope > code');
    if (!code) return;
    code.querySelectorAll('.code-display-line').forEach(line => line.replaceWith(...line.childNodes));
    if (!['code-lines','code-terminal','code-diff'].includes(pre.dataset.style)) return;
    const text = code.textContent;
    const original = code.cloneNode(true);
    const output = document.createDocumentFragment();
    const lines = text.split('\n');
    if (lines[lines.length-1] === '') lines.pop();
    let offset = 0;
    const locate = position => {
      const walker = document.createTreeWalker(original, NodeFilter.SHOW_TEXT);
      let node, used = 0, last;
      while ((node=walker.nextNode())) {
        last=node;
        if (position <= used + node.length) return [node,position-used];
        used+=node.length;
      }
      return last ? [last,last.length] : [original,0];
    };
    const base = Math.max(1,Number(pre.dataset.designStart) || 1) + (Number(pre.dataset.codeLineOffset) || 0);
    lines.forEach((line,index) => {
      const range = document.createRange();
      range.setStart(...locate(offset));range.setEnd(...locate(offset+line.length));
      const span = document.createElement('span');span.className='code-display-line';
      span.dataset.lineNumber=String(base+index);
      if (pre.dataset.style==='code-terminal') span.dataset.codePart=Number(pre.dataset.designOutputFrom)>0 && base+index>=Number(pre.dataset.designOutputFrom) ? 'output' : 'command';
      if (pre.dataset.style==='code-diff') span.dataset.codePart=line.startsWith('+') ? 'added' : line.startsWith('-') ? 'removed' : 'context';
      let contents=range.cloneContents();
      let ancestor=range.commonAncestorContainer.nodeType===Node.ELEMENT_NODE ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
      while (ancestor && ancestor!==original && original.contains(ancestor)) {
        const shell=ancestor.cloneNode(false);shell.append(contents);contents=shell;ancestor=ancestor.parentElement;
      }
      span.append(contents);output.append(span);
      offset+=line.length;
      if (text[offset]==='\n') { output.append(document.createTextNode('\n'));offset++; }
    });
    code.replaceChildren(output);
  }
  function decorate(root, onChange) {
    root.querySelectorAll('pre.shared-code-block').forEach(pre => {
      format(pre);
      pre.querySelector(':scope > .code-block-controls')?.remove();
      const controls = document.createElement('span');
      controls.className = 'code-block-controls';
      controls.contentEditable = 'false';
      const select = document.createElement('select');
      select.className = 'code-language-select';
      select.setAttribute('aria-label', '코드 블록 언어');
      languages().forEach(id => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = labels[id] || id;
        select.append(option);
      });
      select.value = resolve(pre.dataset.codeLanguage);
      select.addEventListener('change', () => onChange(pre, select.value));
      const printLabel = document.createElement('span');
      printLabel.className = 'code-language-print';
      printLabel.textContent = labels[select.value] || select.value;
      controls.append(select, printLabel);
      ['click', 'dblclick', 'mousedown', 'keydown'].forEach(type => controls.addEventListener(type, event => event.stopPropagation()));
      pre.append(controls);
    });
  }
  function exportHtml(root, { sourceOnly = false } = {}) {
    const copy = root.cloneNode(true);
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
    return copy.innerHTML;
  }
  function exportCss() {
    const sheet = document.querySelector('link[data-code-block-style]')?.sheet;
    try { return Array.from(sheet?.cssRules || []).map(rule => rule.cssText).join('\n'); } catch { return ''; }
  }
  // Match parsed code tokens within their top-level source block. Raw HTML pre blocks
  // never enter this mapping, including HTML containing apparent Markdown fences.
  function markdownLocations(raw, tokens) {
    const locations = [];
    let sourceLine = 0, sourceOffset = 0;
    tokens.forEach(top => {
      // Reference definitions are removed from lexer output. Locate each raw
      // token in the source so later code controls still address the right fence.
      const found = raw.indexOf(top.raw, sourceOffset);
      if (found >= 0) { sourceLine = (raw.slice(0,found).match(/\n/g) || []).length; sourceOffset = found + top.raw.length; }
      const lines = top.raw.split('\n');
      let cursor = 0;
      marked.walkTokens([top], token => {
        if (token.type !== 'code') return;
        const opening = token.raw.trimStart().split('\n')[0].trim();
        for (; cursor < lines.length; cursor++) {
          const match = lines[cursor].match(/^([\t ]*(?:>[\t ]*)*(?:(?:[-+*]|\d+[.)])[\t ]+)?)(`{3,}|~{3,})(.*)$/);
          if (!match || (match[2] + match[3]).trim() !== opening) continue;
          locations.push({ line: sourceLine + cursor, prefix: match[1], marker: match[2] });
          cursor += Math.max(1, token.raw.split('\n').length - (token.raw.endsWith('\n') ? 1 : 0));
          break;
        }
      });
      sourceLine += (top.raw.match(/\n/g) || []).length;
    });
    return locations;
  }
  function htmlLocations(tokens, raw = tokens.map(token => token.raw).join('')) {
    const locations = [];
    let sourceLine = 0, sourceOffset = 0;
    tokens.forEach(top => {
      const found = raw.indexOf(top.raw, sourceOffset);
      if (found >= 0) { sourceLine = (raw.slice(0,found).match(/\n/g) || []).length; sourceOffset = found + top.raw.length; }
      const normalize = text => {
        let value = '', offset = 0;
        const indices = [];
        text.split('\n').forEach((line, index, lines) => {
          const prefix = line.match(/^[\t ]*(?:>[\t ]*)*(?:(?:[-+*]|\d+[.)])[\t ]+)?/)[0].length;
          for (let i = prefix; i < line.length; i++) { value += line[i]; indices.push(offset + i); }
          if (index < lines.length - 1) { value += '\n'; indices.push(offset + line.length); }
          offset += line.length + 1;
        });
        return { value, indices };
      };
      const original = normalize(top.raw);
      let cursor = 0;
      const position = offset => {
        const lines = top.raw.slice(0, offset).split('\n');
        return { line: sourceLine + lines.length - 1, ch: lines[lines.length - 1].length };
      };
      marked.walkTokens([top], token => {
        if (token.type === 'code') {
          const start = original.value.indexOf(token.raw.trimStart().split('\n')[0].trim(), cursor);
          if (start >= 0) {
            cursor = start;
            const count = token.raw.split('\n').length - (token.raw.endsWith('\n') ? 1 : 0);
            for (let i = 0; i < count; i++) {
              const next = original.value.indexOf('\n', cursor);
              cursor = next < 0 ? original.value.length : next + 1;
            }
          }
          return;
        }
        if (token.type !== 'html') return;
        const protectedRanges = Array.from(token.raw.matchAll(/<!--[^]*?-->|<(script|style|textarea)\b[^>]*>[^]*?<\/\1\s*>/gi))
          .map(match => [match.index, match.index + match[0].length]);
        for (const match of token.raw.matchAll(/<pre\b[^>]*>/gi)) {
          if (protectedRanges.some(([start, end]) => match.index >= start && match.index < end)) continue;
          const opening = normalize(match[0]).value;
          const start = original.value.indexOf(opening, cursor);
          if (start < 0) continue;
          const from = original.indices[start], to = original.indices[start + opening.length - 1] + 1;
          locations.push({ from: position(from), to: position(to), opening: top.raw.slice(from, to) });
          cursor = start + opening.length;
        }
      });
      sourceLine += (top.raw.match(/\n/g) || []).length;
    });
    return locations;
  }
  return { languages, resolve, renderCode, configureRenderer, setLanguage, normalize, decorate,
    format, exportHtml, exportCss, markdownLocations, htmlLocations };
})();
marked.use({ renderer: { code: window.SharedCodeBlocks.renderCode } });
