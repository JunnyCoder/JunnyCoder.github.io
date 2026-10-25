# JunnyCoder.github.io

GitHub Pages로 정적 배포하는 포트폴리오와 브라우저 도구입니다.

## 로컬 빌드와 전체 QA

필요한 도구: Docker, Python 3.9 이상, Node.js 22 이상, npm.
macOS에서는 Docker Desktop을 먼저 실행합니다.

```sh
npm ci --prefix tests/editor-qa --no-audit --no-fund
python3 scripts/pages.py qa
python3 scripts/pages.py serve --port 8880
```

Safari에서 `http://127.0.0.1:8880/`를 엽니다. 서버는 **Jekyll이 생성한 결과물만** 제공합니다. 소스 폴더를 일반 HTTP 서버로 열면 Liquid 처리와 배포 경로를 제대로 검증할 수 없습니다.

`qa`는 아래 순서로 실행하며 실패하면 0이 아닌 종료 코드를 반환합니다.

1. Git 추적 파일과 ignore되지 않은 새 파일을 별도 빌드 입력으로 복사합니다.
2. 실제 배포에 사용된 공식 Pages 이미지와 동일한 digest·`linux/amd64`로 빌드합니다.
3. 모든 산출물, 내부 링크·앵커, 스크립트 문법과 HTTP 경로를 검사합니다.
4. 생성된 페이지와 모듈을 대상으로 기능 회귀 검사를 실행합니다.

| 명령 | 용도 |
| --- | --- |
| `python3 scripts/pages.py build` | 공식 이미지로 정적 빌드 |
| `python3 scripts/pages.py audit` | 기존 산출물의 전체 경로 검사 |
| `python3 scripts/pages.py test` | 기존 산출물의 기능 검사 |
| `python3 scripts/pages.py paths` | 빌드·증거 파일 위치 확인 |
| `python3 scripts/pages.py fixtures` | Safari 검사용 임시 문서 생성 |
| `python3 scripts/live_check.py` | 현재 공개 배포와 외부 링크 읽기 전용 확인 |

macOS의 빌드 결과는 동기화 충돌을 피하도록 시스템 임시 디렉터리의 `junny-pages-qa/<저장소 경로 해시>/`에 저장합니다. Linux/CI는 `.pages-qa/`를 사용합니다. 필요하면 전 명령에 동일한 `PAGES_QA_DIR` 환경변수를 지정할 수 있습니다. 이 디렉터리는 빌드 전용 경로여야 합니다.

소스에 `index.html`과 `index 2.html`처럼 숫자가 붙은 복사본이 함께 있으면 빌드를 중단하고 이전 산출물을 보존합니다. 동기화 충돌 파일은 저장소 밖에 백업한 뒤 내용을 비교해 정리하세요. 의도한 별도 파일이라면 역할을 드러내는 이름으로 구분합니다.

출력 위치에는 `build.log`, `build.json`, 소스·산출물 SHA-256 목록, `audit.json`이 남습니다. `.github/workflows/pages-qa.yml`은 같은 검사를 PR·main push에서 실행하고 증거 파일을 보관합니다. 배포 작업은 포함하지 않습니다.

## 배포 환경 기준

- 기준 실행: [pages build and deployment #38148363188](https://github.com/JunnyCoder/JunnyCoder.github.io/actions/runs/38148363188)
- 공식 이미지: `ghcr.io/actions/jekyll-build-pages:v1.0.13`
- 고정 digest·플랫폼: [scripts/pages-image.json](scripts/pages-image.json)
- 이미지 내부: GitHub Pages 232 / Jekyll 3.10.0
- `_config.yml`은 배포 입력입니다. 개발 문서·검사 코드·의존성·로그를 정적 산출물에서 제외합니다.

로컬 서버는 대소문자 구분, 디렉터리 리디렉션, 404와 직접 경로 진입을 검사합니다. GitHub/Cloudflare의 TLS·캐시·도메인 설정은 공개 사이트 검사로 따로 확인합니다.

## 문서와 이력서

- [공통 렌더러와 편집기 모듈 구조](docs/editor-runtime.md)
- [QA 범위와 Safari 재현 절차](tests/editor-qa/README.md)
- [이력서 `.jpdf.json` 관리](assets/resume/README.md)
- [브라우저 라이브러리 버전과 출처](docs/vendor-libraries.md)

이력서는 PDF Maker의 **작업 파일 저장** 결과를 `assets/resume/resume_ko.jpdf.json`, `resume_en.jpdf.json`으로 추가합니다. 실제 파일이 없는 언어는 준비 중 안내를 보여줍니다.
