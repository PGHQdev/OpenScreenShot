---
title: 'Chrome에서 전체 페이지 스크린샷 찍는 방법: DevTools 또는 확장 프로그램'
description: Chrome DevTools의 Capture full size screenshot 명령과 한계를 알아보고 OpenScreenShot 전체 페이지 캡처와 비교.
order: 1
---

Chrome은 확장 프로그램 없이도 전체 페이지 스크린샷을 찍을 수 있지만, DevTools에서만 가능해요. DevTools를 열고, 명령 메뉴를 열고, `screenshot`을 입력한 뒤 **Capture full size screenshot**(전체 크기 스크린샷 캡처)을 실행하세요. Chrome이 페이지 전체를 PNG 파일로 저장해요. 일반 Chrome 메뉴에는 스크린샷 항목이 없어요. Google 도움말에는 **Cast, save, and share**(전송, 저장, 공유) 아래에 Share, Send to your devices, Create QR code만 나와 있어요. 표시를 하거나, PDF로 내보내거나, 패널 안에서 스크롤되는 페이지를 캡처하려면 OpenScreenShot을 설치하고 아이콘을 클릭하세요.

## 기본 제공 방법

1. 캡처할 페이지를 여세요.
2. [DevTools를 여세요](https://developer.chrome.com/docs/devtools/open). Windows와 Linux에서는 `F12`나 `Ctrl+Shift+I`를, macOS에서는 `Cmd+Option+I`를 누르세요.
3. [명령 메뉴](https://developer.chrome.com/docs/devtools/command-menu)를 여세요. `Ctrl+Shift+P`를, macOS에서는 `Cmd+Shift+P`를 누르세요.
4. `screenshot`을 입력하고 **Capture full size screenshot**을 선택하세요.
5. Chrome이 페이지 전체의 PNG 파일을 저장해요.

같은 캡처가 기기 모드에도 있어요. 기기 툴바를 켜고 **More options**(옵션 더보기) 메뉴를 연 뒤 전체 크기 스크린샷 항목을 선택하세요. Google의 [기기 모드 문서](https://developer.chrome.com/docs/devtools/device-mode)에서는 이 항목을 **Capture a full size screenshot**(전체 크기 스크린샷 캡처)이라고 불러요.

이 과정 전체를 한 번에 실행하는 단축키는 없어요. Google은 이 캡처용 표시 도구를 문서화하지 않았으므로, 화살표, 텍스트, 가리기는 다른 앱에서 해야 해요.

## 제한 사항

- **DevTools가 열려 있어야 해요.** 이 명령은 명령 메뉴와 기기 모드 메뉴에만 있어요.
- **페이지 크기.** Chromium은 너비나 높이가 131,072 CSS 픽셀 이상인 페이지를 “Page is too large.” 오류와 함께 거부해요.
- **고정 요소.** 캡처를 위해 Chromium은 뷰를 전체 페이지 크기로 늘리고 스크롤바를 숨겨요. 그러면 창 높이(`100vh`)에 맞춘 구역과 고정 헤더나 푸터가 그 긴 뷰를 기준으로 배치될 수 있어요. 고정 푸터가 이미지 맨 아래에 한 번 나타나거나, 전체 높이 히어로 구역이 늘어날 수 있어요.
- **지연 로딩.** `loading="lazy"`로 표시된 이미지와 프레임은 근처까지 스크롤해야 불러와져요. 명령을 실행하기 전에 페이지를 끝까지 스크롤하세요. 그러지 않으면 이미지 일부가 빈 채로 남을 수 있어요.
- **내부 스크롤 컨테이너.** Chromium은 페이지 자체의 스크롤 크기로 캡처 크기를 정해요. 웹 앱이나 콘텐츠 창이 스크롤되는 문서 사이트처럼 높이가 고정된 틀 안의 패널이 스크롤되는 페이지에서는, 캡처에 그 패널이 한 화면 높이만큼만 나와요.

## OpenScreenShot으로 캡처하기

OpenScreenShot은 페이지를 뷰포트 단위로 스크롤하면서 각 부분을 캡처하고, 부분들을 하나의 이미지로 이어 붙여요. 고정 헤더는 첫 부분에서 캡처해 맨 위에 한 번만 넣어요. 창 대신 내부 요소가 스크롤되는 페이지도 동작해요. 높이가 32,000 기기 픽셀을 넘는 페이지는 최대 여섯 개의 이미지로 저장돼요.

1. [Chrome 웹 스토어에서 OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)을 설치하고 아이콘을 툴바에 고정하세요.
2. 페이지를 열고 아이콘을 클릭하거나 `Ctrl+Shift+S`(macOS에서는 `⌘⇧S`)를 누르세요.
3. 편집기에서 결과를 확인하세요. 특히 맨 위, 맨 아래, 고정 내비게이션을 보세요.
4. **이미지 저장**을 클릭하고 PNG, JPEG, WebP, PDF 중에서 고르세요. 옆의 **복사**와 **PDF**는 한 번의 클릭으로 끝나요.

캡처 대신 메뉴가 열리면 **전체 페이지**를 선택하세요. **원클릭 Express 모드** 설정이 이 동작을 정해요. [Chrome 전체 페이지 스크린샷 가이드](/ko/blog/full-page-screenshot-chrome/)에서 빠지거나 반복되는 구역을 포함해 확장 프로그램 사용법을 단계별로 설명해요. [캡처 모드 레퍼런스](/ko/docs/#modes)와 [내보내기 레퍼런스](/ko/docs/#export)에서 모든 옵션을 볼 수 있어요.

## DevTools와 OpenScreenShot 비교

- **시작:** DevTools는 단축키 두 개와 명령 입력이 필요해요. OpenScreenShot은 클릭 한 번이나 단축키 하나면 돼요.
- **결과물:** DevTools는 PNG를 저장해요. OpenScreenShot은 PNG, JPEG, WebP, PDF로 내보내거나 이미지를 복사해요.
- **편집:** DevTools에는 편집 기능이 없어요. OpenScreenShot은 화살표, 텍스트, 단계 번호, 블러, 자르기가 있는 편집기를 열어요.
- **설치:** DevTools는 Chrome에 이미 있어요. OpenScreenShot은 캡처를 로컬에서 처리하는 MIT 라이선스 확장 프로그램이에요.

## 무엇을 쓸까

- 확장 프로그램을 추가할 수 없는 컴퓨터에서 일반 페이지의 PNG를 한 번 찍을 때는 DevTools를 쓰세요.
- 내부 패널이 스크롤되는 페이지, 고정 헤더가 있는 페이지, 공유하기 전에 표시를 하고 싶은 캡처에는 OpenScreenShot을 쓰세요. [버그 리포트](/ko/use-cases/bug-reports/)나 [디자인 리뷰](/ko/use-cases/design-review/)가 그런 경우예요.
- Microsoft Edge에서도 둘 다 쓸 수 있어요. [Edge 가이드](/ko/full-page-screenshot/edge/)에서 Edge 자체의 Screenshot 도구를 다뤄요.

`chrome://settings` 같은 브라우저 페이지에서 캡처가 실패하면 [지원 및 알려진 제한 사항](/ko/support/)을 참고하세요.
