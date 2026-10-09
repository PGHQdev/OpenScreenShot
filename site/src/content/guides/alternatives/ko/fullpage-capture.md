---
title: 'FullPage Capture 대안: 설치 시 모든 사이트 접근이 없는 오픈 소스'
description: FullPage Capture vs OpenScreenShot. 둘 다 전체 페이지 캡처·주석 무료, OpenScreenShot은 오픈 소스에 설치 시 사이트 접근 없음.
order: 2
---

코드를 읽어 볼 수 있고 설치할 때 모든 웹사이트 접근을 요청하지 않는 전체 페이지 스크린샷 확장 프로그램을 원한다면 OpenScreenShot으로 바꾸세요. FullPage Capture의 PDF 내보내기가 제공하는 기능이 필요하다면 FullPage Capture를 계속 쓰세요. 페이지 설명에 따르면 클릭할 수 있는 링크와 스마트 페이지 나눔이 있는 PDF를 만들고, Pro 요금제에서는 검색 가능한 PDF가 추가돼요. OpenScreenShot은 PDF를 이미지로 저장하므로 텍스트를 검색하거나 선택할 수 없고 링크가 동작하지 않아요. OpenScreenShot은 브라우저 안의 웹 페이지만 캡처해요. 데스크톱 창이나 화면 전체는 캡처하지 않아요.

