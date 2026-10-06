// Template metadata and tag variants live together; CSS uses the same variant IDs.
window.PdfTemplates = {
  themes: {
    modern: { name: 'Modern', description: '깔끔한 기본 문서 · 명확한 제목과 여백' },
    dev: { name: 'Dev', description: '개발 문서 · 읽기 쉬운 본문과 구분되는 코드 영역' },
    academic: { name: 'Academic', description: '연구 보고서 · 명조 본문과 가로선 중심 표' },
    report: { name: 'Report', description: '업무·성과 보고서 · 구분선과 명확한 정보 계층' },
    editorial: { name: 'Editorial', description: '에세이·백서 · 명조 본문과 여유 있는 읽기 흐름' },
    minimal: { name: 'Minimal', description: '흑백·잉크 절약 · 배경 없이 간결한 문서' }
  },
  selector: 'h1,h2,h3,h4,h5,h6,p,table,ul,ol,blockquote,pre,figure,img,details,hr,dl',
  family(tag) {
    if (/^H[1-6]$/.test(tag)) return 'heading';
    return ({ TABLE: 'table', UL: 'list', OL: 'list', PRE: 'code', BLOCKQUOTE: 'quote',
      FIGURE: 'figure', IMG: 'figure', DETAILS: 'details', HR: 'rule', DL: 'definition' })[tag] || 'text';
  },
  styles: {
    heading: [['default', '템플릿 기본'], ['h-style-1', '하단 구분선'], ['h-style-2', '왼쪽 강조선'], ['h-style-3', '가운데 제목']],
    table: [['default', '템플릿 기본'], ['t-style-1', '전체 격자'], ['t-style-3', '교차 행'], ['t-style-4', '학술 가로선']],
    list: [['default', '템플릿 기본'], ['l-style-compact', '간결한 목록'], ['l-style-3', '항목 구분선'], ['l-style-spacious', '넉넉한 간격']],
    code: [['default', '템플릿 기본'], ['code-plain', '배경 없이'], ['code-framed', '테두리 코드'], ['code-compact', '간결한 코드']],
    quote: [['default', '템플릿 기본'], ['quote-line', '인용 강조선'], ['quote-editorial', '문장 강조'], ['quote-box', '인용 상자']],
    text: [['default', '템플릿 기본'], ['text-lead', '도입 문장'], ['text-note', '안내 문장'], ['text-framed', '테두리 문장']],
    figure: [['default', '템플릿 기본'], ['figure-framed', '그림 테두리'], ['figure-caption', '캡션 구분선'], ['figure-compact', '간결한 그림']],
    details: [['default', '템플릿 기본'], ['details-line', '제목 강조선'], ['details-framed', '설명 상자'], ['details-compact', '간결한 설명']],
    rule: [['default', '템플릿 기본'], ['rule-accent', '강조 구분선'], ['rule-double', '이중 구분선'], ['rule-space', '여백 구분']],
    definition: [['default', '템플릿 기본'], ['definition-line', '용어 구분선'], ['definition-compact', '간결한 용어'], ['definition-framed', '용어 상자']]
  },
  samples: {
    heading: '<h3>01. 문서 제목</h3>', text: '<p>핵심 내용을 읽기 쉽게 정리합니다.</p>',
    table: '<table><thead><tr><th>항목</th><th>결과</th></tr></thead><tbody><tr><td>A</td><td>98.2</td></tr><tr><td>B</td><td>96.1</td></tr></tbody></table>',
    list: '<ul><li>첫 번째 항목</li><li>두 번째 항목</li></ul>', code: '<pre><code>const result = 42;</code></pre>',
    quote: '<blockquote>근거를 바탕으로 판단합니다.</blockquote>', figure: '<figure><div class="sample-image">그림</div><figcaption>그림 1. 결과</figcaption></figure>',
    details: '<details open><summary>추가 설명</summary><p>내용을 확인합니다.</p></details>', rule: '<hr>',
    definition: '<dl><dt>정확도</dt><dd>예측이 맞은 비율</dd></dl>'
  }
};

