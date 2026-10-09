---
title: 'FireShot 대안: 브라우저 안의 무료 편집기와 오픈 소스'
description: FireShot vs OpenScreenShot. 둘 다 로컬에서 전체 페이지 캡처. OpenScreenShot은 오픈 소스, 무료 브라우저 편집기와 탭 녹화 제공.
order: 4
---

Chrome이나 Firefox가 돌아가는 모든 운영 체제에서, 읽어 볼 수 있는 코드로, 브라우저 안에서 전체 페이지 스크린샷에 무료로 주석을 달고 블러를 넣고 싶다면 OpenScreenShot으로 바꾸세요. 링크가 동작하는 PDF, 일괄 캡처나 자동 캡처, 또는 고급 PDF 내보내기와 캡처 기록 같은 FireShot Pro의 추가 기능이 필요하다면 FireShot을 계속 쓰세요. OpenScreenShot은 PDF를 이미지로 저장하므로 텍스트를 검색할 수 없고 링크가 동작하지 않아요. 웹 페이지만 캡처하고, 데스크톱 창이나 화면 전체는 캡처하지 않아요.

OpenScreenShot은 저희 제품이에요. 이 페이지의 FireShot 관련 사실은 2026년 10월 9일 기준이며, [Chrome 웹 스토어 페이지](https://chromewebstore.google.com/detail/mcbpblocgmgfnpjjppndjkmgjaogfceg), [웹사이트](https://getfireshot.com/), [구매 페이지](https://getfireshot.com/buy.php), [Firefox 부가 기능 페이지](https://addons.mozilla.org/en-US/firefox/addon/fireshot/), Google 업데이트 서버의 버전 2.1.4.18 매니페스트에서 가져왔어요.

## FireShot과 OpenScreenShot 비교

|                     | FireShot                                                                                 | OpenScreenShot                                             |
| ------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 가격                | 무료(Lite). Pro는 연 $39.95, 또는 기기 2대용 평생 라이선스 1회 $99.95                    | 무료, 유료 요금제 없음                                     |
| 오픈 소스           | 아니요(자체 라이선스)                                                                    | 예, MIT                                                    |
| 설치 시 사이트 접근 | Chrome에서는 없음. 모든 사이트 접근은 선택 사항. `nativeMessaging`은 필수                | 없음. 캡처를 시작할 때 현재 탭에 접근                      |
| 전체 페이지 캡처    | 예                                                                                       | 예                                                         |
| 주석과 블러         | 페이지에 텍스트, 화살표, 블러 언급. Pro에 "Editor & smart annotations (on Windows)" 명시 | 무료, 브라우저 안에서                                      |
| PDF 내보내기        | 예, 링크 포함. 고급 PDF는 Pro                                                            | 예, 이미지로: 한 페이지, 또는 겹침을 둔 A4나 Letter 페이지 |
| 탭 녹화             | 아니요                                                                                   | 예, Chrome에서(Firefox 버전은 스크린샷만 캡처)             |
| 계정 또는 클라우드  | 로컬 캡처. 선택적 업로드와 공유                                                          | 계정 없음, 업로드 없음                                     |

## 그대로인 것

두 도구 모두 캡처가 로컬에 남아요. FireShot 사이트에는 "100% local captures keep your work private and offline-safe."(100% 로컬 캡처로 작업을 비공개로, 오프라인에서도 안전하게 지켜요)라고 적혀 있어요. OpenScreenShot은 브라우저 안에서 캡처를 처리하고 업로드하지 않아요. Chrome에서는 둘 다 설치할 때 모든 사이트 접근을 요청하지 않아요.

긴 페이지의 전체 페이지 캡처와 PNG, JPEG, PDF 내보내기는 그대로예요. OpenScreenShot은 WebP로도 저장해요.

## 달라지는 것

편집기가 브라우저 탭에서 실행되므로 모든 운영 체제에서 똑같이 동작하고, 모든 도구가 무료예요. **화살표**, **텍스트**, **단계 번호**, **Spotlight**로 세부 사항을 가리키고, **단색** 채우기를 쓴 **블러**(`B`)로 개인 데이터를 가리세요. **자르기**와 **Cut**으로 긴 캡처를 다듬어요. [주석 레퍼런스](/ko/docs/#annotate)에서 도구 목록을 볼 수 있어요.

PDF는 다르게 동작해요. **이미지 저장**을 클릭해 **내보내기** 대화상자를 열고 **PDF**를 고르세요. **전체**는 이미지 크기에 맞춘 한 페이지를 만들어요. **A4**나 **Letter**에 **여러 페이지로 나누기**를 켜면 긴 캡처를 5mm씩 겹치게 나눠요. PDF에는 스크린샷이 이미지로 들어 있어서 클릭할 수 있는 링크나 선택할 수 있는 텍스트가 없어요. 독자가 링크를 따라가야 하는 PDF를 보낸다면 FireShot이 그 일에 더 잘 맞아요.

OpenScreenShot에는 일괄 캡처, 캡처 기록, 이메일이나 OneNote 업로드가 없어요. 대신 **요소 캡처**, 프레임을 입힌 이미지를 위한 **Beautify** 패널, 클릭 시 줌과 MP4 내보내기를 지원하는 Chrome의 탭 녹화가 있어요.

FireShot Chrome 매니페스트는 `nativeMessaging`을 요구해요. 이 권한은 확장 프로그램이 컴퓨터에 설치된 프로그램과 통신하게 해 줘요. OpenScreenShot은 네이티브 프로그램을 쓰지 않아요. Chrome은 **녹화**를 처음 클릭할 때만 선택 사항인 탭 캡처 권한을 요청해요.

FireShot Firefox 부가 기능은 2023년 6월 5일에 마지막으로 업데이트되었고, 모든 웹사이트의 데이터에 대한 접근을 요청해요. OpenScreenShot Firefox 버전은 설치할 때 사이트 접근을 요청하지 않고 스크린샷만 캡처해요.

## 바꾸는 방법

1. [Chrome 웹 스토어](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)나 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/)에서 OpenScreenShot을 설치하세요.
2. 아이콘을 툴바에 고정하세요.
3. 긴 페이지에서 아이콘을 클릭하세요. 기본값인 **원클릭 Express 모드**에서는 **전체 페이지** 캡처가 시작되고 **편집기**가 열려요.
4. **설정**에서 **캡처 후**를 정하세요. 캡처마다 PNG로 다운로드 폴더에 바로 저장하려면 **다운로드**를, 바로 붙여넣으려면 **클립보드**를 고르세요.
5. `{date}`, `{domain}`, `{title}` 같은 토큰으로 **파일 이름 템플릿**을 정하세요. `/`를 넣으면 다운로드 폴더 안의 폴더에 저장돼요.

키보드 단축키로 캡처가 시작되지 않으면 `chrome://extensions/shortcuts`를 열고 다른 확장 프로그램이 같은 키를 쓰는지 확인하세요.

날짜가 들어간 페이지 사본은 [웹 페이지의 시각적 사본 저장](/ko/use-cases/archive-web-pages/)을 참고하세요. 주석을 단 캡처가 들어간 도움말 페이지는 [문서용 스크린샷](/ko/use-cases/documentation/)을 참고하세요. [내보내기 레퍼런스](/ko/docs/#export)에서 형식과 배율을 다뤄요. 다른 전체 페이지 도구는 [GoFullPage 대안](/ko/alternatives/gofullpage/)과 [FullPage Capture 대안](/ko/alternatives/fullpage-capture/)을 참고하세요.
