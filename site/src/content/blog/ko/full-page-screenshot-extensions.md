---
title: 전체 페이지 스크린샷 확장 프로그램 비교 (2026)
description: OpenScreenShot, GoFullPage 등 확장 프로그램 6종을 가격, 소스, 권한, 주석, PDF, 녹화로 비교하고 브라우저 내장 도구도 소개합니다.
audience: everyday
order: 7
---

전체 페이지 스크린샷이 가끔만 필요하다면 Chrome DevTools, Microsoft Edge, Firefox에 내장된 도구로 설치 없이 페이지 전체를 캡처할 수 있습니다. 페이지를 자주 캡처한다면 아래 확장 프로그램들은 무료로 제공하는 기능, 설치 시 요청하는 사이트 접근 권한, 동영상 녹화 여부, 소스 공개 여부가 서로 다릅니다. 각 섹션에서 어떤 사람에게 맞는 도구인지 설명합니다.

OpenScreenShot은 저희 제품이며, 다른 도구가 더 잘 맞는 경우도 함께 적었습니다. 모든 사실은 2026년 10월 9일 기준이며, 각 섹션에 링크한 스토어 등록 정보, 확장 프로그램 매니페스트, 개발사 페이지를 근거로 합니다. 이 페이지는 기능을 비교할 뿐 도구의 순위를 매기지 않습니다.

## 도구 한눈에 보기

| 도구                  | 가격                                | 오픈 소스                         | 설치 시 모든 사이트 접근 | 주석 무료?                           | PDF                              | 녹화                 |
| --------------------- | ----------------------------------- | --------------------------------- | ------------------------ | ------------------------------------ | -------------------------------- | -------------------- |
| OpenScreenShot        | 무료                                | 예, MIT                           | 아니요                   | 예                                   | 예                               | 탭만, Chrome 버전    |
| GoFullPage            | 무료, Premium 연 $12                | 아니요                            | 아니요                   | 아니요, Premium                      | 예, 스마트 페이지 분할은 Premium | 아니요               |
| FullPage Capture      | 무료, Pro 연 $19                    | 아니요                            | 예                       | 예                                   | 예, 검색 가능한 PDF는 Pro        | 아니요               |
| Awesome Screenshot    | 무료 요금제, 유료는 월 $5부터       | 공개된 소스 없음                  | 예                       | 기본 도구만, 전체 도구는 유료 요금제 | 예                               | 데스크톱, 탭, 카메라 |
| FireShot              | 무료, Pro 연 $39.95 또는 1회 $99.95 | 아니요                            | 아니요                   | 등록 정보 기준 텍스트, 화살표, 블러  | 예, 링크 포함, 고급 PDF는 Pro    | 아니요               |
| FuseBase Pro (Nimbus) | 무료 요금제, Pro 가격 비공개        | 아니요                            | 예                       | 주석과 블러, 무료·유료 구분 비공개   | 예                               | 화면과 웹캠          |
| Chrome DevTools       | 무료, 내장                          | DevTools 프런트엔드, BSD-3-Clause | 설치 불필요              | 문서화된 편집기 없음                 | 문서화되지 않음                  | 문서화되지 않음      |
| Edge 스크린샷         | 무료, 내장                          | 아니요                            | 설치 불필요              | 펜 및 터치 마크업                    | 문서화되지 않음                  | 문서화되지 않음      |
| Firefox Screenshots   | 무료, 내장                          | Firefox의 일부                    | 설치 불필요              | 문서화되지 않음                      | 문서화되지 않음                  | 문서화되지 않음      |

“설치 시 모든 사이트 접근”은 확장 프로그램을 추가할 때 모든 웹사이트에 대한 호스트 접근 권한을 요청한다는 뜻입니다. Chrome은 이 요청을 “Read and change all your data on all websites”(모든 웹사이트의 모든 데이터 읽기 및 변경)로 표시합니다.

## OpenScreenShot

[OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)은 무료이고 유료 등급이 없으며, MIT 라이선스로 [GitHub에 소스](https://github.com/pghqdev/OpenScreenShot)를 공개합니다. Chrome 웹 스토어와 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/)에 등록되어 있습니다. 툴바 아이콘을 한 번 클릭하면 전체 페이지 캡처가 시작되고, 보이는 영역, 선택 영역, 요소 모드는 마우스 오른쪽 버튼 메뉴와 키보드 단축키로 사용할 수 있습니다. [캡처 모드](/ko/docs/#modes)를 참고하세요.

편집기에는 도형, 화살표, 텍스트, 단계 번호, 불투명 채우기가 있는 블러, Spotlight, 자르기, Cut이 있습니다. PNG, JPEG, WebP로 내보내거나, PDF를 한 페이지로, A4 또는 Letter에 맞춰, 또는 여러 페이지로 나눠 내보낼 수 있습니다. 설치 시 호스트 접근 권한을 요청하지 않습니다. Chrome 버전은 [탭을 녹화](/ko/docs/#record)해 MP4 또는 WebM으로 저장할 수 있으며, 처음 녹화할 때 Chrome이 탭 캡처 권한을 요청합니다. Firefox 버전은 스크린샷만 찍습니다.

덜 맞는 경우:

- 브라우저 탭의 웹페이지를 캡처합니다. 데스크톱이나 다른 앱은 캡처할 수 없고, 녹화도 탭만 가능합니다.
- 클라우드 저장소나 공유 링크가 없습니다. 내보낸 파일은 직접 공유해야 합니다.
- PDF는 스크린샷을 이미지로 담기 때문에 텍스트를 검색할 수 없습니다.
- `chrome://` 설정이나 브라우저 스토어 같은 브라우저 페이지는 캡처할 수 없습니다.

## GoFullPage

[GoFullPage](https://gofullpage.com/)는 클릭 한 번으로 페이지를 캡처하고 PNG, JPEG, PDF로 내보냅니다. [FAQ](https://gofullpage.com/faq)에 따르면 무료 버전은 스크린샷 수와 이미지·PDF 내보내기에 제한이 없습니다. [Premium](https://gofullpage.com/premium)은 7일 체험 후 연 $12이며, 자르기, 주석(블러, 텍스트, 강조 표시), URL과 타임스탬프, 스마트 PDF 페이지 분할을 추가합니다.

코드는 비공개입니다. FAQ에 따르면 개발자는 2018년에 원래의 MIT 프로젝트를 비공개로 포크했습니다. GoFullPage는 2026년 8월에 자사 [블로그](https://blog.gofullpage.com/2026/08/11/gofullpage-chrome-update/)가 “저작권 관련 문제”라고 부른 일로 Chrome 웹 스토어에서 삭제되었고, 주 등록 페이지는 2026년 9월 10일에 복구되었습니다. 공식 [Firefox 버전](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/)은 2026년 9월 7일에 출시되었습니다. 설치 시 호스트 접근 권한을 요청하지 않습니다.

GoFullPage는 마크업 없이 원클릭 캡처와 PDF 내보내기만 원하는 사람, 또는 마크업에 비용을 낼 사람에게 맞습니다. [GoFullPage 대안](/ko/alternatives/gofullpage/)을 참고하세요.

## FullPage Capture

[FullPage Capture](https://fullpagecapture.net/)는 캡처, 저장, 복사, 인쇄가 워터마크와 사용량 제한 없이 무료라고 밝힙니다. [Chrome 등록 정보](https://chromewebstore.google.com/detail/ggacghlcchiiejclfdajbpkbjfgjhfol)에는 화살표, 도형, 텍스트, 형광펜, 번호 배지, 블러가 있는 무료 편집기와 클릭 가능한 링크가 포함된 PDF가 설명되어 있습니다. Pro는 7일 체험 후 연 $19이며, 검색 가능한 PDF, 증거 모드, 일괄 캡처, 클라우드 업로드를 추가합니다.

코드는 비공개이며, 저희가 찾은 것은 Chrome 등록 정보뿐입니다. 매니페스트가 모든 웹사이트에 대한 접근을 요구하므로 Chrome은 설치 시 모든 사이트 경고를 표시합니다. 검색 가능한 PDF나 일괄 캡처가 필요하고 그 권한을 받아들일 수 있는 사람에게 맞습니다. [FullPage Capture 대안](/ko/alternatives/fullpage-capture/)을 참고하세요.

## Awesome Screenshot

Diigo의 [Awesome Screenshot](https://chromewebstore.google.com/detail/nlipoenfbbikpbjkfpfillcgkoblgpmj)은 스크린샷과 데스크톱, 탭, 카메라 녹화 기능을 함께 제공합니다. [요금 페이지](https://www.awesomescreenshot.com/pricing)에는 스크린샷 최대 100개, 기본 주석, 720p 녹화를 제공하는 무료 요금제가 나와 있습니다. Basic은 연간 결제 시 월 $5, Professional은 연간 결제 시 월 $6이며 최대 4K 녹화를 지원합니다. 공유 링크가 있는 클라우드 저장소와 로컬 저장을 제공합니다.

설치 시 모든 웹사이트에 대한 접근을 요청하며, Chrome 개인정보 섹션에 “웹사이트 콘텐츠” 수집을 공개하고 있습니다. [Firefox 등록 정보](https://addons.mozilla.org/en-US/firefox/addon/screenshot-capture-annotate/)에는 Mozilla Public License 2.0이 명시되어 있지만, 저희는 공개 소스 저장소를 찾지 못했습니다. 공유 링크와 화면 녹화기를 한 도구에서 원하는 팀에게 맞습니다. [Awesome Screenshot 대안](/ko/alternatives/awesome-screenshot/)을 참고하세요.

## FireShot

[FireShot](https://getfireshot.com/)은 전체 페이지를 링크가 포함된 PDF, PNG, JPEG로 저장합니다. [구매 페이지](https://getfireshot.com/buy.php)에 따르면 FireShot Pro는 기기 두 대 기준 연 $39.95 또는 1회 $99.95입니다. Pro는 고급 PDF 내보내기, Windows용 스마트 주석 편집기, 캡처 기록, 일괄 캡처를 추가합니다. 무료 Chrome 버전에 어떤 편집 도구가 포함되는지는 확인하지 못했습니다.

코드는 비공개입니다. FireShot은 설치 시 호스트 접근 권한을 요청하지 않지만 네이티브 메시징 권한을 요청하며, Chrome은 이를 별도의 경고로 표시합니다. [Firefox 부가 기능](https://addons.mozilla.org/en-US/firefox/addon/fireshot/)은 2023년 6월 5일에 마지막으로 업데이트되었습니다. FireShot은 일괄 캡처나 1회 구매 라이선스를 원하는 Windows 사용자에게 맞습니다. [FireShot 대안](/ko/alternatives/fireshot/)을 참고하세요.

## Nimbus와 FuseBase Pro

원래의 Nimbus Screenshot Chrome 등록 페이지에는 이제 “This item is not available”(이 항목을 사용할 수 없음)이 표시되고, Nimbus 캡처 페이지는 [FuseBase](https://thefusebase.com/screenshot/)로 리디렉션됩니다. Nimbus Web은 현재 스크린샷, 화면 및 웹캠 녹화, 주석, 블러, PDF 저장을 위한 [FuseBase Pro](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn)를 배포합니다. FuseBase, Google Drive, Dropbox, Slack으로 업로드합니다.

무료 요금제는 최대 5분, Pro는 최대 10시간까지 녹화합니다. [FuseBase 요금 페이지](https://thefusebase.com/pricing/)에는 플랫폼 요금제가 나와 있지만 확장 프로그램 가격은 명시되어 있지 않습니다. FuseBase Pro는 설치 시 모든 웹사이트에 대한 접근을 요청합니다. 이미 FuseBase에서 작업하는 사람에게 맞습니다. [Nimbus 대안](/ko/alternatives/nimbus/)을 참고하세요.

## 설치 없이: 브라우저 내장 도구

### Chrome DevTools

DevTools를 열고 Ctrl+Shift+P(macOS에서는 Cmd+Shift+P)를 누른 뒤 “screenshot”을 입력하고 **Capture full size screenshot**(전체 크기 스크린샷 캡처)을 선택하세요. Chrome이 PNG를 저장합니다. 문서에 편집기에 관한 설명은 없으며, [Command Menu 문서](https://developer.chrome.com/docs/devtools/command-menu)에 다른 스크린샷 명령이 나와 있습니다. [Chrome 가이드](/ko/full-page-screenshot/chrome/)를 참고하세요.

### Microsoft Edge 스크린샷

Microsoft [정책 페이지](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled)에 따르면 Edge는 Web Capture의 이름을 Screenshot으로 바꿨고, Ctrl+Shift+S로 열 수 있습니다. 전체 페이지나 일부 영역을 캡처하고, 펜이나 터치로 마크업할 수 있습니다. [Edge 가이드](/ko/full-page-screenshot/edge/)를 참고하세요.

### Firefox Screenshots

[Mozilla 가이드](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/)에 따르면 페이지를 마우스 오른쪽 버튼으로 클릭하고 **Take Screenshot**(스크린샷 찍기)을 선택한 뒤 **Save full page**(전체 페이지 저장)를 선택하세요. 결과는 복사하거나 다운로드합니다. Mozilla 서버로의 업로드는 2019년 5월 Firefox 67에서 종료되었습니다. [Firefox 가이드](/ko/full-page-screenshot/firefox/)를 참고하세요.

Safari, Brave, Opera, Vivaldi, Arc는 [브라우저별 가이드](/ko/full-page-screenshot/)를 참고하세요.

## 무엇을 고를까요

- **오늘 한 페이지만, 설치 없이:** 사용하는 브라우저의 내장 도구.
- **무료 마크업과 PDF, 설치 시 모든 사이트 접근 없음, 읽을 수 있는 소스:** OpenScreenShot.
- **마크업 없는 원클릭 캡처:** GoFullPage 무료 버전.
- **검색 가능한 PDF나 일괄 캡처:** FullPage Capture Pro 또는 FireShot Pro.
- **팀을 위한 공유 링크와 데스크톱 녹화:** Awesome Screenshot 또는 FuseBase Pro.
- **데스크톱 앱 스크린샷:** 데스크톱 도구. [모든 플랫폼을 위한 오픈 소스 스크린샷 도구](/ko/blog/open-source-screenshot-tools/)를 참고하세요.
- **스크립트나 CI에서 스크린샷:** [개발자를 위한 웹사이트 스크린샷 도구](/ko/blog/website-screenshot-tools-for-developers/)를 참고하세요.

이 도구들은 모두 무한 피드와 지연 로드 이미지에서 어려움을 겪을 수 있습니다. 캡처 결과를 확인하는 방법은 [Chrome 전체 페이지 가이드](/ko/blog/full-page-screenshot-chrome/)에서 설명합니다. OpenScreenShot, GoFullPage, FullPage Capture를 나란히 비교한 내용은 [비교 페이지](/ko/compare/)를 참고하세요.
