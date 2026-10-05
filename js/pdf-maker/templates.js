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
