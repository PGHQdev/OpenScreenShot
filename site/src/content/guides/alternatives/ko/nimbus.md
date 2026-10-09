---
title: 'Nimbus Screenshot 대안: FuseBase로 바뀐 뒤의 로컬 캡처'
description: Nimbus Screenshot은 이제 FuseBase Pro. OpenScreenShot은 기기에서 전체 페이지 캡처·주석·탭 녹화를 하는 무료 오픈 소스예요.
order: 5
---

Nimbus Screenshot은 이제 Chrome에서 Nimbus Web이 제공하는 FuseBase Pro로 배포돼요. Nimbus로 웹 페이지를 캡처하고, 주석을 달고, 녹화했고, 계정도 클라우드 워크스페이스도 없이 파일을 기기에 남기는 무료 도구를 원한다면 OpenScreenShot으로 바꾸세요. OpenScreenShot에 없는 기능, 즉 탭 하나를 넘어서는 화면 녹화나 FuseBase, Google Drive, Dropbox, Slack 업로드가 필요하다면 FuseBase Pro를 계속 쓰세요. OpenScreenShot은 Chrome에서만 브라우저 탭 하나를 녹화해요. 데스크톱 창이나 화면 전체는 캡처하지 않아요.

OpenScreenShot은 저희 제품이에요. 이 페이지의 FuseBase Pro 관련 사실은 2026년 10월 9일 기준이며, [Chrome 웹 스토어 페이지](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn), FuseBase [스크린샷 페이지](https://thefusebase.com/screenshot/)와 [가격 페이지](https://thefusebase.com/pricing/), 예전 [Nimbus Firefox 부가 기능 페이지](https://addons.mozilla.org/en-US/firefox/addon/nimbus-screenshot/), Google 업데이트 서버의 버전 3.6.19 매니페스트에서 가져왔어요.

## Nimbus Screenshot에 일어난 일

원래의 Nimbus Screenshot & Screen Video Recorder 페이지는 더 이상 Chrome 웹 스토어에 없어요. 예전 Nimbus 스크린샷 페이지인 nimbusweb.me/screenshot.php는 이제 FuseBase 스크린샷 페이지로 리디렉션돼요. 현재 Chrome 확장 프로그램은 Nimbus Web, Inc.가 제공하는 "FuseBase Pro - Capture screenshots and Video record"예요. 예전 Nimbus 부가 기능은 Firefox에 아직 등록돼 있어요. 마지막 업데이트는 2020년 7월 31일이에요.

## FuseBase Pro와 OpenScreenShot 비교

|                     | FuseBase Pro(구 Nimbus)                                         | OpenScreenShot                        |
| ------------------- | --------------------------------------------------------------- | ------------------------------------- |
| 가격                | 무료 요금제는 녹화 최대 5분. Pro 요금제는 녹화 최대 10시간      | 무료, 유료 요금제 없음                |
| 오픈 소스           | 아니요                                                          | 예, MIT                               |
| 설치 시 사이트 접근 | 모든 웹사이트(필수 `<all_urls>`, 모든 페이지에 콘텐츠 스크립트) | 없음. 캡처를 시작할 때 현재 탭에 접근 |
| 전체 페이지 캡처    | 예                                                              | 예                                    |
| 주석과 블러         | 예                                                              | 예, 모든 도구 무료                    |
| PDF 내보내기        | 예, 페이지 설명 기준                                            | 예                                    |
| 탭 녹화             | 예, 화면과 웹캠. GIF와 MP4 변환은 프리미엄                      | 예, 탭만, Chrome에서. MP4와 WebM 무료 |
| 계정 또는 클라우드  | FuseBase, Google Drive, Dropbox, Slack에 업로드                 | 계정 없음, 업로드 없음                |

FuseBase 스크린샷 페이지에는 캡처 Pro 요금제의 가격이 나와 있지 않아요. FuseBase 가격 페이지는 결제 방식에 따라 월 $32 또는 $39인 Solo부터 시작하는 워크스페이스 요금제를 나열하고, 캡처 확장 프로그램은 언급하지 않아요.

## 그대로인 것

전체 페이지 캡처, 주석 도구와 블러가 있는 편집기, PDF 내보내기는 그대로예요. Chrome에서는 웹캠을 넣은 녹화도 그대로이고, OpenScreenShot은 마이크와 탭 오디오도 녹음해요. 내보낸 결과에 워터마크가 없어요.

## 달라지는 것

파일이 기기에 남아요. OpenScreenShot은 캡처를 로컬 브라우저 저장소에, 녹화를 IndexedDB에 삭제할 때까지 저장하고, 분석이나 원격 측정 기능이 없어요. Chrome 웹 스토어의 FuseBase Pro 개인정보 섹션은 개인 식별 정보, 인증 정보, 웹사이트 콘텐츠 수집을 공개해요. OpenScreenShot 캡처를 공유하려면 **복사**를 클릭하고 붙여넣거나, **이미지 저장**을 클릭하고 파일을 첨부하세요.

설치 시 접근 범위가 더 좁아요. OpenScreenShot은 `activeTab`을 사용하며, 이 권한은 캡처를 시작할 때 탭 하나에만 적용돼요. Chrome은 **녹화**를 처음 클릭할 때 선택 사항인 탭 캡처 권한을 요청하고, **여러 사이트에서 녹화**를 켤 때만 모든 사이트 접근을 요청해요.

녹화 범위는 탭 하나예요. 팝업에서 **녹화**를 클릭하고, **마이크**, **탭 오디오**, **웹캠**을 고른 뒤 탭 전체나 드래그한 영역을 녹화하세요. 녹화 편집기는 클릭마다 2배 줌을 넣고, 구간을 트리밍하고 웹캠 버블을 배치할 수 있어요. MP4와 WebM 내보내기는 무료예요. OpenScreenShot에는 GIF 내보내기가 없어요. [녹화 레퍼런스](/ko/docs/#record)를 참고하세요.

## 바꾸는 방법

1. [Chrome 웹 스토어](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)나 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/)에서 OpenScreenShot을 설치하세요. Firefox 버전은 스크린샷만 캡처해요.
2. 아이콘을 툴바에 고정하세요.
3. 페이지에서 아이콘을 클릭하세요. 기본값인 **원클릭 Express 모드**에서는 **전체 페이지** 캡처가 시작되고 **편집기**가 열려요. **보이는 영역**, **선택 영역**, **요소 캡처**는 페이지를 마우스 오른쪽 버튼으로 클릭해 쓰세요.
4. **설정**에서 **캡처 후**를 **편집기**, **클립보드**, **다운로드** 중 하나로 정하세요.
5. FuseBase나 클라우드 저장소에서 보관할 파일을 다운로드하세요. 예전 캡처에 주석을 달려면 이미지를 OpenScreenShot 편집기에 끌어다 놓으세요.
6. `chrome://extensions`를 확인하고, Nimbus나 FuseBase 확장 프로그램을 더 이상 쓰지 않으면 제거하세요.

짧은 기능 영상은 [제품 데모 영상](/ko/use-cases/product-demos/)을 참고하세요. 팀을 위해 표시한 캡처는 [디자인 리뷰용 페이지 캡처](/ko/use-cases/design-review/)를 참고하세요. 다른 레코더는 [Awesome Screenshot 대안](/ko/alternatives/awesome-screenshot/)과 [Screenity 대안](/ko/alternatives/screenity/)을 참고하세요.
