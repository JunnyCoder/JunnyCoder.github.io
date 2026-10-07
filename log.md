# 개발 및 QA 로그

최종 작성일: 2026-10-07

대상 프로젝트: `/Users/junhokim/Desktop/Projects/JunnyCoder.github.io`

대상 도구: `tools/markdown-editor.html`, `tools/pdf-maker.html`

## 1. 기록 범위와 현재 상태

이 문서는 이번 대화에서 진행한 요청·설계·구현·수정·QA를 순서대로 정리한 누적 기록이다. 대화, 현재 코드, Git 커밋, 작업 폴더의 보고서·테스트 결과를 근거로 작성했다. 개별 요청에 날짜가 없는 경우 순서만 기록하고, 날짜는 확인되는 커밋과 검사 기록에 한정했다.

- **구현 완료**: 현재 코드에 반영된 기능. 실제 브라우저·인쇄의 모든 환경에서 검증됐다는 뜻은 아니다.
- **자동 QA 확인**: 해당 시나리오를 자동 검사로 확인한 상태.
- **발견 / 계획**: 문제나 개선 방향을 확인했지만 아직 수정하지 않은 상태.
- 최신 확인 커밋: `02a4881eb7f7859304e0f7fb461125b93cc19770` — 2026-10-06 22:03:24 +09:00.
- 현재 로컬 자산 버전: `20261007-optimize-9` (최초 QA 시점: `20261007-import-qa-8`).
- HTML → Markdown과 최근 보완은 미커밋 변경이 포함되어 있다. 최초 QA·로그 작성 이후 승인된 코드 수정·최적화는 7절에 기록했다. 커밋·푸시는 수행하지 않았다.
- 초기 요청에 최신화 후 원인 분석이 포함되어 있었다. 최초 pull의 실행 결과는 이 로그 작성 시 확보한 자료로 재확인하지 못해 별도 완료 사실로 기재하지 않았다.

## 2. 진행 과정

### 01. MD Editor 스크롤 동기화 및 단축키 정비

**요청**

- 타이핑 중 미리보기가 아래로 밀려 현재 편집 위치와 어긋나는 현상 분석·수정.
- 상단에 보기 토글과 같은 디자인의 `스크롤: 동기화 / 분리` 선택 추가.
- 동기화 상태는 양쪽 스크롤을 연결하고, 분리 상태도 입력 시에는 편집 위치를 미리보기에 반영.
- 한쪽이 맨 위/맨 아래에 닿으면 반대쪽도 해당 끝단으로 이동.
- 예제의 `Hello from Coddy`를 Junny로 변경.
- 단축키 조합·이름·설명을 함께 관리하고 툴바 도움말에 표시.

**반영**

- 소스 위치와 미리보기 블록 위치를 연결하는 스크롤 처리 및 끝단 동기화.
- 동기화/분리 UI와 입력 위치 반영.
- 단축키 레지스트리에서 키 바인딩과 도움말을 함께 생성하도록 정리.
- 예제 문구 변경.

**확인**: 스크롤·타이핑·단축키·도움말 관련 자동 QA 통과. 관련 커밋 `186460d`(2026-10-04).

### 02. PDF Maker 초기 점검 및 템플릿 확장

**진행**

1. 기존 PDF Maker의 문제점·개선사항을 검토하고 수정 요청에 따라 반영.
2. 붙여넣은 제조 현장 보고서의 일반 문단이 코드 블록으로 처리되는 문제를 점검·수정.
3. 출력에 적합한 디자인을 조사하고 템플릿 시안을 제시.
4. Dev·Academic 필수 포함, 나머지 시안도 사용자 승인 후 추가.

**반영**

- 문서 템플릿 6종: **Modern / Dev / Academic / Report / Editorial / Minimal**.
- 제목·본문·표·목록·인용·코드·그림·접기·용어 등 태그별 스타일 체계.
- 공통 요소 스타일, 템플릿별 변수, 명시적 태그 스타일의 역할 분리.
- HTML 원본 CSS 유지 옵션. 스타일 태그·인라인 스타일·동반 CSS 파일·접근 가능한 외부 스타일을 처리하고 문서 영역에 범위를 제한.
- 기존 `tech` 템플릿 이름은 초안 복원 시 `dev`로 이관.

