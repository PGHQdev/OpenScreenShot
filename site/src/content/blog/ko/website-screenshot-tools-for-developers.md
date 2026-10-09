---
title: 개발자, CI, AI 에이전트를 위한 웹사이트 스크린샷 도구
description: openscreenshot CLI·MCP, shot-scraper, Playwright 등을 런타임, 전체 페이지, CLI, MCP, 동영상, 라이선스로 비교.
audience: developers
order: 9
---

셸 스크립트나 CI 작업에서 공개 페이지의 PNG만 필요하다면 openscreenshot, shot-scraper, capture-website-cli, pageres-cli 같은 명령줄 도구로 충분합니다. 캡처에 로그인, 클릭, 검증, 동영상이 필요하다면 Playwright나 Puppeteer로 작성하세요. AI 에이전트에는 로컬 MCP 서버가 모델에 스크린샷을 반환합니다. `openscreenshot serve`는 호출당 스크린샷 하나를 찍고, Playwright MCP는 브라우저 세션 전체를 제어합니다.

`openscreenshot` 패키지는 저희 제품이며, 이 페이지는 이 패키지가 더 약한 선택인 경우를 함께 설명합니다. 기능을 비교할 뿐 도구의 순위를 매기지 않습니다. 모든 사실은 2026년 10월 9일 기준이며, 아래에 링크한 각 프로젝트의 저장소, 패키지 레지스트리, 공식 문서를 근거로 합니다.

## 도구 한눈에 보기

| 도구                | 언어 / 런타임                                     | 전체 페이지         | CLI           | MCP                   | 동영상             | 라이선스   |
| ------------------- | ------------------------------------------------- | ------------------- | ------------- | --------------------- | ------------------ | ---------- |
| openscreenshot      | Node.js 22.12+, 설치된 Chrome, Chromium 또는 Edge | `--full`            | 예            | 예, stdio             | 아니요             | MIT        |
| shot-scraper        | Python 3.10+, Playwright 브라우저                 | 기본값              | 예            | 명시되지 않음         | 예, WebM 또는 MP4  | Apache-2.0 |
| capture-website-cli | Node.js 20+, Puppeteer Chrome                     | `--full-page`       | 예            | 명시되지 않음         | 아니요             | MIT        |
| pageres-cli         | Node.js 20+, Puppeteer Chrome                     | 기본값              | 예            | 명시되지 않음         | 아니요             | MIT        |
| Playwright          | Node.js, Python, Java, .NET                       | `fullPage: true`    | 테스트 러너   | Playwright MCP를 통해 | 예                 | Apache-2.0 |
| Puppeteer           | Node.js 22.12+                                    | `fullPage: true`    | 명시되지 않음 | 명시되지 않음         | 예, Chrome에서 MP4 | Apache-2.0 |
| Playwright MCP      | `npx`를 통한 Node.js 또는 Docker                  | `fullPage` 매개변수 | 서버만        | 예, stdio 또는 HTTP   | 예, 선택 사항      | Apache-2.0 |

“명시되지 않음”은 저희가 확인한 프로젝트 자체 문서에 해당 기능에 관한 설명이 없다는 뜻입니다.

## openscreenshot (CLI 및 MCP 서버)

