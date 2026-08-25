document.addEventListener('DOMContentLoaded', () => {
  const sourceContent = document.getElementById('sourceContent');
  const previewContainer = document.getElementById('pdfPreviewContainer');
  const historySelect = document.getElementById('mdHistorySelect');
  const tocActionPopup = document.getElementById('tocActionPopup');
  
  let isBreakMode = false, isDeleteMode = false;
  let selectedBlockId = null, selectedTagName = null;
  let activeTocItem = null;
  let selectedPresetClass = null;

  initMarginControls(); // [추가] 여백 조절 이벤트 초기화
  initCodeBlockEvents(); // [추가] 코드블럭 드래그 방지 초기화

  // 템플릿 정보 사전
  const STYLE_PRESETS = [
    { id: 'style-preset-default', name: '기본 (Default)' },
    { id: 'style-preset-highlight', name: '강조 박스' },
    { id: 'style-preset-bordered', name: '테두리 상자' },
    { id: 'style-preset-card', name: '입체 카드' }
  ];

  // === 0. 우측 패널 디자인 템플릿 Grid 생성 및 이벤트 등록 ===
  const initRightPanel = () => {
    const grid = document.getElementById('stylePreviewGrid');
    if (!grid) return;
    grid.innerHTML = '';

    STYLE_PRESETS.forEach(preset => {
      const item = document.createElement('div');
      item.className = 'preview-item';
      item.setAttribute('data-preset', preset.id);
      item.textContent = preset.name;
      item.addEventListener('click', () => {
        grid.querySelectorAll('.preview-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        selectedPresetClass = preset.id;
      });
      grid.appendChild(item);
    });

    // 개별 줄 간격 변경 시 적용
    document.getElementById('elementLineHeight')?.addEventListener('input', (e) => {
      if (!selectedBlockId || !sourceContent) return;
      const target = sourceContent.querySelector(`[data-block-id="${selectedBlockId}"]`);
      if (target) {
        saveHistory();
        target.style.lineHeight = e.target.value || '';
        paginate();
      }
    });

    // 선택 요소에 프리셋 적용
    document.getElementById('applyToSelectedBtn')?.addEventListener('click', () => {
      if (!selectedBlockId || !selectedPresetClass || !sourceContent) return;
      const target = sourceContent.querySelector(`[data-block-id="${selectedBlockId}"]`);
      if (target) {
        saveHistory();
        STYLE_PRESETS.forEach(p => target.classList.remove(p.id));
        if (selectedPresetClass !== 'style-preset-default') {
          target.classList.add(selectedPresetClass);
        }
        paginate();
      }
    });

    // 동일 태그 전체 적용
    document.getElementById('applyToAllBtn')?.addEventListener('click', () => {
      if (!selectedTagName || !selectedPresetClass || !sourceContent) return;
      saveHistory();
      const targets = sourceContent.querySelectorAll(selectedTagName);
      targets.forEach(el => {
        STYLE_PRESETS.forEach(p => el.classList.remove(p.id));
        if (selectedPresetClass !== 'style-preset-default') {
          el.classList.add(selectedPresetClass);
        }
      });
      paginate();
    });
  };
  initRightPanel();

  // === 1. 문서 제목 설정 유틸리티 ===
  const setDocumentTitle = (htmlString, fileName = null) => {
    if (fileName) {
      const cleanName = fileName.replace(/\.[^/.]+$/, "").trim();
      if (cleanName) {
        document.title = cleanName;
        const input = document.getElementById('headerTitleInput');
        if (input && !input.value) input.value = cleanName;
        return;
      }
    }
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    const h1 = tempDiv.querySelector('h1');
    if (h1 && h1.textContent.trim()) {
      const cleanH1 = h1.textContent.trim().replace(/[\\/:*?"<>|]/g, '');
      if (cleanH1) {
        document.title = cleanH1;
        const input = document.getElementById('headerTitleInput');
        if (input && !input.value) input.value = cleanH1;
        return;
      }
    }
    document.title = 'pdf-export';
  };

  // === 2. History (되돌리기) 관리 ===
  let historyStack = [];
  const updateUndoUI = () => {
    const btn = document.getElementById('undoBtn');
    const count = document.getElementById('undoCount');
    if (btn && count) {
      btn.disabled = historyStack.length === 0;
      count.textContent = historyStack.length;
    }
  };
  
  const saveHistory = () => {
    if (!sourceContent) return;
    historyStack.push(sourceContent.innerHTML);
    if (historyStack.length > 10) historyStack.shift();
    updateUndoUI();
  };

  document.getElementById('undoBtn')?.addEventListener('click', () => {
    if (historyStack.length === 0) return;
    sourceContent.innerHTML = historyStack.pop();
    updateUndoUI();
    paginate();
  });

  // === 3. 페이지 레이아웃 엔진 ===
  const createNewPage = (pageIndex) => {
    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'pdf-page A4';

    const themeEl = document.getElementById('colorTheme');
    if (themeEl) {
      pageWrapper.setAttribute('data-theme', themeEl.value);
    }


    const enableHF = document.getElementById('enableHeaderFooter')?.checked;
    if (enableHF) {
      const headerTitle = document.getElementById('headerTitleInput')?.value || document.title;
      const authorName = document.getElementById('footerAuthorInput')?.value || '';
      const todayDate = new Date().toISOString().slice(0, 10);

      const headerDiv = document.createElement('div');
      headerDiv.className = 'pdf-header';
      headerDiv.innerHTML = `<span>${headerTitle}</span><span>${authorName}</span>`;
      pageWrapper.appendChild(headerDiv);

      const footerDiv = document.createElement('div');
      footerDiv.className = 'pdf-footer';
      footerDiv.innerHTML = `<span class="footer-date">${todayDate}</span><span class="page-num-slot">${pageIndex}</span>`;
      pageWrapper.appendChild(footerDiv);
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'pdf-content';
    
    const fontEl = document.getElementById('fontSize');
    const lineEl = document.getElementById('globalLineHeight');

    if (fontEl) contentDiv.style.fontSize = `${fontEl.value}pt`;
    if (lineEl) contentDiv.style.lineHeight = lineEl.value;
    
    pageWrapper.appendChild(contentDiv);
    if (previewContainer) previewContainer.appendChild(pageWrapper);
    return pageWrapper;
  };

  const paginate = () => {
    if (!sourceContent || sourceContent.children.length === 0 || !previewContainer) return; 

    previewContainer.innerHTML = '';
    let pageCount = 1;
    let currentPage = createNewPage(pageCount);
    let currentContentContainer = currentPage.querySelector('.pdf-content');
    
    Array.from(sourceContent.children).forEach(block => {
      if (block.style.display === 'none') return;
      const clone = block.cloneNode(true);
      currentContentContainer.appendChild(clone);
      
      if (block.classList.contains('page-break-before') || currentContentContainer.offsetHeight > 960) {
        currentContentContainer.removeChild(clone); 
        pageCount++;
        currentPage = createNewPage(pageCount); 
        currentContentContainer = currentPage.querySelector('.pdf-content');
        currentContentContainer.appendChild(clone); 
      }
    });

    const allPages = previewContainer.querySelectorAll('.pdf-page');
    allPages.forEach((pg, idx) => {
      const slot = pg.querySelector('.page-num-slot');
      if (slot) slot.textContent = `${idx + 1} / ${allPages.length}`;
    });

    if (selectedBlockId && !isBreakMode && !isDeleteMode) {
      const activeClone = previewContainer.querySelector(`[data-block-id="${selectedBlockId}"]`);
      if (activeClone) activeClone.classList.add('selected-element');
    }
  };

  ['colorTheme', 'fontSize', 'globalLineHeight', 'enableHeaderFooter', 'headerTitleInput', 'footerAuthorInput'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', paginate);
  });

  // === 4. 파일 로드 및 정제 ===
  const renderDocument = (htmlString, fileName = null) => {
    setDocumentTitle(htmlString, fileName);
    sourceContent.innerHTML = DOMPurify.sanitize(htmlString, { USE_PROFILES: { html: true } });
    
    if (window.renderMathInElement) {
      window.renderMathInElement(sourceContent, { 
        delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}] 
      });
    }

    Array.from(sourceContent.children).forEach((child, i) => {
      child.setAttribute('data-block-id', `block-${Date.now()}-${i}`);
    });
    
    historyStack = [];
    updateUndoUI();
    const rightPanel = document.getElementById('rightPanel');
    if (rightPanel) rightPanel.style.display = 'none';
    selectedBlockId = null;
    paginate();
  };

  document.getElementById('mdFileInput')?.addEventListener('change', async (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      renderDocument(marked.parse(await file.text()), file.name); 
      e.target.value = ''; 
    }
  });

  document.getElementById('htmlFileInput')?.addEventListener('change', async (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      renderDocument(await file.text(), file.name); 
      e.target.value = ''; 
    }
  });

  const dropZone = document.getElementById('dropZone');
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault(); 
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (file.name.endsWith('.md')) renderDocument(marked.parse(await file.text()), file.name);
      else if (file.name.endsWith('.html')) renderDocument(await file.text(), file.name);
    });
  }

  // === 5. 상단 툴바 제어 ===
  const resetModes = () => { 
    isBreakMode = isDeleteMode = false; 
    document.getElementById('toggleBreakMode')?.classList.remove('active');
    document.getElementById('toggleDeleteMode')?.classList.remove('active');
    if (previewContainer) previewContainer.className = 'preview-panel';
  };
  
  document.getElementById('toggleBreakMode')?.addEventListener('click', function() {
    const isActive = isBreakMode; resetModes();
    if (!isActive) { isBreakMode = true; this.classList.add('active'); previewContainer.className = 'preview-panel edit-break-mode'; }
  });
  
  document.getElementById('toggleDeleteMode')?.addEventListener('click', function() {
    const isActive = isDeleteMode; resetModes();
    if (!isActive) { isDeleteMode = true; this.classList.add('active'); previewContainer.className = 'preview-panel edit-delete-mode'; }
  });

  // === 6. 표지 & 목차 생성기 ===
  document.getElementById('generateTocBtn')?.addEventListener('click', () => {
    saveHistory();
    sourceContent.querySelector('.toc-wrapper')?.remove();

    const headers = sourceContent.querySelectorAll('h1, h2, h3');
    if (headers.length === 0) { alert('목차로 생성할 H1~H3 제목이 없습니다.'); return; }

    const tocContainer = document.createElement('div');
    tocContainer.className = 'toc-wrapper page-break-before';
    tocContainer.setAttribute('data-block-id', `block-${Date.now()}-toc`);
    
    let tocHtml = '<h2>목차</h2>';
    headers.forEach((h, i) => {
      const level = h.tagName.toLowerCase().replace('h', '');
      tocHtml += `
        <div class="toc-item toc-level-${level}" data-toc-id="toc-item-${i}">
          <span class="toc-title">${h.textContent.trim()}</span>
          <span class="toc-dots"></span>
          <span class="toc-page">-</span>
        </div>`;
    });
    
    tocContainer.innerHTML = tocHtml;
    const cover = sourceContent.querySelector('.cover-page');
    if (cover && cover.nextSibling) sourceContent.insertBefore(tocContainer, cover.nextSibling);
    else sourceContent.insertBefore(tocContainer, sourceContent.firstChild);

    paginate();
  });

  document.getElementById('generateCoverBtn')?.addEventListener('click', () => {
    saveHistory();
    sourceContent.querySelector('.cover-page')?.remove();

    const docTitle = document.getElementById('headerTitleInput')?.value || document.title;
    const subtitle = document.getElementById('coverSubtitleInput')?.value || 'STUDY GUIDE & REFERENCE';
    const author = document.getElementById('footerAuthorInput')?.value || '작성자 미지정';
    const bgStyle = document.getElementById('coverBgInput')?.value || 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
    const imgUrl = document.getElementById('coverImgInput')?.value;

    const coverContainer = document.createElement('div');
    coverContainer.className = 'cover-page page-break-before';
    coverContainer.setAttribute('data-block-id', `block-${Date.now()}-cover`);
    coverContainer.style.background = imgUrl ? `url('${imgUrl}')` : bgStyle;

    coverContainer.innerHTML = `
      <div class="cover-title-group">
        <h1>${docTitle}</h1>
        <h3>${subtitle}</h3>
      </div>
      <div class="cover-meta-group">
        <p><strong>작성자:</strong> ${author}</p>
        <p><strong>발행일:</strong> ${new Date().toISOString().slice(0, 10)}</p>
      </div>
    `;

    sourceContent.insertBefore(coverContainer, sourceContent.firstChild);
    const configPanel = document.getElementById('coverConfigPanel');
    if (configPanel) configPanel.style.display = 'block';
    paginate();
  });

  // === 7. 미리보기 인터랙션 (클릭 & 더블클릭) ===
  if (previewContainer) {
    previewContainer.addEventListener('dblclick', (e) => {
      if (isBreakMode || isDeleteMode) return;
      const block = e.target.closest('[data-block-id]');
      if (!block || block.classList.contains('toc-wrapper')) return;
      block.setAttribute('contenteditable', 'true');
      block.focus();

      block.addEventListener('blur', function handler() {
        block.removeAttribute('contenteditable');
        const sourceBlock = sourceContent.querySelector(`[data-block-id="${block.getAttribute('data-block-id')}"]`);
        if (sourceBlock && sourceBlock.innerHTML !== block.innerHTML) {
          saveHistory(); 
          sourceBlock.innerHTML = block.innerHTML; 
        }
        block.removeEventListener('blur', handler);
        paginate();
      });
    });

    previewContainer.addEventListener('click', (e) => {
      const target = e.target.closest('[data-block-id]');
      if (!target) return;
      const blockId = target.getAttribute('data-block-id');
      const sourceBlock = sourceContent.querySelector(`[data-block-id="${blockId}"]`);
      if (!sourceBlock) return;

      if (isBreakMode) { saveHistory(); sourceBlock.classList.toggle('page-break-before'); paginate(); return; }
      if (isDeleteMode) { saveHistory(); sourceBlock.style.display = 'none'; paginate(); return; }

      selectedBlockId = blockId;
      selectedTagName = sourceBlock.tagName;
      
      const tagSpan = document.getElementById('selectedTagType');
      if (tagSpan) tagSpan.textContent = `<${selectedTagName.toLowerCase()}>`;

      const lhInput = document.getElementById('elementLineHeight');
      if (lhInput) lhInput.value = sourceBlock.style.lineHeight || '';

      const rightPanel = document.getElementById('rightPanel');
      if (rightPanel) rightPanel.style.display = 'block';
      paginate();
    });
  }

  document.getElementById('downloadPdfBtn')?.addEventListener('click', () => window.print());

  // === 8. 히스토리 로드 ===
  const loadHistoryOptions = () => {
    try {
      const historyRaw = localStorage.getItem('mdeditor.history.v1');
      if (historyRaw && historySelect) {
        const history = JSON.parse(historyRaw);
        if (history.length > 0) {
          historySelect.innerHTML = '<option value="">선택하세요</option>';
          history.slice().reverse().forEach(item => {
            const date = new Date(item.ts);
            const label = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
            const opt = document.createElement('option');
            opt.value = item.ts;
            const title = item.content.split('\n')[0].replace(/#/g, '').trim().substring(0, 15);
            opt.textContent = `${label} - ${title || '내용 없음'}`;
            historySelect.appendChild(opt);
          });
        }
      }
    } catch (e) { console.error(e); }
  };
  loadHistoryOptions();

  document.getElementById('loadMdHistoryBtn')?.addEventListener('click', () => {
    if (!historySelect || !historySelect.value) return;
    const historyRaw = localStorage.getItem('mdeditor.history.v1');
    if (!historyRaw) return;
    const history = JSON.parse(historyRaw);
    const target = history.find(h => h.ts == Number(historySelect.value) || h.ts == historySelect.value);
    if (target) renderDocument(marked.parse(target.content));
  });

  const transferData = localStorage.getItem('pdfMakerTransfer');
  if (transferData) {
    renderDocument(marked.parse(transferData));
    localStorage.removeItem('pdfMakerTransfer'); 
  }
  // === [추가됨] 여백 조절 및 코드블럭 이벤트 제어 함수 ===
  function initMarginControls() {
    const marginMap = {
      marginTop: 'paddingTop',
      marginBottom: 'paddingBottom',
      marginLeft: 'paddingLeft',
      marginRight: 'paddingRight'
    };

    Object.entries(marginMap).forEach(([inputId, styleProp]) => {
      const el = document.getElementById(inputId);
      if (!el) return;

      el.addEventListener('input', (e) => {
        const val = e.target.value || 0;
        const cssVarName = `--page-${inputId.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        
        // 1. Root CSS 변수 업데이트
        document.documentElement.style.setProperty(cssVarName, `${val}mm`);

        // 2. 현재 렌더링된 모든 페이지 노드에 직접 패딩 적용 (우선순위 차단)
        const pages = document.querySelectorAll('.pdf-page');
        pages.forEach(page => {
          page.style[styleProp] = `${val}mm`;
        });

        // 3. 페이지 재분할 연산 트리거 (디바운싱)
        clearTimeout(window.marginDebounce);
        window.marginDebounce = setTimeout(() => {
          if (typeof paginate === 'function') {
            paginate();
          }
        }, 150);
      });
    });
  }

  function initCodeBlockEvents() {
    if(!previewContainer) return;
    previewContainer.addEventListener('mousedown', (e) => {
      if (e.target.closest('pre, code')) e.stopPropagation();
    }, true);
    previewContainer.addEventListener('dragstart', (e) => {
      if (e.target.closest('pre, code')) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }
});