**설계 참고**: 개발 문서의 제목·코드 구조, 학술 문서의 단일 열 구성과 절제된 표, 업무 보고서·편집 문서·흑백 출력 구성을 조사해 적용. 참고 링크는 [템플릿 문서](/Users/junhokim/Desktop/Projects/JunnyCoder.github.io/css/pdf-maker/templates/README.md)에 기록되어 있다.

### 03. 공통 코드 블록과 테스트 문서

**요청**

- MD/PDF에서 코드 블록 처리를 공유.
- Markdown fence 언어에 따른 강조와 오른쪽 위 언어 드롭다운 제공.
- HTML에서 가져온 코드, 언어 미지정/미지원 코드는 Plain text로 시작.
- 다양한 태그를 포함한 MD/HTML 테스트 문서 제공.

**반영**

- `js/shared/code-blocks.js`, `css/shared/code-blocks.css` 공유.
- 지원 언어/별칭을 한 곳에서 관리하고 fence 또는 원본 블록 메타데이터에 언어 저장.
- 자동 언어 추정을 사용하지 않고 명시적으로 선택.
- 드롭다운·줄 번호·장식이 원문 복사/다운로드에 섞이지 않도록 처리.
- 코드 줄바꿈과 페이지 분할 후 원문·언어 정보 보존.
- MD/HTML 테스트 문서 작성.

**자료**: [MD 테스트 문서](/Users/junhokim/Documents/Codex/2026-10-01/users-junhokim-desktop-projects-junnycoder-github/test-documents/pdf-maker-test.md), [HTML 테스트 문서](/Users/junhokim/Documents/Codex/2026-10-01/users-junhokim-desktop-projects-junnycoder-github/test-documents/pdf-maker-test.html).

### 04. 사용자 QA 반영: 페이지 분할·표지·CSS·목차

**페이지/문서 작업**

- 같은 위치의 강제 페이지 자르기를 다시 지정하면 변경/Undo 기록을 추가하지 않도록 처리.
- 문서 작업 버리기와 초기 화면 복귀 확인창.
- 새 문서 불러오기 전 현재 내용 교체 경고.
- 코드 편집 줄바꿈 보존.
- 새 문서는 페이지 여백 등 설정을 기본값으로 초기화.

**30% 분할 조건의 정정**

초기 계획의 해석을 사용자 설명에 따라 수정했다. 남은 공간에 들어가지 않는 블록은 다음 기준으로 처리한다.

- 페이지 콘텐츠 높이의 **30% 이상**이면 현재 페이지의 남은 공간에서 잘라 이어서 배치.
- **30% 미만**이면 통째로 다음 페이지에서 시작.
- 그림·수식 내부·일부 병합 표처럼 쪼개기 어려운 요소는 한 덩어리로 유지하고, 한 페이지보다 큰 경우 빈 페이지에서 축소하는 예외를 적용.

**표지**

- 제목/부제목을 왼쪽 표지 설정에서 직접 지정.
- 표지 더블클릭 편집은 작성자·발행일 등 메타데이터 중심으로 제한.
- 배경 프리셋과 Custom CSS 선택을 분리.
- 배경 이미지 채우기·반복·원본 크기 등의 배치, 투명도, 색상 필터 제공.

**원본 CSS**

- 전체 문서 배경 제거를 요소 배경과 구분.
- 배경은 페이지 전체에 표시하고 콘텐츠 여백은 유지.
- 원본 루트 글꼴·rem·인쇄 스타일 등을 문서 범위에 맞게 처리.

**목차**

- 목차 제목·항목 편집과 수동 항목 추가.
- 실제 페이지 참조 및 본문 제목 연결.
- 번호 표시 옵션.
- 목차 계층 변경과 실제 H1–H6 태그 레벨을 연동하고 본문 쪽에서도 계층 조절.
- 링크/방문 상태의 색상을 문서 스타일에 맞게 유지.

**확인**: 기본 회귀 검사 통과. 실제 인쇄 PDF의 페이지 경계·내부 링크·배경 출력은 별도 브라우저 검증이 필요하다.

### 05. 추가 동작 QA 및 9개 수정

2026-10-06 추가 QA에서 다음을 재현하고 후속 승인에 따라 수정했다.

