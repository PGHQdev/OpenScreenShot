---
title: 'Lightshot 대안: 공개 업로드 없는 전체 페이지 캡처'
description: Lightshot vs OpenScreenShot. 브라우저에서 전체 페이지 캡처, 블러, PDF 내보내기. 파일은 기기에 남고 prnt.sc 링크가 없어요.
order: 6
---

Chrome이나 Firefox에서 웹 페이지 스크린샷을 찍고, 전체 페이지 캡처, 블러, PDF 내보내기를 원하며, 파일이 기기에 남기를 바란다면 OpenScreenShot으로 바꾸세요. 다른 앱이나 데스크톱 전체를 캡처한다면 Lightshot을 계속 쓰세요. Lightshot에는 Windows와 Mac용 데스크톱 앱이 있고, OpenScreenShot은 브라우저 안의 웹 페이지만 캡처해요. 즉석 단축 링크에 의존한다면 역시 Lightshot을 계속 쓰세요. OpenScreenShot에는 업로드 서비스가 없어서, 캡처를 붙여넣거나 파일을 첨부해 공유해요.

OpenScreenShot은 저희 제품이에요. 이 페이지의 Lightshot 관련 사실은 2026년 10월 9일 기준이며, [Chrome 웹 스토어 페이지](https://chromewebstore.google.com/detail/mbniclmhobmnbdlbpiphghaielnnpgdp), [웹사이트](https://app.prntscr.com/en/index.html), [Firefox 부가 기능 페이지](https://addons.mozilla.org/firefox/addon/lightshot/), Google 업데이트 서버의 버전 7.0.1 매니페스트에서 가져왔어요.

## Lightshot과 OpenScreenShot 비교

|                     | Lightshot                                            | OpenScreenShot                                 |
| ------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| 가격                | 무료                                                 | 무료                                           |
| 오픈 소스           | 아니요(자체 라이선스)                                | 예, MIT                                        |
| 설치 시 사이트 접근 | 모든 웹사이트(필수 `*://*/*`)                        | 없음. 캡처를 시작할 때 현재 탭에 접근          |
| 전체 페이지 캡처    | 아니요. 페이지 설명은 영역 선택                      | 예                                             |
| 주석과 블러         | 그 자리에서 편집                                     | 도형, 화살표, 텍스트, 단계 번호, 블러, 자르기  |
| PDF 내보내기        | 아니요                                               | 예                                             |
| 탭 녹화             | 아니요                                               | 예, Chrome에서(Firefox 버전은 스크린샷만 캡처) |
| 계정 또는 클라우드  | 단축 링크용 prnt.sc 업로드(선택). 디스크 저장도 제공 | 계정 없음, 업로드 없음                         |
| 데스크톱 캡처       | 예, Windows와 Mac 앱으로                             | 아니요                                         |

Lightshot Chrome 확장 프로그램은 2024년 7월 23일에 마지막으로 업데이트되었어요.

## 업로드와 공유 링크

Lightshot은 스크린샷을 prnt.sc에 업로드하고 단축 링크를 줄 수 있어요. 업로드된 이미지를 보는 데는 계정이 필요 없어요. 2021년 [Kaspersky는](https://www.kaspersky.com/blog/cryptoscam-in-lightshot/39224/) URL이 순차적이어서 글자 하나를 바꾸면 다른 이미지가 열릴 수 있고, "Anyone can see published screenshots without authentication."(누구나 인증 없이 게시된 스크린샷을 볼 수 있어요)라고 보고했어요. [AIN.UA도](https://en.ain.ua/2021/09/08/lightshot-allows-people-to-view-screenshots-of-other-users) 같은 해에 같은 문제를 보도했어요. 저희는 이 문제가 2026년에도 해당하는지 확인하지 않았어요.

OpenScreenShot에는 업로드 단계가 없어요. 브라우저 안에서 캡처를 처리하고 저장하며, 내보낸 파일은 다운로드 폴더로 가요. 어딘가에 붙여넣거나 첨부하기 전까지는 아무도 캡처를 보지 못해요. 자세한 내용은 [개인정보 섹션](/ko/docs/#privacy)에 있어요.

## 그대로인 것

빠른 영역 캡처는 그대로예요. `Ctrl+Shift+E`(macOS에서는 `⌘⇧E`)를 누르거나 페이지를 마우스 오른쪽 버튼으로 클릭하고 **선택 영역**을 고른 뒤, 사각형을 드래그하고 `Enter`를 누르세요. 화살표, 텍스트, 도형, 형광펜이 있는 편집기가 열려요. **복사**는 이미지를 클립보드에 넣어 채팅에 바로 붙여넣을 수 있게 해요.

편집기를 건너뛰려면 **캡처 후**를 **클립보드**로 설정하세요. 그러면 캡처할 때마다 바로 클립보드로 들어가서, 캡처하고 바로 붙여넣는 습관에 가까워요.

## 달라지는 것

페이지를 더 많이 캡처할 수 있어요. **전체 페이지**는 스크롤하면서 페이지 전체를 하나의 이미지로 이어 붙여요. **요소 캡처**는 카드, 표, 차트 하나를 정확한 경계대로 캡처해요. **보이는 영역**은 탭 화면에 보이는 부분을 캡처해요.

편집기에는 부드러운 블러, 모자이크, 개인 데이터를 완전히 덮는 **단색** 채우기를 고를 수 있는 **블러**(`B`)가 있어요. **단계 번호** 배지는 자동으로 숫자가 올라가요. **이미지 저장**을 클릭해 **내보내기** 대화상자를 열고 PNG, JPEG, WebP, PDF로 저장하세요.

설치 시 접근 범위가 더 좁아요. OpenScreenShot은 `activeTab`으로 한 번에 탭 하나에만 접근하고, 브라우저 설정 페이지, 확장 프로그램 페이지, 브라우저 밖의 어떤 것도 캡처할 수 없어요. 데스크톱 앱이나 다른 프로그램 창에는 여전히 데스크톱 도구가 필요해요.

## 바꾸는 방법

1. [Chrome 웹 스토어](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)나 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/)에서 OpenScreenShot을 설치하세요.
2. 아이콘을 툴바에 고정하세요.
3. 첫 캡처를 해 보세요. 기본값인 **원클릭 Express 모드**에서는 아이콘을 클릭하면 **전체 페이지** 캡처가 시작돼요. 영역은 `Ctrl+Shift+E`나 오른쪽 클릭 메뉴를 쓰세요.
4. **설정**에서 **캡처 후**를 정하세요. 바로 붙여넣으려면 **클립보드**, 주석을 달려면 **편집기**, PNG를 저장하려면 **다운로드**를 고르세요.
5. 다른 프로그램용으로 데스크톱 스크린샷 앱을 계속 쓴다면, 그 앱이 OpenScreenShot과 같은 키를 쓰지 않는지 확인하세요. Chrome에서는 `chrome://extensions/shortcuts`에서 확장 프로그램의 키를 바꿀 수 있어요.

지원 답변용 빠른 이미지는 [고객 지원용 스크린샷](/ko/use-cases/customer-support/)을 참고하세요. 게시물용은 [소셜 미디어용 스크린샷](/ko/use-cases/social-media/)을 참고하세요. 데스크톱 캡처가 필요하다면 [Snagit 대안](/ko/alternatives/snagit/) 페이지에서 데스크톱 도구가 다루는 범위를 확인하세요.
