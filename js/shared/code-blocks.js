// Shared code blocks: explicit languages only, safe highlighting and display formatting.
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
  const highlightCache = window.EditorRuntime?.cache({entries: 256, bytes: 2 * 1024 * 1024});
  function highlighted(text, language) {
    const key=language+'\0'+text;
    const cached=highlightCache?.get(key);if(cached!==undefined)return cached;
    if (language !== 'plaintext' && window.hljs?.getLanguage(language)) {
      try { const html=hljs.highlight(text, { language, ignoreIllegals: true }).value;highlightCache?.set(key,html);return html; } catch { /* Retain literal code. */ }
    }
    return escape(text);
  }
  function renderCode(text, info) {
    if (String(info || "").trim() === "junny-html" && window.SharedHtmlBlocks) return SharedHtmlBlocks.renderFence(text);
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
  const normalized = new WeakMap();
  function setLanguage(pre, info) {
    const document = pre.ownerDocument;
    const language = resolve(info);
    let code = pre.querySelector(':scope > code');
    const text = codeText(code || pre);
    const stamp=language+'\0'+text;
    if(code && normalized.get(pre)===stamp && code.classList.contains('language-'+language))return pre;
    if (!code) { code = document.createElement('code'); pre.replaceChildren(code); }
    code.className = code.className.replace(/(?:^|\s)(?:hljs|language-[\w+#-]+)(?=\s|$)/g, '').trim();
    code.classList.add('hljs', 'language-' + language);
    code.innerHTML = highlighted(text, language);
    pre.classList.add('shared-code-block');
    pre.dataset.codeLanguage = language;
    normalized.set(pre,stamp);
    return pre;
  }
  function normalize(root, { forcePlain = false } = {}) {
    root.querySelectorAll('pre').forEach(pre => {
      setLanguage(pre, forcePlain ? 'plaintext' : pre.dataset.codeLanguage || 'plaintext');
      if (forcePlain || !pre.dataset.codeOrigin) pre.dataset.codeOrigin = 'html';
    });
  }
  function format(pre) {
    const document = pre.ownerDocument;
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
  return {languages, resolve, labels, renderCode, configureRenderer, codeText, setLanguage, normalize, format};
})();