| 발견 사항 | 수정 내용 |
| --- | --- |
| 작업 버리기 뒤 지연된 불러오기가 문서를 다시 표시 | 문서 버전/요청 ID로 이전 비동기 결과 무효화 |
| HTML 코드의 `<br>` 줄바꿈 소실 | 공유 코드 정규화에서 줄바꿈 복원 |
| 편집으로 추가한 수식이 미렌더링 | 편집 저장 후 수식 재생성 |
| 표지 작성자 변경 미반영 | 자동 작성자와 직접 편집 메타데이터 구분 |
| 삭제한 본문 제목이 목차에 남음 | 숨긴 대상의 목차 항목도 제외, Undo 복원 |
| 이미지 업로드/URL 허용 유형 불일치 | 지원 MIME 처리 일치 및 로딩 오류 안내 |
| 빈 부제목이 기본 문구로 복귀 | 빈 값을 부제목 없음으로 보존 |
| 변경 없는 표지 업데이트가 Undo에 기록 | 결과 비교 후 실제 변경만 기록 |
| 목차 재생성 시 사용자 수정·수동 항목 소실 | 안정적인 제목 ID로 수정 라벨·수동 항목 유지 |

**확인**: 수정 후 재현 결과의 남은 오류 0개 및 기존 기능 검사 통과. [추가 QA 보고서](/Users/junhokim/Documents/Codex/2026-10-01/users-junhokim-desktop-projects-junnycoder-github/pdf-maker-qa-report.md).

### 06. 수식·구조 편집·임시 디자인 적용 보완

**요청/반영**

- 수식 TeX를 Markdown 파싱 전에 보호하고 코드 영역은 제외.
- 원본 TeX·표시 모드를 저장하며 초안/Undo에는 생성된 KaTeX 내부 DOM 대신 원본을 보관.
- 분수·위첨자·아래첨자가 깨지는 현상에 대해 수식 내부 CSS와 원본 CSS 간 간섭을 수정. 사용자가 해결 확인 후 다음 단계 진행.
- 표 편집 후 평문으로 변하는 문제를 전체 table 문맥을 유지한 정제로 수정.
- 표 셀 편집과 행/열 추가. 병합 셀은 논리적 격자를 사용.
- 강제 페이지 자르기 취소 모드와 선택 요소의 자르기 해제.
- 스타일 선택 시 임시 미리보기, 선택 요소/동일 태그 적용 시 확정.
- 미확정 스타일 상태에서 다른 작업을 시작하면 변경 버리기/선택 요소 적용/동일 태그 적용 선택.
- UL 불릿과 UL/OL 전환·번호 옵션.

**확인**: 수식 기본 구조, 표 편집/Undo, 스타일 임시 적용, 목록 자동 QA 통과. 최신 HTML 변환 QA에서 발견한 특수 MathML·역순 목록 문제는 아래 미해결 항목과 구분한다.

### 07. 두 도구 UI 공통화 및 MD 예제·단축키 확대

- 완성도가 높은 MD Editor를 기준으로 PDF Maker 툴바·패널·버튼·대화상자의 디자인을 공통화.
- `css/shared/editor-ui.css`, `js/shared/editor-ui.js`에서 공유 UI와 테마 관리.
- 기본 다크 모드, 라이트 모드 토글, 설정 복원 및 탭 간 동기화.
- 문서 출력용 템플릿 색상과 화면 UI 테마를 별도로 유지.
- MD 예제를 지원 태그와 렌더링을 확인할 수 있는 샘플로 확대.
- 추가 단축키: 취소선 `Ctrl + Shift + S`, 기울임 `Ctrl + I`, `<mark>` 강조 `Ctrl + M`.

**확인**: 실제 키 이벤트 기반 자동 검사, 예제 렌더링, 설정 저장 차단/다중 탭 테마 동기화 검사 통과. 관련 커밋 `92289d3`(2026-10-06).

### 08. 이미지 기능: 검토 후 승인받아 구현

처음 요청에서는 개발 없이 기능을 검토했다. 검토안 이후 사용자의 구현 요청에 따라 개발했다.

- 본문 이미지 추가: 파일/URL 입력, 선택 요소 기준 앞/뒤 또는 문서 끝 삽입.
- 이미지 교체·너비·정렬·대체 텍스트·캡션.
- 그림과 캡션을 함께 페이지에 배치하고 과대 크기 조정.
- 이미지 바이너리는 별도 저장하고 문서/히스토리는 자산 ID 참조.
- 로딩 실패·재시도·이미지 없이 출력 선택을 안내.
- 초안 복원, Undo/Redo, 프로젝트 이동 시 이미지 복원.

