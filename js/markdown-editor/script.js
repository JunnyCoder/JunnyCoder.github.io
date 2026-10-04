(function(){

  /* ================= Example content ================= */
  var exampleLines = [
    '# Hello from Junny',
    '',
    'A tiny README to **try out** the editor.',
    '',
    '> Tip: headers, quotes, and code fences turn blue as you type.',
    '',
    '## Features',
    '',
    '- Live preview with GitHub-flavored Markdown',
    '- Tables, task lists, and fenced code',
    '- Copy or download the result',
    '',
    '## Math Rendering (KaTeX)',
    '',
    '인라인 수식: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$',
    '',
    '블록 수식:',
    '$$',
    'f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi)\\,e^{2\\pi i \\xi x}\\,d\\xi',
    '$$',
    '',
    '## Checklist',
    '',
    '- [x] Write draft',
    '- [ ] Add screenshots',
    '- [ ] Ship it',
    '',
    '## Code',
    '',
    '```js',
    'function greet(name) {',
    '  return `Hello, ${name}!`;',
    '}',
    '```',
    '',
    '```python',
    'def greet(name):',
    '    return f"Hello, {name}!"',
    '```',
    '',
    '| Track | Lessons |',
    '| ----- | ------- |',
    '| Python | 220 |',
    '| JavaScript | 180 |',
    '| Markdown | 12 |',
    ''
  ];
  var exampleMarkdown = exampleLines.join('\n');

  /* ================= Export CSS ================= */
  var EXPORT_CSS = [
    'body{margin:0;background:#111217;color:#d8dadf;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Apple SD Gothic Neo","Malgun Gothic",Roboto,sans-serif;}',
    '.preview-body{max-width:820px;margin:0 auto;padding:40px 24px 80px;font-size:16px;line-height:1.75;}',
    '.preview-body h1,.preview-body h2,.preview-body h3,.preview-body h4{color:#f4f5f7;font-weight:700;line-height:1.35;margin:1.4em 0 .6em;}',
    '.preview-body h1{font-size:2em;padding-bottom:.35em;border-bottom:1px solid #2a2b32;margin-top:0;}',
    '.preview-body h2{font-size:1.5em;padding-bottom:.3em;border-bottom:1px solid #2a2b32;}',
    '.preview-body h3{font-size:1.2em;}',
    '.preview-body p{margin:.7em 0;}',
    '.preview-body strong{color:#fff;}',
    '.preview-body a{color:#5aa2ef;text-decoration:none;}',
    '.preview-body a:hover{text-decoration:underline;}',
    '.preview-body ul,.preview-body ol{padding-left:1.5em;margin:.6em 0;}',
    '.preview-body li{margin:.25em 0;}',
    '.preview-body li.task-list-item{list-style:none;margin-left:-1.5em;padding-left:1.5em;}',
    '.preview-body input[type="checkbox"]{accent-color:#5aa2ef;margin-right:.5em;}',
    '.preview-body blockquote{margin:.9em 0;padding:.4em 1em;border-left:3px solid #5aa2ef;background:rgba(90,162,239,.14);color:#9a9da6;border-radius:0 6px 6px 0;}',
    '.preview-body hr{border:none;border-top:1px solid #2a2b32;margin:1.8em 0;}',
    '.preview-body table{border-collapse:collapse;margin:1em 0;width:100%;font-size:.92em;}',
    '.preview-body th,.preview-body td{border:1px solid #2a2b32;padding:.5em .8em;text-align:left;}',
    '.preview-body th{background:#212228;color:#f0f1f3;}',
    '.preview-body code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:#26272e;color:#ffb27a;border-radius:4px;padding:.15em .4em;font-size:.88em;}',
    '.preview-body pre{background:#16171c;border:1px solid #2a2b32;border-radius:8px;padding:14px 16px;overflow:auto;margin:1em 0;}',
    '.preview-body pre code{background:none;color:inherit;padding:0;font-size:.88em;line-height:1.6;display:block;}',
    '.hljs-keyword,.hljs-selector-tag,.hljs-literal{color:#c792ea;}',
    '.hljs-string,.hljs-addition{color:#c3e88d;}',
    '.hljs-number{color:#f78c6c;}',
    '.hljs-comment,.hljs-quote{color:#6b6e76;font-style:italic;}',
    '.hljs-title,.hljs-function,.hljs-section{color:#82aaff;}',
    '.hljs-attr,.hljs-attribute,.hljs-symbol{color:#ffcb6b;}',
    '.hljs-tag,.hljs-name,.hljs-selector-id{color:#f07178;}',
    '.hljs-built_in,.hljs-type,.hljs-selector-class{color:#89ddff;}',
    '.hljs-variable,.hljs-params,.hljs-template-variable{color:#eeffff;}',
    '.hljs-meta,.hljs-meta-string,.hljs-deletion{color:#ff5874;}',
    '.hljs-emphasis{font-style:italic;}',
    '.hljs-strong{font-weight:700;}'
  ].join('\n');

  /* ================= Marked + highlight.js setup ================= */
  var renderer = new marked.Renderer();
  renderer.link = function(href, title, text){
    var titleAttr = title ? ' title="' + title + '"' : '';
    return '<a href="' + href + '"' + titleAttr + ' target="_blank" rel="noopener noreferrer">' + text + '</a>';
  };

  marked.setOptions({
    renderer: renderer,
    gfm: true,
    breaks: false,
    headerIds: false,
    mangle: false,
    langPrefix: 'hljs language-',
    highlight: function(code, lang){
      try{
        if (lang && hljs.getLanguage(lang)){
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      }catch(e){
        return code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      }
    }
  });

  /* ================= Elements ================= */
  var editorHost = document.getElementById('editorHost');
  var previewHost = document.getElementById('previewHost');
  var scrollSegment = document.getElementById('scrollSegment');
  var shortcutList = document.getElementById('shortcutList');
  var statsLabel = document.getElementById('statsLabel');
  var workspace = document.getElementById('workspace');
  var paneEditor = document.getElementById('paneEditor');
  var panePreview = document.getElementById('panePreview');
  var divider = document.getElementById('divider');
  var viewSegment = document.getElementById('viewSegment');
  var copyHtmlBtn = document.getElementById('copyHtmlBtn');
  var downloadMdBtn = document.getElementById('downloadMdBtn');
  var downloadHtmlBtn = document.getElementById('downloadHtmlBtn');
  var loadExampleBtn = document.getElementById('loadExampleBtn');
  var clearBtn = document.getElementById('clearBtn');
  var historyBtn = document.getElementById('historyBtn');
  var tempSaveBtn = document.getElementById('tempSaveBtn');
  var historyOverlay = document.getElementById('historyOverlay');
  var historyList = document.getElementById('historyList');
  var historyCloseBtn = document.getElementById('historyCloseBtn');
  var historyClearBtn = document.getElementById('historyClearBtn');

  /* ================= localStorage persistence ================= */
  var LS_AUTOSAVE_KEY = 'mdeditor.autosave.v1';
  var LS_HISTORY_KEY = 'mdeditor.history.v1';
  var HISTORY_LIMIT = 30;
  var HISTORY_MIN_INTERVAL_MS = 60000;

  function lsGet(key){
    try{ return localStorage.getItem(key); }catch(e){ return null; }
  }
  function lsSet(key, value){
    try{ localStorage.setItem(key, value); return true; }catch(e){ return false; }
  }

  function loadAutosave(){ return lsGet(LS_AUTOSAVE_KEY); }
  function saveAutosave(text){ lsSet(LS_AUTOSAVE_KEY, text); }

  function loadHistory(){
    var raw = lsGet(LS_HISTORY_KEY);
    if (!raw) return [];
    try{
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    }catch(e){ return []; }
  }
  function saveHistoryList(arr){ lsSet(LS_HISTORY_KEY, JSON.stringify(arr)); }

  var lastSnapshotTime = 0;
  var lastSnapshotContent = null;

  function maybeTakeSnapshot(force){
    var text = editor.getValue();
    if (!text.trim()) return;
    if (text === lastSnapshotContent) return;
    var now = Date.now();
    if (!force && (now - lastSnapshotTime) < HISTORY_MIN_INTERVAL_MS) return;
    var history = loadHistory();
    history.push({ id: now + '-' + Math.random().toString(36).slice(2, 7), ts: now, content: text });
    if (history.length > HISTORY_LIMIT) history = history.slice(history.length - HISTORY_LIMIT);
    saveHistoryList(history);
    lastSnapshotTime = now;
    lastSnapshotContent = text;
  }
  
  function formatRelativeTime(ts){
    var diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 60) return '방금 전';
    var min = Math.floor(diffSec / 60);
    if (min < 60) return min + '분 전';
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + '시간 전';
    var day = Math.floor(hr / 24);
    if (day < 7) return day + '일 전';
    var d = new Date(ts);
    return (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
  }

  function formatFileTimestamp(ts){
    var d = new Date(ts);
    function pad(n){ return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes());
  }

  function renderHistoryList(){
    var items = loadHistory().slice().reverse();
    historyList.innerHTML = '';
    if (!items.length){
      var empty = document.createElement('div');
      empty.className = 'history-empty';
      empty.textContent = '저장된 히스토리가 없습니다.';
      historyList.appendChild(empty);
      return;
    }
    items.forEach(function(item){
      var row = document.createElement('div');
      row.className = 'history-item';

      var head = document.createElement('div');
      head.className = 'history-item-head';

      var btnGroup = document.createElement('div');
      btnGroup.className = 'history-item-btns';

      var timeEl = document.createElement('div');
      timeEl.className = 'history-item-time';
      timeEl.textContent = formatRelativeTime(item.ts);

      var saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'history-item-save';
      saveBtn.textContent = '저장';
      saveBtn.addEventListener('click', function(e){
        e.stopPropagation();
        var filename = 'markdown-' + formatFileTimestamp(item.ts) + '.md';
        downloadFile(filename, item.content, 'text/markdown;charset=utf-8');
        saveBtn.textContent = '저장됨';
        saveBtn.classList.add('saved');
        setTimeout(function(){
          saveBtn.textContent = '저장';
          saveBtn.classList.remove('saved');
        }, 1200);
      });

      var deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'history-item-delete';
      deleteBtn.textContent = '삭제';
      deleteBtn.addEventListener('click', function(e){
        e.stopPropagation();
        if (confirm('이 히스토리를 삭제할까요?')){
          var history = loadHistory();
          history = history.filter(function(h) { return h.ts !== item.ts; });
          saveHistoryList(history);
          renderHistoryList();
        }
      });

      head.appendChild(timeEl);
      btnGroup.appendChild(saveBtn);
      btnGroup.appendChild(deleteBtn);
      head.appendChild(btnGroup);

      var previewEl = document.createElement('div');
      previewEl.className = 'history-item-preview';
      previewEl.textContent = item.content.slice(0, 90).replace(/\n/g, ' ');

      row.appendChild(head);
      row.appendChild(previewEl);
      row.addEventListener('click', function(){
        if (confirm('이 시점으로 복원할까요? 현재 편집기 내용은 덮어써집니다.')){
          editor.setValue(item.content);
          closeHistoryModal();
          editor.focus();
        }
      });
      historyList.appendChild(row);
    });
  }

  function openHistoryModal(){
    renderHistoryList();
    historyOverlay.hidden = false;
  }
  function closeHistoryModal(){
    historyOverlay.hidden = true;
  }

  tempSaveBtn.addEventListener('click', function(){
    saveAutosave(editor.getValue());
    maybeTakeSnapshot(true);
    alert('임시저장 완료');
  });

  historyBtn.addEventListener('click', openHistoryModal);
  historyCloseBtn.addEventListener('click', closeHistoryModal);
  historyOverlay.addEventListener('click', function(e){
    if (e.target === historyOverlay) closeHistoryModal();
  });
  historyClearBtn.addEventListener('click', function(){
    if (confirm('저장된 히스토리를 모두 삭제할까요?')){
      saveHistoryList([]);
      renderHistoryList();
    }
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && !historyOverlay.hidden) closeHistoryModal();
  });

  window.addEventListener('beforeunload', function(){
    saveAutosave(editor.getValue());
    maybeTakeSnapshot(true);
  });
  document.addEventListener('visibilitychange', function(){
    if (document.visibilityState === 'hidden'){
      saveAutosave(editor.getValue());
      maybeTakeSnapshot(true);
    }
  });

  /* ================= CodeMirror ================= */
  var savedDraft = loadAutosave();
  // The old starter text was auto-saved on first load; update only an untouched copy.
  if (savedDraft === exampleMarkdown.replace('# Hello from Junny', '# Hello from Coddy')){
    savedDraft = exampleMarkdown;
  }
  var initialValue = (savedDraft !== null && savedDraft.trim().length > 0) ? savedDraft : exampleMarkdown;

  // Add or edit a shortcut here; its editor binding and toolbar help share this list.
  var SHORTCUTS = [
    { keys: ['Tab'], display: 'Tab', name: '들여쓰기', description: '커서에는 공백 두 칸을 넣고, 선택한 줄은 들여씁니다.', handler: insertIndent },
    { keys: ['Ctrl-B', 'Cmd-B'], display: 'Ctrl / ⌘ + B', name: '굵게', description: '선택한 글자를 굵게 표시하거나 커서 위치에 표시를 넣습니다.', handler: insertBold },
    { keys: ['Ctrl-['], display: 'Ctrl + [', name: '접기 블록', description: '선택한 내용을 접기 블록으로 감쌉니다.', handler: insertDetailsBlock },
    { keys: ['Ctrl-]'], display: 'Ctrl + ]', name: '코드 블록', description: '선택한 내용을 코드 블록으로 감쌉니다.', handler: insertCodeBlock },
    { keys: ['Ctrl-`'], display: 'Ctrl + `', name: '인라인 코드', description: '선택한 글자를 백틱으로 감쌉니다.', handler: insertHighlightBlock },
    { keys: ['Shift-Enter'], display: 'Shift + Enter', name: '줄바꿈', description: '문단을 유지한 채 줄을 바꿉니다.', handler: insertBRtag },
    { keys: ['Ctrl-S', 'Cmd-S'], display: 'Ctrl / ⌘ + S', name: 'Markdown 저장', description: '현재 내용을 .md 파일로 다운로드합니다.', scope: 'page', handler: function(){ downloadMdBtn.click(); } }
  ];
  var editorKeys = {};
  SHORTCUTS.forEach(function(shortcut){
    if (shortcut.scope !== 'page') shortcut.keys.forEach(function(key){ editorKeys[key] = shortcut.handler; });
    var item = document.createElement('div');
    item.className = 'shortcut-item';
    var name = document.createElement('span');
    name.className = 'shortcut-name';
    name.textContent = shortcut.name;
    var keys = document.createElement('span');
    keys.className = 'shortcut-keys';
    keys.textContent = shortcut.display;
    var description = document.createElement('span');
    description.className = 'shortcut-description';
    description.textContent = shortcut.description;
    item.appendChild(name);
    item.appendChild(keys);
    item.appendChild(description);
    shortcutList.appendChild(item);
  });

  var editor = CodeMirror(editorHost, {
    value: initialValue,
    mode: null,
    lineNumbers: false,
    lineWrapping: true,
    tabSize: 2,
    indentUnit: 2,
    extraKeys: editorKeys
  });

  function insertWrapped(cm, prefix, suffix){
    var selected = cm.getSelection();
    var from = cm.getCursor('from');
    var to = cm.getCursor('to');
    var startIndex = cm.indexFromPos(from);
    cm.operation(function(){
      cm.replaceRange(prefix + selected + suffix, from, to);
      cm.setSelection(
        cm.posFromIndex(startIndex + prefix.length),
        cm.posFromIndex(startIndex + prefix.length + selected.length)
      );
    });
    cm.focus();
  }
  function insertIndent(cm){
    if (cm.somethingSelected()) cm.indentSelection('add');
    else cm.replaceSelection('  ', 'end');
  }
  function insertHighlightBlock(cm) {
    insertWrapped(cm, '`', '`');
  }
  function insertBRtag(cm) {
    cm.replaceSelection('  \n', 'end');
  }
  function insertBold(cm) {
    insertWrapped(cm, '**', '**');
  }
  function insertBlock(cm, opening, closing, blankBeforeClose){
    var selected = cm.getSelection();
    var from = cm.getCursor('from');
    var to = cm.getCursor('to');
    var prefix = (from.ch ? '\n' : '') + opening;
    var suffix = (selected.endsWith('\n') ? '' : '\n') + (blankBeforeClose ? '\n' : '') + closing;
    if (to.ch < cm.getLine(to.line).length) suffix += '\n';
    insertWrapped(cm, prefix, suffix);
  }
  function insertCodeBlock(cm) {
    insertBlock(cm, '```\n', '```', false);
  }

  function insertDetailsBlock(cm) {
    insertBlock(cm, '<details>\n<summary>예제</summary>\n\n', '</details>', true);
  }

  lastSnapshotContent = initialValue;

  function refreshSyntaxHighlight(){
    var viewport = editor.getViewport();
    var inFence = false;

    for (var i = viewport.from; i < viewport.to; i++){
      editor.removeLineClass(i, 'text', 'cm-md-syntax');
      var raw = editor.getLine(i);
      if (!raw) continue;
      var t = raw.replace(/^\s+/, '');
      var special = false;
      var isFence = /^(```|~~~)/.test(t);

      if (isFence){
        special = true;
        inFence = !inFence;
      } else if (!inFence){
        if (/^#{1,6}\s+\S/.test(t)) special = true;
        else if (/^>\s?/.test(t)) special = true;
        else if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(t)) special = true;
        else if (t.indexOf('|') !== -1 && t.length > 1) special = true;
      }

      if (special) editor.addLineClass(i, 'text', 'cm-md-syntax');
    }
  }

  editor.on('scroll', refreshSyntaxHighlight);

  function formatBytes(n){
    if (n < 1024) return n + 'B';
    return (n / 1024).toFixed(1) + 'KB';
  }

  function updateStats(){
    var text = editor.getValue();
    var bytes = new TextEncoder().encode(text).length;
    statsLabel.textContent = editor.lineCount() + '줄 · ' + formatBytes(bytes);
  }

  /* ================= Preview rendering and source positions ================= */
  var previewBlocks = [];
  function renderPreview(){
    var raw = editor.getValue();
    if (!raw.trim()){
      previewHost.innerHTML = '<p class="empty-state">편집기에 마크다운을 입력하면 여기에 미리보기가 표시됩니다.</p>';
      previewBlocks = [];
      return;
    }

    var tokens = marked.lexer(raw);
    var html = marked.parser(tokens);
    var clean = window.DOMPurify ? DOMPurify.sanitize(html) : html;
    previewHost.innerHTML = clean;

    if (window.renderMathInElement) {
      window.renderMathInElement(previewHost, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false}
        ],
        throwOnError: false
      });
    }

    // Each top-level Markdown token corresponds to its rendered top-level elements.
    previewBlocks = [];
    var sourceLine = 0;
    var elementIndex = 0;
    var probe = document.createElement('div');
    tokens.forEach(function(token){
      var startLine = sourceLine;
      var newlines = (token.raw.match(/\n/g) || []).length;
      sourceLine += newlines;
      var endLine = Math.max(startLine, sourceLine - (/\n$/.test(token.raw) ? 1 : 0));
      var single = [token];
      single.links = tokens.links;
      var part = marked.parser(single);
      probe.innerHTML = window.DOMPurify ? DOMPurify.sanitize(part) : part;
      for (var i = 0; i < probe.children.length; i++){
        if (previewHost.children[elementIndex]){
          previewBlocks.push({line: startLine, endLine: endLine, element: previewHost.children[elementIndex]});
        }
        elementIndex++;
      }
    });
  }

  var pendingPreviewScroll = null;
  var pendingEditorScroll = null;

  function scrollEdge(position, maxScroll){
    if (maxScroll <= 2) return null;
    if (position <= 2) return 'top';
    if (maxScroll - position <= 2) return 'bottom';
    return null;
  }

  function setPreviewScroll(target){
    if (Math.abs(previewHost.scrollTop - target) < 1) return;
    pendingPreviewScroll = target;
    previewHost.scrollTop = target;
  }

  function blockTop(block){
    return block.element.getBoundingClientRect().top - previewHost.getBoundingClientRect().top + previewHost.scrollTop;
  }

  function previewPositionForLine(line){
    if (!previewBlocks.length) return null;
    var block = previewBlocks[0];
    for (var i = 1; i < previewBlocks.length && previewBlocks[i].line <= line; i++){
      block = previewBlocks[i];
    }
    var progress = Math.max(0, Math.min(1, (line - block.line) / Math.max(1, block.endLine - block.line + 1)));
    return blockTop(block) + progress * block.element.getBoundingClientRect().height;
  }

  function scrollPreviewToLine(line, viewportFraction){
    if (currentMode !== 'split') return;
    var position = previewPositionForLine(line);
    if (position === null) return;
    var maxScroll = previewHost.scrollHeight - previewHost.clientHeight;
    var target = Math.max(0, Math.min(maxScroll, position - viewportFraction * previewHost.clientHeight));
    setPreviewScroll(target);
  }

  function syncPreviewToCursor(){
    if (currentMode !== 'split') return;
    if (scrollSyncEnabled){
      var info = editor.getScrollInfo();
      var edge = scrollEdge(info.top, info.height - info.clientHeight);
      if (edge){
        setPreviewScroll(edge === 'top' ? 0 : Math.max(0, previewHost.scrollHeight - previewHost.clientHeight));
        return;
      }
    }
    var cursorTop = editor.cursorCoords(null, 'page').top;
    var editorRect = editor.getWrapperElement().getBoundingClientRect();
    var fraction = Math.max(0, Math.min(1, (cursorTop - editorRect.top) / editorRect.height));
    scrollPreviewToLine(editor.getCursor().line, fraction);
  }

  function syncPreviewFromEditorScroll(){
    if (!scrollSyncEnabled || currentMode !== 'split') return;
    if (pendingEditorScroll !== null && Math.abs(editor.getScrollInfo().top - pendingEditorScroll) < 2){
      pendingEditorScroll = null;
      return;
    }
    var info = editor.getScrollInfo();
    var edge = scrollEdge(info.top, info.height - info.clientHeight);
    if (edge){
      setPreviewScroll(edge === 'top' ? 0 : Math.max(0, previewHost.scrollHeight - previewHost.clientHeight));
      return;
    }
    var line = editor.lineAtHeight(info.top + info.clientHeight / 2, 'local');
    scrollPreviewToLine(line, 0.5);
  }

  previewHost.addEventListener('scroll', function(){
    if (!scrollSyncEnabled || currentMode !== 'split') return;
    if (pendingPreviewScroll !== null && Math.abs(previewHost.scrollTop - pendingPreviewScroll) < 2){
      pendingPreviewScroll = null;
      return;
    }
    var previewEdge = scrollEdge(previewHost.scrollTop, previewHost.scrollHeight - previewHost.clientHeight);
    if (previewEdge){
      var edgeInfo = editor.getScrollInfo();
      var edgeTarget = previewEdge === 'top' ? 0 : Math.max(0, edgeInfo.height - edgeInfo.clientHeight);
      if (Math.abs(edgeInfo.top - edgeTarget) >= 1){
        pendingEditorScroll = edgeTarget;
        editor.scrollTo(null, edgeTarget);
      }
      return;
    }
    if (!previewBlocks.length) return;
    var middle = previewHost.scrollTop + previewHost.clientHeight / 2;
    var block = previewBlocks[0];
    for (var i = 1; i < previewBlocks.length && blockTop(previewBlocks[i]) <= middle; i++){
      block = previewBlocks[i];
    }
    var height = Math.max(1, block.element.getBoundingClientRect().height);
    var progress = Math.max(0, Math.min(1, (middle - blockTop(block)) / height));
    var line = Math.min(editor.lineCount() - 1, block.line + Math.round(progress * (block.endLine - block.line)));
    var info = editor.getScrollInfo();
    var target = Math.max(0, Math.min(info.height - info.clientHeight,
      editor.heightAtLine(line, 'local') - info.clientHeight / 2));
    if (Math.abs(info.top - target) < 1) return;
    pendingEditorScroll = target;
    editor.scrollTo(null, target);
  });

  editor.on('scroll', syncPreviewFromEditorScroll);
  var scrollSyncEnabled = true;
  scrollSegment.addEventListener('click', function(e){
    var button = e.target.closest('[data-sync]');
    if (!button) return;
    scrollSyncEnabled = button.getAttribute('data-sync') === 'on';
    Array.prototype.forEach.call(scrollSegment.querySelectorAll('[data-sync]'), function(item){
      var active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    pendingPreviewScroll = null;
    pendingEditorScroll = null;
    if (scrollSyncEnabled) syncPreviewToCursor();
  });

  var scheduleTimer = null;
  function scheduleUpdate(){
    clearTimeout(scheduleTimer);
    scheduleTimer = setTimeout(function(){
      refreshSyntaxHighlight();
      updateStats();
      renderPreview();
      syncPreviewToCursor();
      saveAutosave(editor.getValue());
      maybeTakeSnapshot(false);
    }, 200);
  }

  editor.on('changes', scheduleUpdate);
  scheduleUpdate();
  renderPreview();

  /* ================= View mode tabs ================= */
  var currentMode = 'split';
  var splitRatio = 50;

  function applyLayout(){
    if (currentMode === 'editor'){
      panePreview.style.display = 'none';
      divider.style.display = 'none';
      paneEditor.style.display = 'flex';
      paneEditor.style.flex = '1 1 auto';
    } else if (currentMode === 'preview'){
      paneEditor.style.display = 'none';
      divider.style.display = 'none';
      panePreview.style.display = 'flex';
      panePreview.style.flex = '1 1 auto';
    } else {
      paneEditor.style.display = 'flex';
      panePreview.style.display = 'flex';
      divider.style.display = 'block';
      paneEditor.style.flex = '0 0 ' + splitRatio + '%';
      panePreview.style.flex = '1 1 auto';
    }
    editor.refresh();
    if (currentMode === 'split' && scrollSyncEnabled) syncPreviewToCursor();
  }

  viewSegment.addEventListener('click', function(e){
    var btn = e.target.closest('.seg-btn');
    if (!btn) return;
    currentMode = btn.getAttribute('data-mode');
    Array.prototype.forEach.call(viewSegment.querySelectorAll('.seg-btn'), function(b){
      b.classList.toggle('active', b === btn);
    });
    applyLayout();
  });

  applyLayout();

  /* ================= Divider drag-to-resize ================= */
  var dragging = false;

  divider.addEventListener('pointerdown', function(e){
    if (currentMode !== 'split') return;
    dragging = true;
    divider.classList.add('dragging');
    divider.setPointerCapture(e.pointerId);
  });

  divider.addEventListener('pointermove', function(e){
    if (!dragging) return;
    var rect = workspace.getBoundingClientRect();
    var pct = ((e.clientX - rect.left) / rect.width) * 100;
    pct = Math.max(20, Math.min(80, pct));
    splitRatio = pct;
    paneEditor.style.flex = '0 0 ' + splitRatio + '%';
  });

  function endDrag(){
    dragging = false;
    divider.classList.remove('dragging');
    editor.refresh();
    if (scrollSyncEnabled) syncPreviewToCursor();
  }
  divider.addEventListener('pointerup', endDrag);
  divider.addEventListener('pointercancel', endDrag);

  /* ================= Toolbar actions ================= */

  function deriveTitle(text){
    var lines = text.split('\n');
    var firstLine = '';
    for (var i = 0; i < lines.length; i++){
      var t = lines[i].trim();
      if (t){ firstLine = t; break; }
    }
    firstLine = firstLine.replace(/^#+\s*/, '');
    firstLine = firstLine.replace(/[\\/:*?"<>|]/g, '');
    firstLine = firstLine.replace(/\s+/g, ' ').trim();
    if (firstLine.length > 80) firstLine = firstLine.slice(0, 80).trim();
    return firstLine || 'document';
  }
 
  function deriveFilename(ext){
    return deriveTitle(editor.getValue()) + '.' + ext;
  }

  function downloadFile(filename, content, mime){
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  }

  downloadMdBtn.addEventListener('click', function(){
    downloadFile(deriveFilename('md'), editor.getValue(), 'text/markdown;charset=utf-8');
  });

  /* ================= 🛠️ 수정한 부분: HTML 다운로드 파일에 KaTeX CSS 추가 ================= */
  downloadHtmlBtn.addEventListener('click', function(){
    var doc = '<!DOCTYPE html>\n' +
      '<html lang="ko">\n<head>\n<meta charset="UTF-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
      '<title>Markdown Export</title>\n' +
      '<link rel="stylesheet" href="[https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css](https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css)">\n' + // 수식 스타일 깨짐 방지용 CSS 추가
      '<style>\n' + EXPORT_CSS + '\n</style>\n</head>\n<body>\n' +
      '<article class="preview-body">\n' + previewHost.innerHTML + '\n</article>\n</body>\n</html>';
    downloadFile(deriveFilename('html'), doc, 'text/html;charset=utf-8');
  });
  /* ====================================================================================== */

  function fallbackCopy(text){
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try{ document.execCommand('copy'); }catch(e){}
    document.body.removeChild(ta);
  }

  function showCopied(){
    copyHtmlBtn.textContent = '복사됨';
    copyHtmlBtn.classList.add('copied');
    setTimeout(function(){
      copyHtmlBtn.textContent = 'HTML 복사';
      copyHtmlBtn.classList.remove('copied');
    }, 1400);
  }

  copyHtmlBtn.addEventListener('click', function(){
    var html = previewHost.innerHTML;
    if (navigator.clipboard && window.isSecureContext){
      navigator.clipboard.writeText(html).then(showCopied).catch(function(){
        fallbackCopy(html);
        showCopied();
      });
    } else {
      fallbackCopy(html);
      showCopied();
    }
  });

  loadExampleBtn.addEventListener('click', function(){
    editor.setValue(exampleMarkdown);
    editor.focus();
  });

  clearBtn.addEventListener('click', function(){
    if (!editor.getValue().trim() || confirm('편집기 내용을 모두 지울까요?')){
      editor.setValue('');
      editor.focus();
    }
  });

  document.addEventListener('keydown', function(e){
    if (e.altKey || e.shiftKey || !(e.ctrlKey || e.metaKey)) return;
    var key = (e.metaKey ? 'Cmd-' : 'Ctrl-') + e.key.toUpperCase();
    SHORTCUTS.forEach(function(shortcut){
      if (shortcut.scope === 'page' && shortcut.keys.indexOf(key) !== -1){
        e.preventDefault();
        shortcut.handler();
      }
    });
  });

  /* ================= PDF Maker 연동 ================= */
  var sendToPdfBtn = document.getElementById('sendToPdfBtn');
  if(sendToPdfBtn) {
    sendToPdfBtn.addEventListener('click', function() {
      localStorage.setItem('pdfMakerTransfer', editor.getValue());
      window.open('pdf-maker.html', '_blank'); 
    });
  }
})();
