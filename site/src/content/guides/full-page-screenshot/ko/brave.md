---
title: Brave에서 전체 페이지 스크린샷 찍는 방법
description: Brave의 스크린샷 버튼을 켜고 전체 페이지를 PNG로 캡처하고, 한계를 확인하고, Chrome 웹 스토어의 OpenScreenShot을 써 보세요.
order: 5
---

Brave 1.94 이상에는 스크린샷 도구가 기본으로 있어요. `brave://settings/appearance`에서 스크린샷 버튼을 켜고, 버튼을 클릭한 뒤 **Full page**(전체 페이지)를 선택하세요. Brave 1.96 이상에서는 미리보기가 열리고, 거기서 PNG를 다운로드하거나 이미지를 복사해요. OpenScreenShot도 Brave에서 동작해요. Brave는 Chromium 브라우저이고 Chrome 웹 스토어에서 확장 프로그램을 설치해요.

## 기본 제공 방법

Brave에는 이 도구에 대한 도움말 센터 문서가 없어요. 아래 단계는 Brave의 [릴리스 노트](https://brave.com/latest/)와 [이슈 트래커](https://github.com/brave/brave-browser/issues/57937)를 따라요.

1. `brave://settings/appearance`로 가서 툴바 구역의 스크린샷 버튼을 켜세요.
2. 캡처할 페이지를 여세요.
3. 툴바의 **Take a screenshot**(스크린샷 찍기) 버튼을 클릭하세요.
4. **Capture screenshot**(스크린샷 캡처) 버블에서 **Full page**를 선택하세요. 버블에는 **Selected area**(선택한 영역)와 **Visible area**(보이는 영역)도 있어요.
5. **Screenshot preview**(스크린샷 미리보기) 대화상자에서 **Download**(다운로드)를 선택해 PNG를 저장하거나, **Copy to clipboard**(클립보드에 복사)를 선택하세요.

Brave 1.75 이상에서는 `Ctrl+Shift+S`(macOS에서는 `Shift+Cmd+S`)가 Brave의 스크린샷 도구를 열어요. Brave의 이슈 트래커는 이 단축키를 선택 방식의 캡처로 설명하므로, **Full page**에는 툴바 버튼을 쓰세요. Brave 1.96에서는 앱 메뉴의 스크린샷 항목이 **Save and share**(저장 및 공유)의 Save 구역으로 옮겨졌어요.

미리보기에는 **Download**와 **Copy to clipboard**가 있어요. 화살표나 텍스트를 넣으려면 PNG를 다른 앱에서 여세요.

## 제한 사항

- **페이지 크기.** **Full page** 옵션은 Chromium의 DevTools 스크린샷 명령을 사용해요. 이 명령은 너비나 높이가 131,072 CSS 픽셀 이상인 페이지를 “Page is too large.” 오류와 함께 거부해요.
- **고정 요소.** 이 명령을 위해 Chromium은 뷰를 전체 페이지 크기로 늘려요. 그러면 창 높이(`100vh`)에 맞춘 구역과 고정 헤더나 푸터가 그 긴 뷰를 기준으로 배치될 수 있어서, 고정 푸터가 이미지 맨 아래에 한 번 나타날 수 있어요.
- **지연 로딩.** `loading="lazy"`로 표시된 이미지는 근처까지 스크롤해야 불러와져요. 캡처하기 전에 페이지를 끝까지 스크롤하세요. 그러지 않으면 이미지 일부가 빈 채로 남을 수 있어요.
- **내부 스크롤 컨테이너.** Chromium은 페이지 자체의 스크롤 크기로 캡처 크기를 정해요. 높이가 고정된 틀 안의 패널이 스크롤되는 페이지에서는, 캡처에 그 패널이 한 화면 높이만큼만 나와요.
- **무한 스크롤.** 계속 불러오는 피드에는 진짜 끝이 없어요. 캡처에는 시작하기 전에 불러온 내용만 담겨요.

## OpenScreenShot으로 캡처하기

OpenScreenShot은 페이지를 뷰포트 단위로 스크롤하면서 부분들을 하나의 이미지로 이어 붙여요. 고정 헤더는 맨 위에 한 번만 캡처되고, 내부 요소가 스크롤되는 페이지도 동작해요. 높이가 32,000 기기 픽셀을 넘는 페이지는 최대 여섯 개의 이미지로 저장돼요.

1. Brave에서 [OpenScreenShot 페이지](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)를 열고 확장 프로그램을 추가하세요. Brave는 [Using Chrome extensions in Brave](https://brave.com/learn/using-chrome-extensions-in-brave/)에서 Chrome 웹 스토어 설치를 설명해요.
2. OpenScreenShot 아이콘을 툴바에 고정하세요.
3. 페이지를 열고 아이콘을 클릭하세요. 기본 설정에서는 전체 페이지 캡처가 시작되고 결과가 편집기에서 열려요.
4. 맨 위, 맨 아래, 고정 내비게이션을 확인하세요.
5. **이미지 저장**을 클릭하고 PNG, JPEG, WebP, PDF 중에서 고르거나, **복사**를 클릭하세요.

OpenScreenShot의 전체 페이지 단축키는 `Ctrl+Shift+S`(macOS에서는 `⌘⇧S`)로, Brave의 스크린샷 도구와 같은 키예요. 이 키가 Brave의 도구를 열면 대신 아이콘을 클릭하거나, 캡처 메뉴의 **단축키** 링크에서 다른 키를 지정하세요. 아이콘이 메뉴를 열면 **전체 페이지**를 선택하세요. **원클릭 Express 모드** 설정이 이 동작을 정해요.

## 무엇을 쓸까

- 창 전체가 스크롤되는 페이지의 PNG를 빠르게 찍으려면 Brave의 **Full page** 버튼을 쓰세요.
- 내부 패널이 스크롤되는 페이지, PDF·JPEG·WebP 내보내기, 공유하기 전의 표시와 가리기에는 OpenScreenShot을 쓰세요. [버그 리포트](/ko/use-cases/bug-reports/)가 그런 경우예요.
- 캡처를 게시물에 올릴 때는 OpenScreenShot의 **Beautify** 패널을 쓰세요. 여백, 둥근 모서리, 그림자, 배경을 넣어요. [소셜 미디어용 스크린샷](/ko/use-cases/social-media/)을 참고하세요.

[캡처 모드 레퍼런스](/ko/docs/#modes)와 [내보내기 레퍼런스](/ko/docs/#export)에서 모든 옵션을 볼 수 있어요. [Chrome 가이드](/ko/full-page-screenshot/chrome/)에서 Brave에도 있는 DevTools 캡처를 다뤄요. 브라우저 설정처럼 확장 프로그램을 막는 페이지는 [지원 및 알려진 제한 사항](/ko/support/)을 참고하세요.
