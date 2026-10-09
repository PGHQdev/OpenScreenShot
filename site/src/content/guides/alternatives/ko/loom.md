---
title: 'Loom 대안: 기기에 남는 탭 녹화'
description: Loom과 OpenScreenShot 비교. 웹캠, 마이크, 자동 줌으로 브라우저 탭을 녹화하고 MP4를 로컬로 내보내요. 계정도 유료 요금제도 없어요.
order: 8
---

Chrome에서 웹 앱이나 페이지의 사용법 영상을 녹화하고, 계정 없이 내 기기에서 MP4 파일로 내보내고 싶다면 OpenScreenShot으로 바꾸세요. 링크로 영상을 공유한다면 Loom을 계속 쓰세요. Loom은 영상마다 호스팅을 해 주고, 라이브러리와 팀 워크스페이스를 제공하며, 데스크톱 앱과 모바일 앱도 있다고 안내해요. OpenScreenShot에는 호스팅도 공유 링크도 없어서, 내보낸 파일을 직접 업로드하거나 첨부해야 해요. Chrome에서만 브라우저 탭 하나를 녹화하고, 데스크톱 창이나 화면 전체는 캡처하지 않아요.

OpenScreenShot은 저희 제품이에요. 이 페이지의 Loom 관련 사실은 2026년 10월 9일 기준이며, [가격 페이지](https://www.loom.com/pricing), [Chrome 웹 스토어 페이지](https://chromewebstore.google.com/detail/loom-%E2%80%93-screen-recorder-sc/liecbddmkiiihnedobmlmillhodjkdmb), Atlassian의 [계정 도움말 페이지](https://support.atlassian.com/loom/docs/use-loom-with-an-atlassian-account), Chrome의 [권한 경고 목록](https://developer.chrome.com/docs/extensions/reference/permissions-list)에서 가져왔어요.

## Loom과 OpenScreenShot 비교

|                     | Loom                                                                                                                         | OpenScreenShot                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 가격                | Starter $0(영상 25개, 화면 녹화 최대 5분). Business 사용자당 월 $18. Business + AI 사용자당 월 $24로 표시. Enterprise는 문의 | 무료, 유료 요금제 없음                               |
| 오픈 소스           | 아니요                                                                                                                       | 예, MIT                                              |
| 설치 시 사이트 접근 | 모든 웹사이트(필수 `<all_urls>`, 모든 페이지에 콘텐츠 스크립트)                                                              | 없음. 탭 캡처는 선택 사항이며 첫 녹화 때 요청        |
| 전체 페이지 캡처    | 저희가 확인한 자료에서는 다루지 않음                                                                                         | 예                                                   |
| 주석과 블러         | 저희가 확인한 자료에서는 다루지 않음                                                                                         | 예, 스크린샷에서                                     |
| PDF 내보내기        | 저희가 확인한 자료에서는 다루지 않음                                                                                         | 예, 스크린샷용                                       |
| 탭 녹화             | 화면 녹화, 요금제별 제한 있음                                                                                                | 예, 탭만, Chrome에서(Firefox 버전은 스크린샷만 캡처) |
| 계정 또는 클라우드  | 계정 필수. 영상은 Loom이 호스팅                                                                                              | 계정 없음, 업로드 없음                               |

Loom은 2023년 11월부터 Atlassian에 속해 있고, Loom 계정에 Atlassian 계정을 사용할 수 있어요.

## 그대로인 것

브라우저 툴바에서 시작하는 레코더는 그대로예요. OpenScreenShot 팝업에서 **녹화**를 클릭하고, **마이크**와 **웹캠**을 켠 뒤 **녹화 시작**을 클릭하세요. 웹캠은 내보낸 영상에 직접 배치하는 둥근 버블로 나와요. **탭 오디오**는 페이지의 소리를 더해요.

## 달라지는 것

영상이 파일이에요. 중지하면 같은 탭에서 녹화 편집기가 열려요. 편집기는 클릭마다 2배 줌을 넣어서, 시청자가 클릭한 위치를 볼 수 있어요. 각 줌을 조정하거나 삭제하고, 1.5배, 2배, 3배 줌을 직접 추가하고, 구간을 트리밍할 수 있어요. 내보내기는 MP4(H.264와 AAC)나 WebM 파일을 다운로드 폴더에 렌더링해요. 그 파일을 직접 운영하는 영상 호스트, 채팅, 티켓에 업로드하세요. [녹화 레퍼런스](/ko/docs/#record)에서 각 컨트롤을 다뤄요.

녹화가 기기에 남아요. OpenScreenShot은 녹화하는 동안 IndexedDB에 저장하고, 세션을 삭제할 때까지 보관해요. 분석이나 원격 측정 기능이 없어요. 자세한 내용은 [개인정보 섹션](/ko/docs/#privacy)에 있어요.

범위는 탭 하나예요. **탭 전체**를 그대로 두거나 미리보기 위를 드래그해 페이지 일부를 녹화하세요. 녹화 중에 탭이 다른 사이트로 이동하면 클릭 추적에 **여러 사이트에서 녹화**가 필요하고, 이 기능은 모든 사이트 접근을 요청해요. 이 권한이 없으면 영상의 나머지 부분에서 줌과 클릭 효과가 멈추고, 영상은 계속 녹화돼요.

설치 시 접근 범위가 더 좁아요. Loom의 매니페스트는 `<all_urls>`, `tabCapture`, `desktopCapture`를 요구해요. Chrome의 목록에는 `tabCapture`에 대해 "Read and change all your data on all websites"(모든 웹사이트에 있는 내 데이터 읽기 및 변경)가, `desktopCapture`에 대해 "Capture content of your screen"(화면 콘텐츠 캡처)이 표시돼요. OpenScreenShot은 `activeTab`으로 설치되고, **녹화**를 처음 클릭할 때만 탭 캡처를 요청해요.

OpenScreenShot은 스크린샷도 찍어요. 기본값인 **원클릭 Express 모드**에서는 툴바 아이콘을 클릭하면 **전체 페이지** 캡처가 시작되고, 편집기에는 화살표, 단계 번호, **단색** 채우기를 쓴 **블러**가 있어요.

## 바꾸는 방법

1. [Chrome 웹 스토어](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)에서 OpenScreenShot을 설치하세요. [Firefox 버전](https://addons.mozilla.org/firefox/addon/openscreenshot/)은 스크린샷만 캡처해요.
2. 아이콘을 툴바에 고정하세요.
3. 팝업에서 **녹화**를 클릭하고 Chrome의 탭 캡처 요청을 수락하세요. 짧은 테이크를 녹화한 뒤 **내보내기**를 클릭하세요.
4. 어느 탭에서든 `Alt+Shift+X`를 누르면 녹화가 중지돼요.
5. 스크린샷은 **설정**에서 **캡처 후**를 **편집기**, **클립보드**, **다운로드** 중 하나로 정하세요.
6. 계정을 닫거나 요금제를 바꾸기 전에 보관할 Loom 영상을 다운로드하세요.

기능 사용법 영상은 [제품 데모 영상](/ko/use-cases/product-demos/)을 참고하세요. 지원 답변은 [고객 지원용 스크린샷](/ko/use-cases/customer-support/)을 참고하세요. 데스크톱도 녹화하는 오픈 소스 레코더는 [Screenity 대안](/ko/alternatives/screenity/)을 참고하세요. 클라우드 링크가 있는 레코더는 [Awesome Screenshot 대안](/ko/alternatives/awesome-screenshot/)을 참고하세요.
