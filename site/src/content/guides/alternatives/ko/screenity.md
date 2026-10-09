---
title: 'Screenity 대안: 스크린샷과 탭 녹화를 하나의 확장 프로그램으로'
description: Screenity vs OpenScreenShot. 둘 다 오픈 소스. OpenScreenShot은 전체 페이지 스크린샷·PDF 추가, 설치 시 사이트 접근 없음.
order: 7
---

브라우저 탭을 녹화하면서 전체 페이지 스크린샷도 찍고, 설치할 때 모든 웹사이트 접근 없이 둘 다 하는 오픈 소스 확장 프로그램 하나를 원한다면 OpenScreenShot으로 바꾸세요. 탭보다 넓게 녹화한다면 Screenity를 계속 쓰세요. Screenity는 영역, 데스크톱, 모든 앱 창, 카메라를 녹화하고, GIF로 내보내거나 Google Drive에 저장해요. OpenScreenShot은 브라우저 탭 하나를 녹화하고, 데스크톱 창이나 화면 전체는 캡처하지 않아요. Screenity의 유료 Pro 요금제는 링크 공유와 클라우드 호스팅도 더하는데, OpenScreenShot에는 이 기능이 없어요.

OpenScreenShot은 저희 제품이에요. 이 페이지의 Screenity 관련 사실은 2026년 10월 9일 기준이며, [GitHub 저장소](https://github.com/alyssaxuu/screenity)와 [매니페스트](https://github.com/alyssaxuu/screenity/blob/master/src/manifest.json), [Chrome 웹 스토어 페이지](https://chromewebstore.google.com/detail/screenity-screen-recorder/kbbdabhdfibnancpjfhlkhafgdilcnji), [Pro 페이지](https://screenity.io/pro), Chrome의 [권한 경고 목록](https://developer.chrome.com/docs/extensions/reference/permissions-list)에서 가져왔어요.

## Screenity와 OpenScreenShot 비교

|                     | Screenity                                                                | OpenScreenShot                                                        |
| ------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| 가격                | 확장 프로그램 무료. Pro는 월 $10 또는 연 $120, 7일 체험 제공             | 무료, 유료 요금제 없음                                                |
| 오픈 소스           | 예, GPL-3.0                                                              | 예, MIT                                                               |
| 설치 시 사이트 접근 | 모든 웹사이트(필수 `<all_urls>`, `tabs`와 `tabCapture`도)                | 없음. 탭 캡처는 선택 사항이며 첫 녹화 때 요청                         |
| 전체 페이지 캡처    | 저희가 확인한 자료에서는 다루지 않음                                     | 예                                                                    |
| 주석과 블러         | 그리기, 텍스트, 화살표, 도형. 페이지 콘텐츠 블러                         | 스크린샷에서 도형, 화살표, 텍스트, 단계 번호, 블러, Spotlight, 자르기 |
| PDF 내보내기        | 저희가 확인한 자료에서는 다루지 않음                                     | 예                                                                    |
| 탭 녹화             | 예, 영역, 데스크톱, 앱 창, 카메라도                                      | 예, 탭만, Chrome에서(Firefox 버전은 스크린샷만 캡처)                  |
| 영상 내보내기       | MP4, GIF, WebM, 또는 Google Drive                                        | MP4 또는 WebM                                                         |
| 계정 또는 클라우드  | 무료 확장 프로그램은 로그인 불필요. Pro는 계정과 EU 호스팅 클라우드 사용 | 계정 없음, 업로드 없음                                                |

## 그대로인 것

두 확장 프로그램 모두 오픈 소스이고, 둘 다 로그인 없이 무료 녹화를 기기에 보관해요. OpenScreenShot에서는 팝업에서 **녹화**를 클릭하고 **마이크**, **탭 오디오**, **웹캠**을 고르세요. **탭 전체**를 그대로 두거나 미리보기 위를 드래그해 페이지 일부를 녹화하세요. 녹화 탭에 타이머와 **일시중지**, **중지**, **취소** 버튼이 있어서 영상에는 컨트롤이 나오지 않아요. 어느 탭에서든 `Alt+Shift+X`를 누르면 중지돼요.

## 달라지는 것

녹화 편집기는 커서가 클릭한 모든 지점에 2배 줌을 넣어요. 이 줌을 옮기거나 삭제하고, 1.5배, 2배, 3배의 수동 줌을 추가하고, 각 구간을 트리밍할 수 있어요. 웹캠은 직접 배치하는 둥근 버블로 내보낸 영상에 들어가고, **Beautify** 패널은 여백과 배경을 넣어요. 내보내기는 기본으로 MP4(H.264와 AAC)를, 또는 WebM을 렌더링해요. [녹화 레퍼런스](/ko/docs/#record)에서 각 컨트롤을 다뤄요.

스크린샷도 같은 확장 프로그램에 들어 있어요. 기본값인 **원클릭 Express 모드**에서는 툴바 아이콘을 클릭하면 **전체 페이지** 캡처가 시작돼요. 스크린샷 편집기에는 가리기용으로 **단색** 채우기를 쓴 **블러**가 있고, **이미지 저장**은 PNG, JPEG, WebP, PDF용 **내보내기** 대화상자를 열어요. OpenScreenShot은 녹화하는 동안 페이지에 아무것도 추가하지 않으므로, 녹화 중에는 페이지에 그릴 수 없어요. 주석은 스크린샷에서 동작해요.

설치 시 접근 범위가 더 좁아요. Screenity의 매니페스트는 `<all_urls>`를 요구하고, Chrome의 목록에는 `tabCapture`에 대해 "Read and change all your data on all websites"(모든 웹사이트에 있는 내 데이터 읽기 및 변경)가, `tabs`에 대해 "Read your browsing history"(방문 기록 읽기)가 표시돼요. OpenScreenShot은 `activeTab`으로 설치되고, **녹화**를 처음 클릭할 때만 탭 캡처를 요청해요. 모든 사이트 접근은 **여러 사이트에서 녹화**를 켤 때만 요청하며, 이 기능은 탭이 다른 사이트로 이동해도 클릭 추적이 따라가게 해 줘요.

## 바꾸는 방법

1. [Chrome 웹 스토어](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)에서 OpenScreenShot을 설치하세요. [Firefox 버전](https://addons.mozilla.org/firefox/addon/openscreenshot/)은 스크린샷만 캡처해요.
2. 아이콘을 툴바에 고정하세요.
3. 첫 스크린샷을 찍어 보세요. 페이지에서 아이콘을 클릭하고 **편집기**에서 결과를 확인하세요.
4. 팝업에서 **녹화**를 클릭하고 Chrome의 탭 캡처 요청을 수락하세요. 짧은 테이크를 녹화하고 내보내세요.
5. 스크린샷은 **설정**에서 **캡처 후**를 **편집기**, **클립보드**, **다운로드** 중 하나로 정하세요.
6. Screenity를 제거하기 전에 보관할 녹화를 내보내세요.

기능 사용법 영상은 [제품 데모 영상](/ko/use-cases/product-demos/)을 참고하세요. 이슈에서 버그를 보여 주려면 [버그 리포트용 스크린샷](/ko/use-cases/bug-reports/)을 참고하세요. 팀과 링크로 영상을 공유한다면 [Loom 대안](/ko/alternatives/loom/)과 비교해 보세요. 클라우드 업로드가 있는 레코더는 [Nimbus 대안](/ko/alternatives/nimbus/)을 참고하세요.
