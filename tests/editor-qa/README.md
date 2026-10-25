# 전체 사이트 QA

## 자동 검사

저장소 최상위에서 실행합니다.

```sh
npm ci --prefix tests/editor-qa --no-audit --no-fund
python3 scripts/pages.py qa
```

| 검사 | 범위 |
| --- | --- |
| `scripts/site_audit.py` | 모든 빌드 파일, HTML/CSS/JS 참조, 내부 앵커, 문법, 대소문자, 직접 진입, 디렉터리 리디렉션, 404, 개발 파일 배포 제외 |
| `correctness.cjs` | 병합 셀, 목록 번호, MathML, 참조 링크, 원문 위치, DOM 재사용, 캐시·매크로, 변환 취소, 부분 재배치 |
| `document-layer.cjs` | 원문을 보존하는 공통 코드 명령, iframe CSS, HTML 내보내기, jpdf 검증, 편집기/뷰어 렌더링 일치, 긴 코드·수식·목차, 자산 해제, 뷰어 저장소 접근 없음 |
| `editor-workflows.cjs` | 검색·치환·Undo, 손상 기록, 가져오기 경쟁/취소, 다중 탭, 저장 실패, jpdf 저장·열기, 표지·목차·테마·이동·삭제·출력, 모바일 패널 |
| `site.cjs` | 모든 포트폴리오 상세/탭, 메뉴·모달·초점, 이력서 메시지, Jekyll 목록, 퀴즈 업로드·채점·저장·격리, 프롬프트, 점심조 편성·공유 URL·뒤로가기 |

라이브러리는 브라우저가 사용하는 저장소의 배포 파일을 읽습니다. `modules.cjs`가 실제 HTML에서 모듈 경로와 순서를 추출합니다. `run.cjs`는 각 묶음에 실행 제한 시간을 둡니다.

빠른 소스 회귀 검사만 필요할 때는 `npm test --prefix tests/editor-qa`를 사용할 수 있습니다. 배포 확인에는 반드시 `pages.py qa`를 사용합니다.

## Safari 검사

이 프로젝트의 실제 브라우저 검증은 Safari를 사용합니다. Chrome은 사용하지 않습니다.

```sh
python3 scripts/pages.py serve --port 8880
python3 scripts/pages.py fixtures
python3 scripts/pages.py paths
```

출력된 QA 경로의 `fixtures/`에 `document.md`, `document.html`, `document.css`, `quiz.json`, `image.png`, `resume.jpdf.json`이 생성됩니다. 모든 내용은 검사용이며 실제 이력서 폴더로 복사하지 않습니다.

| 경로/화면 | 실제 확인 흐름 |
| --- | --- |
| `/` | 메뉴, 프로젝트 모달/탭, Escape와 초점 복귀, 390px 폭 |
| 이력서 모달 | 파일 없는 KO/EN 안내와 인쇄 비활성화, 샘플 정상 렌더링, 언어 전환, 이미지·목차·인쇄 |
| `/tools/`, `/ssafy/` | Jekyll 목록의 실제 링크로 진입; 이력서 뷰어는 도구 목록에 미노출 |
| Markdown | MD 파일 열기, 코드·한글·수식, 저장 기록, HTML 변환 iframe과 적용, PDF 전달, 모바일 편집/미리보기 |
| PDF | HTML+CSS 동시 선택, jpdf 열기·저장·재열기, 새로고침 후 이미지 복구, 모바일 패널, 실제 PDF 저장 |
| 퀴즈 | JSON 파일 열기, 한 문제씩 답변, 화면 밖 답안 전체 채점, 좁은 화면 상태 |
| 점심조 | 임시 이름으로 생성, 공유 URL 새로고침 후 같은 팀 구성 |
| 없는 주소 | 실제 404 화면과 복귀 링크 |

정상 이력서 샘플은 별도 서버의 `--resume-fixture`로만 연결합니다. 예를 들어 `python3 scripts/pages.py serve --port 8881 --resume-fixture /path/to/qa/fixtures/resume.jpdf.json`에서 마지막 경로를 `paths`가 알려준 실제 위치로 바꿉니다. 이 옵션은 두 이력서 URL의 응답만 대체하고 빌드 결과를 수정하지 않습니다.

## 실제 인쇄 확인

Safari 인쇄 창에서 **A4, 100%, 브라우저 머리말/꼬리말 끄기**를 선택합니다. 물리 프린터 대신 PDF 저장을 사용합니다.

```sh
python3 tests/editor-qa/check-print.py /path/to/editor.pdf --pages 3
python3 tests/editor-qa/check-print.py /path/to/viewer.pdf --pages 5 --image
pdftoppm -scale-to 1100 -png /path/to/editor.pdf /path/to/editor-page
```

`check-print.py`는 Poppler를 사용해 A4 크기, 빈 페이지, 텍스트 경계, 코드 65줄의 순서·중복·누락, 마지막 문단, 첨부 이미지를 확인합니다. 위 페이지 수는 이번 macOS Safari 기본 설정으로 생성한 QA fixture 기준입니다. 생성된 **모든 페이지 이미지도 직접 확인**해야 합니다.

jsdom은 실제 폰트·인쇄·이미지 디코딩·브라우저 레이아웃을 대체하지 않습니다. 다른 브라우저와 실제 iPhone 기기 검증을 수행한 것으로 간주하지 않습니다.

## 공개 배포 검사

`python3 scripts/live_check.py`는 현재 운영 사이트의 응답·리디렉션·TLS와 공개 참고 링크를 확인하고 `live.json`을 남깁니다. 로컬 변경을 배포하지 않습니다. SNS의 401/403/429/999는 접근 제한으로 기록하며 깨진 링크로 단정하지 않습니다.
