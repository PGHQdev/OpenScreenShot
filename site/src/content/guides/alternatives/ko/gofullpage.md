---
title: 'GoFullPage 대안: 무료 주석과 오픈 소스'
description: GoFullPage vs OpenScreenShot. OpenScreenShot은 주석, 블러, 자르기, PDF 페이지 분할이 무료이고 코드가 공개돼 있어요.
order: 1
---

전체 페이지를 캡처한 뒤 자르기, 블러, 표시, PDF 페이지 분할이 필요하다면 OpenScreenShot으로 바꾸세요. GoFullPage는 이 기능들을 유료 Premium 요금제에 넣었고, OpenScreenShot은 무료로 제공해요. OpenScreenShot은 MIT 라이선스이기도 해서, 내 페이지에서 실행되는 코드를 읽어 볼 수 있어요. 편집 없이 전체 페이지를 이미지나 PDF로 캡처해 저장하기만 한다면 GoFullPage를 계속 쓰세요. 무료 버전으로도 캡처 횟수 제한 없이 그렇게 할 수 있고, FAQ에는 Microsoft Edge Add-ons 버전 링크가 있어요. OpenScreenShot은 Edge Add-ons에 등록돼 있지 않지만, Edge에서 Chrome 웹 스토어를 통해 설치할 수 있어요. OpenScreenShot은 브라우저 안의 웹 페이지만 캡처해요. 데스크톱 창이나 화면 전체는 캡처하지 않아요.

