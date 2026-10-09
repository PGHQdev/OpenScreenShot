---
title: 모든 플랫폼을 위한 오픈 소스 스크린샷 도구
description: '실행 환경별 오픈 소스 스크린샷 도구: 브라우저용 OpenScreenShot, Screenity와 ShareX, Flameshot, Playwright 등.'
audience: everyday
order: 8
---

캡처할 대상이 어디에 있는지에 따라 오픈 소스 스크린샷 도구를 고르세요. Windows 화면에 있는 것이라면 무엇이든 ShareX를 사용하세요. Linux, macOS, Windows 데스크톱에는 Flameshot을 사용하세요. 웹페이지에는 OpenScreenShot이나 Firefox에 내장된 Screenshots 도구 같은 브라우저 도구를 사용하고, 스크립트에서 스크린샷을 찍으려면 shot-scraper, Playwright, Puppeteer를 사용하세요.

OpenScreenShot은 저희 제품입니다. 이 페이지는 OpenScreenShot이 맞지 않는 경우를 함께 설명하며, 도구의 순위를 매기지 않습니다. 모든 사실은 2026년 10월 9일 기준이며, 아래에 링크한 각 프로젝트의 저장소, 스토어 등록 정보, 공식 사이트를 근거로 합니다.

## 어떤 도구가 어떤 플랫폼을 지원하나요

| 도구                | 실행 환경                                               | 캡처 대상                              | 라이선스       | 전체 페이지     | 동영상                 |
| ------------------- | ------------------------------------------------------- | -------------------------------------- | -------------- | --------------- | ---------------------- |
| OpenScreenShot      | Chrome, Firefox                                         | 탭 안의 웹페이지                       | MIT            | 예              | 탭 녹화, Chrome 버전만 |
| Screenity           | Chrome 및 Chrome 웹 스토어를 사용하는 Chromium 브라우저 | 탭, 영역, 데스크톱, 앱 창, 카메라 녹화 | GPL-3.0        | 문서화되지 않음 | 예                     |
| ShareX              | Windows                                                 | 화면의 모든 것                         | GPL-3.0        | 스크롤 캡처     | 동영상과 GIF           |
| Flameshot           | Linux, macOS, Windows                                   | 화면 영역                              | GPL-3.0        | 아니요          | 문서화되지 않음        |
| Firefox Screenshots | Firefox 데스크톱                                        | 웹페이지                               | Firefox의 일부 | 예              | 문서화되지 않음        |
| shot-scraper        | Python 3.10 이상                                        | 명령으로 웹페이지 캡처                 | Apache-2.0     | 예, 기본값      | 예, 스크립트 파일로    |
| Playwright          | Node.js, Python, Java, .NET                             | 코드로 웹페이지 캡처                   | Apache-2.0     | 예              | 예                     |
| Puppeteer           | Node.js                                                 | 코드로 웹페이지 캡처                   | Apache-2.0     | 예              | 예, Chrome             |

이 중 Android나 iOS에서 실행되는 도구는 없습니다. 브라우저 확장 프로그램은 자기 탭 안의 웹페이지만 봅니다. 데스크톱 앱은 화면 전체를 보지만 웹페이지가 어디서 끝나는지는 알지 못합니다.

## 브라우저: OpenScreenShot