**자료**: [당시 이미지 검토안](/Users/junhokim/Documents/Codex/2026-10-01/users-junhokim-desktop-projects-junnycoder-github/pdf-maker-image-review.md). 이 검토안의 ‘미구현’ 표시는 작성 시점 기준이며 현재 상태는 후속 구현으로 달라졌다.

### 09. 요소별 특화 디자인 29종

요소별 시안 제시 후 사용자가 전체 추가를 승인했다. 기능 구현과 함께 MD 예제에도 샘플을 추가했다.

| 요소 | 추가 디자인 |
| --- | --- |
| 표 | 비교 매트릭스, 수치 리포트, 필드 명세 |
| 목록 | 절차 흐름, 검수 체크리스트, 제목과 설명 |
| 인용 | 참고 메모, 주의 사항, 핵심 문장, 정의와 정리 |
| 제목 | 장 번호 독립형, 목차식 번호열, 구간 탭 |
| 본문 | 초록과 요약, 결론 강조, 출판형 첫 글자 |
| 코드 | 파일 제목, 줄 번호, 명령어와 출력, 변경 비교 |
| 그림 | 기술 도판, 책자 캡션, 측면 캡션 |
| 접기 | 질문과 답변, 부록 메모 |
| 용어 | 필드 정의, 사전형 |
| 구분선 | 절 전환, 끝맺음 |

- 선택 요소에 적합한 디자인만 노출.
- 필요한 라벨·출처·파일명·강조 열 등 디자인별 옵션.
- 코드 장식과 원문을 분리하고 제목/그림 번호 연동.
- 템플릿 글꼴·강조색을 공유하고 출력에 맞게 디자인 적용.

**확인**: 29종 예제, 옵션·적용 범위·Undo·복원·원문 보존 검사 통과. 관련 커밋 `5df09a1`(2026-10-06). [당시 요소 디자인 제안](/Users/junhokim/Documents/Codex/2026-10-01/users-junhokim-desktop-projects-junnycoder-github/pdf-maker-element-style-proposal.md)은 구현 전 제안서다.

### 10. 배포 오류 및 편집 흐름 개선

**배포 오류**

Windows Chrome/GitHub Pages에서 `window.PdfTemplates?.prepareDesign is not a function`이 발생해 툴바와 스크롤 기능까지 중단되는 문제가 보고됐다.

- 오래된 템플릿 의존성으로 오류를 재현.
- 선택적 디자인 기능은 메서드 존재 여부까지 확인하도록 수정.
- 두 도구의 로컬 JS/CSS 자산 버전을 일치시켜 캐시 혼용에 대응.
- 오래된/누락된/현재 의존성 각각에서 편집·보기·동기화·저장·출력 흐름 검사.

**편집 흐름**

- 두 도구의 개선사항과 추가 도구 후보를 검토한 뒤 MD/PDF 문서 작업을 우선 개선.
- MD 파일 열기·백업, 찾기/바꾸기·제목 탐색.
- 빈 문서 복원·저장 실패·교체 취소·다중 탭 충돌·비동기 요청 경쟁 처리.
- PDF Redo/분기 처리, 줌과 페이지 계산 분리, 페이지 이동.
- 이미지 포함 `.jpdf.json` 프로젝트 저장/불러오기와 잘못된 파일 입력 시 기존 작업 보존.
- PDF 스타일 편집 후 최상단으로 이동하는 문제를 재페이지 구성 후 스크롤 복원으로 수정.

**추가 도구**: 후보 검토 이력은 있으나 현재 자료에서 신규 도구 페이지 구현 완료를 확인하지 않아 완료 목록에는 포함하지 않는다.

### 11. MD 툴바 재구성

- 입력(`.md 열기`), 문서 작업(찾기·바꾸기/제목 탐색), 출력(PDF 편집 전달/.md/.html)을 역할별로 구분.
- 화면 폭에 맞는 툴바 배치 및 버튼 스타일 정리.
- 내용 삭제 버튼을 **전체 내용 지우기**로 변경하고 확인 흐름 제공.
- 찾기·바꾸기 버튼을 다시 누르면 패널이 닫히도록 처리.

**확인**: 관련 커밋 `02a4881`(2026-10-06). 사용자가 이 시점까지 커밋했고 푸시는 하지 않았다고 알렸다.

### 12. HTML → Markdown: 계획·모드 결정·구현

**의사결정 순서**