OpenScreenShot은 저희 제품이에요. 이 페이지의 GoFullPage 관련 사실은 2026년 10월 9일 기준이며, [Chrome 웹 스토어 페이지](https://chromewebstore.google.com/detail/fdpohaocaechififmbbbbbknoalclacl), [FAQ](https://gofullpage.com/faq), [Premium 페이지](https://gofullpage.com/premium), [Firefox 부가 기능 페이지](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/)에서 가져왔어요.

## GoFullPage와 OpenScreenShot 비교

|                     | GoFullPage                                             | OpenScreenShot                                      |
| ------------------- | ------------------------------------------------------ | --------------------------------------------------- |
| 가격                | 무료. Premium은 연 $12(세전), 7일 체험 제공            | 무료, 유료 요금제 없음                              |
| 오픈 소스           | 아니요. 2018년부터 MIT 프로젝트를 비공개로 포크한 버전 | 예, MIT                                             |
| 설치 시 사이트 접근 | 없음. 모든 사이트 접근은 선택 사항                     | 없음. 캡처를 시작할 때 현재 탭에 접근               |
| 전체 페이지 캡처    | 예                                                     | 예                                                  |
| 주석과 블러         | Premium 전용(블러, 텍스트, 형광펜, 자르기)             | 무료(도형, 화살표, 텍스트, 단계 번호, 블러, 자르기) |
| PDF 내보내기        | 무료. 스마트 PDF 페이지 분할은 Premium                 | 무료. 겹침을 두고 나눈 A4나 Letter 페이지 포함      |
| 탭 녹화             | 아니요                                                 | 예, Chrome에서(Firefox 버전은 스크린샷만 캡처)      |
| 계정 또는 클라우드  | 무료 캡처에는 계정 불필요. Premium은 계정 사용         | 계정 없음, 업로드 없음                              |
| 브라우저 스토어     | Chrome 웹 스토어, Firefox Add-ons, Edge Add-ons        | Chrome 웹 스토어, Firefox Add-ons                   |

[전체 비교](/ko/compare/)에서는 같은 표에 FullPage Capture를 더해요.

## 그대로인 것

주요 습관은 그대로예요. 기본 설정에서는 OpenScreenShot 툴바 아이콘을 한 번 클릭하면 **전체 페이지** 캡처가 시작돼요. 이것이 **원클릭 Express 모드**예요. 확장 프로그램이 페이지를 스크롤하고, 부분들을 하나의 이미지로 이어 붙이고, 결과를 **편집기**에서 열어요. 고정 헤더는 맨 위에 한 번만 나오고, 내부 요소가 스크롤되는 페이지도 동작해요.

두 확장 프로그램 모두 설치할 때 사이트 접근을 요청하지 않아요. OpenScreenShot은 `activeTab`을 사용하므로, 캡처를 시작하는 순간 캡처하는 탭만 읽을 수 있어요. 둘 다 PNG, JPEG, PDF 파일로 저장해요. 둘 다 Chrome과 Firefox에서 동작해요.

## 달라지는 것

편집기 도구가 무료예요. **자르기**(`C`)로 이미지를 잘라내고, **단색** 채우기를 쓴 **블러**(`B`)로 개인 데이터를 덮고, **화살표**, **텍스트**, **단계 번호**로 중요한 곳을 표시해요. **Cut**(`X`)은 긴 캡처에서 가로 띠를 잘라내요. [주석 레퍼런스](/ko/docs/#annotate)에서 모든 도구와 단축키를 볼 수 있어요.

PDF 레이아웃도 무료예요. **이미지 저장**을 클릭해 **내보내기** 대화상자를 열고, **PDF**를 고른 뒤 **A4**나 **Letter**와 **여러 페이지로 나누기**를 선택하세요. 각 페이지가 다음 페이지와 5mm씩 겹치므로 텍스트 줄이 중간에 잘리지 않아요. **이미지 저장** 옆의 **PDF** 버튼은 한 번의 클릭으로 PDF를 저장해요. PDF에는 스크린샷이 이미지로 들어 있어서 텍스트를 검색하거나 선택할 수 없어요.

캡처 모드도 더 많아요. **보이는 영역**, **선택 영역**, 그리고 카드, 표, 차트 하나를 정확한 경계대로 캡처하는 **요소 캡처**가 있어요. Chrome에서는 **녹화**로 클릭마다 줌이 들어간 MP4나 WebM 영상으로 탭을 캡처해요. 첫 녹화 때 선택 사항인 탭 캡처 권한을 요청해요.

OpenScreenShot에는 날짜나 URL 스탬프가 없어요. 대신 **설정**의 파일 이름 템플릿에 `{date}`와 `{domain}`을 넣어 그 정보를 파일 이름에 남기세요.

## 바꾸는 방법

1. [Chrome 웹 스토어](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)나 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/)에서 OpenScreenShot을 설치하세요.
2. 아이콘을 툴바에 고정하세요. GoFullPage가 같은 위치에 고정돼 있다면, 올바른 아이콘을 클릭할 수 있게 고정을 해제하세요.
3. 긴 페이지를 열고 OpenScreenShot 아이콘을 클릭하세요. **편집기**에서 맨 위, 맨 아래, 고정 헤더를 확인하세요.
4. **설정**에서 **캡처 후**를 정하세요. **편집기**는 캡처마다 주석을 달 수 있게 열어요. **다운로드**는 탭을 열지 않고 PNG를 다운로드 폴더에 저장하며, 캡처하고 바로 저장하는 습관에 가까워요. **클립보드**는 이미지를 복사해요.
5. GoFullPage로 저장한 이미지에 표시를 하려면 파일을 편집기에 끌어다 놓거나 `Ctrl+V`(macOS에서는 `⌘V`)로 붙여넣으세요.

키보드 단축키로 OpenScreenShot 캡처가 시작되지 않으면 `chrome://extensions/shortcuts`를 열고 다른 확장 프로그램이 같은 키를 쓰는지 확인하세요.

날짜가 들어간 파일 이름으로 페이지 사본을 보관하려면 [웹 페이지의 시각적 사본 저장](/ko/use-cases/archive-web-pages/)을 참고하세요. 클릭할 수 있는 링크가 있는 PDF가 필요하면 [FireShot 대안](/ko/alternatives/fireshot/)과 [FullPage Capture 대안](/ko/alternatives/fullpage-capture/)을 비교해 보세요.