[OpenScreenShot](https://github.com/pghqdev/OpenScreenShot)은 [Chrome](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)과 [Firefox](https://addons.mozilla.org/firefox/addon/openscreenshot/)용 MIT 라이선스 확장 프로그램입니다. 전체 페이지, 보이는 영역, 선택 영역, 또는 요소 하나를 캡처합니다. 그다음 화살표, 도형, 텍스트, 단계 번호, 블러, 자르기가 있는 편집기를 열고 PNG, JPEG, WebP, PDF로 내보냅니다. 캡처와 편집은 브라우저 안에서 실행되며, 확장 프로그램은 스크린샷이나 녹화를 업로드하지 않습니다. 각 모드는 [문서](/ko/docs/)에서 다룹니다.

Chrome 버전은 선택적으로 마이크, 탭 오디오, 웹캠과 함께 [탭을 녹화](/ko/docs/#record)하고 MP4 또는 WebM으로 내보낼 수도 있습니다. Firefox 버전은 스크린샷만 찍습니다.

필요한 대상이 브라우저 탭 밖에 있다면 OpenScreenShot은 맞지 않는 도구입니다. 데스크톱, 다른 앱, 브라우저 설정 페이지는 캡처할 수 없고, 화면 전체를 녹화하지도 않습니다.

## 브라우저 녹화: Screenity

[Screenity](https://github.com/alyssaxuu/screenity)는 Chrome용 화면 녹화 및 주석 확장 프로그램입니다. 마이크와 내부 오디오를 포함해 탭, 영역, 데스크톱, 모든 앱 창, 카메라를 녹화합니다. MP4, GIF, WebM으로 내보내거나 Google Drive에 저장합니다. 그림을 그리고 텍스트, 화살표, 도형을 추가하고, 민감한 페이지 콘텐츠를 블러 처리할 수 있습니다.

라이선스는 [GPL-3.0](https://github.com/alyssaxuu/screenity/blob/master/LICENSE)입니다. README에 따르면 버전 3.0.0부터 Manifest V3 버전에 맞춰 라이선스가 GPLv3로 바뀌었습니다. 확장 프로그램은 무료이며 로컬 녹화에는 로그인이 필요하지 않습니다. [Screenity Pro](https://screenity.io/pro)는 7일 체험 후 월 $10 또는 연 $120이며, 계정을 만들면 편집기, 링크 공유, EU 서버의 클라우드 호스팅을 추가합니다. README에 따르면 일부 코드 경로가 Screenity Pro에 연결되며, 이 경로는 Chrome 웹 스토어 버전에서만 활성화됩니다.

Screenity는 설치 시 모든 웹사이트에 대한 접근을 요청합니다. 문서에 전체 페이지 스크린샷에 관한 설명은 없습니다. 데스크톱이나 다른 앱을 녹화해야 한다면 OpenScreenShot 대신 Screenity를 고르세요. [Screenity 대안](/ko/alternatives/screenity/)을 참고하세요.

## Windows: ShareX

[ShareX](https://getsharex.com/)는 광고 없는 무료 Windows 앱으로, [GPL-3.0](https://github.com/ShareX/ShareX) 라이선스를 따릅니다. 화면, 창, 영역을 캡처하며, [스크롤 캡처](https://getsharex.com/docs/scrolling-screenshot)는 연속된 스크린샷을 비교해 바뀐 부분을 덧붙이므로 화면 밖으로 스크롤되는 콘텐츠도 이미지 한 장에 담을 수 있습니다. 동영상과 GIF도 녹화하며, README에는 OCR과 QR 코드 스캔이 나와 있습니다.

이미지 편집기에는 도형, 화살표, 텍스트, 말풍선, 블러, 픽셀화, 강조 표시, 스포트라이트가 있습니다. ShareX는 여러 서비스로 업로드할 수 있고, 캡처 후 작업을 설정하면 자동으로 업로드할 수도 있습니다. 개인적인 콘텐츠를 캡처하기 전에 이 설정을 확인하세요. 설치 프로그램, 포터블 버전, Microsoft Store 또는 Steam으로 받을 수 있습니다. 최신 릴리스인 v21.0.0은 2026년 7월 3일에 나왔습니다.

ShareX는 macOS나 Linux에서 실행되지 않습니다.

## Linux, macOS, Windows: Flameshot

[Flameshot](https://flameshot.org/)은 Linux, macOS, Windows용 무료 스크린샷 도구로, [GPL-3.0](https://github.com/flameshot-org/flameshot) 라이선스를 따릅니다. 영역을 선택한 뒤 그 자리에서 화살표, 강조 표시, 블러 또는 픽셀화, 텍스트, 자유 곡선, 상자, 카운터 번호로 주석을 답니다. 명령줄 인터페이스도 있습니다. README에는 Return 키로 시작하는 선택적 Imgur 업로드가 나와 있으므로, 개인적인 콘텐츠를 캡처하기 전에 이 키를 알아 두세요.

[버전 14.0.0](https://github.com/flameshot-org/flameshot/releases/tag/v14.0.0)(2026년 6월)은 어느 모니터를 캡처할지 물어보며, Linux에서는 xdg-desktop-portal을 주 캡처 경로로 사용합니다. README는 GNOME과 Plasma의 Wayland 지원을 실험적이라고 설명합니다.

Flameshot에는 스크롤 캡처가 없습니다. [기능 요청](https://github.com/flameshot-org/flameshot/issues/1130)은 아직 열려 있습니다. 문서에서 녹화 기능은 찾지 못했습니다. Linux에서 웹페이지 전체를 캡처하려면 Flameshot과 브라우저 도구를 함께 사용하세요.

## 내장 도구: Firefox Screenshots

Firefox는 오픈 소스이며, Screenshots 도구는 설치가 필요 없습니다. [Mozilla 가이드](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/)에 따르면 페이지를 마우스 오른쪽 버튼으로 클릭하고 **Take Screenshot**(스크린샷 찍기)을 선택한 뒤 영역, 보이는 영역, 또는 **Save full page**(전체 페이지 저장)를 고르세요. 결과는 복사하거나 다운로드합니다. Mozilla는 2019년 5월 Firefox 67에서 Screenshots 서버로의 [업로드를 종료](https://blog.mozilla.org/futurereleases/2019/01/24/clarifying-the-future-of-firefox-screenshots/)했으므로 캡처는 로컬에 남습니다.

명령으로 캡처하려면, [DevTools 문서](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html)에 따라 Firefox DevTools 콘솔에서 `:screenshot --fullpage`를 입력하면 다운로드 폴더에 PNG가 저장됩니다. Chrome의 DevTools 프런트엔드도 [BSD-3-Clause](https://github.com/ChromeDevTools/devtools-frontend)로 공개된 오픈 소스이며, **Capture full size screenshot**(전체 크기 스크린샷 캡처) 명령으로 PNG를 저장합니다. 브라우저별 방법은 [전체 페이지 스크린샷 가이드](/ko/full-page-screenshot/)에서 다룹니다.

## 스크립트: shot-scraper, Playwright, Puppeteer

이 도구들은 반복 작업과 CI를 위해 명령이나 코드로 웹페이지를 캡처합니다. 자체 브라우저에서 페이지를 로드하므로 로그인된 탭은 보지 못합니다.

- [shot-scraper](https://github.com/simonw/shot-scraper)는 Playwright 기반의 Python 명령줄 도구입니다. 기본으로 전체 페이지 스크린샷을 찍으며, YAML 스크립트로 PDF를 저장하고 동영상을 녹화할 수도 있습니다.
- [Playwright](https://github.com/microsoft/playwright)는 Chromium, Firefox, WebKit용 Microsoft의 브라우저 자동화 및 테스트 프레임워크이며, 스크린샷, PDF, 동영상 API를 제공합니다.
- [Puppeteer](https://github.com/puppeteer/puppeteer)는 Chrome과 Firefox용 Google의 Node.js 라이브러리이며, 스크린샷, PDF, MP4 녹화 API를 제공합니다.

저희의 MIT 라이선스 `openscreenshot` 패키지는 명령줄 도구와 AI 에이전트용 MCP 서버를 제공합니다. 이 도구들을 모두 명령과 함께 다룬 내용은 [개발자용 비교](/ko/blog/website-screenshot-tools-for-developers/)를 참고하세요.

## 무엇을 고를까요

- **Windows 화면의 모든 것, 스크롤 캡처 포함:** ShareX.
- **Linux나 macOS의 화면 영역:** Flameshot.
- **마크업과 PDF 내보내기가 필요한 웹페이지 전체:** OpenScreenShot, 또는 설치 없이 빠르게 캡처하려면 Firefox Screenshots.
- **데스크톱이나 다른 앱의 녹화:** Screenity, 또는 Windows에서는 ShareX.
- **스크립트나 CI에서 스크린샷:** shot-scraper, Playwright, Puppeteer.

도구가 오픈 소스일 필요가 없다면 [전체 페이지 확장 프로그램 비교](/ko/blog/full-page-screenshot-extensions/)에서 GoFullPage, FireShot 등도 살펴보세요. [비교 페이지](/ko/compare/)는 OpenScreenShot, GoFullPage, FullPage Capture를 나란히 비교합니다.