1. 최초 요청은 구현 전 계획과 확인 질문이었다.
2. Notion 활용 의도를 반영한 strict/HTML 허용 구분을 검토.
3. 사용자 지시에 따라 최종 용도 문구를 **Strict MD (for AI) / Allow HTML (for PDF)**로 변경.
4. 가능한 구조는 우선 Markdown으로 변환하고 정말 표현하기 어려운 HTML만 고유 블록으로 유지하는 방향을 확정.
5. 단계별 계획 이후 사용자 승인에 따라 구현.

**반영**

- 입력 버튼 모음에 HTML → Markdown 추가.
- 모달에서 HTML 붙여넣기/파일 업로드 선택.
- 원본 렌더링과 변환 결과를 비교하고 Markdown을 직접 수정.
- 변환이 어려운 요소는 사용자에게 설명하고 문단·제목·목록·인용·표·코드·텍스트·제외·HTML 유지 등 유형을 선택.
- 같은 태그에 일괄 매핑, 전체 교체/현재 위치 삽입, 기존 작업 교체 확인과 Undo.
- Strict MD에서는 HTML 및 고유 HTML 블록 제한.
- Allow HTML에서는 `junny-html` fence를 사용해 복합 구조를 고유 문서 블록으로 보존.
- 공유 HTML 블록 렌더링·CSS 범위 처리 및 PDF에서 블록 선택·원본 HTML/CSS 편집·이동·삭제.
- 실행/외부 삽입 요소 정리, 파일 읽기 경쟁 처리, 과대 HTML 블록 한 덩어리 배치.

**주요 파일**

- `js/shared/html-to-markdown.js`: 정규화·변환·strict 검사·일괄 처리.
- `js/shared/html-blocks.js`: 고유 HTML 블록·정제·CSS 범위·렌더링.
- `js/markdown-editor/html-import.js`: 모달 상태·사용자 선택·비교·삽입.

이 모드는 Notion 전용 호환 보장을 의미하지 않는다. 최종 승인된 용도는 AI용 strict MD와 PDF용 HTML 허용이다.

### 13. HTML 변환 후속 QA 반영

**추가 요청**

- 수식 표현 점검과 strict 검사 상세화.
- 전체 교체 시 과한 공백 제거.
- 일괄 자동 적용.
- 모달 원본/미리보기 강제 스크롤 동기화와 재렌더 후 위치 유지.

**반영**

- 공유 수식 파싱으로 원본 TeX, KaTeX/MathML의 기본 분수·첨자 처리를 보완.
- strict 결과창 실시간 검사: HTML 토큰, `junny-html`, 위험 링크, 닫히지 않은 fence. 일반 코드 블록 안의 HTML 예시는 허용.
- 코드·수식 영역의 공백은 보존하고 일반 문서의 연속 빈 줄을 정리.
- 미해결 항목 일괄 자동 적용 및 결과 안내.
- iframe 양방향 비율 스크롤 동기화, 재로딩·폰트/이미지 로딩 후 위치 복원.

**확인**: `import-qa.cjs`, `html-import.cjs` 자동 검사 통과. 아래 최신 경계 QA에서 추가 손실 사례를 발견해 완전한 변환 정확성은 아직 확보되지 않았다.

### 14. 전체 회귀·부하 QA 및 최적화 전략

2026-10-07 사용자 요청에 따라 제품 수정 없이 QA와 전략 수립을 수행했다.

**자동 회귀**

- 14개 스위트 최종 통과: import-qa, html-import, workflow, features, element-designs, images, scroll-preservation, markdown-shortcuts, deployment-cache, math-layout, markdown-code, ui-theme, ui-theme-pdf, regression-qa.
- 예전 테스트의 제목 디자인 개수 기대값(4개)을 현재 유효 레지스트리(7개) 기준으로 보정하고 재실행.

**부하**

- 33회 실행: 32회 완료, 깊은 HTML 1회 jsdom 직렬화 스택 초과.
- MD/HTML 100–1,500묶음, 병합 표 50–500개, HTML 블록 10–100개, PDF 표 100–1,500행, 수식 50–250개, 자산 5/20MiB, 중첩 깊이 100–2,500단계 검사.
- 핵심 MD 입력은 반복 실행으로 경향 확인.