// Element designs use attributes for editable metadata; preview decorations never
// become document text, heading titles, code copies, or undo snapshots.
(() => {
  const t = window.PdfTemplates;
  const catalog = {
    heading: [['heading-chapter','장 번호 독립형','장 번호를 제목 위에 표시'],['heading-index','목차식 번호열','번호와 제목을 나란히 정렬'],['heading-tab','구간 탭','절의 시작을 작은 탭으로 구분']],
    table: [['table-compare','비교 매트릭스','기준 열과 비교 대상을 구분'],['table-numeric','수치 리포트','수량 열 정렬과 합계 행 강조'],['table-fields','필드 명세','필드 이름과 설명을 두 열로 표시']],
    list: [['list-steps','절차 흐름','단계 번호와 연결선'],['list-check','검수 체크리스트','체크 상태와 완료 항목 구분'],['list-outline','제목과 설명','항목별 제목과 설명 강조']],
    quote: [['quote-note','참고 메모','참고 라벨과 보충 설명'],['quote-warning','주의 사항','주의 라벨과 상단 강조선'],['quote-pull','핵심 문장','인용 부호와 출처 강조'],['quote-theorem','정의와 정리','학술 정의와 가정 구분']],
    text: [['text-abstract','초록과 요약','요약 제목과 키워드'],['text-conclusion','결론 강조','결과와 권고 사항 강조'],['text-dropcap','출판형 첫 글자','첫 글자를 크게 표시']],
    code: [['code-file','파일 제목','파일명과 언어 헤더'],['code-lines','줄 번호','원문과 분리된 번호 열'],['code-terminal','명령어와 출력','명령과 결과 영역 구분'],['code-diff','변경 비교','추가·삭제 행을 기호와 색으로 구분']],
    figure: [['figure-plate','기술 도판','도판 제목과 프레임'],['figure-book','책자 캡션','그림 번호와 설명·출처'],['figure-side','측면 캡션','그림 옆에 설명 배치']],
    details: [['details-faq','질문과 답변','질문 표시와 답변 들여쓰기'],['details-appendix','부록 메모','보충 조건과 상세 설명']],
    definition: [['definition-fields','필드 정의','필드 이름과 정의의 두 열'],['definition-glossary','사전형','용어 제목과 설명 문단']],
    rule: [['rule-transition','절 전환','중앙 마커와 양쪽 선'],['rule-ending','끝맺음','작은 점 세 개로 마무리']]
  };
  Object.entries(catalog).forEach(([family, designs]) => t.styles[family].push(...designs));
  t.designIds = new Set(Object.values(catalog).flat().map(([id]) => id));
  const field = (key,label,placeholder='',type='text') => ({key,label,placeholder,type});
  const label = placeholder => field('label','표시 제목',placeholder);
  t.designFields = {
    'heading-chapter':[field('number','장 번호','자동 번호 · 직접 입력 가능')],
    'heading-index':[field('number','절 번호','자동 번호 · 직접 입력 가능')],
    'table-compare':[field('column','강조할 열 (1부터)','비워두면 강조 없음','number')],
    'table-numeric':[field('columns','수량 열 번호','예: 2,3 · 날짜와 식별자는 제외')],
    'quote-note':[label('참고')], 'quote-warning':[label('주의')],
    'quote-pull':[field('source','인용 출처','직접 입력')], 'quote-theorem':[label('정의')],
    'text-abstract':[label('요약'),field('keywords','키워드','예: 분석 / 재현성')],
    'text-conclusion':[label('결론')],
    'code-file':[field('filename','파일명','예: src/report.js')],
    'code-lines':[field('start','첫 줄 번호','1','number')],
    'code-terminal':[field('outputFrom','출력 시작 줄 (1부터)','비워두면 모두 명령어','number')],
    'figure-plate':[label('도판'),field('source','출처','직접 입력')],
    'figure-book':[field('number','그림 번호','자동 번호 · 직접 입력 가능'),field('source','출처','직접 입력')],
    'figure-side':[field('source','출처','직접 입력')],
    'details-appendix':[label('부록')]
  };
  const attr = key => 'design' + key[0].toUpperCase() + key.slice(1);
  t.hasHeadingNumber = heading => /^(?:(?:제\s*)?\d+(?:[.-]\d+)*(?:[.)、．]|\s|장)|[IVX]+[.)]\s)/i.test(heading.textContent.trim());
  t.readDesign = node => Object.fromEntries((t.designFields[node.dataset.style] || []).map(({key}) => [key,node.dataset[attr(key)] || '']));
  t.validDesign = (node,id) => {
    if (id==='list-steps') return node.tagName==='OL';
    if (id==='list-check') return /^(UL|OL)$/.test(node.tagName) && node.children.length > 0 && Array.from(node.children).every(li => li.querySelector(':scope > input[type="checkbox"], :scope > p > input[type="checkbox"]'));
    if (id==='table-fields') return !!node.rows?.length && Array.from(node.rows).every(row => row.cells.length===2 && Array.from(row.cells).every(cell=>cell.colSpan===1 && cell.rowSpan===1));
    if (id==='definition-fields') return Array.from(node.children).every((child,i)=>child.tagName===(i%2 ? 'DD':'DT')) && node.children.length%2===0;
    if (id.startsWith('figure-') && t.designIds.has(id)) return node.tagName==='FIGURE';
    if (id==='code-diff') return node.dataset.codeLanguage==='diff';
    return true;
  };
  t.writeDesign = (node,id,values={}) => {
    Object.keys(node.dataset).filter(key=>key.startsWith('design')).forEach(key=>delete node.dataset[key]);
    if (id==='default') delete node.dataset.style; else node.dataset.style=id;
    (t.designFields[id] || []).forEach(({key,type}) => {
      let value=String(values[key] || '').trim().slice(0,500);
      if (type==='number') value=/^\d+$/.test(value) && Number(value)>0 ? String(Math.min(Number(value),999999)) : '';
      if (key==='columns') value=[...new Set(value.split(',').map(v=>v.trim()).filter(v=>/^\d+$/.test(v) && Number(v)>0))].join(',');
      if (value) node.dataset[attr(key)]=value;
    });
  };
  t.prepareDesign = root => {
    if (root.matches?.('.preview-body,.document-style')) {
      const counters=[0,0,0,0,0,0]; let figures=0;
      root.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(heading=>{
        const level=Number(heading.tagName.slice(1));counters[level-1]++;counters.fill(0,level);
        if (['heading-chapter','heading-index'].includes(heading.dataset.style) && (!heading.dataset.designNumber || heading.dataset.designAutoNumber)) {
          heading.dataset.designNumber=t.hasHeadingNumber(heading) ? '' : counters.slice(counters.findIndex(n=>n>0),level).map(n=>n || 1).join('.');
          heading.dataset.designAutoNumber='true';
        }
      });
      root.querySelectorAll('figure').forEach(figure=>{figures++;if (figure.dataset.style==='figure-book' && (!figure.dataset.designNumber || figure.dataset.designAutoNumber)) {figure.dataset.designNumber=String(figures);figure.dataset.designAutoNumber='true';}});
    }
    const nodes=[root,...root.querySelectorAll('[data-style]')];
    nodes.forEach(node=>{
      const id=node.dataset.style;
      if (!t.designIds.has(id)) return;
      if (id==='definition-fields' && !t.validDesign(node,id)) { node.dataset.style='definition-glossary';return; }
      node.dataset.designDisplayLabel=node.dataset.designLabel || ({'quote-note':'ⓘ 참고','quote-warning':'⚠ 주의','quote-theorem':'정의','text-abstract':'요약','text-conclusion':'결론','figure-plate':'도판','details-appendix':'부록'}[id] || '');
      if (id==='table-compare' || id==='table-numeric') {
        const columns=new Set((node.dataset.designColumns || '').split(',').map(Number));
        const selected=Number(node.dataset.designColumn);
        let occupied=[], section=null;
        Array.from(node.rows || []).forEach(row=>{
          if (section!==row.parentElement) { section=row.parentElement;occupied=[]; }
          let column=1;
          Array.from(row.cells).forEach(cell=>{
            while (occupied[column]>0) column++;
            cell.removeAttribute('data-design-highlight');cell.removeAttribute('data-design-numeric');
            if (id==='table-compare' && selected>=column && selected<column+cell.colSpan) cell.dataset.designHighlight='true';
            if (id==='table-numeric' && cell.colSpan===1 && columns.has(column)) cell.dataset.designNumeric='true';
            const rows=cell.rowSpan || Array.from(section.rows).length-row.sectionRowIndex;
            for (let i=column;i<column+cell.colSpan;i++) occupied[i]=rows;
            column+=cell.colSpan;
          });
          occupied=occupied.map(n=>Math.max(0,n-1));
        });
      }
      if (id==='list-steps') Array.from(node.children).forEach((li,i)=>{
        const index=Number(li.dataset.listIndex ?? i);
        li.dataset.designStep=String(Number(node.getAttribute('start') || (node.reversed ? node.children.length : 1))+(node.reversed ? -1:1)*(node.dataset.fragment==='true' ? i:index));
      });
      if (id==='list-check') Array.from(node.children).forEach(li=>{li.dataset.designChecked=String(!!li.querySelector(':scope > input[type="checkbox"]:checked, :scope > p > input[type="checkbox"]:checked'));});
      if (id.startsWith('figure-')) {
        const caption=node.querySelector(':scope > figcaption');
        if (caption) {
          if (node.dataset.designNumber) caption.dataset.designNumber=node.dataset.designNumber;
          else delete caption.dataset.designNumber;
          if (node.dataset.designSource) caption.dataset.designSource=node.dataset.designSource;
          else delete caption.dataset.designSource;
        }
      }
      if (node.tagName==='PRE') window.SharedCodeBlocks?.format?.(node);
    });
    return root;
  };
  t.sampleFor = (family,id,tag) => {
    if (family==='heading' && t.designIds.has(id)) return '<h3>문서 제목</h3>';
    const samples={
      'table-compare':'<table data-design-column="3"><thead><tr><th>基準</th><th>기존</th><th>개선</th></tr></thead><tbody><tr><th>검사</th><td>수기</td><td>자동</td></tr><tr><th>시점</th><td>종료 후</td><td>진행 중</td></tr></tbody></table>',
      'table-numeric':'<table data-design-columns="2,3"><thead><tr><th>기간</th><th>전체</th><th>통과</th></tr></thead><tbody><tr><td>1분기</td><td>1,248</td><td>1,210</td></tr></tbody><tfoot><tr><th>합계</th><td>1,248</td><td>1,210</td></tr></tfoot></table>',
      'table-fields':'<table><tbody><tr><th>batch_id</th><td>배치 식별자</td></tr><tr><th>threshold</th><td>판정 기준값</td></tr></tbody></table>',
      'list-steps':'<ol><li><strong>자료 준비</strong><p>원본 기록 확인</p></li><li><strong>결과 검토</strong></li></ol>',
      'list-check':'<ul><li><input type="checkbox" checked disabled> 자료 확인</li><li><input type="checkbox" disabled> 결과 검토</li></ul>',
      'list-outline':'<ul><li><strong>재현성</strong><p>조건을 함께 기록합니다.</p></li><li><strong>추적성</strong><p>출처를 보관합니다.</p></li></ul>',
      'quote-pull':'<blockquote data-design-source="Junny">작은 실험이 큰 개선으로 이어집니다.</blockquote>',
      'quote-theorem':'<blockquote>같은 조건에서 결과를 다시 얻을 수 있는 성질.</blockquote>',
      'text-abstract':'<p data-design-keywords="분석 / 재현성">자료의 일관성과 분석의 재현성을 검토합니다.</p>',
      'code-file':'<pre data-design-filename="src/report.js"><code>const report = create(data);</code></pre>',
      'code-lines':'<pre><code>def validate(data):\n    return bool(data)\n</code></pre>',
      'code-terminal':'<pre data-design-output-from="2"><code>npm run build\nBuild completed.\n</code></pre>',
      'code-diff':'<pre data-code-language="diff"><code>- timeout: 1000\n+ timeout: 5000\n</code></pre>',
      'figure-plate':'<figure data-design-label="측정 대상"><div class="sample-image">도판</div><figcaption>형상과 측정 위치</figcaption></figure>',
      'figure-book':'<figure data-design-number="1" data-design-source="직접 작성"><div class="sample-image">그림</div><figcaption>측정 대상의 구조</figcaption></figure>',
      'figure-side':'<figure><div class="sample-image">그림</div><figcaption>측정 위치 설명</figcaption></figure>'
    };
    if (samples[id]) return samples[id].replace('基準','기준');
    if (family==='list' && tag==='OL') return t.samples.list.replaceAll('ul>','ol>');
    return t.samples[family];
  };
  t.exportCss = () => {
    try { return Array.from(document.querySelector('link[data-element-style]')?.sheet?.cssRules || []).map(rule=>rule.cssText).join('\n'); } catch { return ''; }
  };
})();
