---
title: Arc에서 전체 페이지 스크린샷 찍는 방법
description: macOS Arc의 Capture Full Page로 PNG 저장, 문서화되지 않은 점 확인, Chrome 웹 스토어의 OpenScreenShot 사용법.
order: 8
---

macOS용 Arc에는 **Capture Full Page**(전체 페이지 캡처) 명령이 있어요. `Cmd+T`를 눌러 Command Bar를 열고, `Capture Full Page`를 입력한 뒤 선택하세요. Arc가 페이지 전체의 PNG를 기본 다운로드 위치에 내려받아요. Arc 도움말은 이 명령을 macOS용으로만 문서화해요. OpenScreenShot도 Arc에서 동작해요. Arc는 Chromium 브라우저이고 Chrome 웹 스토어에서 확장 프로그램을 설치해요.

## 기본 제공 방법

Arc는 [How to take full page screen captures in Arc](https://resources.arc.net/hc/en-us/articles/25481392111895-How-To-Take-Full-Page-Screen-Captures-in-Arc)에서 이 명령을 설명해요.

1. 캡처할 페이지를 여세요.
2. `Cmd+T`를 눌러 Command Bar를 열고, `Capture Full Page`를 입력한 뒤 선택하세요. **File**(파일) > **Capture Full Page**를 선택해도 돼요.
3. Arc가 PNG를 기본 다운로드 위치에 내려받아요.

이 명령에는 기본 단축키가 없어요. 단축키를 추가하려면 **Arc** > **Settings**(설정) > **Shortcuts**(단축키)를 열고, `capture`를 검색한 뒤 **Capture Full Page**에 키를 지정하세요.

스타일을 입힌 스크린샷을 원하면 [Developer Mode](https://resources.arc.net/hc/en-us/articles/20468488031511-Developer-Mode-Instant-Dev-Tools)를 켜고 툴바의 스크린샷 버튼을 쓰거나, Command Bar에서 **Capture in Portrait Mode**(세로 모드로 캡처)를 실행하세요. Arc의 별도 Capture 도구는 편집과 Easels를 지원하는 선택 캡처를 하며, 이것도 macOS 전용이에요.

## 제한 사항

- **macOS 전용.** Arc는 Windows용 Arc의 전체 페이지 명령을 문서화하지 않아요.
- **문서화되지 않은 동작.** Arc는 이미지를 만드는 방식, 크기 한도, 고정 헤더 처리 방식을 문서화하지 않아요. PNG의 맨 위와 중간에서 헤더가 빠지거나 반복되지 않았는지 확인하세요.
- **표시.** Arc는 전체 페이지 캡처의 편집 기능을 문서화하지 않아요. 화살표나 텍스트를 넣으려면 PNG를 다른 앱에서 여세요.
- **지연 로딩.** `loading="lazy"`로 표시된 이미지는 근처까지 스크롤해야 불러와져요. 캡처하기 전에 페이지를 끝까지 스크롤하세요. 그러지 않으면 이미지 일부가 빈 채로 남을 수 있어요.
- **내부 스크롤 컨테이너.** 개발자들은 Chromium, Firefox, WebKit의 전체 페이지 캡처가 높이가 고정된 틀 안에서 스크롤되는 패널을 한 화면 높이만큼만 보여 준다고 보고해요. 콘텐츠 창이 스크롤되는 웹 앱과 문서 사이트를 확인하세요.
- **무한 스크롤.** 계속 불러오는 피드에는 진짜 끝이 없어요. 캡처에는 시작하기 전에 불러온 내용만 담겨요.

## OpenScreenShot으로 캡처하기

OpenScreenShot은 페이지를 뷰포트 단위로 스크롤하면서 부분들을 하나의 이미지로 이어 붙여요. 고정 헤더는 맨 위에 한 번만 캡처되고, 내부 요소가 스크롤되는 페이지도 동작해요. 높이가 32,000 기기 픽셀을 넘는 페이지는 최대 여섯 개의 이미지로 저장돼요.

1. Arc에서 [OpenScreenShot 페이지](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)를 열고 확장 프로그램을 추가하세요. Arc는 [Extensions in Arc](https://resources.arc.net/hc/en-us/articles/19434259167767-Extensions-in-Arc-How-to-Import-Add-Open)에서 Chrome 웹 스토어 설치를 다뤄요.
2. OpenScreenShot 아이콘을 고정하세요.
3. 페이지를 열고 아이콘을 클릭하거나 `⌘⇧S`를 누르세요. 기본 설정에서는 전체 페이지 캡처가 시작되고 결과가 편집기에서 열려요.
4. 맨 위, 맨 아래, 고정 내비게이션을 확인하세요.
5. **이미지 저장**을 클릭하고 PNG, JPEG, WebP, PDF 중에서 고르거나, **복사**를 클릭하세요.

아이콘이 메뉴를 열면 **전체 페이지**를 선택하세요. **원클릭 Express 모드** 설정이 이 동작을 정해요. OpenScreenShot에서 캡처에 스타일을 입히려면 편집기에서 **Beautify** 패널을 여세요. 여백, 둥근 모서리, 그림자, 그라디언트·단색·투명 배경을 넣고, 프레임은 모든 내보내기에 함께 들어가요. [캡처 모드 레퍼런스](/ko/docs/#modes)와 [내보내기 레퍼런스](/ko/docs/#export)에서 모든 옵션을 볼 수 있어요.

## 무엇을 쓸까

- 창 전체가 스크롤되는 페이지의 PNG를 빠르게 찍으려면 macOS의 Arc에서 **Capture Full Page**를 쓰세요.
- 내부 패널이 스크롤되는 페이지이거나, 캡처에 표시를 하거나, 가리거나, PDF로 저장하고 싶다면 OpenScreenShot을 쓰세요. [디자인 리뷰](/ko/use-cases/design-review/)가 그런 경우예요.
- 원하는 여백과 배경으로 스타일을 입힌 이미지가 필요하면 OpenScreenShot의 **Beautify** 패널을 쓰세요. [소셜 미디어용 스크린샷](/ko/use-cases/social-media/)이 그런 경우예요.

[Chrome 가이드](/ko/full-page-screenshot/chrome/)에서 Chrome의 DevTools 캡처와 확장 프로그램을 비교하고, [Brave 가이드](/ko/full-page-screenshot/brave/)에서 기본 도구가 있는 또 다른 Chromium 브라우저를 다뤄요. 브라우저 설정처럼 확장 프로그램을 막는 페이지는 [지원 및 알려진 제한 사항](/ko/support/)을 참고하세요.
