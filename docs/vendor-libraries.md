# 브라우저 라이브러리

작성기와 이력서 뷰어의 필수 JavaScript는 `tools/libs/`에서 로드합니다. 파일은 공식 배포본이며 앱 소스와 구분합니다.

| 라이브러리 | 버전 | 역할 | 출처·라이선스 |
| --- | --- | --- | --- |
| CodeMirror | 5.65.16 | Markdown 원문 편집 | [공식 저장소](https://github.com/codemirror/codemirror5/tree/5.65.16), MIT |
| Marked | 4.3.0 | Markdown 파싱 | [공식 패키지](https://www.npmjs.com/package/marked/v/4.3.0), MIT |
| Highlight.js | 11.9.0 | 코드 구문 강조 | [공식 배포](https://github.com/highlightjs/highlight.js/releases/tag/11.9.0), BSD-3-Clause |
| DOMPurify | 3.4.17 | 가져온 HTML 정화 | [공식 패키지](https://www.npmjs.com/package/dompurify/v/3.4.17), Apache-2.0 / MPL-2.0 |
| KaTeX | 0.16.9 | 수식과 수식 글꼴 | [공식 패키지](https://www.npmjs.com/package/katex/v/0.16.9), MIT |

DOMPurify와 KaTeX의 패키지 버전·무결성 값은 QA `package-lock.json`에 고정했습니다. DOMPurify 라이선스는 `tools/libs/DOMPurify-LICENSE.txt`, KaTeX 라이선스는 `tools/libs/katex/LICENSE`에 있습니다. 기존 배포 파일의 라이선스 헤더를 유지합니다. 제공하지 않는 DOMPurify sourcemap URL 주석만 제거했습니다.

라이브러리를 갱신할 때는 버전을 명시해 설치하고 공식 `dist` 파일을 복사한 뒤, HTML의 캐시 버전과 이 문서를 갱신합니다. `python3 scripts/pages.py qa`와 Safari HTML 가져오기·수식·인쇄 검사를 수행합니다.

홈페이지 Pretendard는 기존 CDN을 사용하며 시스템 글꼴 대체값이 있습니다. 독립 HTML 내보내기는 다른 컴퓨터에서도 수식 글꼴을 받을 수 있도록 KaTeX CSS의 절대 CDN URL을 남깁니다. 작성기·이력서 화면의 필수 스크립트는 CDN을 기다리지 않습니다.
