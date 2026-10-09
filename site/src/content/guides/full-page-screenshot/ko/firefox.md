---
title: Firefox에서 전체 페이지 스크린샷 찍는 방법
description: Firefox Screenshots 도구나 :screenshot 명령으로 전체 페이지 캡처, 크기 한도 확인, OpenScreenShot 부가 기능 사용법.
order: 3
---

Firefox에는 Screenshots 도구가 기본으로 있어요. `Ctrl+Shift+S`(macOS에서는 `Cmd+Shift+S`)를 누르고 **Save full page**(전체 페이지 저장)를 선택한 뒤, **Download**(다운로드)를 선택해 PNG를 저장하거나 **Copy**(복사)를 선택해 이미지를 클립보드에 넣으세요. Firefox용 OpenScreenShot 부가 기능은 화살표, 텍스트, 가리기를 위한 편집기를 더하고, PNG, JPEG, WebP, PDF로 내보내요.

## 기본 제공 방법

Mozilla는 [Take screenshots in Firefox](https://support.mozilla.org/en-US/kb/take-screenshots-firefox)에서 이 도구를 설명해요.

1. 캡처할 페이지를 여세요.
2. Windows와 Linux에서는 `Ctrl+Shift+S`를, macOS에서는 `Cmd+Shift+S`를 누르세요. 페이지의 빈 곳을 마우스 오른쪽 버튼으로 클릭하고 **Take Screenshot**(스크린샷 찍기)을 선택해도 돼요.
3. 오른쪽 위의 **Save full page**를 선택하세요.
4. 미리보기에서 **Download**를 선택해 Firefox 다운로드 폴더에 PNG를 저장하거나, **Copy**를 선택하세요.

미리보기에는 **Copy**와 **Download**가 있어요. 화살표나 텍스트를 넣으려면 PNG를 다른 앱에서 여세요.

Firefox DevTools에는 두 번째 방법이 있어요. 웹 콘솔을 열고 `:screenshot --fullpage`를 입력하면 Firefox가 페이지 전체의 PNG를 저장해요. DevTools 설정의 **Available Toolbox Buttons**(사용 가능한 도구 상자 버튼)에서 **Take a screenshot of the entire page**(전체 페이지 스크린샷 찍기) 버튼을 켤 수도 있어요. Mozilla는 [DevTools 스크린샷 가이드](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html)에서 두 방법을 모두 설명해요.

## 제한 사항

- **크기.** Firefox는 한 변이 32,766픽셀을 넘거나 면적이 472,907,776픽셀을 넘는 캡처를 잘라내고 “Your screenshot was cropped because it was too large.”를 표시해요. 너무 큰 캡처에 대한 Firefox의 오류 메시지는 다른 숫자를 제시해요. 가장 긴 변이 32,700픽셀보다 작거나 전체 면적이 124,900,000픽셀보다 작아야 한다고 해요.
- **디스플레이 배율.** Firefox는 이 한도를 기기 픽셀로 계산해요. 페이지 너비와 높이에 디스플레이의 픽셀 비율을 곱한 값이에요. 2배 디스플레이에서는 CSS 픽셀 기준 페이지 높이 한도가 절반인 약 16,383이에요.
- **내부 스크롤 컨테이너.** Firefox는 창의 스크롤 너비와 높이로 전체 페이지 경계를 정해요. 높이가 고정된 틀 안의 패널이 스크롤되는 페이지에서는 그 패널 안의 콘텐츠가 펼쳐지지 않아서, 캡처에 한 화면 높이만큼만 나와요.
- **지연 로딩.** `loading="lazy"`로 표시된 이미지는 근처까지 스크롤해야 불러와져요. 캡처하기 전에 페이지를 끝까지 스크롤하세요. 그러지 않으면 이미지 일부가 빈 채로 남을 수 있어요.
- **무한 스크롤.** 스크롤할수록 더 불러오는 피드에는 진짜 끝이 없어요. 캡처에는 시작하기 전에 불러온 내용만 담겨요.
- **고정 헤더.** 공유하기 전에 이미지의 맨 위와 중간에서 헤더가 빠지거나, 반복되거나, 엉뚱한 위치에 있지 않은지 확인하세요.

## OpenScreenShot으로 캡처하기

OpenScreenShot의 Firefox 버전은 스크린샷만 찍어요. 탭 녹화는 Chrome 버전에 있어요. 전체 페이지 모드는 페이지를 스크롤하면서 부분별로 캡처하고, 부분들을 하나의 이미지로 이어 붙이며, 고정 헤더는 맨 위에 한 번만 넣어요. 창 대신 내부 요소가 스크롤되는 페이지도 동작해요.

1. [Firefox Add-ons에서 OpenScreenShot](https://addons.mozilla.org/firefox/addon/openscreenshot/)을 설치하고 아이콘을 툴바에 고정하세요.
2. 페이지를 열고 지연 로딩되는 이미지가 불러와지도록 한 번 끝까지 스크롤한 뒤 맨 위로 돌아가세요.
3. OpenScreenShot 아이콘을 클릭하고, 모드 메뉴가 열리면 **전체 페이지**를 고르세요.
4. 편집기에서 결과를 확인하세요. 특히 맨 위, 맨 아래, 고정 내비게이션을 보세요.
5. **이미지 저장**을 클릭하고 PNG, JPEG, WebP, PDF 중에서 고르거나, **복사**를 클릭하세요.

Firefox는 자체 Screenshots 도구에 `Ctrl+Shift+S`를 쓰므로, OpenScreenShot을 쓰려면 툴바 아이콘을 클릭하세요. [캡처 모드 레퍼런스](/ko/docs/#modes)에서 각 모드를 설명하고, [내보내기 레퍼런스](/ko/docs/#export)에서 형식과 배율을 다뤄요.

## 무엇을 쓸까

- 창 전체가 스크롤되고 크기 한도 안에 들어가는 페이지의 PNG를 빠르게 찍으려면 Firefox Screenshots를 쓰세요.
- 이미 웹 콘솔에서 작업 중이라면 `:screenshot --fullpage` 명령을 쓰세요.
- 내부 패널이 스크롤되는 페이지, 표시를 하거나 PDF로 저장하고 싶은 캡처에는 OpenScreenShot을 쓰세요. [버그 리포트](/ko/use-cases/bug-reports/)나 [페이지 사본 저장](/ko/use-cases/archive-web-pages/)이 그런 경우예요.

[Chrome 가이드](/ko/full-page-screenshot/chrome/)와 [Edge 가이드](/ko/full-page-screenshot/edge/)에서 Chromium 브라우저에서의 같은 작업을 다뤄요. Chromium 브라우저에서는 OpenScreenShot으로 탭도 녹화할 수 있어요. Firefox 설정처럼 확장 프로그램을 막는 페이지는 [지원 및 알려진 제한 사항](/ko/support/)을 참고하세요.
