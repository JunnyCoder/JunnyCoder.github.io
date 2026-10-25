# 문서 렌더러와 편집기 구조

Markdown Editor, PDF Maker, 이력서 뷰어가 문서 처리와 출력 규칙을 공유합니다. 입력 방식과 저장 책임은 각 작성기에 남깁니다. 브라우저용 일반 JavaScript 모듈을 HTML에서 순서대로 로드하며 별도 번들러가 필요하지 않습니다.

## 모듈 경계

| 계층 | 주요 모듈 | 담당 범위 |
| --- | --- | --- |
| 문서 해석·정규화 | `document/markdown`, `content`, `math`, `html-styles` | Markdown 해석, 안전한 HTML, 수식 원문, 가져온 CSS 범위 제한 |
| 문서 표현·명령 | `document/templates`, `commands`, `serialization` | 문서·요소 디자인, 공통 편집 명령, 원문/HTML 직렬화 |
| 출력·파일 형식 | `document/settings`, `project-format`, `renderer`, `page-reflow`, `resources` | 설정 검증, jpdf 형식, A4 분할·목차·번호, 자원 로딩 대기 |
| 읽기 전용 사용 | `document/assets`, `viewer` | 메모리 이미지, 프로젝트 렌더링·인쇄·자원 해제 |
| 공용 기반 기능 | `shared/render-runtime`, `table-model`, `code-blocks`, `code-controls`, `file-download`, `editor-transfer` | 제한된 캐시, 논리 표 좌표, 코드 표시·언어 변경 UI, 다운로드, 작성기 간 전달 |
| HTML 변환 | `shared/html-import-structures`, `html-to-markdown`, `html-blocks` | 표·목록·MathML 해석, 변환 선택, 독립 HTML/CSS 블록 |
| Markdown 전용 | `markdown-editor/preview-renderer`, `code-editing`, `import-preview`, `html-import`, `script` | CodeMirror 원문 편집, 원문 위치 매핑, 미리보기 갱신, 가져오기 화면, 기록·검색·탐색 |
| PDF 전용 | `pdf-maker/document-state`, `images`, `code-editing`, `script` | DOM 문서 편집, Undo/Redo·자동 저장, IndexedDB 이미지, 편집 UI |
| 이력서 연결 | `resume.js`, `resume/viewer.js` | 홈페이지 모달, 언어별 파일 로드, 준비/실패 상태, 인쇄 연결 |

위 경로는 `js/` 기준입니다. 공통 CSS는 `css/document/`와 `css/shared/`, 작성기 UI는 `css/markdown-editor/`와 `css/pdf-maker/`에 둡니다. A4 크기와 인쇄 규칙은 `css/document/paper.css` 한 곳에서 관리합니다.

```mermaid
flowchart LR
  MD[Markdown Editor: 원문] --> Parse[공통 해석·정규화·수식]
  PDF[PDF Maker: 문서 DOM] --> Parse
  MD --> Transfer[원문 전달]
  Transfer --> PDF
  Parse --> Style[공통 코드·표·요소 디자인]
  Style --> Preview[Markdown 미리보기]
  Style --> Renderer[공통 A4 렌더러]
  PDF --> Project[jpdf 저장 파일]
  Project --> Viewer[읽기 전용 뷰어]
  Viewer --> Renderer
  Renderer --> Print[페이지·목차·인쇄]
```

## 공통으로 빼지 않은 책임

Markdown의 진실 원본은 문자열이며 코드 언어 변경도 정확한 원문 구간을 수정합니다. 렌더링된 HTML을 Markdown으로 되돌려 편집하지 않습니다. PDF Maker의 진실 원본은 문서 DOM과 설정이며 이미지 저장·Undo·자동 저장을 함께 관리합니다.

두 작성기는 같은 명령을 각자의 어댑터로 실행합니다. 한 작성기의 상태 모델을 다른 작성기에 강제하지 않습니다. 이력서 뷰어에는 편집기 컨트롤러, localStorage 초안, IndexedDB를 로드하지 않습니다.

## 유지해야 할 동작

- 바뀌지 않은 Markdown 블록은 DOM을 재사용합니다. 원문 위치와 참조 링크가 바뀌면 필요한 결과를 갱신합니다.
- 코드 원문·수식 TeX·HTML 블록을 표시용 마크업으로 덮어쓰지 않습니다. 복사·저장 시 편집 컨트롤을 제거합니다.
- 수식 매크로는 문서 순서대로 적용합니다. 매크로 문맥에서는 일반 수식 캐시를 사용하지 않습니다.
- HTML 입력을 먼저 정화한 뒤 캐시합니다. CSS는 문서/블록 범위 안에 한정하며 앱의 전역 `@page`를 변경하지 못합니다.
- 가져오기·이미지 로딩 중 사용자가 문서나 설정을 바꾸면 오래된 결과가 새 작업을 덮어쓰지 않습니다. 취소/실패 시 원래 문서를 유지합니다.
- PDF의 선택 요소 스타일 변경에는 부분 재배치를 사용할 수 있습니다. 설정·가져오기·Undo·표지·목차·인쇄는 전체 재배치합니다.
- PDF 인쇄는 폰트·이미지를 기다린 후 전체 페이지를 준비합니다. Safari의 A4 반올림으로 생기는 빈 페이지를 막기 위해 인쇄 높이에 1 CSS px 여유를 둡니다.
- 모바일 설정 패널을 열어도 A4 미리보기 DOM은 치수를 계산할 수 있게 유지합니다. `display:none`으로 페이지 측정을 중단시키지 않습니다.
- 읽기 전용 뷰어는 모달 닫힘·언어 전환 시 DOM과 임시 이미지 URL을 해제합니다. 메시지는 같은 origin과 실제 iframe에서 온 것만 받습니다.
- 잘못된 저장 기록을 건너뛰고 유효한 기록은 복원합니다. 읽지 못한 PDF 초안을 빈 자동 저장으로 덮어쓰지 않습니다.

## 입력과 메모리 제한

HTML 입력: 텍스트 10MiB, 요소 50,000개, 중첩 256단계. 표 확장: 점유 셀 100,000개, 열 1,000개. jpdf 프로젝트: 최대 150MiB. 이미지와 자산은 형식·크기를 검증합니다.

Undo/Redo는 최대 30개 상태와 약 16MiB 문자열 예산을 사용하며 최소 한 상태를 유지합니다. 캐시의 용량 제한은 문서 크기 제한과 별개입니다. 오류가 나면 편집 중인 내용을 보존하고 상태를 표시합니다.

## 검증

`python3 scripts/pages.py qa`는 공식 Pages 산출물의 실제 HTML 로드 순서를 사용합니다. jsdom 검사는 상태·변환·편집 계약을 검증하며 PDF 치수는 모사합니다. Safari 검증에서 실제 파일 선택, 이미지 디코딩·저장, iframe, 화면 배치와 PDF 인쇄를 확인합니다. 상세 범위와 재현 방법은 [QA 문서](../tests/editor-qa/README.md)에 있습니다.