| 병목 | 관측 결과 | 해석 |
| --- | --- | --- |
| MD 전체 미리보기 교체 | 약 294KB/9,001노드 입력에서 편집 후 렌더 약 6.1–6.4초 | jsdom 수치이며 실제 Chrome 시간은 아님. 전체 DOM 교체 비용 집중 |
| 모달 결과 입력 | 큰 사례에서 입력 1회마다 222–243ms | 입력 병합 없이 전체 미리보기 생성 |
| 일괄 자동 적용 | 50개 16ms → 500개 717ms | 반복 전체 변환·요소 검색 개선 필요 |
| HTML 재처리 | 동일 블록 100개 재호출 36ms, 같은 CSS도 스타일 100개 | 변경 여부 확인 전 파싱, 스타일 중복 |
| PDF 재구성 | 표 1,500행 불러오기 1,182ms/Undo 968ms | 치수는 모의. 실제 레이아웃 추가 측정 필요 |

**검사 한계**

Node/jsdom과 실제 라이브러리를 사용했다. PDF 치수·이미지 디코딩·저장소 일부는 모의 처리했다. 실제 Chrome 입력 지연/FPS/인쇄 품질·링크/메모리 누수는 이 수치로 확정할 수 없다. 깊은 입력 실패도 Chrome 오류로 확정하지 않았다.

**상세 자료**: [전체 QA 및 최적화 전략](/Users/junhokim/Documents/Codex/2026-10-01/users-junhokim-desktop-projects-junnycoder-github/editor-qa-optimization-2026-10-07.md).

## 3. 최적화 착수 전 확인 사항과 계획

아래는 착수 전 상태다. 후속 수정 결과와 현재 잔여 사항은 7절을 기준으로 한다.

| 우선순위 | 항목 | 상태/다음 조치 |
| --- | --- | --- |
| P1 | HTML 병합 표 자동 변환에서 셀 열 이동 | 재현 완료. rowspan/colspan 논리 좌표 보존 필요 |
| P1 | 특수 MathML 의미 손실 | mphantom이 보이는 문자로 변환, mtext 중괄호 삭제. 원본 의미 보존 또는 미지원 안내 필요 |
| P2 | 역순 OL/개별 li 번호 소실 | 재현 완료. 다시 렌더링한 번호 기준 검증 및 MD/HTML 선택 처리 필요 |
| 성능 1 | 반복 전체 처리 | 입력 병합, 숨긴 목차 갱신 중단, ID Map, HTML/수식/코드 캐시 |
| 성능 2 | 모듈화·변경 블록 갱신 | 문서 모델·예약기·렌더러·변환·저장·히스토리 책임 분리 |
| 성능 3 | PDF 페이지 재계산 | 변경 지점부터 재분할, 치수 캐시, 화면 근처 우선 렌더링 검토 |
| 성능 4 | 히스토리·프로젝트 크기 | 바이트 상한, 변경 기록/체크포인트, 필요 시 바이너리 묶음 형식 |
| 추가 QA | 복잡한 입력과 실제 출력 | 노드/깊이 예산, Windows Chrome 성능·수식·이미지·목차 링크·전체 페이지 검증 |

구현 순서: **변환 정확성 → 불필요한 처리 제거 → 모듈화/부분 렌더링 → PDF 부분 재분할 → 저장 관리 → 실제 브라우저 검증**.

모듈 분리만으로 성능 개선을 기대하지 않는다. 한 revision의 파싱 결과 공유, 캐시 상한/무효화, 오래된 비동기 결과 취소, 안전한 DOM 정제를 함께 설계한다. Worker는 순수 계산을 대상으로 검토하고 DOM 갱신·치수 측정은 별도로 최적화한다. PDF 인쇄 전에는 모든 페이지와 자산이 준비되어야 한다.

## 4. Git 이력과 미커밋 상태

### 확인된 주요 커밋

| 날짜 | 커밋 | 제목 |
| --- | --- | --- |
| 2026-10-04 | `186460d` | MD Editor Update. (Scroll and shortcut key) |
| 2026-10-06 | `4a11c15` | pdf-maker 대규모 개선 |
| 2026-10-06 | `9c5bceb` | 유아이 통일화 전 중간 작업본 |
| 2026-10-06 | `92289d3` | UI Itergrated and Updated |
| 2026-10-06 | `5df09a1` | pdf-maker element template updated |
| 2026-10-06 | `a0baaa8` | bug fix |
| 2026-10-06 | `02a4881` | UI 개선(md-editor 버튼 정렬) |

위 제목은 Git 기록 그대로다. 한 커밋이 여러 기능을 포함할 수 있어 모든 요청을 개별 커밋과 일대일 대응시키지 않았다.

### 로그 작성 직전 미커밋 제품 파일

수정:

