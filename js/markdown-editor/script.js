(function(){

  /* ================= Example content ================= */
  var legacyExampleLines = [
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
  var legacyExampleMarkdown = legacyExampleLines.join('\n');

  var exampleLines = [
    "# Hello from Junny",
    "",
    "Markdown과 HTML 문서 태그의 렌더링 테스트 예제입니다. 내용을 수정하면서 미리보기와 PDF 출력을 비교해보세요.",
    "",
    "## 1. 제목과 문단",
    "",
    "# H1 · 큰 제목",
    "## H2 · 장 제목",
    "### H3 · 절 제목",
    "#### H4 · 소제목",
    "##### H5 · 작은 제목",
    "###### H6 · 가장 작은 제목",
    "",
    "Setext 제목 H1",
    "==============",
    "",
    "Setext 제목 H2",
    "--------------",
    "",
    "일반 문단입니다. 한 번의 줄바꿈은 같은 문단으로 이어지고,",
    "빈 줄을 넣으면 새 문단이 됩니다.",
    "",
    "공백 두 칸으로 줄을 바꿉니다.  ",
    "이 문장은 다음 줄에 표시됩니다.<br>HTML의 br 태그로도 줄을 바꿀 수 있습니다.",
    "",
    "---",
    "",
    "## 2. 글자 꾸미기와 단축키",
    "",
    "**굵게** · *기울임* · ***굵게 + 기울임*** · ~~취소선~~ · <mark>형광펜 강조</mark>",
    "",
    "- 굵게: Ctrl + B (Mac: ⌘ + B)",
    "- 취소선: Ctrl + Shift + S",
    "- 기울임: Ctrl + I",
    "- 형광펜 강조: Ctrl + M",
    "",
    "HTML 표현: <strong>strong</strong>, <b>b</b>, <em>em</em>, <i>i</i>, <del>del</del>, <s>s</s>, <u>u</u>, <ins>ins</ins>, <small>small</small>.",
    "",
    "위첨자: x<sup>2</sup> · 아래첨자: H<sub>2</sub>O · <span>span 안의 텍스트</span>",
    "",
    "짧은 인용: <q>작은 실험이 큰 개선으로 이어집니다.</q> — <cite>Junny의 노트</cite>",
    "",
    "용어: <abbr title=\"HyperText Markup Language\">HTML</abbr> · <dfn>렌더링</dfn>은 문서를 화면에 표현하는 과정입니다.",
    "",
    "키보드: <kbd>Ctrl</kbd> + <kbd>S</kbd> · 출력: <samp>Hello, Junny!</samp> · 변수: <var>x</var>",
    "",
    "날짜: <time datetime=\"2026-10-06\">2026년 10월 6일</time> · 루비: <ruby>漢<rp>(</rp><rt>한</rt><rp>)</rp></ruby>",
    "",
    "문법을 그대로 보여주기: \\*기울임 아님\\*, \\# 제목 아님, &lt;mark&gt;태그 이름&lt;/mark&gt;, &amp; 기호.",
    "",
    "긴 단어 중간의 줄바꿈 후보: very<wbr>long<wbr>word.",
    "",
    "## HTML 고유 블록 · PDF용",
    "",
    "Markdown으로 표현하기 어려운 병합 표는 HTML 허용 모드에서 하나의 블록으로 보존합니다.",
    "",
    "```junny-html",
    "<style>table{width:100%;border-collapse:collapse}td,th{border:1px solid #8b95a5;padding:10px}th{background:#e8eef8}</style>",
    "<table><tr><th colspan=\"2\">병합된 제목</th></tr><tr><td>왼쪽</td><td>오른쪽</td></tr></table>",
    "```",
    "",
    "## 3. 목록과 체크리스트",
    "",
    "- 불릿 항목",
    "  - 하위 불릿 항목",
    "  - **굵게**와 `코드`가 들어간 항목",
    "- 다음 불릿 항목",
    "",
    "1. 첫 번째 순서",
    "2. 두 번째 순서",
    "   1. 하위 순서",
    "   2. 다음 하위 순서",
    "",
    "번호를 지정해서 시작하는 목록:",
    "",
    "5. 5번에서 시작하는 순서 목록",
    "6. 다음 번호",
    "",
    "- [x] 완료된 작업",
    "- [ ] 진행 중인 작업",
    "- [ ] 미리보기 확인",
    "",
    "<ol type=\"A\" start=\"3\"><li>HTML 알파벳 목록: C</li><li>HTML 알파벳 목록: D</li></ol>",
    "",
    "<dl>",
    "<dt>Markdown</dt><dd>텍스트로 문서 구조를 표현하는 문법입니다.</dd>",
    "<dt>HTML</dt><dd>태그로 문서의 구조와 의미를 표현합니다.</dd>",
    "</dl>",
    "",
    "## 4. 인용문",
    "",
    "> 인용문입니다. **강조**와 [링크](https://example.com)도 사용할 수 있습니다.",
    ">",
    "> 두 번째 문단입니다.",
    ">",
    "> > 중첩 인용문입니다.",
    "",
    "## 5. 링크와 이미지",
    "",
    "[일반 링크](https://example.com \"링크 제목\") · [참조형 링크][junny-reference] · <https://example.com>",
    "",
    "[junny-reference]: https://example.com \"참조형 링크 제목\"",
    "",
    "![Junny 이미지 예제](../assets/img/favicon_main.png \"이미지 제목\")",
    "",
    "<figure>",
    "<img src=\"../assets/img/favicon_main.png\" alt=\"HTML 이미지 예제\" width=\"120\" height=\"120\">",
    "<figcaption>figure / img / figcaption으로 구성한 그림과 설명입니다.</figcaption>",
    "</figure>",
    "",
    "## 6. 표",
    "",
    "| 왼쪽 정렬 | 가운데 정렬 | 오른쪽 정렬 |",
    "| :--- | :---: | ---: |",
    "| **굵게** | *기울임* | 1,000 |",
    "| `inline code` | <mark>강조</mark> | 2,000 |",
    "| 두 줄<br>내용 | ~~취소선~~ | 3,000 |",
    "",
    "<table>",
    "<caption>HTML 표: caption / colgroup / thead / tbody / tfoot / tr / th / td</caption>",
    "<colgroup><col><col><col></colgroup>",
    "<thead><tr><th scope=\"col\">구분</th><th scope=\"col\">설명</th><th scope=\"col\">개수</th></tr></thead>",
    "<tbody>",
    "<tr><th scope=\"row\" rowspan=\"2\">병합된 행</th><td>첫 번째 내용</td><td>2</td></tr>",
    "<tr><td>두 번째 내용</td><td>3</td></tr>",
    "<tr><td colspan=\"2\">병합된 열</td><td>5</td></tr>",
    "</tbody>",
    "<tfoot><tr><th colspan=\"2\">합계</th><td>10</td></tr></tfoot>",
    "</table>",
    "",
    "## 7. 코드",
    "",
    "인라인 코드: `const name = \"Junny\";` · 백틱 포함: `` `code` ``",
    "",
    "```javascript",
    "function greet(name) {",
    "  return `Hello, ${name}!`;",
    "}",
    "console.log(greet(\"Junny\"));",
    "```",
    "",
    "```python",
    "def greet(name):",
    "    return f\"Hello, {name}!\"",
    "```",
    "",
    "```html",
    "<article>",
    "  <h1>Hello from Junny</h1>",
    "  <p>HTML 코드도 텍스트 그대로 보여야 합니다.</p>",
    "</article>",
    "```",
    "",
    "```css",
    ".card {",
    "  display: grid;",
    "  gap: 12px;",
    "}",
    "```",
    "",
    "```json",
    "{\"name\": \"Junny\", \"enabled\": true, \"count\": 3}",
    "```",
    "",
    "```bash",
    "printf 'Hello, Junny!\\n'",
    "```",
    "",
    "```",
    "언어를 지정하지 않은 코드 블록입니다.",
    "오른쪽 위에서 언어를 선택할 수 있습니다.",
    "```",
    "",
    "<pre><code>HTML pre / code 블록입니다.",
    "&lt;mark&gt;이 내용은 태그가 아니라 코드입니다.&lt;/mark&gt;",
    "언어를 선택하기 전에는 Plain text로 표시됩니다.</code></pre>",
    "",
    "## 8. 접기 블록",
    "",
    "<details open>",
    "<summary>열려 있는 접기 블록: summary를 클릭하세요</summary>",
    "",
    "접기 블록 안에서도 **굵게**, *기울임*, ~~취소선~~, <mark>강조</mark>를 확인할 수 있습니다.",
    "",
    "- 첫 번째 항목",
    "- 두 번째 항목",
    "",
    "</details>",
    "",
    "<details>",
    "<summary>처음에는 닫혀 있는 블록</summary>",
    "",
    "펼치면 이 문장이 보입니다.",
    "",
    "</details>",
    "",
    "## 9. 수식 (KaTeX)",
    "",
    "인라인 수식: $x_i^2 + y_j^2 = r^2$ · 분수: $\\frac{a+b}{c+d}$",
    "",
    "블록 수식 — 분수 / 지수 / 아래첨자 / 제곱근:",
    "",
    "$$",
    "f(x) = \\frac{x_i^2 + \\sqrt{y}}{1 + x^{n+1}}",
    "$$",
    "",
    "행렬:",
    "",
    "$$",
    "\\begin{bmatrix}",
    "a & b \\cr",
    "c & d",
    "\\end{bmatrix}",
    "$$",
    "",
    "여러 줄 수식:",
    "",
    "$$",
    "\\begin{aligned}",
    "x_i &= \\frac{a}{b} \\cr",
    "y^2 &= x_i + 1",
    "\\end{aligned}",
    "$$",
    "",
    "## 10. HTML 문서 구조",
    "",
    "<section>",
    "<header><h3>section / header / h3</h3></header>",
    "<article><p>article 안의 p입니다. <span>span 안의 글자</span>도 표시됩니다.</p></article>",
    "<aside><p>aside: 본문을 보충하는 설명입니다.</p></aside>",
    "<nav><a href=\"https://example.com\">nav: 탐색 링크</a></nav>",
    "<div><p>div: 여러 요소를 묶는 컨테이너입니다.</p></div>",
    "<footer><small>footer: 문서 하단의 보조 정보입니다.</small></footer>",
    "</section>",
    "",
    "<address>문서 작성자: Junny</address>",
    "",
    "---",
    "",
    "예제를 수정한 후 **HTML 복사**, **.html 다운로드**, **PDF 편집**으로 같은 내용을 비교해보세요.",
    ""
  ];
  exampleLines = exampleLines.concat([
    "",
    "## 11. 요소별 디자인 샘플",
    "",
    "아래 HTML 태그의 디자인은 PDF 편집으로 보내도 유지됩니다. 요소를 선택하면 디자인과 세부 설정을 바꿀 수 있습니다.",
    "",
    "### 제목과 본문",
    "",
    "<h2 data-style=\"heading-chapter\" data-design-number=\"01\">장 번호 독립형</h2>",
    "<h3 data-style=\"heading-index\" data-design-number=\"1.1\">목차식 번호열</h3>",
    "<h3 data-style=\"heading-tab\">구간 탭</h3>",
    "<p data-style=\"text-abstract\" data-design-label=\"초록\" data-design-keywords=\"분석 / 재현성 / 문서화\">자료의 일관성과 분석의 재현성을 검토합니다.</p>",
    "<p data-style=\"text-conclusion\">측정 결과를 비교하기 전에 <strong>기록 기준을 먼저 통일해야 합니다.</strong></p>",
    "<p data-style=\"text-dropcap\">문서는 생각을 정리하는 공간입니다. 정보의 구조와 문장의 흐름을 함께 확인하세요.</p>",
    "",
    "### 표 · 비교 / 수치 / 명세",
    "",
    "미리보기용 예시 데이터입니다. 수량 열은 지정된 열만 오른쪽 정렬합니다. 합계는 입력한 값을 표시합니다.",
    "",
    "<table data-style=\"table-compare\" data-design-column=\"3\"><thead><tr><th>비교 항목</th><th>기존 방식</th><th>개선 방식</th></tr></thead><tbody><tr><th>검사 시점</th><td>작업 종료 후</td><td>공정 진행 중</td></tr><tr><th>기록 방법</th><td>수기 입력</td><td>자동 수집</td></tr></tbody></table>",
    "<table data-style=\"table-numeric\" data-design-columns=\"2,3\"><thead><tr><th>기간</th><th>전체 (건)</th><th>통과 (건)</th></tr></thead><tbody><tr><th>1분기</th><td>1,248</td><td>1,210</td></tr><tr><th>2분기</th><td>1,562</td><td>1,519</td></tr></tbody><tfoot><tr><th>합계</th><td>2,810</td><td>2,729</td></tr></tfoot></table>",
    "<table data-style=\"table-fields\"><tbody><tr><th>batch_id</th><td>배치 식별자</td></tr><tr><th>threshold</th><td>판정 기준값</td></tr></tbody></table>",
    "",
    "### 목록 · 절차 / 체크 / 제목과 설명",
    "",
    "<ol data-style=\"list-steps\" start=\"3\"><li><strong>자료 준비</strong><p>원본 기록을 확인합니다.</p></li><li><strong>결과 검토</strong><p>기준에 맞춰 비교합니다.</p></li></ol>",
    "<ul data-style=\"list-check\"><li><input type=\"checkbox\" checked disabled> 자료 확인 완료</li><li><input type=\"checkbox\" disabled> 결과 검토 예정</li></ul>",
    "<ul data-style=\"list-outline\"><li><strong>재현성</strong><p>조건을 함께 기록합니다.</p></li><li><strong>추적성</strong><p>출처를 함께 보관합니다.</p></li></ul>",
    "",
    "### 인용 · 참고 / 주의 / 핵심 / 정의",
    "",
    "<blockquote data-style=\"quote-note\"><p>원본 자료와 처리 조건을 함께 보관하세요.</p></blockquote>",
    "<blockquote data-style=\"quote-warning\"><p>기록 기준이 다르면 결과를 직접 비교하기 어렵습니다.</p></blockquote>",
    "<blockquote data-style=\"quote-pull\" data-design-source=\"Junny의 문서 노트\"><p>작은 실험이 큰 개선으로 이어집니다.</p></blockquote>",
    "<blockquote data-style=\"quote-theorem\" data-design-label=\"정의 · 재현성\"><p>같은 조건과 절차에서 결과를 다시 얻을 수 있는 성질입니다.</p></blockquote>",
    "",
    "### 코드 · 파일 / 줄 번호 / 실행 / 변경 비교",
    "",
    "펜스 뒤에 filename=\"파일명\", linenums, start=번호, output=출력시작줄을 지정할 수 있습니다. 줄 번호와 파일명은 코드 원문에 포함되지 않습니다.",
    "",
    "```javascript filename=\"src/report.js\"",
    "export function createReport(data) {",
    "  return { title: \"Inspection report\", items: data };",
    "}",
    "```",
    "",
    "```python linenums start=5",
    "def validate(records):",
    "    ids = set()",
    "    for row in records:",
    "        if row.id in ids:",
    "            return False",
    "        ids.add(row.id)",
    "    return True",
    "```",
    "",
    "```bash output=2",
    "npm run build",
    "Build completed.",
    "Output: ./dist",
    "```",
    "",
    "```diff",
    "- timeout: 1000,",
    "+ timeout: 5000,",
    "  retries: 3",
    "```",
    "",
    "### 그림 · 도판 / 책자 / 측면 캡션",
    "",
    "<figure data-style=\"figure-plate\" data-design-label=\"측정 대상 · 원형 부품\" data-design-source=\"Junny 샘플\"><img src=\"../assets/img/favicon_main.png\" alt=\"기술 도판 샘플\" width=\"120\"><figcaption>대상의 형상과 측정 위치를 설명합니다.</figcaption></figure>",
    "<figure data-style=\"figure-book\" data-design-source=\"직접 작성한 샘플\"><img src=\"../assets/img/favicon_main.png\" alt=\"책자 캡션 샘플\" width=\"120\"><figcaption>번호와 설명을 나란히 표시하는 그림입니다.</figcaption></figure>",
    "<figure data-style=\"figure-side\" data-design-source=\"Junny 샘플\"><img src=\"../assets/img/favicon_main.png\" alt=\"측면 캡션 샘플\" width=\"120\"><figcaption>이미지 옆에 설명을 배치합니다. 좁은 화면에서는 아래에 표시합니다.</figcaption></figure>",
    "",
    "### 접기 · 질문과 답변 / 부록",
    "",
    "<details open data-style=\"details-faq\"><summary>원본 자료를 함께 보관해야 하나요?</summary><p>결과의 근거를 확인할 수 있도록 함께 보관하세요.</p></details>",
    "<details open data-style=\"details-appendix\" data-design-label=\"부록 A\"><summary>측정 환경</summary><p>장비와 실험 조건에 관한 보충 설명입니다.</p></details>",
    "",
    "### 용어와 구분선",
    "",
    "<dl data-style=\"definition-fields\"><dt>batch_id</dt><dd>공정 배치 식별자</dd><dt>threshold</dt><dd>이상 여부의 판정 기준값</dd></dl>",
    "<dl data-style=\"definition-glossary\"><dt>재현성</dt><dd>같은 조건에서 결과를 다시 얻을 수 있는 성질.</dd><dt>추적성</dt><dd>결과의 출처와 처리 과정을 확인할 수 있는 성질.</dd></dl>",
    "<hr data-style=\"rule-transition\">",
    "<p>다음 절에서는 결과를 검토합니다.</p>",
    "<hr data-style=\"rule-ending\">",
    ""
]);
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
    '.preview-body pre code{background:none;color:inherit;padding:0;font-size:.88em;line-height:1.6;display:block;}'
  ].join('\n');

  /* ================= Marked + highlight.js setup ================= */
  var renderer = new marked.Renderer();
  SharedCodeBlocks.configureRenderer(renderer);
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
    highlight: null
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
  var expectedDraft = lsGet(LS_AUTOSAVE_KEY), mdSaveConflict = false, mdFileRequest = 0;
  function mdStatus(message,failed){
    var status=document.getElementById('mdSaveStatus');status.textContent=message;status.classList.toggle('save-failed',!!failed);
  }
  function saveAutosave(text){
    var actual=lsGet(LS_AUTOSAVE_KEY);
    if (mdSaveConflict || (actual !== expectedDraft && actual !== text)) {
      mdSaveConflict=true;document.getElementById('mdConflict').hidden=false;mdStatus('다른 탭 변경 확인 필요 · 자동 저장 일시 중지',true);return false;
    }
    var saved=lsSet(LS_AUTOSAVE_KEY,text);
    if (saved) { expectedDraft=text;mdStatus('자동 저장됨 · '+new Date().toLocaleTimeString(),false); }
    else mdStatus('저장 실패 · 현재 내용을 .md 파일로 저장해주세요.',true);
    return saved;
  }

  function loadHistory(){
    var raw = lsGet(LS_HISTORY_KEY);
    if (!raw) return [];
    try{
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    }catch(e){ return []; }
  }
  function saveHistoryList(arr){ return lsSet(LS_HISTORY_KEY, JSON.stringify(arr)); }

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
    if (!saveHistoryList(history)) { mdStatus('복원 기록 저장 실패 · .md 파일로 백업해주세요.',true);return false; }
    lastSnapshotTime = now;
    lastSnapshotContent = text;
    return true;
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
      empty.textContent = '저장 기록이 없습니다.';
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
        if (confirm('이 저장 기록을 삭제할까요?')){
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
          maybeTakeSnapshot(true);
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
    var saved=saveAutosave(editor.getValue());
    var recorded=maybeTakeSnapshot(true);
    if (saved && recorded !== false) mdStatus('임시 저장 완료 · '+new Date().toLocaleTimeString(),false);
  });

  historyBtn.addEventListener('click', openHistoryModal);
  historyCloseBtn.addEventListener('click', closeHistoryModal);
  historyOverlay.addEventListener('click', function(e){
    if (e.target === historyOverlay) closeHistoryModal();
  });
  historyClearBtn.addEventListener('click', function(){
    if (confirm('저장 기록을 모두 삭제할까요?')){
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
  if (savedDraft === legacyExampleMarkdown || savedDraft === legacyExampleMarkdown.replace('# Hello from Junny', '# Hello from Coddy')){
    savedDraft = exampleMarkdown;
  }
  var initialValue = savedDraft !== null ? savedDraft : exampleMarkdown;

  // Add or edit a shortcut here; its editor binding and toolbar help share this list.
  var SHORTCUTS = [
    { keys:['Ctrl-F','Cmd-F'],display:'Ctrl / ⌘ + F',name:'찾기',description:'문서 안에서 텍스트를 찾습니다.',handler:function(){openFind();} },
    { keys:['Ctrl-H','Cmd-Alt-F'],display:'Ctrl + H / ⌘ + Option + F',name:'바꾸기',description:'문서 안의 텍스트를 찾아 바꿉니다.',handler:function(){openFind(true);} },
    { keys: ['Tab'], display: 'Tab', name: '들여쓰기', description: '커서에는 공백 두 칸을 넣고, 선택한 줄은 들여씁니다.', handler: insertIndent },
    { keys: ['Ctrl-B', 'Cmd-B'], display: 'Ctrl / ⌘ + B', name: '굵게', description: '선택한 글자를 굵게 표시하거나 커서 위치에 표시를 넣습니다.', handler: insertBold },
    { keys: ['Shift-Ctrl-S'], display: 'Ctrl + Shift + S', name: '취소선', description: '선택한 내용을 ~~로 감싸 취소선을 넣습니다. 선택이 없으면 커서에 표시를 넣습니다.', handler: insertStrikethrough },
    { keys: ['Ctrl-I'], display: 'Ctrl + I', name: '기울임', description: '선택한 내용을 *로 감싸 기울임을 넣습니다. 선택이 없으면 커서에 표시를 넣습니다.', handler: insertItalic },
    { keys: ['Ctrl-M'], display: 'Ctrl + M', name: '형광펜 강조', description: '선택한 내용을 <mark> 태그로 감쌉니다. 선택이 없으면 커서에 태그를 넣습니다.', handler: insertMark },
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
  function insertStrikethrough(cm) {
    insertWrapped(cm, '~~', '~~');
  }
  function insertItalic(cm) {
    insertWrapped(cm, '*', '*');
  }
  function insertMark(cm) {
    insertWrapped(cm, '<mark>', '</mark>');
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
  var languagePreviewScroll = null;
  var previewRenderer = window.MdPreviewRenderer?.create(previewHost);
  var previewTokens = null;
  function renderPreview(){
    var raw = editor.getValue();
    if (!raw.trim()){
      previewHost.innerHTML = '<p class="empty-state">편집기에 마크다운을 입력하면 여기에 미리보기가 표시됩니다.</p>';
      previewBlocks = [];
      previewTokens = null; previewRenderer?.reset();
      return;
    }

    var rendered = previewRenderer?.update(raw);
    var tokens = rendered ? rendered.tokens : marked.lexer(raw);
    previewTokens = {raw: raw, tokens: tokens};
    if (!rendered) {
      var html = window.PdfMath ? PdfMath.parse(raw) : marked.parser(tokens);
      previewHost.innerHTML = window.DOMPurify ? DOMPurify.sanitize(html) : html;
    }
    window.SharedHtmlBlocks?.hydrate(previewHost);
    window.PdfMath?.render(previewHost);
    SharedCodeBlocks.normalize(previewHost);
    // Optional design enhancements must tolerate a cached older template script.
    window.PdfTemplates?.prepareDesign?.(previewHost);
    var locations = SharedCodeBlocks.markdownLocations(raw, tokens);
    previewHost.querySelectorAll('pre[data-code-origin="markdown"]').forEach(function(pre, index){
      var location = locations[index];
      if (!location) return;
      pre.codeLocation = location;
      pre.codeLineHandle = editor.getLineHandle(location.line);
    });
    var htmlLocations = SharedCodeBlocks.htmlLocations(tokens, raw);
    previewHost.querySelectorAll('pre[data-code-origin="html"]').forEach(function(pre, index){
      var location = htmlLocations[index];
      if (!location) return;
      pre.htmlCodeLocation = location;
      pre.codeLineHandle = editor.getLineHandle(location.from.line);
      pre.codeEndHandle = editor.getLineHandle(location.to.line);
    });
    SharedCodeBlocks.decorate(previewHost, function(pre, language){
      var scroll = previewHost.scrollTop;
      if (!pre.codeLineHandle) { renderPreview(); return; }
      var line = editor.getLineNumber(pre.codeLineHandle);
      if (line == null) { renderPreview(); return; }
      if (pre.codeLocation) {
        var current = editor.getLine(line);
        var beginning = pre.codeLocation.prefix + pre.codeLocation.marker;
        if (current.slice(0, beginning.length) !== beginning) { renderPreview(); return; }
        var extra = current.slice(beginning.length).trim().replace(/^\S+/, '');
        editor.replaceRange(beginning + (language === 'xml' ? 'html' : language) + extra,
          { line: line, ch: 0 }, { line: line, ch: current.length }, '+code-language');
      } else if (pre.htmlCodeLocation) {
        var location = pre.htmlCodeLocation;
        var endLine = editor.getLineNumber(pre.codeEndHandle);
        if (endLine == null) { renderPreview(); return; }
        var from = { line: line, ch: location.from.ch }, to = { line: endLine, ch: location.to.ch };
        if (editor.getRange(from, to) !== location.opening) { renderPreview(); return; }
        var opening = location.opening.replace(/\sdata-code-language\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
        opening = opening.replace(/>$/, ' data-code-language="' + language + '">');
        editor.replaceRange(opening, from, to, '+code-language');
      } else { renderPreview(); return; }
      languagePreviewScroll = scroll;
      renderPreview();
      previewHost.scrollTop = scroll;
    });

    if (window.renderMathInElement) {
      window.renderMathInElement(previewHost, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false}
        ],
        throwOnError: false
      });
    }

    if (rendered) previewBlocks = rendered.blocks;
    else {
      // Safe compatibility path when an older cached page lacks the new module.
      previewBlocks = Array.from(previewHost.children, function(element){
        return {line: 0, endLine: editor.lineCount() - 1, element: element};
      });
    }
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
      updateOutline();updateFindMatches();
      if (languagePreviewScroll !== null) {
        previewHost.scrollTop = languagePreviewScroll;
        languagePreviewScroll = null;
      } else syncPreviewToCursor();
      saveAutosave(editor.getValue());
      maybeTakeSnapshot(false);
    }, 200);
  }

  editor.on('changes', function(cm, changes){
    if (!changes.every(function(change){ return change.origin === '+code-language'; })) languagePreviewScroll = null;
    mdStatus('변경 사항 저장 중…',false);scheduleUpdate();
  });
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
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">\n' +
      '<style>\n' + EXPORT_CSS + '\n' + SharedCodeBlocks.exportCss() + '\n' + (window.PdfTemplates?.exportCss?.() || '') + '\n</style>\n</head>\n<body>\n' +
      '<article class="preview-body">\n' + SharedCodeBlocks.exportHtml(previewHost) + '\n</article>\n</body>\n</html>';
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
    var html = SharedCodeBlocks.exportHtml(previewHost);
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
    if (editor.getValue() !== exampleMarkdown && editor.getValue().trim() && !confirm('예제를 불러오면 현재 내용이 교체됩니다. 계속할까요?')) return;
    maybeTakeSnapshot(true);editor.setValue(exampleMarkdown);
    editor.focus();
  });

  clearBtn.addEventListener('click', function(){
    if (!editor.getValue().trim() || confirm('편집기 내용을 모두 지울까요?')){
      maybeTakeSnapshot(true);editor.setValue('');
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
      try { localStorage.setItem('pdfMakerTransfer',editor.getValue());window.open('pdf-maker.html','_blank'); }
      catch (_) { mdStatus('PDF 편집기로 전달하지 못했습니다. .md 파일을 저장한 뒤 PDF Maker에서 열어주세요.',true); }
    });
  }

  /* File loading, heading navigation and literal-text search share the source editor. */
  document.getElementById('openMdBtn').addEventListener('click',function(){document.getElementById('openMdInput').click();});
  async function openMarkdownFile(file){
    if (!file) return;
    if (!/\.(md|markdown)$/i.test(file.name)) {mdStatus('.md 파일을 선택해주세요.',true);return;}
    if (file.size > 10*1024*1024) {mdStatus('10MB 이하의 Markdown 파일을 선택해주세요.',true);return;}
    var request=++mdFileRequest,before=editor.getValue();
    try {
      var text=await file.text();
      if (request!==mdFileRequest) return;
      if (editor.getValue()!==before) {mdStatus('파일을 읽는 동안 문서가 변경됐습니다. 다시 열어주세요.',true);return;}
      if (before.trim() && !confirm('파일을 열면 현재 내용이 교체됩니다. 계속할까요?')) return;
      maybeTakeSnapshot(true);editor.setValue(text.replace(/^\uFEFF/,''));editor.focus();
    } catch (_) {mdStatus('파일을 읽지 못했습니다. 현재 문서는 유지됩니다.',true);}
  }
  document.getElementById('openMdInput').addEventListener('change',function(e){openMarkdownFile(e.target.files[0]);e.target.value='';});
  workspace.addEventListener('dragover',function(e){if(Array.from(e.dataTransfer.types||[]).includes('Files'))e.preventDefault();});
  workspace.addEventListener('drop',function(e){if(e.dataTransfer.files.length){e.preventDefault();openMarkdownFile(e.dataTransfer.files[0]);}});
  document.getElementById('mdBackup').addEventListener('click',function(){downloadMdBtn.click();});
  document.getElementById('mdLoadRemote').addEventListener('click',function(){
    if (!confirm('다른 탭의 내용을 불러오면 현재 내용이 교체됩니다. 계속할까요?'))return;
    maybeTakeSnapshot(true);expectedDraft=lsGet(LS_AUTOSAVE_KEY);mdSaveConflict=false;document.getElementById('mdConflict').hidden=true;
    editor.setValue(expectedDraft===null?'':expectedDraft);scheduleUpdate();
  });
  document.getElementById('mdKeepLocal').addEventListener('click',function(){
    if (!confirm('다른 탭에서 저장한 내용을 현재 내용으로 덮어씁니다. 계속할까요?'))return;
    expectedDraft=lsGet(LS_AUTOSAVE_KEY);mdSaveConflict=false;document.getElementById('mdConflict').hidden=true;saveAutosave(editor.getValue());
  });
  window.addEventListener('storage',function(e){
    if ((e.key===LS_AUTOSAVE_KEY || e.key===null) && e.newValue!==expectedDraft) {
      mdSaveConflict=true;document.getElementById('mdConflict').hidden=false;mdStatus('다른 탭 변경 확인 필요 · 자동 저장 일시 중지',true);
    }
  });
  var outlineSignature = null;
  function updateOutline(){
    if (document.getElementById('mdOutline').hidden) return;
    var raw=editor.getValue();
    var outlineTokens=previewTokens?.raw===raw ? previewTokens.tokens : marked.lexer(raw);
    // Include source line positions: inserting body text can shift heading targets.
    if (outlineSignature===raw) return;
    outlineSignature=raw;
    var list=document.getElementById('mdOutlineList');list.replaceChildren();
    var offset=0;
    var headings=[];
    outlineTokens.forEach(function(token){
      var start=raw.indexOf(token.raw,offset);if(start<0)return;offset=start+token.raw.length;
      if(token.type==='heading')headings.push({start:start,depth:token.depth,html:marked.parseInline(token.text)});
      else if(token.type==='html'){
        // Preserve source offsets while excluding headings inside code and comments.
        var html=token.raw.replace(/<!--[\s\S]*?-->|<(pre|script|style|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,function(value){return value.replace(/[^\n]/g,' ');});
        var expression=/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi,match;
        while((match=expression.exec(html)))headings.push({start:start+match.index,depth:Number(match[1]),html:match[2]});
      }
    });
    headings.forEach(function(heading){
      var line=(raw.slice(0,heading.start).match(/\n/g)||[]).length;
      var button=document.createElement('button');button.type='button';button.className='outline-entry';button.style.paddingLeft=(12+(heading.depth-1)*12)+'px';
      var title=document.createElement('span');title.innerHTML=DOMPurify.sanitize(heading.html);button.textContent=title.textContent;
      button.addEventListener('click',function(){
        if(currentMode==='preview'){document.querySelector('#viewSegment [data-mode="split"]').click();}
        editor.setCursor({line:line,ch:0});editor.scrollIntoView({line:line,ch:0},80);editor.focus();scrollPreviewToLine(line,.2);
      });list.append(button);
    });
    if(!list.children.length)list.textContent='문서에 제목이 없습니다.';
  }
  document.getElementById('outlineBtn').addEventListener('click',function(){var outline=document.getElementById('mdOutline');outline.hidden=!outline.hidden;this.setAttribute('aria-expanded',String(!outline.hidden));updateOutline();editor.refresh();});
  var searchMatches=[],searchMarks=[],activeSearch=-1;
  function openFind(replace){document.getElementById('findPanel').hidden=false;document.getElementById('findBtn').setAttribute('aria-expanded','true');var input=document.getElementById(replace?'replaceInput':'findInput');input.focus();if(!replace && editor.getSelection())document.getElementById('findInput').value=editor.getSelection();updateFindMatches();}
  function updateFindMatches(){
    if(!searchMarks)return;
    searchMarks.forEach(function(mark){mark.clear();});searchMarks=[];searchMatches=[];activeSearch=-1;
    if(document.getElementById('findPanel').hidden)return;
    var query=document.getElementById('findInput').value,text=editor.getValue();
    if(query){
      var escaped=query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      var expression=new RegExp(escaped,document.getElementById('findCase').checked?'gu':'giu'),match;
      while((match=expression.exec(text))!==null)searchMatches.push({from:match.index,to:match.index+match[0].length});
    }
    document.getElementById('findCount').textContent=searchMatches.length+'개 일치';
    // Limit painted ranges while keeping all results available for navigation.
    searchMatches.slice(0,1000).forEach(function(match){searchMarks.push(editor.markText(editor.posFromIndex(match.from),editor.posFromIndex(match.to),{className:'md-search-match'}));});
  }
  function goFind(direction){
    if(!searchMatches.length)return;
    var cursor=editor.indexFromPos(editor.getCursor(direction>0?'to':'from'));
    var index=direction>0?searchMatches.findIndex(function(m){return m.from>=cursor;}):-1;
    if(direction<0)for(var i=searchMatches.length-1;i>=0;i--)if(searchMatches[i].to<=cursor){index=i;break;}
    if(index<0)index=direction>0?0:searchMatches.length-1;activeSearch=index;
    var match=searchMatches[index];editor.setSelection(editor.posFromIndex(match.from),editor.posFromIndex(match.to));editor.scrollIntoView(editor.posFromIndex(match.from),60);
    document.getElementById('findCount').textContent=(index+1)+' / '+searchMatches.length;
  }
  document.getElementById('findBtn').addEventListener('click',function(){if(document.getElementById('findPanel').hidden)openFind();else closeFind();});
  ['findInput','findCase'].forEach(function(id){document.getElementById(id).addEventListener('input',updateFindMatches);});
  document.getElementById('findNext').addEventListener('click',function(){goFind(1);});document.getElementById('findPrev').addEventListener('click',function(){goFind(-1);});
  document.getElementById('replaceOne').addEventListener('click',function(){
    var from=editor.indexFromPos(editor.getCursor('from')),to=editor.indexFromPos(editor.getCursor('to'));
    if(!searchMatches.some(function(m){return m.from===from && m.to===to;})){goFind(1);return;}
    editor.replaceSelection(document.getElementById('replaceInput').value,'end','+replace');updateFindMatches();goFind(1);
  });
  document.getElementById('replaceAll').addEventListener('click',function(){
    if(!searchMatches.length)return;
    var matches=searchMatches.slice(),replacement=document.getElementById('replaceInput').value;
    editor.operation(function(){matches.reverse().forEach(function(m){editor.replaceRange(replacement,editor.posFromIndex(m.from),editor.posFromIndex(m.to),'+replace-all');});});updateFindMatches();
  });
  function closeFind(){document.getElementById('findPanel').hidden=true;document.getElementById('findBtn').setAttribute('aria-expanded','false');updateFindMatches();editor.focus();}
  document.getElementById('findClose').addEventListener('click',closeFind);
  document.getElementById('findPanel').addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();closeFind();}else if(e.key==='Enter'){e.preventDefault();goFind(e.shiftKey?-1:1);}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderPreview,{once:true});
  updateOutline();
  window.MdHtmlImporter?.install({editor:editor,backup:function(){maybeTakeSnapshot(true);},status:mdStatus});
})();
