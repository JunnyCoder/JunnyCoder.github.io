// Paginated output shared by the PDF author and read-only project viewer.
// Inputs are prepared source DOM, settings and optional reflow state; output is pages.
window.DocumentRenderer = {render({source: sourceContent, container: previewContainer, settings,
    importedStyles = {css: [], attributes: {}, missing: [], available: false},
    title = '', date = new Date().toLocaleDateString('sv-SE'), pageReflow = null,
    changedId = null, pendingDesign = null}) {
  const document = previewContainer.ownerDocument;
  const getComputedStyle = node => document.defaultView.getComputedStyle(node);
  const templates = DocumentDesigns, htmlStyles = DocumentHtmlStyles;
  const hiddenInSource = node => DocumentContent.hidden(node, sourceContent);
  const findHeading = id => Array.from(sourceContent.querySelectorAll('[data-heading-id]')).find(node => node.dataset.headingId === id);
  const textNode = (tag, text, className) => {
    const node = document.createElement(tag); node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  let designHeadingNumbers, designFigureNumbers, scaledCount = 0;
  DocumentSettings.applyMargins(previewContainer, settings);
  htmlStyles.mount(importedStyles, settings.preserveHtmlCss && importedStyles.available);
  function synchronizeToc() {
    const counters = [0, 0, 0, 0, 0, 0];
    sourceContent.querySelectorAll('.toc-item').forEach(item => {
      const heading = findHeading(item.dataset.headingTarget);
      item.hidden = Boolean(item.dataset.headingTarget && (!heading || hiddenInSource(heading)));
      if (item.hidden) return;
      if (heading) {
        const level = Number(heading.tagName.slice(1));
        item.dataset.level = level;
        if (!item.dataset.customTitle) if (item.querySelector('.toc-title')) item.querySelector('.toc-title').textContent = heading.textContent.trim();
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
  function createPage(cover = false, original = true) {
    const page = document.createElement('div');
    page.className = 'pdf-page A4' + (cover ? ' cover-page-wrapper' : '');
    page.dataset.theme = settings.colorTheme;
    if (settings.enableHeaderFooter && !cover) {
      page.classList.add('with-header-footer');
      const header = document.createElement('div');
      header.className = 'pdf-header';
      header.append(textNode('span', settings.headerTitleInput || title), textNode('span', settings.footerAuthorInput));
      const footer = document.createElement('div');
      footer.className = 'pdf-footer';
      footer.append(textNode('span', date, 'footer-date'), textNode('span', '', 'page-num-slot'));
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
    if(node.matches('[data-html-block]'))return node;
    node = htmlStyles.prepare(node, settings.preserveHtmlCss && importedStyles.available);
    DocumentAssets.decorate(node);
    if (pendingDesign) [node, ...node.querySelectorAll('[data-element-id]')].forEach(element => {
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
    synchronizeToc();
    designHeadingNumbers = new Map(); designFigureNumbers = new Map();
    const designCounters = [0,0,0,0,0,0];
    const tocNumbers = new Map(Array.from(sourceContent.querySelectorAll('.toc-item[data-heading-target]')).map(item => [item.dataset.headingTarget,item.querySelector('.toc-number')?.textContent.trim()]));
    sourceContent.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(heading => {
      if (heading.closest('.cover-page,.toc-wrapper,[data-html-block]') || hiddenInSource(heading)) return;
      const level = Number(heading.tagName.slice(1)); designCounters[level-1]++; designCounters.fill(0,level);
      const first = designCounters.findIndex(n => n > 0);
      designHeadingNumbers.set(heading.dataset.elementId,templates.hasHeadingNumber(heading) ? '' : tocNumbers.get(heading.dataset.headingId) || designCounters.slice(first,level).map(n=>n || 1).join('.'));
    });
    let figureNumber = 0;
    sourceContent.querySelectorAll('figure').forEach(figure => { if (!hiddenInSource(figure) && !figure.closest('.cover-page')) designFigureNumbers.set(figure.dataset.elementId,String(++figureNumber)); });
    scaledCount = 0;
    const visible = Array.from(sourceContent.children).filter(block => !hiddenInSource(block));
    const reflow=pageReflow?.begin(visible,JSON.stringify([settings,importedStyles,title,date]),changedId,pendingDesign);
    if (!reflow) previewContainer.replaceChildren();
    scaledCount=reflow?.scaled || 0;
    if (!visible.length) return {pages: [], scaled: 0};
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
      if (!total || block.matches('.katex,img,svg,figure,video,canvas,iframe,[data-html-block]') || block.querySelector('.katex')) {
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
      if (!rows.length || Array.from(table.querySelectorAll('td,th')).some(cell => cell.rowSpan !== 1)) {
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
    visible.slice(reflow?.start || 0).forEach(block => {
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
          !block.matches('img,svg,figure,video,canvas,iframe,[data-html-block]') && !block.querySelector('.katex') &&
          (block.tagName !== 'TABLE' || !Array.from(block.querySelectorAll('td,th')).some(cell => cell.rowSpan !== 1));
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
    return {pages, scaled: scaledCount};
}};