```text
css/markdown-editor/style.css
css/pdf-maker/style.css
js/markdown-editor/script.js
js/pdf-maker/script.js
js/shared/code-blocks.js
tools/markdown-editor.html
tools/pdf-maker.html
```

신규:

```text
js/markdown-editor/html-import.js
js/shared/html-blocks.js
js/shared/html-to-markdown.js
```

이 로그는 위 상태를 변경하지 않고 추가했다. 원격 브랜치와의 최신 차이는 이번 로그 작성에서 조회하지 않았다.

## 5. 자료 위치

- [템플릿·편집 계약 문서](/Users/junhokim/Desktop/Projects/JunnyCoder.github.io/css/pdf-maker/templates/README.md)
- [PDF 추가 QA 보고서](/Users/junhokim/Documents/Codex/2026-10-01/users-junhokim-desktop-projects-junnycoder-github/pdf-maker-qa-report.md)
- [이미지 기능 초기 검토](/Users/junhokim/Documents/Codex/2026-10-01/users-junhokim-desktop-projects-junnycoder-github/pdf-maker-image-review.md)
- [요소 디자인 초기 제안](/Users/junhokim/Documents/Codex/2026-10-01/users-junhokim-desktop-projects-junnycoder-github/pdf-maker-element-style-proposal.md)
- [최신 QA·최적화 보고서](/Users/junhokim/Documents/Codex/2026-10-01/users-junhokim-desktop-projects-junnycoder-github/editor-qa-optimization-2026-10-07.md)
- [14개 회귀 검사 결과](/Users/junhokim/Documents/Codex/2026-10-01/users-junhokim-desktop-projects-junnycoder-github/work/pdf-maker-tests/qa-20261007-results.json)
- [기본 부하 결과](/Users/junhokim/Documents/Codex/2026-10-01/users-junhokim-desktop-projects-junnycoder-github/work/pdf-maker-tests/load-20261007.json)
- [추가 부하·상세 계측](/Users/junhokim/Documents/Codex/2026-10-01/users-junhokim-desktop-projects-junnycoder-github/work/pdf-maker-tests/load-extra-20261007.json)
- [신규 변환 경계 사례](/Users/junhokim/Documents/Codex/2026-10-01/users-junhokim-desktop-projects-junnycoder-github/work/pdf-maker-tests/edge-20261007.json)

작업 폴더에 있는 보고서·테스트 링크는 현재 로컬 환경의 위치다. 프로젝트 저장소에 모두 포함된 파일은 아니다.

## 6. 이번 로그 작성

- 2026-10-07: 대화와 코드·커밋·기존 보고서를 대조해 프로젝트 루트 `log.md` 생성.
- 요청 변경 사항(30% 분할 해석, Notion → PDF 용도 전환, 이미지 검토 → 후속 구현)을 기록.
- 구현 완료, 자동 QA 통과, 실제 브라우저 검증 잔여, 미해결 오류/최적화 계획을 구분.
- 제품 변경 및 커밋·푸시는 수행하지 않음.

## 7. QA 지적 수정 및 1차 최적화 적용 — 2026-10-07

사용자의 “이제 코드 수정해봐” 요청에 따라 실제 프로젝트에 반영했다.

### 변환 정확성

- 병합 표의 논리적 셀 좌표를 유지해 값의 열 이동을 수정. rowspan=0은 행 그룹 끝까지 적용하며 병합으로 점유된 추가 칸은 빈칸으로 유지.
- 역순 OL·개별 li 번호는 일반 Markdown에서 의미가 달라질 때 선택 필요 항목으로 안내. Strict 자동 적용은 번호 텍스트, Allow HTML은 원본 블록으로 보존.
- MathML mphantom을 TeX phantom으로 변환하고 mtext 중괄호·특수 문자를 이스케이프. 미지원 MathML을 성공으로 처리하지 않음.
- HTML 크기·노드 수·중첩 깊이, 표 격자 확장 작업량을 제한하고 오류 시 현재 편집기 문서를 보존.

### 반복 처리 제거 및 모듈화

