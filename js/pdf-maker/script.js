document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const sourceContent = $('sourceContent');
  const previewContainer = $('pdfPreviewContainer');
  const popup = $('tocActionPopup');
  const draftKey = 'pdfmaker.draft.v1';
  const templates = window.PdfTemplates;
  const htmlStyles = window.PdfHtmlStyles;
  const settingIds = ['colorTheme', 'preserveHtmlCss', 'fontSize', 'globalLineHeight', 'enableHeaderFooter',
    'headerTitleInput', 'footerAuthorInput', 'marginTop', 'marginBottom', 'marginLeft',
    'marginRight', 'coverTitleInput', 'coverSubtitleInput', 'coverBgStyle', 'coverBgInput', 'coverImgInput',
    'coverImageFit', 'coverImageOpacity', 'coverFilterColor', 'coverFilterOpacity', 'removeHtmlBackground', 'tocTitleInput', 'tocNumbering'];
  const limits = { fontSize: [6, 36], globalLineHeight: [1, 3],
    coverImageOpacity: [0, 100], coverFilterOpacity: [0, 100], marginTop: [0, 50], marginBottom: [0, 50], marginLeft: [0, 50], marginRight: [0, 50] };
  let importedStyles = { css: [], attributes: {}, missing: [], available: false };
  let settings = Object.fromEntries(settingIds.map(id => [id, $(id).type === 'checkbox' ? $(id).checked : $(id).value]));
  const defaultSettings = { ...settings };
  let activeCodeId = null, activeEditKind = 'block', pendingConfirmation = null;
  let history = [], inputGroup = null, selectedId = null, selectedPreset = null;
  let tocEditor = null;
  let mode = 'normal', activeTocId = null, activeEditId = null;
  let renderTimer, saveTimer, scaledCount = 0, serial = 0;
  let storageFailed = false;
  let documentVersion = 0, loadRequest = 0, imageRequest = 0;
  let coverImageProbe = null;
  let committedPrint = false, printPreparing = false;
  let pendingDesign = null, deferredDesignAction = null, replayDesignAction = false;
  let designHeadingNumbers = new Map(), designFigureNumbers = new Map();
  let activeTableId = null, tableEditCell = null;
  const uid = prefix => prefix + '-' + Date.now() + '-' + (++serial);
  const clean = html => DOMPurify.sanitize(html, { FORBID_ATTR: ['contenteditable'] });
  const parseMarkdown = markdown => window.PdfMath ? PdfMath.parse(markdown) : marked.parse(markdown);
  function safeDocumentHtml(html) {
    const staging = document.createElement('div'); staging.innerHTML = html;
    return clean(window.PdfMath ? PdfMath.sourceHtml(staging) : html);
  }
  const localDate = () => {
    const date = new Date();
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  };
  const textNode = (tag, text, className) => {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const blockById = id => Array.from(sourceContent.children).find(block => block.dataset.blockId === id);
  const elementById = id => Array.from(sourceContent.querySelectorAll('[data-element-id]')).find(node => node.dataset.elementId === id);
  function resetLineHeight(source) {
    if ('pdfOriginalLineHeight' in source.dataset) {
      source.style.lineHeight = source.dataset.pdfOriginalLineHeight;
      delete source.dataset.pdfOriginalLineHeight;
    } else if (source.dataset.pdfLineHeight) source.style.removeProperty('line-height');
    delete source.dataset.pdfLineHeight;
  }
  function hiddenInSource(node) {
    for (let current = node; current && current !== sourceContent; current = current.parentElement) {
      if (current.hidden || current.style.display === 'none') return true;
    }
    return false;
  }
  function documentHtml() {
    const html = window.PdfMath ? PdfMath.sourceHtml(sourceContent) : sourceContent.innerHTML;
    return window.PdfImages ? PdfImages.snapshotHtml(html) : html;
  }
  const snapshot = () => ({ html: documentHtml(), settings: { ...settings }, title: document.title, importedStyles });
  const updateUndo = () => {
    $('undoBtn').disabled = history.length === 0;
    $('undoCount').textContent = history.length;
  };
  function saveHistory(group = null) {
    if (group && inputGroup === group) return;
    const state = snapshot();
    if (JSON.stringify(history[history.length - 1]) !== JSON.stringify(state)) history.push(state);
    if (history.length > 30) history.shift();
    inputGroup = group;
    updateUndo();
  }
  function confirmDocument(message) {
    if (pendingConfirmation) return Promise.resolve(false);
    $('confirmDocumentMessage').textContent = message;
    $('confirmDocumentDialog').showModal();
    return new Promise(resolve => { pendingConfirmation = resolve; });
  }
  function finishConfirmation(accepted) {
    const resolve = pendingConfirmation;
    pendingConfirmation = null;
    $('confirmDocumentDialog').close();
    resolve?.(accepted);
  }
  $('cancelDocumentActionBtn').addEventListener('click', () => finishConfirmation(false));
  $('confirmDocumentActionBtn').addEventListener('click', () => finishConfirmation(true));
  $('confirmDocumentDialog').addEventListener('cancel', event => { event.preventDefault(); finishConfirmation(false); });
  function hasDocument() { return sourceContent.children.length > 0; }
  function resetDocument() {
    pendingDesign = null;
    closeImageEditor();
    $('imageLoadNotice').hidden = true;
    documentVersion++;
    loadRequest++;
    imageRequest++;
    coverImageProbe = null;
    $('coverImageStatus').textContent = '';
    clearTimeout(renderTimer);
    clearTimeout(saveTimer);
    if ($('blockEditDialog').open) $('blockEditDialog').close();
    activeEditId = activeCodeId = null;
    if ($('tocEditDialog').open) $('tocEditDialog').close();
    tocEditor = null;
    sourceContent.replaceChildren();
    settings = { ...defaultSettings };
    importedStyles = { css: [], attributes: {}, missing: [], available: false };
    history = [];
    inputGroup = null;
    document.title = 'pdf-maker';
    clearSelection();
    setMode('normal');
    updateUndo();
  }
  $('discardDocumentBtn').addEventListener('click', async () => {
    if (!hasDocument() || !await confirmDocument('모든 작업을 버리고 초기 화면으로 돌아갑니다. 계속하시겠습니까?')) return;
    resetDocument();
    applySettings();
    paginate();
    persist();
  });
  function persist() {
    clearTimeout(saveTimer);
    try {
      const state = snapshot();
      localStorage.setItem(draftKey, JSON.stringify(state));
      window.PdfImages?.releaseUnused([state.html, ...history.map(item => item.html)]);
      storageFailed = false;
    } catch (error) {
      storageFailed = true;
      $('documentStatus').textContent = '자동 저장 공간이 부족하거나 사용할 수 없습니다.';
      console.error(error);
    }
  }
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 250);
  }
  function applySettings(syncInputs = true) {
    if (syncInputs) settingIds.forEach(id => {
      const input = $(id);
      if (input.type === 'checkbox') input.checked = Boolean(settings[id]);
      else input.value = settings[id];
    });
    ['Top', 'Bottom', 'Left', 'Right'].forEach(side => {
      document.documentElement.style.setProperty('--page-margin-' + side.toLowerCase(), settings['margin' + side] + 'mm');
    });
    $('coverConfigPanel').hidden = !sourceContent.querySelector('.cover-page');
    const preserve = settings.preserveHtmlCss && importedStyles.available;
    $('preserveHtmlCss').disabled = !importedStyles.available;
    $('removeHtmlBackground').disabled = !preserve;
    $('coverCustomCssGroup').hidden = settings.coverBgStyle !== 'custom';
    $('fontSize').disabled = preserve;
    $('globalLineHeight').disabled = preserve;
    $('htmlCssStatus').textContent = (importedStyles.available ?
      (preserve ? '원본 글꼴과 디자인을 유지합니다. 템플릿은 표지와 목차에 적용됩니다.' : '선택한 문서 템플릿을 적용합니다.') :
      'HTML의 스타일·인라인 CSS를 지원합니다. 별도 CSS 파일은 함께 선택하세요.') +
      (importedStyles.missing?.length ? ' · 불러오지 못한 CSS: ' + importedStyles.missing.join(', ') + ' (CSS 파일을 HTML과 함께 선택하세요)' : '');
    $('templateDescription').textContent = templates.themes[settings.colorTheme].description;
    htmlStyles.mount(importedStyles, preserve);
  }
  function normalizeSettings(values) {
    const next = { ...settings };
    settingIds.forEach(id => {
      if (!(id in values)) return;
      if (id in limits) {
        const value = Number(values[id]);
        if (Number.isFinite(value) && values[id] !== '') next[id] = Math.max(limits[id][0], Math.min(limits[id][1], value));
      } else if ($(id).type === 'checkbox') next[id] = values[id] === true;
      else if (id === 'colorTheme') next[id] = values[id] === 'tech' ? 'dev' :
        (values[id] in templates.themes ? values[id] : 'modern');
      else next[id] = String(values[id]);
    });
    if (!('coverBgStyle' in values) && values.coverBgInput) next.coverBgStyle = 'custom';
    if (!('coverTitleInput' in values) && 'colorTheme' in values && 'headerTitleInput' in values) next.coverTitleInput = values.headerTitleInput || document.title;
    return next;
  }
  function normalizeContent() {
    SharedCodeBlocks.normalize(sourceContent);
    sourceContent.querySelectorAll('[data-design-auto-number]').forEach(node => { delete node.dataset.designAutoNumber; delete node.dataset.designNumber; });
    sourceContent.querySelectorAll('[data-style] > figcaption').forEach(node => { delete node.dataset.designNumber;delete node.dataset.designSource; });
    sourceContent.querySelectorAll('[data-style]').forEach(node => {
      if (templates.designIds.has(node.dataset.style) && !templates.validDesign(node,node.dataset.style)) templates.writeDesign(node,'default');
    });
    // Plain HTML text and the Markdown editor's exported article must also paginate.
    const exported = sourceContent.querySelector(':scope > article.preview-body');
    if (exported) exported.replaceWith(...exported.childNodes);
    Array.from(sourceContent.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) node.replaceWith(textNode('p', node.textContent));
    });
    const usedIds = new Set();
    Array.from(sourceContent.children).forEach(block => {
      if (!block.dataset.blockId || usedIds.has(block.dataset.blockId)) block.dataset.blockId = uid('block');
      usedIds.add(block.dataset.blockId);
    });
    const headingIds = new Set();
    const elementIds = new Set();
    sourceContent.querySelectorAll(templates.selector).forEach(node => {
      if (!node.dataset.elementId || elementIds.has(node.dataset.elementId)) node.dataset.elementId = uid('element');
      elementIds.add(node.dataset.elementId);
    });
    sourceContent.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(heading => {
      if (heading.closest('.cover-page,.toc-wrapper')) return;
      if (!heading.dataset.headingId || headingIds.has(heading.dataset.headingId)) heading.dataset.headingId = uid('heading');
      headingIds.add(heading.dataset.headingId);
    });
    if (sourceContent.querySelector('img[data-image-asset]')) restoreBodyImages();
  }
  function renderMath(root = sourceContent) {
    if (window.renderMathInElement) window.renderMathInElement(root, {
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false }, { left: '\\[', right: '\\]', display: true }],
      ignoredClasses: ['pdf-math', 'katex', 'katex-display'],
      throwOnError: false
    });
    window.PdfMath?.render(sourceContent);
  }
  function requestPaginate() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(paginate, 100);
  }
  function hidePopup() {
    popup.hidden = true;
    activeTocId = null;
  }
  function clearSelection() {
    selectedId = null;
    selectedPreset = null;
    $('rightPanel').style.display = 'none';
    previewContainer.querySelectorAll('.selected-element').forEach(node => node.classList.remove('selected-element'));
  }
  function setMode(next) {
    mode = next;
    previewContainer.classList.toggle('edit-break-mode', mode === 'break' || mode === 'breakCancel');
    previewContainer.classList.toggle('edit-delete-mode', mode === 'delete');
    $('toggleBreakMode').classList.toggle('active', mode === 'break');
    $('toggleBreakCancelMode').classList.toggle('active', mode === 'breakCancel');
    $('toggleDeleteMode').classList.toggle('active', mode === 'delete');
    $('interactionHelpText').textContent = mode === 'break' ? '요소를 클릭하면 그 앞에서 페이지를 나눕니다.' :
      mode === 'breakCancel' ? '강제 페이지 자르기를 해제할 요소를 클릭하세요.' :
      mode === 'delete' ? '제거할 요소를 클릭하세요. 되돌리기로 복구할 수 있습니다.' :
        '일반 모드: 더블클릭으로 편집 · 파일 드래그 앤 드롭';
    hidePopup();
  }
  function createPage(cover = false, original = true) {
    const page = document.createElement('div');
    page.className = 'pdf-page A4' + (cover ? ' cover-page-wrapper' : '');
    page.dataset.theme = settings.colorTheme;
    if (settings.enableHeaderFooter && !cover) {
      page.classList.add('with-header-footer');
      const header = document.createElement('div');
      header.className = 'pdf-header';
      header.append(textNode('span', settings.headerTitleInput || document.title), textNode('span', settings.footerAuthorInput));
      const footer = document.createElement('div');
      footer.className = 'pdf-footer';
      footer.append(textNode('span', localDate(), 'footer-date'), textNode('span', '', 'page-num-slot'));
      page.append(header, footer);
    }
    const content = document.createElement('div');
    content.className = 'pdf-content';
    const preserve = settings.preserveHtmlCss && importedStyles.available && !cover && original;
    htmlStyles.decorateRoot(content, importedStyles, preserve);
    if (!preserve) {
      content.style.fontSize = settings.fontSize + 'pt';
      content.style.lineHeight = settings.globalLineHeight;
    }
    content.style.setProperty('--document-font-size', settings.fontSize + 'pt');
    content.style.setProperty('--document-line-height', settings.globalLineHeight);
    page.append(content);
    previewContainer.append(page);
    if (preserve) htmlStyles.pageBackground(page, content, settings.removeHtmlBackground);
    const style = getComputedStyle(page);
    const capacity = page.getBoundingClientRect().height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    content.style.setProperty('height', Math.max(1, capacity) + 'px', 'important');
    content.style.setProperty('--page-content-height', Math.max(1, capacity) + 'px');
    return { page, content };
  }
  const fits = content => content.scrollHeight <= content.clientHeight + 1 && content.scrollWidth <= content.clientWidth + 1;
  function openDetails(node) {
    if (node.tagName === 'DETAILS') node.open = true;
    node.querySelectorAll('details').forEach(detail => { detail.open = true; });
    return node;
  }
  function preparePreview(node) {
    node = htmlStyles.prepare(node, settings.preserveHtmlCss && importedStyles.available);
    window.PdfImages?.decorate(node);
    if (pendingDesign && !committedPrint) [node, ...node.querySelectorAll('[data-element-id]')].forEach(element => {
      if (element.dataset.elementId !== pendingDesign.id) return;
      ['style-preset-default', 'style-preset-highlight', 'style-preset-bordered', 'style-preset-card'].forEach(name => element.classList.remove(name));
      templates.writeDesign(element, pendingDesign.preset, pendingDesign.options);
    });
    [node, ...node.querySelectorAll('[data-style]')].forEach(element => {
      if (['heading-chapter','heading-index'].includes(element.dataset.style) && !element.dataset.designNumber)
        element.dataset.designNumber = designHeadingNumbers.get(element.dataset.elementId) || '';
      if (element.dataset.style === 'figure-book' && !element.dataset.designNumber)
        element.dataset.designNumber = designFigureNumbers.get(element.dataset.elementId) || '';
      if (element.dataset.style === 'figure-side') element.dataset.designNarrow = String(794 - 3.7795 * (Number(settings.marginLeft) + Number(settings.marginRight)) < 420);
    });
    templates.prepareDesign(node);
    return node;
  }
  function sliceBlock(block, start, end, total) {
    const range = document.createRange();
    range.selectNodeContents(block);
    let offset = 0;
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const next = offset + node.textContent.length;
      if (start > 0 && start >= offset && start < next) range.setStart(node, start - offset);
      if (end < total && end > offset && end <= next) { range.setEnd(node, end - offset); break; }
      offset = next;
    }
    const fragment = block.cloneNode(false);
    let contents = range.cloneContents();
    let ancestor = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE ?
      range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    // A range wholly inside one text/span omits its ancestors. Retain code and
    // syntax spans in middle page fragments, including multiline strings/comments.
    while (ancestor && ancestor !== block && block.contains(ancestor)) {
      const shell = ancestor.cloneNode(false);
      shell.append(contents);
      contents = shell;
      ancestor = ancestor.parentElement;
    }
    fragment.append(contents);
    fragment.classList.remove('page-break-before');
    fragment.dataset.fragment = 'true';
    fragment.dataset.designContinuation = String(start > 0);
    if (fragment.tagName === 'PRE') fragment.dataset.codeLineOffset = String((block.textContent.slice(0,start).match(/\n/g) || []).length);
    fragment.dataset.manualBreak = String(start === 0 && block.classList.contains('page-break-before'));
    if (fragment.tagName === 'OL') {
      const first = fragment.querySelector(':scope > li');
      if (first?.dataset.listIndex) fragment.start = Number(block.getAttribute('start') || (block.reversed ? block.children.length : 1)) + (block.reversed ? -1 : 1) * Number(first.dataset.listIndex);
    }
    return openDetails(preparePreview(fragment));
  }
  function tableChunk(table, rows, first) {
    const clone = table.cloneNode(false);
    clone.classList.remove('page-break-before');
    clone.dataset.fragment = 'true';
    Array.from(table.children).filter(node => ['COLGROUP', 'THEAD'].includes(node.tagName) || (first && node.tagName === 'CAPTION'))
      .forEach(node => clone.append(node.cloneNode(true)));
    const body = document.createElement('tbody');
    rows.forEach(row => body.append(row.cloneNode(true)));
    clone.append(body);
    return preparePreview(clone);
  }
  function paginate() {
    clearTimeout(renderTimer);
    hidePopup();
    previewContainer.replaceChildren();
    synchronizeToc();
    designHeadingNumbers = new Map(); designFigureNumbers = new Map();
    const designCounters = [0,0,0,0,0,0];
    const tocNumbers = new Map(Array.from(sourceContent.querySelectorAll('.toc-item[data-heading-target]')).map(item => [item.dataset.headingTarget,item.querySelector('.toc-number')?.textContent.trim()]));
    sourceContent.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(heading => {
      if (heading.closest('.cover-page,.toc-wrapper') || hiddenInSource(heading)) return;
      const level = Number(heading.tagName.slice(1)); designCounters[level-1]++; designCounters.fill(0,level);
      const first = designCounters.findIndex(n => n > 0);
      designHeadingNumbers.set(heading.dataset.elementId,templates.hasHeadingNumber(heading) ? '' : tocNumbers.get(heading.dataset.headingId) || designCounters.slice(first,level).map(n=>n || 1).join('.'));
    });
    let figureNumber = 0;
    sourceContent.querySelectorAll('figure').forEach(figure => { if (!hiddenInSource(figure) && !figure.closest('.cover-page')) designFigureNumbers.set(figure.dataset.elementId,String(++figureNumber)); });
    scaledCount = 0;
    $('discardDocumentBtn').disabled = !hasDocument();
    const visible = Array.from(sourceContent.children).filter(block => !hiddenInSource(block));
    if (!visible.length) {
      previewContainer.append(textNode('p', '문서가 비어 있습니다. .md 또는 .html 파일을 열어주세요.', 'placeholder-box'));
      $('downloadPdfBtn').disabled = true;
      $('documentStatus').textContent = '빈 문서';
      scheduleSave();
      return;
    }
    $('downloadPdfBtn').disabled = printPreparing;
    let current = null, inToc = false;
    const newPage = () => (current = createPage(false, !inToc));
    const ensurePage = () => current || newPage();
    const tryAppend = node => {
      if (!node.classList.contains('cover-page')) preparePreview(node);
      ensurePage().content.append(openDetails(node));
      if (fits(current.content)) return true;
      node.remove();
      return false;
    };
    function fitAtomic(node) {
      if (!node.classList.contains('cover-page')) preparePreview(node);
      const content = ensurePage().content;
      content.append(node);
      const style = getComputedStyle(node);
      openDetails(node);
      const rect = node.getBoundingClientRect();
      const height = Math.max(rect.height, node.scrollHeight) +
        (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
      const width = Math.max(rect.width, node.scrollWidth);
      const scale = Math.min(1, content.clientHeight / Math.max(1, height + 2), content.clientWidth / Math.max(1, width));
      node.remove();
      const wrapper = document.createElement('div');
      wrapper.className = 'scaled-block';
      wrapper.dataset.blockId = node.dataset.blockId;
      wrapper.dataset.fragment = 'true';
      wrapper.style.height = Math.ceil(height * scale) + 'px';
      node.style.width = rect.width + 'px';
      node.style.transform = 'scale(' + scale + ')';
      node.style.transformOrigin = 'top left';
      wrapper.append(node);
      content.append(wrapper);
      scaledCount++;
    }
    function splitText(block) {
      const total = block.textContent.length;
      // Keep formula and figure geometry intact, including the image's caption.
      if (!total || block.matches('.katex,img,svg,figure,video,canvas,iframe') || block.querySelector('.katex')) {
        fitAtomic(block.cloneNode(true));
        return;
      }
      const prepared = block.cloneNode(true);
      if (prepared.tagName === 'OL') Array.from(prepared.children).forEach((li, i) => { li.dataset.listIndex = String(i); });
      let start = 0;
      while (start < total) {
        let low = start, high = total;
        while (low < high) {
          const mid = Math.ceil((low + high) / 2);
          const candidate = sliceBlock(prepared, start, mid, total);
          ensurePage().content.append(candidate);
          const ok = fits(current.content);
          candidate.remove();
          if (ok) low = mid;
          else high = mid - 1;
        }
        if (low === start && current.content.children.length) { newPage(); continue; }
        if (low === start) {
          fitAtomic(sliceBlock(prepared, start, total, total));
          return;
        }
        let end = low;
        if (end < total) {
          const chunk = prepared.textContent.slice(start, end);
          const boundary = Math.max(chunk.lastIndexOf('\n'), chunk.lastIndexOf(' '));
          if (boundary > chunk.length * 0.6) end = start + boundary + 1;
          const code = prepared.textContent.charCodeAt(end);
          if (code >= 0xDC00 && code <= 0xDFFF) end--;
          if (end <= start) { fitAtomic(sliceBlock(prepared, start, total, total)); return; }
        }
        current.content.append(sliceBlock(prepared, start, end, total));
        start = end;
        if (start < total) newPage();
      }
    }
    function splitTable(table) {
      const rows = Array.from(table.tBodies).flatMap(body => Array.from(body.rows));
      if (!rows.length || Array.from(table.querySelectorAll('td,th')).some(cell => cell.rowSpan > 1)) {
        fitAtomic(table.cloneNode(true));
        return;
      }
      let chunk = [], first = true;
      rows.forEach(row => {
        const candidate = tableChunk(table, [...chunk, row], first);
        const previous = current.content.lastElementChild;
        if (chunk.length) previous.remove();
        current.content.append(candidate);
        if (fits(current.content)) { chunk.push(row); return; }
        candidate.remove();
        if (chunk.length) {
          current.content.append(tableChunk(table, chunk, first));
          newPage();
          first = false;
        }
        chunk = [row];
        const single = tableChunk(table, chunk, first);
        if (!tryAppend(single)) {
          if (current.content.children.length) newPage();
          if (tryAppend(single)) return;
          fitAtomic(single);
          chunk = [];
          current = null;
          first = false;
        }
        ensurePage();
      });
      if (table.tFoot) {
        const foot = table.cloneNode(false);
        foot.dataset.fragment = 'true';
        foot.append(table.tFoot.cloneNode(true));
        if (!tryAppend(foot)) { newPage(); if (!tryAppend(foot)) fitAtomic(foot); }
      }
    }
    function splitToc(toc) {
      const entries = Array.from(toc.querySelectorAll(':scope > .toc-item')).filter(item => !item.hidden);
      if (!entries.length) { splitText(toc); return; }
      const heading = toc.querySelector(':scope > h2');
      const makeChunk = items => {
        const fragment = toc.cloneNode(false);
        fragment.classList.remove('page-break-before');
        fragment.dataset.fragment = 'true';
        if (heading) fragment.append(heading.cloneNode(true));
        items.forEach(item => fragment.append(item.cloneNode(true)));
        return fragment;
      };
      let chunk = [];
      entries.forEach(item => {
        if (chunk.length) current.content.lastElementChild.remove();
        const candidate = makeChunk([...chunk, item]);
        current.content.append(candidate);
        if (fits(current.content)) { chunk.push(item); return; }
        candidate.remove();
        if (chunk.length) {
          current.content.append(makeChunk(chunk));
          newPage();
        }
        chunk = [item];
        const single = makeChunk(chunk);
        if (!tryAppend(single)) {
          fitAtomic(single);
          chunk = [];
          current = null;
        }
        ensurePage();
      });
    }
    visible.forEach(block => {
      if (block.classList.contains('cover-page')) {
        current = createPage(true);
        const cover = block.cloneNode(true);
        if (!tryAppend(cover)) fitAtomic(cover);
        current = null;
        return;
      }
      const section = block.classList.contains('toc-wrapper');
      inToc = section;
      if ((section || block.classList.contains('page-break-before')) && current?.content.children.length) current = null;
      const clone = block.cloneNode(true);
      clone.dataset.manualBreak = String(block.classList.contains('page-break-before'));
      clone.classList.remove('page-break-before');
      if (!tryAppend(clone)) {
        // Measure the whole block in the same width/typography as its destination.
        current.content.append(clone);
        const style = getComputedStyle(clone);
        const height = Math.max(clone.getBoundingClientRect().height, clone.scrollHeight) +
          (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
        clone.remove();
        const splittable = !section && Boolean(block.textContent.length) &&
          !block.matches('img,svg,figure,video,canvas,iframe') && !block.querySelector('.katex') &&
          (block.tagName !== 'TABLE' || !Array.from(block.querySelectorAll('td,th')).some(cell => cell.rowSpan > 1));
        const large = height >= current.content.clientHeight * .3;
        if (current.content.children.length && (!large || !splittable)) newPage();
        const retry = block.cloneNode(true);
        retry.classList.remove('page-break-before');
        if (!tryAppend(retry)) {
          if (section) splitToc(block);
          else if (block.tagName === 'TABLE') splitTable(block);
          else splitText(block);
        }
      }
      if (section) current = null;
    });
    // A split row may leave an unused working page.
    previewContainer.querySelectorAll('.pdf-page').forEach(page => {
      if (!page.querySelector('.pdf-content').children.length) page.remove();
    });
    const pages = Array.from(previewContainer.querySelectorAll('.pdf-page'));
    const headingPages = new Map();
    const headingAnchors = new Set();
    const anchorByHeading = new Map();
    pages.forEach((page, index) => {
      const slot = page.querySelector('.page-num-slot');
      if (slot) slot.textContent = (index + 1) + ' / ' + pages.length;
      page.querySelectorAll('[data-heading-id]').forEach(heading => {
        const id = heading.id || 'pdf-heading-' + heading.dataset.headingId;
        if (!anchorByHeading.has(heading.dataset.headingId)) {
          heading.id = headingAnchors.has(id) ? 'pdf-heading-' + heading.dataset.headingId : id;
          headingAnchors.add(heading.id);
          anchorByHeading.set(heading.dataset.headingId, heading.id);
        } else heading.removeAttribute('id');
        if (heading.textContent.trim() && !headingPages.has(heading.dataset.headingId)) headingPages.set(heading.dataset.headingId, index + 1);
      });
    });
    [sourceContent, previewContainer].forEach(root => {
      root.querySelectorAll('.toc-item').forEach(item => {
        const page = item.querySelector('.toc-page-number,.toc-page');
        const number = headingPages.get(item.dataset.headingTarget) || item.dataset.manualPage || '';
        if (page) page.textContent = number || '—';
        if (root === previewContainer) {
          if (item.dataset.headingTarget && headingPages.has(item.dataset.headingTarget)) item.href = '#' + anchorByHeading.get(item.dataset.headingTarget);
          else if (number && pages[Number(number) - 1]) {
            pages[Number(number) - 1].id = 'pdf-page-' + number;
            item.href = '#pdf-page-' + number;
          } else item.removeAttribute('href');
        }
      });
    });
    SharedCodeBlocks.decorate(previewContainer, (pre, language) => {
      const source = elementById(pre.dataset.elementId);
      if (!source || source.tagName !== 'PRE') return;
      saveHistory();
      SharedCodeBlocks.setLanguage(source, language);
      if (!templates.validDesign(source,source.dataset.style || 'default')) templates.writeDesign(source,'default');
      paginate();
      if (selectedId === source.dataset.elementId) renderStyleChoices(source);
    });
    highlightSelection();
    if (!storageFailed) $('documentStatus').textContent = pages.length + '페이지 · 자동 저장' +
      (scaledCount ? ' · 큰 요소 ' + scaledCount + '개 축소' : '');
    scheduleSave();
  }
  function highlightSelection() {
    previewContainer.querySelectorAll('.selected-element').forEach(node => node.classList.remove('selected-element'));
    if (mode === 'normal' && selectedId) previewContainer.querySelectorAll('[data-element-id]').forEach(node => {
      if (node.dataset.elementId === selectedId) node.classList.add('selected-element');
    });
  }
  function renderDocument(html, fileName = '', styles = null) {
    resetDocument();
    importedStyles = styles || { css: [], attributes: {}, missing: [], available: false };
    settings.preserveHtmlCss = importedStyles.available;
    sourceContent.innerHTML = safeDocumentHtml(html);
    normalizeContent();
    const title = fileName ? fileName.replace(/\.[^/.]+$/, '') : sourceContent.querySelector('h1')?.textContent.trim();
    document.title = title || 'pdf-export';
    settings.headerTitleInput = title || '';
    settings.coverTitleInput = sourceContent.querySelector('h1,h2,h3,h4,h5,h6')?.textContent.trim() || title || '';
    renderMath();
    clearSelection();
    setMode('normal');
    history = [];
    updateUndo();
    applySettings();
    paginate();
  }
  async function readFile(file, companions = []) {
    if (!file) return;
    const extension = file.name.split('.').pop().toLowerCase();
    if (!['md', 'html', 'htm'].includes(extension)) { alert('.md 또는 .html 파일을 선택해주세요.'); return; }
    if (hasDocument() && !await confirmDocument('새 문서를 불러오면 작업 중이던 내용과 설정이 사라집니다. 계속하시겠습니까?')) return;
    const request = ++loadRequest, version = documentVersion;
    const current = () => request === loadRequest && version === documentVersion;
    try {
      const content = await file.text();
      if (!current()) return;
      if (extension === 'md') renderDocument(parseMarkdown(content), file.name);
      else {
        const imported = await htmlStyles.extract(content, companions);
        if (!current()) return;
        const staging = document.createElement('div');
        staging.innerHTML = safeDocumentHtml(imported.html);
        SharedCodeBlocks.normalize(staging, { forcePlain: true });
        imported.html = staging.innerHTML;
        renderDocument(imported.html, file.name, imported.styles);
      }
    } catch (error) {
      if (!current()) return;
      alert('파일을 읽지 못했습니다. 다시 선택해주세요.');
      console.error(error);
    }
  }
  ['mdFileInput', 'htmlFileInput'].forEach(id => $(id).addEventListener('change', async event => {
    const files = Array.from(event.target.files);
    await readFile(files.find(file => /\.(md|html?)$/i.test(file.name)), files);
    event.target.value = '';
  }));
  const dropZone = $('dropZone');
  dropZone.addEventListener('dragover', event => { event.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', event => { if (!dropZone.contains(event.relatedTarget)) dropZone.classList.remove('drag-over'); });
  dropZone.addEventListener('drop', async event => {
    event.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = Array.from(event.dataTransfer.files);
    await readFile(files.find(file => /\.(md|html?)$/i.test(file.name)), files);
  });
  settingIds.forEach(id => {
    const input = $(id);
    if (limits[id]) { input.min = limits[id][0]; input.max = limits[id][1]; }
    input.addEventListener('input', () => {
      if (limits[id] && (!input.value || !Number.isFinite(Number(input.value)))) return;
      saveHistory(id);
      settings = normalizeSettings({ [id]: input.type === 'checkbox' ? input.checked : input.value });
      applySettings(false);
      if (id === 'tocTitleInput') {
        sourceContent.querySelectorAll('.toc-heading').forEach(node => { node.textContent = settings.tocTitleInput; });
      }
      if ((id.startsWith('cover') || id === 'footerAuthorInput') && sourceContent.querySelector('.cover-page')) buildCover();
      else requestPaginate();
    });
    input.addEventListener('blur', () => { inputGroup = null; applySettings(); });
  });
  $('undoBtn').addEventListener('click', () => {
    const state = history.pop();
    if (!state) return;
    documentVersion++; loadRequest++; imageRequest++;
    sourceContent.innerHTML = safeDocumentHtml(state.html);
    renderMath();
    importedStyles = state.importedStyles || { css: [], attributes: {}, missing: [], available: false };
    settings = normalizeSettings(state.settings);
    document.title = state.title;
    inputGroup = null;
    clearSelection();
    applySettings();
    const imageLayer = sourceContent.querySelector('.cover-image-layer');
    checkCoverImage(imageLayer?.style.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1] || null);
    updateUndo();
    restoreBodyImages();
    paginate();
  });
  $('toggleBreakMode').addEventListener('click', () => { setMode(mode === 'break' ? 'normal' : 'break'); highlightSelection(); });
  $('toggleBreakCancelMode').addEventListener('click', () => { setMode(mode === 'breakCancel' ? 'normal' : 'breakCancel'); highlightSelection(); });
  $('toggleDeleteMode').addEventListener('click', () => { setMode(mode === 'delete' ? 'normal' : 'delete'); highlightSelection(); });

  function makeTocItem(title, level, headingTarget = '', manualPage = '') {
    const item = document.createElement('a');
    item.className = 'toc-item toc-level-' + level;
    item.dataset.tocId = uid('toc');
    item.dataset.level = level;
    if (headingTarget) item.dataset.headingTarget = headingTarget;
    if (manualPage) item.dataset.manualPage = manualPage;
    item.append(textNode('span', '', 'toc-number'), textNode('span', title, 'toc-title'), textNode('span', '', 'toc-dots'), textNode('span', '—', 'toc-page-number'));
    return item;
  }
  $('generateTocBtn').addEventListener('click', () => {
    const headings = Array.from(sourceContent.querySelectorAll('h1,h2,h3,h4,h5,h6')).filter(heading =>
      !heading.closest('.cover-page,.toc-wrapper') && !hiddenInSource(heading));
    if (!headings.length) { alert('목차로 만들 H1~H6 제목이 없습니다.'); return; }
    const existing = sourceContent.querySelector('.toc-wrapper');
    const previous = Array.from(existing?.querySelectorAll('.toc-item') || []);
    const byHeading = new Map();
    previous.forEach(item => {
      if (item.dataset.headingTarget && !byHeading.has(item.dataset.headingTarget)) byHeading.set(item.dataset.headingTarget, item);
    });
    const toc = document.createElement('div');
    toc.className = existing?.className || 'toc-wrapper page-break-before';
    toc.dataset.blockId = existing?.dataset.blockId || uid('block');
    const tocHeading = existing?.querySelector('.toc-heading')?.cloneNode(false) || textNode('h2', '', 'toc-heading');
    tocHeading.textContent = settings.tocTitleInput || '목차';
    toc.append(tocHeading);
    const emitted = new Set();
    const append = item => { if (!emitted.has(item.dataset.tocId)) { toc.append(item.cloneNode(true)); emitted.add(item.dataset.tocId); } };
    // Keep manual/duplicate user entries next to their prior preceding heading.
    previous.filter((item, index) => !item.dataset.headingTarget &&
      !previous.slice(0, index).some(entry => entry.dataset.headingTarget)).forEach(append);
    headings.forEach(heading => {
      const old = byHeading.get(heading.dataset.headingId);
      if (old) append(old);
      else toc.append(makeTocItem(heading.textContent.trim(), heading.tagName.slice(1), heading.dataset.headingId));
      if (old) {
        const index = previous.indexOf(old);
        for (let i = index + 1; i < previous.length; i++) {
          const item = previous[i];
          if (item.dataset.headingTarget && byHeading.get(item.dataset.headingTarget) === item) break;
          append(item);
        }
      }
    });
    previous.filter(item => !emitted.has(item.dataset.tocId) &&
      (!item.dataset.headingTarget || item.dataset.customTitle)).forEach(append);
    if (existing && toc.innerHTML === existing.innerHTML) return;
    saveHistory();
    existing?.remove();
    const cover = sourceContent.querySelector('.cover-page');
    if (cover) cover.after(toc);
    else sourceContent.prepend(toc);
    paginate();
  });
  function checkCoverImage(url) {
    if (!url) { coverImageProbe = null; $('coverImageStatus').textContent = ''; return; }
    if (coverImageProbe?.url === url && coverImageProbe.version === documentVersion) return;
    const image = new Image();
    const probe = { url, version: documentVersion, promise: null };
    coverImageProbe = probe;
    $('coverImageStatus').textContent = '배경 이미지를 확인하고 있습니다.';
    probe.promise = new Promise(resolve => {
      const done = ok => {
        if (coverImageProbe === probe && probe.version === documentVersion) {
          $('coverImageStatus').textContent = ok ? '배경 이미지 준비 완료' : '이미지를 표시할 수 없습니다. 파일 형식이나 URL을 확인해주세요.';
        }
        image.onload = image.onerror = null;
        resolve(ok);
      };
      image.onload = () => done(true);
      image.onerror = () => done(false);
      image.src = url;
    });
  }
  function buildCover(recordHistory = false) {
    const existing = sourceContent.querySelector('.cover-page');
    const cover = document.createElement('div');
    cover.className = 'cover-page';
    cover.dataset.blockId = existing?.dataset.blockId || uid('block');
    const image = settings.coverImgInput.trim();
    let imageUrl = null;
    if (image) {
      try {
        const parsed = new URL(image, location.href);
        if (['https:', 'http:'].includes(parsed.protocol) || /^data:image\/[a-z0-9.+-]+(?:;[^,]*)?,/i.test(image)) imageUrl = parsed.href;
      } catch { /* Keep the selected background if the URL is invalid. */ }
    }
    checkCoverImage(imageUrl);
    if (image && !imageUrl) $('coverImageStatus').textContent = '지원하지 않는 이미지 URL입니다. 이미지 파일 또는 HTTP(S) URL을 사용해주세요.';
    const backgrounds = {
      template: 'var(--cover-background, #fff)', white: '#fff',
      soft: 'linear-gradient(135deg, #f0f9ff, #dbeafe)', warm: 'linear-gradient(135deg, #fffbeb, #f5e9d5)',
      grid: 'repeating-linear-gradient(0deg, transparent, transparent 23px, #cbd5e1 24px), repeating-linear-gradient(90deg, #f8fafc, #f8fafc 23px, #cbd5e1 24px)',
      custom: settings.coverBgInput || '#fff'
    };
    cover.style.background = backgrounds[settings.coverBgStyle] || backgrounds.template;
    const imageLayer = document.createElement('div');
    imageLayer.className = 'cover-image-layer';
    imageLayer.setAttribute('aria-hidden', 'true');
    if (imageUrl) imageLayer.style.backgroundImage = 'url(' + JSON.stringify(imageUrl) + ')';
    const imageFits = { cover: ['cover', 'no-repeat'], tile: ['auto', 'repeat'], width: ['100% auto', 'no-repeat'], original: ['auto', 'no-repeat'] };
    const [size, repeat] = imageFits[settings.coverImageFit] || imageFits.cover;
    imageLayer.style.backgroundSize = size;
    imageLayer.style.backgroundRepeat = repeat;
    imageLayer.style.opacity = 1 - settings.coverImageOpacity / 100;
    const filter = document.createElement('div');
    filter.className = 'cover-filter-layer';
    filter.setAttribute('aria-hidden', 'true');
    filter.style.backgroundColor = settings.coverFilterColor;
    filter.style.opacity = 1 - settings.coverFilterOpacity / 100;
    const titles = document.createElement('div');
    titles.className = 'cover-title-group';
    titles.append(textNode('h1', settings.coverTitleInput || document.title),
      textNode('h3', settings.coverSubtitleInput));
    Array.from(titles.children).forEach(node => {
      const previous = existing?.querySelector('.cover-title-group ' + node.tagName.toLowerCase());
      if (previous?.dataset.elementId) node.dataset.elementId = previous.dataset.elementId;
    });
    const meta = document.createElement('div');
    meta.className = 'cover-meta-group';
    meta.append(textNode('p', '작성자: ' + (settings.footerAuthorInput || '작성자 미지정')), textNode('p', '발행일: ' + localDate()));
    const metadata = existing?.querySelector('.cover-meta-group')?.cloneNode(true) || meta;
    const author = metadata.querySelector('[data-cover-field="author"]') || metadata.querySelector('p');
    const oldAuthor = metadata.dataset.coverAuthor ?? settings.footerAuthorInput;
    if (author?.textContent === '작성자: ' + (oldAuthor || '작성자 미지정')) {
      author.textContent = '작성자: ' + (settings.footerAuthorInput || '작성자 미지정');
      author.dataset.coverField = 'author';
    }
    metadata.dataset.coverAuthor = settings.footerAuthorInput;
    cover.append(imageLayer, filter, titles, metadata);
    if (existing && cover.outerHTML === existing.outerHTML) return;
    if (recordHistory) saveHistory();
    if (existing) existing.replaceWith(cover);
    else sourceContent.prepend(cover);
    applySettings();
    paginate();
  }
  $('coverImageFile').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('이미지 파일을 선택해주세요.'); event.target.value = ''; return; }
    const request = ++imageRequest, version = documentVersion;
    const image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }).catch(() => null);
    event.target.value = '';
    if (request !== imageRequest || version !== documentVersion) return;
    if (!image) { alert('이미지를 읽지 못했습니다.'); return; }
    saveHistory();
    settings.coverImgInput = image;
    buildCover();
  });
  $('clearCoverImageBtn').addEventListener('click', () => {
    if (!settings.coverImgInput) return;
    imageRequest++;
    saveHistory(); settings.coverImgInput = ''; buildCover();
  });
  $('generateCoverBtn').addEventListener('click', () => buildCover(true));
  $('applyCoverConfigBtn').addEventListener('click', () => buildCover(true));

  function sourceTocItem() {
    return Array.from(sourceContent.querySelectorAll('.toc-item')).find(item => item.dataset.tocId === activeTocId);
  }
  const findHeading = id => Array.from(sourceContent.querySelectorAll('[data-heading-id]')).find(node => node.dataset.headingId === id);
  function synchronizeToc() {
    const counters = [0, 0, 0, 0, 0, 0];
    sourceContent.querySelectorAll('.toc-item').forEach(item => {
      const heading = findHeading(item.dataset.headingTarget);
      item.hidden = Boolean(item.dataset.headingTarget && (!heading || hiddenInSource(heading)));
      if (item.hidden) return;
      if (heading) {
        const level = Number(heading.tagName.slice(1));
        item.dataset.level = level;
        if (!item.dataset.customTitle) item.querySelector('.toc-title').textContent = heading.textContent.trim();
      }
      const level = Math.max(1, Math.min(6, Number(item.dataset.level || 1)));
      for (let i = 1; i <= 6; i++) item.classList.toggle('toc-level-' + i, i === level);
      counters[level - 1]++;
      counters.fill(0, level);
      let number = item.querySelector('.toc-number');
      if (!number) { number = textNode('span', '', 'toc-number'); item.prepend(number); }
      // For documents starting at H2/H3, do not invent empty leading parents.
      const first = counters.findIndex(value => value > 0);
      const parts = counters.slice(first, level).map(value => value || 1);
      number.textContent = settings.tocNumbering ? parts.join('.') + ' ' : '';
      number.hidden = !settings.tocNumbering;
    });
  }
  function openTocEditor(kind, item = null) {
    tocEditor = { kind, id: item?.dataset.tocId || null };
    const titleOnly = kind === 'title';
    $('tocEditTitle').textContent = titleOnly ? '목차 제목 편집' : kind === 'add' ? '목차 항목 추가' : '목차 항목 편집';
    $('tocEntryTitle').value = titleOnly ? settings.tocTitleInput : kind === 'add' ? '' : item.querySelector('.toc-title').textContent;
    $('tocEntryOptions').hidden = titleOnly;
    const select = $('tocEntryTarget');
    select.replaceChildren(textNode('option', '직접 페이지 지정 (연결 없음)'));
    select.firstChild.value = '';
    sourceContent.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(heading => {
      if (heading.closest('.cover-page,.toc-wrapper') || hiddenInSource(heading)) return;
      const option = textNode('option', heading.tagName + ' · ' + heading.textContent.trim());
      option.value = heading.dataset.headingId;
      select.append(option);
    });
    select.value = kind === 'edit' ? item.dataset.headingTarget || '' : '';
    $('tocEntryPage').value = kind === 'edit' ? item.dataset.manualPage || '' : '';
    $('tocEntryPage').disabled = Boolean(select.value);
    hidePopup();
    $('tocEditDialog').showModal();
    $('tocEntryTitle').focus();
  }
  $('tocEntryTarget').addEventListener('change', () => {
    $('tocEntryPage').disabled = Boolean($('tocEntryTarget').value);
    if ($('tocEntryTarget').value && !$('tocEntryTitle').value.trim()) $('tocEntryTitle').value = findHeading($('tocEntryTarget').value).textContent.trim();
  });
  function closeTocEditor() { tocEditor = null; $('tocEditDialog').close(); }
  $('cancelTocEditBtn').addEventListener('click', closeTocEditor);
  $('tocEditDialog').addEventListener('cancel', event => { event.preventDefault(); closeTocEditor(); });
  $('saveTocEditBtn').addEventListener('click', () => {
    if (!tocEditor || !$('tocEntryTitle').value.trim()) { $('tocEntryTitle').focus(); return; }
    const title = $('tocEntryTitle').value.trim();
    const item = Array.from(sourceContent.querySelectorAll('.toc-item')).find(node => node.dataset.tocId === tocEditor.id);
    if (tocEditor.kind === 'title') {
      if (settings.tocTitleInput !== title) {
        saveHistory(); settings.tocTitleInput = title;
        sourceContent.querySelectorAll('.toc-heading').forEach(node => { node.textContent = title; });
        applySettings();
      }
    } else if (item) {
      const target = $('tocEntryTarget').value;
      const page = /^[1-9]\d*$/.test($('tocEntryPage').value) && !target ? $('tocEntryPage').value : '';
      if (tocEditor.kind === 'add') {
        saveHistory();
        const heading = findHeading(target);
        const next = makeTocItem(title, heading ? heading.tagName.slice(1) : item.dataset.level, target, page);
        next.dataset.customTitle = 'true';
        item.after(next);
      } else if (title !== item.querySelector('.toc-title').textContent || target !== (item.dataset.headingTarget || '') || page !== (item.dataset.manualPage || '')) {
        saveHistory(); item.querySelector('.toc-title').textContent = title;
        item.dataset.customTitle = 'true'; item.dataset.headingTarget = target; item.dataset.manualPage = page;
      }
    }
    closeTocEditor(); paginate();
  });
  $('tocEditBtn').addEventListener('click', () => { const item = sourceTocItem(); if (item) openTocEditor('edit', item); });
  $('tocAddBtn').addEventListener('click', () => { const item = sourceTocItem(); if (item) openTocEditor('add', item); });
  function changeHeadingLevel(heading, delta) {
    const old = Number(heading.tagName.slice(1));
    const level = Math.max(1, Math.min(6, old + delta));
    if (old === level) return false;
    saveHistory();
    const next = document.createElement('h' + level);
    Array.from(heading.attributes).forEach(attr => next.setAttribute(attr.name, attr.value));
    next.append(...heading.childNodes);
    heading.replaceWith(next);
    return true;
  }
  function changeTocLevel(delta) {
    const item = sourceTocItem();
    if (!item) return;
    const heading = findHeading(item.dataset.headingTarget);
    if (heading) {
      if (!changeHeadingLevel(heading, delta)) return;
    } else {
      const old = Number(item.dataset.level || 1);
      const level = Math.max(1, Math.min(6, old + delta));
      if (old === level) return;
      saveHistory(); item.dataset.level = level;
    }
    paginate();
  }
  $('tocPromoteBtn').addEventListener('click', () => changeTocLevel(-1));
  $('tocDemoteBtn').addEventListener('click', () => changeTocLevel(1));
  function changeSelectedHeading(delta) {
    const heading = elementById(selectedId);
    if (!heading || !/^H[1-6]$/.test(heading.tagName) || !changeHeadingLevel(heading, delta)) return;
    paginate(); selectBlock(selectedId);
  }
  $('headingPromoteBtn').addEventListener('click', () => changeSelectedHeading(-1));
  $('headingDemoteBtn').addEventListener('click', () => changeSelectedHeading(1));
  $('removePageBreakBtn').addEventListener('click', () => {
    const element = elementById(selectedId);
    const block = element?.closest('[data-block-id]');
    if (!block?.classList.contains('page-break-before')) return;
    saveHistory(); block.classList.remove('page-break-before'); paginate(); selectBlock(selectedId);
  });
  $('tocDeleteBtn').addEventListener('click', () => {
    const item = sourceTocItem();
    if (!item) return;
    saveHistory();
    item.remove();
    paginate();
  });
  function selectBlock(id) {
    const source = elementById(id);
    if (!source) return;
    if (selectedId === id && pendingDesign) return;
    selectedId = id;
    configureListControls(source);
    configureImageControls(source);
    $('selectedTagType').textContent = '<' + source.tagName.toLowerCase() + '>';
    $('elementLineHeight').value = source.style.lineHeight || '';
    $('rightPanel').style.display = 'block';
    const heading = /^H[1-6]$/.test(source.tagName) && !source.closest('.cover-page,.toc-wrapper');
    $('headingLevelControls').hidden = !heading;
    $('headingPromoteBtn').disabled = source.tagName === 'H1';
    $('headingDemoteBtn').disabled = source.tagName === 'H6';
    $('removePageBreakBtn').hidden = !source.closest('[data-block-id]')?.classList.contains('page-break-before');
    renderStyleChoices(source);
    highlightSelection();
  }
  previewContainer.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (link) {
      event.preventDefault();
      if ((event.ctrlKey || event.metaKey) && link.getAttribute('href')?.startsWith('#')) {
        document.getElementById(link.getAttribute('href').slice(1))?.scrollIntoView({ block: 'start' });
        return;
      }
    }
    const target = event.target.closest('[data-block-id]');
    if (!target) return;
    const source = blockById(target.dataset.blockId);
    if (!source) return;
    if (mode === 'break') {
      if (source.classList.contains('page-break-before') || source.classList.contains('cover-page')) return;
      saveHistory(); source.classList.add('page-break-before'); paginate(); return;
    }
    if (mode === 'breakCancel') {
      if (!source.classList.contains('page-break-before')) return;
      saveHistory(); source.classList.remove('page-break-before'); paginate(); return;
    }
    if (mode === 'delete') { saveHistory(); source.style.display = 'none'; clearSelection(); paginate(); return; }
    const toc = event.target.closest('.toc-item');
    if (toc) {
      activeTocId = toc.dataset.tocId;
      popup.hidden = false;
      popup.style.left = Math.max(8, Math.min(event.clientX, window.innerWidth - popup.offsetWidth - 8)) + 'px';
      popup.style.top = Math.max(8, Math.min(event.clientY + 12, window.innerHeight - popup.offsetHeight - 8)) + 'px';
      return;
    }
    hidePopup();
    const element = event.target.closest('[data-element-id]');
    if (element) selectBlock(element.dataset.elementId);
  });
  document.addEventListener('click', event => { if (!event.target.closest('.toc-item,#tocActionPopup')) hidePopup(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hidePopup(); });

  function closeEditor(save) {
    const source = blockById(activeEditId);
    const edited = $('blockEditContent').firstElementChild;
    const tableSource = activeTableId && elementById(activeTableId);
    const codeSource = activeCodeId && elementById(activeCodeId);
    if (save && codeSource) {
      const text = $('codeEditInput').value;
      const oldText = codeSource.querySelector('code')?.textContent ?? codeSource.textContent;
      if (text !== oldText) {
        saveHistory();
        codeSource.replaceChildren(textNode('code', text));
        SharedCodeBlocks.setLanguage(codeSource, codeSource.dataset.codeLanguage || 'plaintext');
      }
    } else if (save && tableSource && edited) {
      edited.querySelectorAll('[contenteditable]').forEach(node => node.removeAttribute('contenteditable'));
      htmlStyles.restoreInline(edited);
      const shell = edited.cloneNode(false);
      shell.innerHTML = window.PdfMath ? PdfMath.sourceHtml(edited) : edited.innerHTML;
      const safe = document.createElement('div'); safe.innerHTML = clean(shell.outerHTML);
      const html = safe.querySelector('table')?.innerHTML || '';
      const old = window.PdfMath ? PdfMath.sourceHtml(tableSource) : tableSource.innerHTML;
      if (html !== old) { saveHistory(); tableSource.innerHTML = html; renderMath(tableSource); normalizeContent(); }
    } else if (save && source && edited && activeEditKind === 'cover-meta') {
      const meta = source.querySelector('.cover-meta-group');
      const html = clean(edited.innerHTML);
      if (meta && html !== meta.innerHTML) { saveHistory(); meta.innerHTML = html; }
    } else if (save && source && edited) {
      edited.querySelectorAll('.code-block-controls').forEach(node => node.remove());
      htmlStyles.restoreInline(edited);
      const html = clean(window.PdfMath ? PdfMath.sourceHtml(edited) : edited.innerHTML);
      const previousHtml = window.PdfMath ? PdfMath.sourceHtml(source) : source.innerHTML;
      if (html !== previousHtml) {
        saveHistory();
        source.innerHTML = html;
        renderMath(source);
        SharedCodeBlocks.normalize(sourceContent);
        normalizeContent();
      }
    }
    activeEditId = activeCodeId = activeTableId = null;
    tableEditCell = null;
    $('blockEditDialog').close();
    paginate();
  }
  previewContainer.addEventListener('dblclick', event => {
    if (mode !== 'normal') return;
    const target = event.target.closest('[data-block-id]');
    const source = target && blockById(target.dataset.blockId);
    if (!source) return;
    const imageTarget = event.target.closest('img[data-element-id]');
    if (imageTarget && !source.classList.contains('cover-page')) { const image = elementById(imageTarget.dataset.elementId); if (image) openImageEditor(image); return; }
    if (source.classList.contains('toc-wrapper')) {
      if (event.target.closest('.toc-heading')) openTocEditor('title');
      else { const item = event.target.closest('.toc-item'); if (item) { const original = Array.from(source.querySelectorAll('.toc-item')).find(node => node.dataset.tocId === item.dataset.tocId); if (original) openTocEditor('edit', original); } }
      return;
    }
    activeEditId = source.dataset.blockId;
    activeTableId = event.target.closest('table[data-element-id]')?.dataset.elementId || null;
    tableEditCell = null;
    $('tableEditToolbar').hidden = !activeTableId;
    const code = event.target.closest('pre[data-element-id]');
    activeCodeId = code?.dataset.elementId || null;
    activeEditKind = source.classList.contains('cover-page') ? 'cover-meta' : 'block';
    $('codeEditInput').hidden = !activeCodeId;
    $('blockEditContent').hidden = Boolean(activeCodeId);
    if (activeCodeId) {
      const original = elementById(activeCodeId);
      $('codeEditInput').value = original.querySelector('code')?.textContent ?? original.textContent;
      $('blockEditDialog').showModal();
      $('codeEditInput').focus();
      return;
    }
    if (activeEditKind === 'cover-meta' && !event.target.closest('.cover-meta-group')) { activeEditId = null; return; }
    const copy = htmlStyles.prepare((activeTableId ? elementById(activeTableId) : activeEditKind === 'cover-meta' ? source.querySelector('.cover-meta-group') : source).cloneNode(true), settings.preserveHtmlCss && importedStyles.available);
    copy.classList.remove('page-break-before');
    window.PdfMath?.editable(copy);
    window.PdfImages?.decorate(copy);
    if (activeTableId) {
      copy.contentEditable = 'false';
      copy.querySelectorAll('td,th,caption').forEach(cell => { cell.contentEditable = 'true'; });
      $('tableAddRowBtn').disabled = $('tableAddColumnBtn').disabled = false;
      $('tableEditHint').textContent = '셀 선택 후 해당 행·열 다음에 추가합니다. 병합 영역은 유지합니다.';
    } else copy.contentEditable = 'true';
    copy.removeAttribute('data-block-id');
    $('blockEditContent').replaceChildren(copy);
    $('blockEditContent').dataset.theme = settings.colorTheme;
    $('blockEditContent').className = 'block-edit-content';
    $('blockEditContent').removeAttribute('style');
    htmlStyles.decorateRoot($('blockEditContent'), importedStyles, settings.preserveHtmlCss && importedStyles.available);
    $('blockEditDialog').showModal();
    copy.focus();
  });
  $('blockEditContent').addEventListener('paste', event => {
    event.preventDefault();
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const parent = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    if (!$('blockEditContent').contains(parent) || (activeTableId && !parent.closest('td,th,caption'))) return;
    range.deleteContents();
    const fragment = document.createDocumentFragment();
    event.clipboardData.getData('text/plain').split(/\r?\n/).forEach((line, index) => {
      if (index) fragment.append(document.createElement('br'));
      fragment.append(document.createTextNode(line));
    });
    const last = fragment.lastChild;
    range.insertNode(fragment);
    range.setStartAfter(last);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  });
  $('saveBlockEditBtn').addEventListener('click', () => closeEditor(true));
  $('cancelBlockEditBtn').addEventListener('click', () => closeEditor(false));
  $('blockEditDialog').addEventListener('cancel', event => { event.preventDefault(); closeEditor(false); });

  // Table shell is never contenteditable: only cells/captions are edited.
  $('blockEditContent').addEventListener('focusin', event => {
    if (activeTableId) tableEditCell = event.target.closest('td,th');
  });
  $('blockEditContent').addEventListener('click', event => {
    if (activeTableId) tableEditCell = event.target.closest('td,th');
  });
  function editableTableCell(tag, text = '') {
    const cell = textNode(tag, text); cell.contentEditable = 'true'; return cell;
  }
  function tableGrid(table) {
    const rows = Array.from(table.rows), grid = rows.map(() => []), records = [];
    rows.forEach((row, ri) => {
      let column = 0;
      Array.from(row.cells).forEach(cell => {
        while (grid[ri][column]) column++;
        const groupEnd = rows.findLastIndex(item => item.parentElement === row.parentElement);
        const bottom = Math.min(groupEnd, cell.rowSpan === 0 ? groupEnd : ri + cell.rowSpan - 1);
        const record = { cell, top: ri, bottom, left: column, right: column + cell.colSpan - 1, group: row.parentElement };
        records.push(record);
        for (let r = ri; r <= bottom; r++) for (let c = record.left; c <= record.right; c++) grid[r][c] = record;
        column = record.right + 1;
      });
    });
    return { rows, grid, records, width: Math.max(1, ...grid.map(row => row.length)) };
  }
  $('tableAddRowBtn').addEventListener('click', () => {
    const table = $('blockEditContent').firstElementChild;
    if (!activeTableId || table?.tagName !== 'TABLE') return;
    const layout = tableGrid(table), chosen = tableEditCell?.closest('tr');
    const group = chosen?.parentElement || table.tBodies[table.tBodies.length - 1] || table.createTBody();
    const row = document.createElement('tr');
    const index = chosen ? chosen.rowIndex + 1 : layout.rows.filter(item => item.parentElement === group).at(-1)?.rowIndex + 1 || (table.tHead?.rows.length || 0);
    const covered = new Set();
    layout.records.forEach(record => {
      if (record.group !== group || record.top >= index) return;
      if (record.bottom >= index || (record.cell.rowSpan === 0 && record.bottom === index - 1)) {
        if (record.cell.rowSpan !== 0) record.cell.rowSpan++;
        for (let c = record.left; c <= record.right; c++) covered.add(c);
      }
    });
    for (let c = 0; c < layout.width; c++) if (!covered.has(c)) row.append(editableTableCell(group.tagName === 'THEAD' ? 'th' : 'td'));
    if (chosen) chosen.after(row); else group.append(row);
    tableEditCell = row.cells[0] || tableEditCell; tableEditCell?.focus();
  });
  $('tableAddColumnBtn').addEventListener('click', () => {
    const table = $('blockEditContent').firstElementChild;
    if (!activeTableId || table?.tagName !== 'TABLE') return;
    const layout = tableGrid(table), chosen = layout.records.find(record => record.cell === tableEditCell);
    const index = chosen ? chosen.right + 1 : layout.width;
    const expanded = new Set();
    layout.rows.forEach((row, ri) => {
      const before = layout.grid[ri][index - 1], after = layout.grid[ri][index];
      if (before && before === after) {
        if (!expanded.has(before.cell)) { before.cell.colSpan++; expanded.add(before.cell); }
        return;
      }
      const next = layout.records.find(record => record.top === ri && record.left >= index);
      row.insertBefore(editableTableCell(row.parentElement.tagName === 'THEAD' ? 'th' : 'td'), next?.cell || null);
    });
    table.querySelectorAll(':scope > colgroup').forEach(group => {
      let position = 0;
      for (const col of Array.from(group.children)) {
        const width = Number(col.span || 1);
        if (position < index && index < position + width) { col.span++; return; }
        if (position >= index) { group.insertBefore(document.createElement('col'), col); return; }
        position += width;
      }
      group.append(document.createElement('col'));
    });
  });
  const markerOptions = {
    ul: [['disc', '채운 원'], ['circle', '빈 원'], ['square', '사각형'], ['none', '불릿 없음']],
    ol: [['decimal', '1, 2, 3'], ['decimal-leading-zero', '01, 02, 03'], ['lower-alpha', 'a, b, c'], ['upper-alpha', 'A, B, C'], ['lower-roman', 'i, ii, iii'], ['upper-roman', 'I, II, III']]
  };
  function listMarkers(tag, value) {
    $('listMarkerInput').replaceChildren();
    markerOptions[tag].forEach(([id, label]) => { const option = textNode('option', label); option.value = id; $('listMarkerInput').append(option); });
    $('listMarkerInput').value = markerOptions[tag].some(([id]) => id === value) ? value : markerOptions[tag][0][0];
    $('listStartInput').disabled = $('listReversedInput').disabled = tag !== 'ol';
  }
  function configureListControls(source) {
    const list = /^(UL|OL)$/.test(source.tagName);
    $('listControls').hidden = !list;
    if (!list) return;
    const tag = source.tagName.toLowerCase(); $('listTagInput').value = tag;
    listMarkers(tag, source.dataset.listMarker || source.style.listStyleType);
    $('listStartInput').value = source.getAttribute('start') || (source.hasAttribute('reversed') ? source.children.length : 1);
    $('listReversedInput').checked = source.hasAttribute('reversed');
  }
  $('listTagInput').addEventListener('change', () => listMarkers($('listTagInput').value));
  $('applyListConfigBtn').addEventListener('click', () => {
    const source = elementById(selectedId);
    if (!source || !/^(UL|OL)$/.test(source.tagName)) return;
    const tag = $('listTagInput').value, marker = $('listMarkerInput').value;
    if (!markerOptions[tag]?.some(([id]) => id === marker)) return;
    const start = Number($('listStartInput').value), reversed = $('listReversedInput').checked;
    if (tag === 'ol' && !Number.isInteger(start)) { $('listStartInput').focus(); return; }
    const next = document.createElement(tag);
    Array.from(source.attributes).forEach(attr => next.setAttribute(attr.name, attr.value));
    next.dataset.listMarker = marker; next.style.removeProperty('list-style-type');
    next.removeAttribute('type');
    if (tag === 'ol') { next.setAttribute('start', start); next.toggleAttribute('reversed', reversed); }
    else { next.removeAttribute('start'); next.removeAttribute('reversed'); }
    next.innerHTML = source.innerHTML;
    if (!templates.validDesign(next,next.dataset.style || 'default')) templates.writeDesign(next,'default');
    if (next.outerHTML === source.outerHTML) return;
    saveHistory(); source.replaceWith(next); paginate(); selectBlock(selectedId);
  });
  // Defer the next user action until the temporary preview is explicitly resolved.
  function finishPendingDesign(choice) {
    const action = deferredDesignAction; deferredDesignAction = null;
    $('pendingDesignDialog').close();
    if (choice === 'discard') { pendingDesign = null; paginate(); const source = elementById(selectedId); if (source) renderStyleChoices(source); }
    else applyPreset(choice === 'all');
    if (action) {
      replayDesignAction = true;
      try { action(); } finally { replayDesignAction = false; }
    }
  }
  $('discardDesignBtn').addEventListener('click', () => finishPendingDesign('discard'));
  $('commitDesignSelectedBtn').addEventListener('click', () => finishPendingDesign('selected'));
  $('commitDesignAllBtn').addEventListener('click', () => finishPendingDesign('all'));
  $('pendingDesignDialog').addEventListener('cancel', event => { event.preventDefault(); deferredDesignAction = null; $('pendingDesignDialog').close(); });
  function guardDesign(event) {
    if (!pendingDesign || replayDesignAction || event.target.closest('#pendingDesignDialog,#stylePreviewGrid,#elementDesignOptions,#applyToSelectedBtn,#applyToAllBtn,#uiThemeToggle')) return;
    if (event.target.closest('#pdfPreviewContainer') && event.type === 'click' && event.target.closest('[data-element-id]')?.dataset.elementId === selectedId && mode === 'normal') return;
    if (!event.target.closest('button,input,select,label,#pdfPreviewContainer,#dropZone')) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if ($('pendingDesignDialog').open) return;
    const target = event.target, id = target.closest('[data-element-id]')?.dataset.elementId;
    const input = event.type === 'input' || event.type === 'change';
    const value = target.value, checked = target.checked;
    if (input && settingIds.includes(target.id)) { target.value = settings[target.id]; if (target.type === 'checkbox') target.checked = settings[target.id]; }
    const files = target.type === 'file' ? Array.from(target.files || []) : null;
    const dropped = event.type === 'drop' ? Array.from(event.dataTransfer.files) : null;
    deferredDesignAction = () => {
      if (files?.length && target.id === 'coverImageFile') { target.dispatchEvent(new Event('change', { bubbles: true })); return; }
      if (files?.length) { readFile(files.find(file => /.(md|html?)$/i.test(file.name)), files); target.value = ''; return; }
      if (dropped) { readFile(dropped.find(file => /.(md|html?)$/i.test(file.name)), dropped); return; }
      const current = target.isConnected ? target : id ? Array.from(previewContainer.querySelectorAll('[data-element-id]')).find(node => node.dataset.elementId === id) : null;
      if (!current) return;
      if (input) { current.value = value; current.checked = checked; current.dispatchEvent(new Event(event.type, { bubbles: true })); }
      else if (event.type === 'click' && current.matches('button,label,input,select')) { current.focus(); current.click(); }
      else current.dispatchEvent(new MouseEvent(event.type, { bubbles: true, clientX: event.clientX || 0, clientY: event.clientY || 0, ctrlKey: event.ctrlKey, metaKey: event.metaKey, shiftKey: event.shiftKey, altKey: event.altKey }));
    };
    $('pendingDesignDialog').showModal();
  }
  ['click', 'dblclick', 'input', 'change', 'drop'].forEach(type => document.addEventListener(type, guardDesign, true));
  function designOptions() {
    return Object.fromEntries(Array.from($('elementDesignOptions').querySelectorAll('input')).map(input => [input.dataset.key,input.value]));
  }
  function previewDesign(source) {
    const candidate = source.cloneNode(true);
    templates.writeDesign(candidate, selectedPreset, designOptions());
    const options = templates.readDesign(candidate);
    pendingDesign = selectedPreset === (source.dataset.style || 'default') && JSON.stringify(options) === JSON.stringify(templates.readDesign(source)) ? null : { id:source.dataset.elementId,preset:selectedPreset,options };
    $('elementDesignStatus').textContent = pendingDesign ? '임시 미리보기 · 적용 버튼을 눌러 저장하세요.' : '';
    paginate();
  }
  function renderDesignOptions(source, preset) {
    const container = $('elementDesignOptions'); container.replaceChildren();
    const fields = templates.designFields[preset] || [];
    container.hidden = !fields.length;
    fields.forEach(({key,label,placeholder,type}) => {
      const input = document.createElement('input'); input.type = type; input.id = 'design-' + key; input.dataset.key = key;
      if (type === 'number') { input.min = '1'; input.step = '1'; }
      const title = textNode('label',label); title.htmlFor = input.id;
      input.placeholder = placeholder;
      input.value = source.dataset['design' + key[0].toUpperCase() + key.slice(1)] || '';
      input.addEventListener('input',() => previewDesign(source));
      container.append(title,input);
    });
  }
  function renderStyleChoices(source) {
    const family = templates.family(source.tagName);
    selectedPreset = source.dataset.style || 'default';
    $('stylePreviewGrid').replaceChildren();
    $('elementDesignStatus').textContent = '';
    templates.styles[family].filter(([id]) => templates.validDesign(source,id)).forEach(([id,name,description]) => {
      const button = document.createElement('button'); button.className = 'preview-item'; button.type = 'button';
      button.classList.toggle('active',selectedPreset === id); button.setAttribute('aria-pressed',String(selectedPreset === id));
      const sample = document.createElement('div'); sample.className = 'tag-style-sample document-style'; sample.dataset.theme = settings.colorTheme;
      sample.innerHTML = templates.sampleFor(family,id,source.tagName); sample.firstElementChild.dataset.style = id;
      if (family === 'code') SharedCodeBlocks.normalize(sample);
      templates.prepareDesign(sample);
      button.append(sample,textNode('span',name));
      if (description) button.append(textNode('small',description,'design-description'));
      button.addEventListener('click',() => {
        $('stylePreviewGrid').querySelectorAll('.preview-item').forEach(node => { node.classList.toggle('active',node === button);node.setAttribute('aria-pressed',String(node === button)); });
        selectedPreset = id; renderDesignOptions(source,id); previewDesign(source);
      });
      $('stylePreviewGrid').append(button);
    });
    renderDesignOptions(source,selectedPreset);
  }
  function applyPreset(all) {
    const source = elementById(selectedId);
    if (!source || !selectedPreset) return;
    const candidates = Array.from(all ? sourceContent.querySelectorAll(source.tagName) : [source]).filter(target => !target.closest('.cover-page,.toc-wrapper'));
    const targets = candidates.filter(target => templates.validDesign(target,selectedPreset));
    const values = pendingDesign?.options || designOptions();
    const plans = targets.map(target => {
      const copy = target.cloneNode(true);
      // Metadata belongs to its element. Whole-tag application retains each
      // other element's own values rather than copying a filename or column index.
      const own = Object.fromEntries((templates.designFields[selectedPreset] || []).map(({key}) => [key,target.dataset['design'+key[0].toUpperCase()+key.slice(1)] || '']));
      templates.writeDesign(copy,selectedPreset,target === source ? values : own);
      ['style-preset-default','style-preset-highlight','style-preset-bordered','style-preset-card'].forEach(name => copy.classList.remove(name));
      return {target,copy};
    });
    const changes = plans.filter(({target,copy}) => target.outerHTML !== copy.outerHTML);
    pendingDesign = null;
    if (changes.length) saveHistory();
    changes.forEach(({target,copy}) => {
      templates.writeDesign(target,selectedPreset,templates.readDesign(copy));
      ['style-preset-default','style-preset-highlight','style-preset-bordered','style-preset-card'].forEach(name => target.classList.remove(name));
    });
    paginate(); renderStyleChoices(source);
    $('elementDesignStatus').textContent = all ? targets.length + '개에 적용 · 요소별 세부 설정 유지' + (targets.length < candidates.length ? ' · 구조가 다른 ' + (candidates.length-targets.length) + '개 제외' : '') : '선택 요소에 적용했습니다.';
  }
  $('applyToSelectedBtn').addEventListener('click', () => applyPreset(false));
  $('applyToAllBtn').addEventListener('click', () => applyPreset(true));
  $('resetElementStyleBtn').addEventListener('click', () => {
    const source = elementById(selectedId);
    if (!source) return;
    saveHistory();
    templates.writeDesign(source,'default');
    resetLineHeight(source);
    ['style-preset-default', 'style-preset-highlight', 'style-preset-bordered', 'style-preset-card'].forEach(name => source.classList.remove(name));
    $('elementLineHeight').value = '';
    renderStyleChoices(source);
    paginate();
  });
  $('elementLineHeight').addEventListener('input', event => {
    const source = elementById(selectedId);
    if (!source) return;
    const value = event.target.value;
    if (value && (!Number.isFinite(Number(value)) || Number(value) < 1 || Number(value) > 3)) return;
    saveHistory('elementLineHeight');
    if (value) {
      if (!('pdfOriginalLineHeight' in source.dataset)) source.dataset.pdfOriginalLineHeight = source.style.lineHeight;
      source.style.lineHeight = value;
      source.dataset.pdfLineHeight = value;
    } else resetLineHeight(source);
    requestPaginate();
  });
  $('elementLineHeight').addEventListener('blur', () => { inputGroup = null; });

  let imageEditor = null, bodyImageRequest = 0;
  function selectedImage() {
    const element = elementById(selectedId);
    if (!element || element.closest('.cover-page,.toc-wrapper')) return null;
    if (element.tagName === 'IMG') return element;
    const candidates = element.tagName === 'FIGURE' ? element.querySelectorAll('img') : [];
    return candidates.length === 1 ? candidates[0] : null;
  }
  function imageCaption(image) { return image.closest('figure')?.querySelector(':scope > figcaption')?.textContent || ''; }
  function fillImageFields(prefix, image) {
    $(prefix + 'Width').value = image?.dataset.imageWidth || '100';
    $(prefix + 'Align').value = image?.dataset.imageAlign || 'center';
    $(prefix + 'Alt').value = image?.getAttribute('alt') || '';
    $(prefix + 'Caption').value = image ? imageCaption(image) : '';
  }
  function readImageFields(prefix) {
    const width = Number($(prefix + 'Width').value);
    if (!Number.isFinite(width) || width < 1 || width > 100) throw Error('이미지 너비는 1~100%로 입력해주세요.');
    return { width, align: ['left', 'center', 'right'].includes($(prefix + 'Align').value) ? $(prefix + 'Align').value : 'center',
      alt: $(prefix + 'Alt').value, caption: $(prefix + 'Caption').value.trim() };
  }
  function configureImageControls(source) {
    const image = selectedImage();
    $('imageControls').hidden = !image;
    if (image) fillImageFields('selectedImage', image);
  }
  function imageFigure(image) {
    const existing = image.closest('figure');
    if (existing && existing.querySelectorAll('img').length === 1) return existing;
    const paragraph = image.closest('p');
    const target = paragraph && !existing && paragraph.querySelectorAll('img').length === 1 ? paragraph : image.closest('picture') || image;
    const figure = document.createElement('figure');
    if (target.dataset.blockId) { figure.dataset.blockId = target.dataset.blockId; delete target.dataset.blockId; }
    if (target.classList.contains('page-break-before')) { figure.classList.add('page-break-before'); target.classList.remove('page-break-before'); }
    target.replaceWith(figure); figure.append(target);
    return figure;
  }
  function applyImageFields(image, fields) {
    const figure = imageFigure(image);
    image.dataset.pdfImage = 'true'; image.dataset.imageWidth = String(fields.width); image.dataset.imageAlign = fields.align;
    image.setAttribute('alt', fields.alt);
    let caption = figure.querySelector(':scope > figcaption');
    if (fields.caption) { if (!caption) { caption = document.createElement('figcaption'); figure.append(caption); } caption.textContent = fields.caption; }
    else caption?.remove();
    return figure;
  }
  function closeImageEditor() {
    bodyImageRequest++; imageEditor = null; $('imageDialog').close(); $('imageFileInput').value = ''; $('saveImageBtn').disabled = false;
  }
  function updateImageSourceFields() {
    $('imageFileGroup').hidden = $('imageSourceType').value !== 'file';
    $('imageUrlGroup').hidden = $('imageSourceType').value !== 'url';
    $('imageDialogStatus').textContent = '';
  }
  function openImageEditor(image = null) {
    if (activeEditId) closeEditor(true);
    const selected = elementById(selectedId)?.closest('[data-block-id]');
    imageEditor = { imageId: image?.dataset.elementId || null, blockId: selected?.dataset.blockId || null, version: documentVersion };
    $('imageDialogTitle').textContent = image ? '이미지 편집' : '이미지 추가';
    $('saveImageBtn').textContent = image ? '적용' : '추가'; $('saveImageBtn').disabled = false;
    $('imageSourceType').querySelector('[value="keep"]').hidden = !image;
    $('imageSourceType').value = image ? 'keep' : 'file';
    $('imageFileInput').value = ''; $('imageUrlInput').value = '';
    $('imageFileInfo').textContent = 'PNG, JPG, WebP · 파일당 최대 20MB · 원본 품질로 저장합니다.';
    $('imagePositionGroup').hidden = Boolean(image);
    ['before', 'after'].forEach(value => { $('imagePosition').querySelector('[value="' + value + '"]').disabled = !selected || Boolean(selected.closest('.cover-page,.toc-wrapper')); });
    $('imagePosition').value = selected && !selected.closest('.cover-page,.toc-wrapper') ? 'after' : 'end';
    fillImageFields('image', image); updateImageSourceFields(); $('imageDialog').showModal();
  }
  $('addImageBtn').addEventListener('click', () => openImageEditor());
  $('replaceImageBtn').addEventListener('click', () => { const image = selectedImage(); if (image) openImageEditor(image); });
  $('cancelImageBtn').addEventListener('click', closeImageEditor);
  $('imageDialog').addEventListener('cancel', event => { event.preventDefault(); closeImageEditor(); });
  $('imageSourceType').addEventListener('change', updateImageSourceFields);
  $('imageFileInput').addEventListener('change', () => {
    const file = $('imageFileInput').files[0];
    $('imageFileInfo').textContent = file ? file.name + ' · ' + (file.size / 1024 / 1024).toFixed(2) + 'MB · 원본 품질로 저장합니다.' : 'PNG, JPG, WebP · 파일당 최대 20MB';
    if (file && !$('imageAlt').value) $('imageAlt').value = file.name.replace(/\.[^.]+$/, '');
  });
  $('saveImageBtn').addEventListener('click', async () => {
    const context = imageEditor, request = ++bodyImageRequest;
    if (!context) return;
    const current = () => imageEditor === context && request === bodyImageRequest && context.version === documentVersion;
    let asset;
    try {
      const fields = readImageFields('image');
      const kind = $('imageSourceType').value, position = $('imagePosition').value;
      let url, dimensions;
      $('saveImageBtn').disabled = true; $('imageDialogStatus').textContent = '이미지를 확인하고 있습니다…';
      if (kind === 'file') { asset = await PdfImages.fileAsset($('imageFileInput').files[0]); url = asset.url; dimensions = asset; }
      else if (kind === 'url') { url = PdfImages.httpUrl($('imageUrlInput').value); dimensions = await PdfImages.probe(url); }
      else if (kind !== 'keep' || !context.imageId) throw Error('이미지를 선택해주세요.');
      if (!current()) { if (asset) await PdfImages.remove(asset.id); return; }
      const old = context.imageId && elementById(context.imageId);
      if (context.imageId && !old) throw Error('편집할 이미지가 없습니다. 다시 선택해주세요.');
      const image = old || document.createElement('img');
      if (!url && image.dataset.pdfImage && Number(image.dataset.imageWidth) === fields.width && image.dataset.imageAlign === fields.align && image.alt === fields.alt && imageCaption(image) === fields.caption) { closeImageEditor(); return; }
      saveHistory();
      if (url) {
        image.src = url; image.removeAttribute('srcset');
        image.closest('picture')?.querySelectorAll('source').forEach(source => source.remove());
        delete image.dataset.imageFailed;
        if (asset) { image.dataset.imageAsset = asset.id; image.dataset.imageName = asset.name; }
        else { delete image.dataset.imageAsset; delete image.dataset.imageName; }
        image.setAttribute('width', dimensions.width); image.setAttribute('height', dimensions.height);
      }
      if (!old) {
        const figure = document.createElement('figure'); figure.append(image);
        const target = context.blockId && blockById(context.blockId);
        if (target && position === 'before') target.before(figure);
        else if (target && position === 'after') target.after(figure);
        else sourceContent.append(figure);
      }
      applyImageFields(image, fields); normalizeContent();
      const id = image.dataset.elementId;
      closeImageEditor(); setMode('normal'); paginate(); selectBlock(id); persist(); updateImageLoadNotice();
    } catch (error) {
      if (asset) await PdfImages.remove(asset.id);
      if (current()) { $('imageDialogStatus').textContent = error.message || '이미지를 추가하지 못했습니다.'; $('saveImageBtn').disabled = false; }
    }
  });
  $('applyImageSettingsBtn').addEventListener('click', () => {
    const image = selectedImage(); if (!image) return;
    try {
      const fields = readImageFields('selectedImage');
      if (image.dataset.pdfImage && Number(image.dataset.imageWidth) === fields.width && image.dataset.imageAlign === fields.align && image.alt === fields.alt && imageCaption(image) === fields.caption) return;
      saveHistory(); applyImageFields(image, fields); normalizeContent(); paginate(); selectBlock(image.dataset.elementId);
    } catch (error) { alert(error.message); }
  });
  function updateImageLoadNotice() {
    const failed = Array.from(sourceContent.querySelectorAll('img[data-image-failed="true"]')).filter(image => !hiddenInSource(image));
    $('imageLoadNotice').hidden = failed.length === 0;
    $('imageLoadMessage').textContent = failed.length ? '불러오지 못한 이미지가 ' + failed.length + '개 있습니다. 파일 또는 URL을 확인해주세요.' : '';
  }
  function restoreBodyImages() {
    const version = documentVersion;
    window.PdfImages?.restore(sourceContent).then(() => { if (version === documentVersion) { updateImageLoadNotice(); requestPaginate(); } });
  }
  $('retryImagesBtn').addEventListener('click', async () => {
    const version = documentVersion;
    $('retryImagesBtn').disabled = true;
    await window.PdfImages?.restore(sourceContent);
    if (version !== documentVersion) { $('retryImagesBtn').disabled = false; return; }
    await Promise.all(Array.from(sourceContent.querySelectorAll('img[data-image-failed="true"]')).map(async image => {
      const url = image.getAttribute('src'); if (!url) return;
      try { await PdfImages.probe(url); if (sourceContent.contains(image)) { delete image.dataset.imageFailed; image.src = url; } } catch { /* Keep failure notice visible. */ }
    }));
    $('retryImagesBtn').disabled = false; if (version === documentVersion) { updateImageLoadNotice(); paginate(); }
  });

  function getMarkdownHistory() {
    try {
      const entries = JSON.parse(localStorage.getItem('mdeditor.history.v1') || '[]');
      return Array.isArray(entries) ? entries.filter(item => typeof item.content === 'string') : [];
    } catch { return []; }
  }
  function refreshHistory() {
    const select = $('mdHistorySelect');
    const entries = getMarkdownHistory();
    select.replaceChildren(textNode('option', entries.length ? '선택하세요' : '저장된 기록 없음'));
    select.firstChild.value = '';
    entries.slice().reverse().forEach(item => {
      const option = textNode('option', new Date(item.ts).toLocaleString() + ' · ' + (item.content.split('\n')[0].replace(/^#+\s*/, '').slice(0, 25) || '제목 없음'));
      option.value = String(item.id || item.ts);
      select.append(option);
    });
  }
  $('loadMdHistoryBtn').addEventListener('click', async () => {
    const value = $('mdHistorySelect').value;
    const item = getMarkdownHistory().find(entry => String(entry.id || entry.ts) === value);
    if (item) {
      if (hasDocument() && !await confirmDocument('새 문서를 불러오면 작업 중이던 내용과 설정이 사라집니다. 계속하시겠습니까?')) return;
      renderDocument(parseMarkdown(item.content));
    }
  });
  window.addEventListener('storage', event => { if (event.key === 'mdeditor.history.v1') refreshHistory(); });
  sourceContent.addEventListener('load', event => { if (event.target.tagName === 'IMG') { delete event.target.dataset.imageFailed; updateImageLoadNotice(); } requestPaginate(); }, true);
  sourceContent.addEventListener('error', event => { if (event.target.tagName === 'IMG') { event.target.dataset.imageFailed = 'true'; updateImageLoadNotice(); } requestPaginate(); }, true);
  sourceContent.addEventListener('toggle', requestPaginate, true);
  async function preparePrint() {
    if (printPreparing) return;
    printPreparing = true; $('downloadPdfBtn').disabled = true;
    try {
      const version = documentVersion;
      if (activeEditId) closeEditor(true);
      await document.fonts?.ready;
      if (version !== documentVersion) return;
      if (coverImageProbe?.promise) {
        await new Promise(resolve => {
          const timer = setTimeout(resolve, 3000);
          coverImageProbe.promise.then(() => { clearTimeout(timer); resolve(); });
        });
        if (version !== documentVersion) return;
      }
      await window.PdfImages?.restore(sourceContent);
      if (version !== documentVersion) return;
      const images = Array.from(sourceContent.querySelectorAll('img')).filter(image => !hiddenInSource(image) && !image.complete);
      await Promise.all(images.map(image => new Promise(resolve => {
        const done = () => { clearTimeout(timer); image.removeEventListener('load', done); image.removeEventListener('error', done); resolve(); };
        const timer = setTimeout(done, 10000);
        image.addEventListener('load', done, { once: true });
        image.addEventListener('error', done, { once: true });
        if (image.complete) done();
      })));
      if (version !== documentVersion) return;
      const failed = Array.from(sourceContent.querySelectorAll('img')).filter(image => !hiddenInSource(image) && (!image.complete || !image.naturalWidth));
      failed.forEach(image => { image.dataset.imageFailed = 'true'; }); updateImageLoadNotice();
      if (failed.length && !await confirmDocument('이미지 ' + failed.length + '개를 불러오지 못했습니다. 해당 이미지가 표시되지 않은 상태로 출력하시겠습니까?')) return;
      if (version !== documentVersion) return;
      paginate();
      persist();
      if (previewContainer.querySelector('.pdf-page')) window.print();
    } finally {
      printPreparing = false; $('downloadPdfBtn').disabled = !previewContainer.querySelector('.pdf-page');
    }
  }
  $('downloadPdfBtn').addEventListener('click', preparePrint);
  window.addEventListener('beforeprint', () => {
    committedPrint = true;
    if (activeEditId) closeEditor(true);
    else paginate();
    persist();
  });
  window.addEventListener('afterprint', () => { committedPrint = false; paginate(); });
  window.addEventListener('pagehide', persist);
  document.fonts?.ready.then(requestPaginate);
  refreshHistory();
  applySettings();
  try {
    const transferred = localStorage.getItem('pdfMakerTransfer');
    const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
    if (draft && typeof draft.html === 'string') {
      sourceContent.innerHTML = safeDocumentHtml(draft.html);
      importedStyles = draft.importedStyles || { css: [], attributes: {}, missing: [], available: false };
      settings = normalizeSettings(draft.settings || {});
      document.title = typeof draft.title === 'string' ? draft.title : 'pdf-export';
      normalizeContent();
      renderMath();
      applySettings();
      restoreBodyImages();
      const background = sourceContent.querySelector('.cover-image-layer')?.style.backgroundImage;
      checkCoverImage(background?.match(/^url\(["']?(.*?)["']?\)$/)?.[1] || null);
    }
    paginate();
    if (transferred !== null) {
      (async () => {
        if (hasDocument() && !await confirmDocument('편집기 문서를 불러오면 작업 중이던 내용과 설정이 사라집니다. 계속하시겠습니까?')) return;
        renderDocument(parseMarkdown(transferred));
        persist();
        if (!storageFailed) localStorage.removeItem('pdfMakerTransfer');
      })();
    }
  } catch (error) {
    console.error(error);
    paginate();
  }
});