OpenScreenShot은 저희 제품이에요. 이 페이지의 FullPage Capture 관련 사실은 2026년 10월 9일 기준이며, [Chrome 웹 스토어 페이지](https://chromewebstore.google.com/detail/ggacghlcchiiejclfdajbpkbjfgjhfol), [웹사이트](https://fullpagecapture.net/), Google 업데이트 서버의 버전 1.19.67 매니페스트에서 가져왔어요.

## FullPage Capture와 OpenScreenShot 비교

|                     | FullPage Capture                                                         | OpenScreenShot                                                                 |
| ------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| 가격                | 무료. Pro는 7일 체험 후 연 $19                                           | 무료, 유료 요금제 없음                                                         |
| 오픈 소스           | 아니요                                                                   | 예, MIT                                                                        |
| 설치 시 사이트 접근 | 모든 웹사이트(필수 `<all_urls>`)                                         | 없음. 캡처를 시작할 때 현재 탭에 접근                                          |
| 전체 페이지 캡처    | 예, 무료, 워터마크 없음                                                  | 예, 무료, 워터마크 없음                                                        |
| 주석과 블러         | 무료(화살표, 도형, 텍스트, 형광펜, 펜, 번호 배지, 블러와 픽셀화)         | 무료(도형, 화살표, 텍스트, 형광펜, 펜, 단계 번호, 블러, 모자이크, 단색 채우기) |
| PDF 내보내기        | 예, 클릭할 수 있는 링크와 스마트 페이지 나눔 포함. 검색 가능한 PDF는 Pro | 예, 이미지로: 한 페이지, 또는 겹침을 둔 A4나 Letter 페이지                     |
| 탭 녹화             | 아니요                                                                   | 예, Chrome에서(Firefox 버전은 스크린샷만 캡처)                                 |
| 계정 또는 클라우드  | 페이지에는 계정 불필요라고 표시. Pro는 계정과 "Send to your cloud" 사용  | 계정 없음, 업로드 없음                                                         |

[전체 비교](/ko/compare/)에서는 같은 표에 GoFullPage를 넣어요.

## 설치 시 접근

FullPage Capture의 매니페스트는 `<all_urls>` 호스트 권한을 요구해요. 이 권한이 있는 확장 프로그램을 설치하면 Chrome이 "Read and change all your data on all websites"(모든 웹사이트에 있는 내 데이터 읽기 및 변경) 경고를 보여 줘요. 페이지에는 "No account, no analytics, no network requests. Files stay on your device,"(계정 없음, 분석 없음, 네트워크 요청 없음. 파일은 기기에 남아요)라고 적혀 있고, 웹사이트에는 "The extension makes zero network requests."(확장 프로그램은 네트워크 요청을 전혀 하지 않아요)라고 적혀 있어요. 저희는 이 확장 프로그램의 네트워크 동작을 테스트하지 않았고, 이 페이지는 그에 대해 아무것도 주장하지 않아요.

OpenScreenShot은 호스트 권한을 요구하지 않아요. `activeTab`을 사용하며, 이 권한은 아이콘을 클릭하거나, 단축키를 누르거나, 오른쪽 클릭 메뉴에서 캡처를 고르는 순간 탭 하나에 대한 접근을 줘요. Chrome은 **녹화**를 처음 클릭할 때만 선택 사항인 탭 캡처 권한을 요청해요. 모든 사이트 접근은 **여러 사이트에서 녹화**를 켤 때만 요청해요. [개인정보 섹션](/ko/docs/#privacy)에서 캡처가 기기에 남는 방식을 설명해요.

## 그대로인 것

작업 흐름이 비슷해요. 기본값인 **원클릭 Express 모드**에서는 툴바 아이콘을 한 번 클릭하면 **전체 페이지** 캡처가 시작되고, 결과가 **편집기**에서 열려요. 화살표, 도형, 텍스트, 번호 배지, 블러가 모두 무료예요. 저장, 복사, PDF 내보내기도 무료이고, 어떤 내보내기에도 워터마크가 없어요.

## 달라지는 것

가리기에는 **블러**(`B`)를 고른 뒤 **가리기**에서 **단색** 채우기를 고르세요. 단색은 내보낸 결과에서 영역을 완전히 덮어요. [가리기 가이드](/ko/blog/redact-screenshot/)에서 저장된 파일을 확인하는 방법을 보여 줘요.

PDF는 다르게 동작해요. **이미지 저장**을 클릭해 **내보내기** 대화상자를 열고, **PDF**를 고른 뒤, 이미지 크기에 맞춘 한 페이지에는 **전체**를, 아니면 **A4**나 **Letter**와 **여러 페이지로 나누기**를 선택하세요. 페이지가 5mm씩 겹쳐서 텍스트 줄이 중간에 잘리지 않아요. [스크린샷 PDF 저장 가이드](/ko/blog/save-screenshot-as-pdf/)에서 레이아웃을 비교해요.

OpenScreenShot에는 일괄 캡처와 클라우드 업로드가 없어요. 대신 카드나 표 하나를 위한 **요소 캡처**, 여백·모서리·그림자·배경을 넣는 **Beautify** 패널, Chrome에서 MP4나 WebM으로 저장하는 탭 녹화가 있어요. 스크린샷은 Firefox에서도 동작해요.

## 바꾸는 방법

1. [Chrome 웹 스토어](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)나 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/)에서 OpenScreenShot을 설치하세요.
2. 아이콘을 툴바에 고정하고, FullPage Capture가 같은 위치에 있다면 고정을 해제하세요.
3. 긴 페이지를 열고 아이콘을 클릭하세요. **편집기**에서 결과를 확인하세요.
4. **설정**에서 **캡처 후**를 정하세요. 주석을 달려면 **편집기**, 이미지를 바로 붙여넣으려면 **클립보드**, 탭을 열지 않고 PNG를 저장하려면 **다운로드**를 고르세요.
5. 저장된 파일이 날짜와 사이트별로 정렬되도록 **설정**에서 **파일 이름 템플릿**을 정하세요. 예: `{date}_{domain}`.
6. FullPage Capture를 더 이상 쓰지 않으면 `chrome://extensions`에서 제거하세요.

이슈 트래커에 올릴 주석 캡처는 [버그 리포트용 스크린샷](/ko/use-cases/bug-reports/)을 참고하세요. [캡처 모드 레퍼런스](/ko/docs/#modes)에서 모든 모드를 다뤄요. 다른 전체 페이지 도구는 [GoFullPage 대안](/ko/alternatives/gofullpage/)과 [FireShot 대안](/ko/alternatives/fireshot/)을 참고하세요.