[openscreenshot](https://www.npmjs.com/package/openscreenshot)은 `puppeteer-core`로 컴퓨터에 이미 설치된 Chrome, Chromium, Edge를 제어하므로 브라우저를 다운로드하지 않습니다. 명령 하나로 전체 페이지 PNG를 저장합니다.

```sh
npx openscreenshot shot https://example.com --out example.png --full
```

플래그는 `--out`(파일, 또는 stdout은 `-`), `--full`, `--width`(200~~3840, 기본값 1280), `--height`(200~~2160, 기본값 800)입니다. 종료 코드 0은 PNG가 기록되었음을, 1은 캡처 실패를, 2는 잘못된 사용법을 뜻합니다. `openscreenshot serve`는 stdio로 MCP 서버를 시작하며, 도구는 `capture_screenshot` 하나입니다. 이 도구는 `url`, `fullPage`, `width`, `height`를 받아 PNG 이미지 콘텐츠를 반환합니다. 설정 방법은 [CLI 가이드](/ko/blog/screenshot-cli/), [MCP 가이드](/ko/blog/screenshot-mcp-server/), [CI 가이드](/ko/blog/screenshots-for-ci/)에서 다루며, 기준은 [소스](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src)입니다.

더 약한 선택인 경우:

- 캡처할 때마다 빈 프로필로 새 브라우저를 시작합니다. 쿠키, 로그인, 클릭, 선택자 대기가 없으므로 로그인이 필요한 페이지는 로그인 화면이 나옵니다.
- 페이지 이동은 최대 30초 동안 `networkidle2`를 기다리며, 추가 대기 옵션은 없습니다. 네트워크가 잠잠해진 뒤에 렌더링되는 페이지는 절반만 로드된 상태로 찍힐 수 있습니다.
- 출력은 PNG뿐이며 PDF나 동영상은 없습니다.
- MCP 서버는 로컬 stdio만 지원하며 호스팅 URL이나 HTTP 전송은 없습니다. 도구는 이미지를 반환할 뿐 파일을 기록하지 않습니다.
- 컨테이너에서 동작하도록 브라우저를 `--no-sandbox`로 실행합니다. 신뢰하는 URL만 캡처하세요.
- Windows에서는 Edge와 사용자별 Chrome 설치를 감지하지 못하므로 `CHROME_PATH`를 설정하세요.

로그인된 페이지, 주석, 직접 하는 PDF 내보내기에는 [브라우저 확장 프로그램](/ko/docs/)을 사용하세요.

## shot-scraper

[shot-scraper](https://github.com/simonw/shot-scraper)는 Playwright 기반의 Python 도구입니다. [스크린샷 문서](https://github.com/simonw/shot-scraper/blob/main/docs/screenshots.md)에 따라 설치하고, 브라우저를 다운로드한 뒤 스크린샷을 찍으세요.

```sh
pip install shot-scraper
shot-scraper install
shot-scraper https://example.com -o example.png
```

`--height`를 생략하면 전체 페이지 스크린샷이 됩니다. `--selector`는 요소 하나를 캡처하고, `shot-scraper pdf`는 PDF를 저장하며, `multi`는 YAML 목록의 스크린샷들을 실행합니다. [1.10](https://github.com/simonw/shot-scraper/releases/tag/1.10)에서 추가된 `video` 명령은 YAML 스토리보드로 WebM을 녹화하고, `--mp4`는 ffmpeg로 이를 변환합니다. 기본 브라우저는 Chromium이며 Firefox와 WebKit도 설치할 수 있습니다. 팀이 Python으로 작업하거나, 스크린샷, PDF, 스크립트로 만든 데모 동영상을 한 도구에서 원할 때 고르세요.

## capture-website-cli

[capture-website-cli](https://github.com/sindresorhus/capture-website-cli)는 Sindre Sorhus가 만든 Node.js 도구로, Puppeteer로 페이지를 캡처합니다. 기본값은 뷰포트이며, `--full-page`는 스크롤 가능한 페이지 전체를 캡처합니다.

```sh
npm install --global capture-website-cli
capture-website https://example.com --output=screenshot.png --full-page
```

`--output`이 없으면 이미지를 stdout으로 출력합니다. PNG, JPEG, WebP로 출력합니다. `--element`, `--hide-elements`, `--remove-elements`, `--click-element`, `--dark-mode`, `--style`, `--script` 같은 플래그로 캡처 전에 페이지를 준비할 수 있는데, 이는 openscreenshot이 할 수 없는 일입니다. 캡처 전에 쿠키 배너를 숨기거나 CSS를 주입해야 할 때 고르세요.

## pageres-cli

[pageres-cli](https://github.com/sindresorhus/pageres-cli)는 한 번의 실행으로 여러 URL을 여러 해상도로 캡처합니다.

```sh
pageres https://example.com 1366x768 1600x900
```

모든 URL과 해상도 조합을 캡처하며 기본값은 전체 페이지입니다. `--crop`은 각 이미지를 지정한 높이로 제한합니다. 출력은 PNG 또는 JPEG이며 기본 크기는 1366x768입니다. `iphone5s` 같은 기기 키워드는 더 이상 지원되지 않습니다. 활동은 적은 편입니다. 마지막 릴리스인 2025년 9월 9일의 v9.0.0은 Node.js 요구 버전을 20으로 올리고 플래그 세 개를 추가했습니다. 여러 너비에서 빠르게 반응형을 점검할 때 고르세요.

## Playwright

[Playwright](https://github.com/microsoft/playwright)는 Chromium, Firefox, WebKit용 Microsoft의 자동화 및 테스트 프레임워크로, Node.js, Python, Java, .NET 바인딩을 제공합니다. 전체 페이지 스크린샷은 [`page.screenshot`](https://playwright.dev/docs/api/class-page#page-screenshot)의 옵션 하나입니다.

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://playwright.dev/docs/api/class-page#page-pdf)는 헤드리스 Chromium에서만 동작합니다. [동영상 녹화](https://playwright.dev/docs/videos)는 컨텍스트 옵션이며, 테스트 러너는 실패한 테스트의 동영상만 남길 수 있습니다. 스크린샷이 로그인, 클릭, 검증을 하는 테스트의 한 단계라면 Playwright를 고르세요.

## Puppeteer

[Puppeteer](https://github.com/puppeteer/puppeteer)는 Chrome과 Firefox용 Google의 Node.js 라이브러리입니다. `npm i puppeteer`는 Chrome for Testing을 다운로드합니다. [스크린샷 옵션](https://pptr.dev/api/puppeteer.screenshotoptions)도 같은 형태를 사용합니다.

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://pptr.dev/api/puppeteer.page.pdf)는 인쇄용 CSS로 PDF를 생성합니다. puppeteer-core 25.10.0에서 추가된 [`page.record()`](https://pptr.dev/api/puppeteer.page.record)는 Chrome에서 MP4를 녹화합니다. Firefox는 WebDriver BiDi로 실행되며, 일부 기능은 지원되지 않습니다. openscreenshot은 `puppeteer-core`를 얇게 감싼 도구이므로, 네 가지 캡처 옵션 이상이 필요하다면 Puppeteer를 직접 사용하세요.

## Playwright MCP

[Playwright MCP](https://github.com/microsoft/playwright-mcp)는 에이전트가 접근성 스냅샷을 통해 브라우저를 제어하게 하므로 비전 모델이 필요하지 않습니다. [README](https://github.com/microsoft/playwright-mcp/blob/v0.0.83/README.md)에는 다음과 같은 표준 설정이 나와 있습니다.

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

`browser_take_screenshot` 도구는 `fullPage` 매개변수를 받아 PNG, JPEG, WebP를 반환합니다. PDF와 동영상 도구는 `--caps`로 선택해 켭니다. 브라우저는 기본으로 화면이 보이는 상태로 실행되고 영구 프로필을 유지하므로 로그인 상태가 이어질 수 있습니다. `--isolated`, `--storage-state`, `--extension`(실행 중인 Chrome이나 Edge에 연결)으로 이 동작을 바꿀 수 있습니다. `--port`는 stdio 대신 HTTP로 서비스합니다. 아직 0.0.x 릴리스(v0.0.83)입니다. 에이전트가 로그인, 클릭, 양식 입력을 해야 한다면 `openscreenshot serve` 대신 이 도구를 고르세요.

## 무엇을 고를까요

- **스크립트나 CI 아티팩트용 공개 페이지 PNG:** openscreenshot, shot-scraper, capture-website-cli.
- **같은 페이지를 여러 너비로:** pageres-cli.
- **먼저 요소를 숨기거나 CSS 주입:** capture-website-cli 또는 shot-scraper.
- **명령줄에서 PDF나 스크립트로 만든 데모 동영상:** shot-scraper.
- **테스트 스위트에서 로그인, 클릭, 검증:** Playwright 또는 Puppeteer.
- **페이지를 보기만 하면 되는 에이전트:** `openscreenshot serve`.
- **페이지와 상호작용하거나 로그인해야 하는 에이전트:** Playwright MCP.
- **로그인된 페이지를 캡처하고 주석을 다는 사람:** 확장 프로그램. [전체 페이지 확장 프로그램 비교](/ko/blog/full-page-screenshot-extensions/)를 참고하세요.