- 공통 런타임에 크기 상한 캐시, 취소/즉시 실행 가능한 예약 작업, 변경 감지 ID 색인 분리.
- MD 렌더러 분리 및 변경 구간 DOM 갱신. 토큰별 위치 확인용 재파싱 제거, 참조 링크·소스 위치·코드 컨트롤 보존.
- 여러 토큰에 걸친 원본 HTML 컨테이너는 문서 파서 문맥으로 처리. 임시 위치 속성은 출력 전에 제거.
- 닫힌 제목 탐색은 갱신하지 않고 열릴 때 최신 파싱 결과 사용.
- HTML 모달 입력은 180ms로 병합. 최신 검사 전 삽입을 막고 닫기/재변환 시 예약 취소.
- 모달 미리보기와 strict 검사에서 토큰 공유. 로딩된 iframe의 문서·폰트를 유지하고 변경 블록만 갱신.
- iframe 스크롤은 프레임당 한 번으로 병합하고 오래된 문서의 복원 작업 무효화.
- HTML 정제 결과·CSS·코드 강조·수식 캐시. 같은 CSS는 한 스타일시트로 공유하고 범위 ID는 충돌 없이 생성.
- 수식 매크로 정의는 순서대로 실행하며 매크로 문맥이 있으면 캐시 재사용 제외.
- PDF 원본 직렬화/히스토리와 페이지 재분할 경계를 별도 모듈로 분리.
- PDF 선택 스타일 미리보기/선택 적용/코드 언어 변경은 영향받은 페이지부터 재분할하고 앞쪽 완성 페이지 재사용. 분할된 블록은 첫 조각까지 경계를 되돌림.
- 전역 설정, 표지/목차, 불러오기/Undo, 출력은 전체 재분할 유지. 페이지 번호·제목 링크는 갱신.
- Undo/Redo는 최대 30개와 약 16MiB 상태 문자열을 기준으로 관리하며 최소 한 상태 보존. 변경 없는 원본은 저장용 직렬화 재사용.

### 검증 결과

- 기존 14개 + 신규 최적화 1개 = **15개 스위트 최종 통과**.
- 7개 부하 사례를 각각 5회 실행하여 **35회 모두 완료**.
- 저장소에 `tests/editor-qa` 및 의존성 잠금 파일 추가. 새 검사 스위트는 저장소 기준으로 재현 가능.
- 두 도구의 자산 버전을 `20261007-optimize-9`로 일치시킴.

| 사례 | 수정 전 관측 | 수정 후 5회 중앙값 |
| --- | --- | --- |
| MD 약 98KB 편집 후 렌더 | 835–869ms | 54ms |
| MD 약 294KB 편집 후 렌더 | 6.1–6.4초 | 145ms |
| 변환 항목 500개 자동 적용 | 717ms | 35ms |
| 변경 없는 HTML 블록 100개 재처리 | 36ms | 1.4ms |
| 같은 CSS의 HTML 블록 100개 스타일 수 | 100개 | 1개 |
| PDF 선택 스타일 미리보기 | 현재 코드 전체 재분할 경로 62ms | 부분 재분할 22ms |

수정 전 값은 이전 QA의 단회/반복 관측값이며 수정 후는 5회 중앙값이다. PDF는 이번 코드의 같은 입력에 대해 전체/부분 경로를 각각 5회 비교했다. **모두 Node/jsdom 수치이며 실제 Chrome의 FPS·입력 p95·인쇄 성능은 아니다.**

### 잔여 단계

- Windows/macOS Chrome 실제 화면·스크롤·폰트/이미지 로딩·출력 PDF 확인.
- 표지/목차·구조 편집의 부분 재분할 확장, 치수 캐시·화면 근처 페이지 우선 렌더링은 추가 브라우저 계측 후 진행.
- 명령 기반 히스토리와 바이너리 프로젝트 묶음 형식은 추가 검토.

### 후속 자료

- [런타임 모듈 책임·계약](/Users/junhokim/Desktop/Projects/JunnyCoder.github.io/docs/editor-runtime.md)
- [저장소 QA 안내](/Users/junhokim/Desktop/Projects/JunnyCoder.github.io/tests/editor-qa/README.md)
- [수정 결과 보고서](/Users/junhokim/Documents/Codex/2026-10-01/users-junhokim-desktop-projects-junnycoder-github/editor-optimization-results-2026-10-07.md)
- [최종 회귀 검사 결과](/Users/junhokim/Documents/Codex/2026-10-01/users-junhokim-desktop-projects-junnycoder-github/work/pdf-maker-tests/qa-optimization-results.json)
- [반복 부하 측정 결과](/Users/junhokim/Documents/Codex/2026-10-01/users-junhokim-desktop-projects-junnycoder-github/work/pdf-maker-tests/load-optimization-results.json)

이번 수정은 커밋·푸시하지 않았다.
