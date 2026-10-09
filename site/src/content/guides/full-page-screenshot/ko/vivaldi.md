---
title: Vivaldi에서 전체 페이지 스크린샷 찍는 방법
description: Vivaldi Capture로 전체 페이지를 PNG·JPEG로 캡처, 30,000픽셀 한도, Chrome 웹 스토어의 OpenScreenShot 사용법.
order: 7
---

Vivaldi에는 Capture 도구가 기본으로 있어요. 상태 표시줄의 카메라 아이콘을 클릭하고, **Full Page**(전체 페이지)를 선택하고, PNG, JPEG, 클립보드 중에서 고른 뒤 **Capture**(캡처)를 클릭하세요. Full Page 캡처는 30,000픽셀에서 멈춰요. OpenScreenShot도 Vivaldi에서 동작해요. Vivaldi는 Chromium 브라우저이고 Chrome 웹 스토어에서 확장 프로그램을 설치해요.

## 기본 제공 방법

Vivaldi는 [Capture a screenshot](https://help.vivaldi.com/desktop/tools/capture-a-screenshot/)에서 이 도구를 설명해요.

1. 캡처할 페이지를 여세요.
2. 상태 표시줄의 카메라 아이콘을 클릭하세요. Windows와 Linux에서는 `F2`로, macOS에서는 `Cmd+E`로 Quick Commands를 열고 `Capture`를 입력해도 돼요.
3. **Full Page**를 선택하세요.
4. 출력 방식을 선택하세요. **Save as PNG**(PNG로 저장), **Save as JPEG**(JPEG로 저장), **Copy to Clipboard**(클립보드에 복사) 중 하나예요.
5. **Capture**를 클릭하세요. 저장된 파일은 **Settings**(설정) > **Webpages**(웹 페이지) > **Image Capture**(이미지 캡처) > **Capture Storage Folder**(캡처 저장 폴더)에 지정된 폴더로 가요.

Vivaldi는 캡처를 캡처 날짜와 페이지 URL이 들어간 새 메모로 Notes 패널에 넣을 수도 있어요.

[Vivaldi 키보드 단축키 목록](https://help.vivaldi.com/desktop/shortcuts/keyboard-shortcuts/)에는 페이지 캡처의 기본 키가 없어요. 키를 지정하려면 **Settings** > **Keyboard**(키보드)를 열고 **Capture Page to disk**(페이지를 디스크에 캡처)나 **Capture Page to Clipboard**(페이지를 클립보드에 캡처)에 키를 연결하세요.

## 제한 사항

- **크기.** Full Page 캡처는 최대 30,000픽셀까지예요. 더 긴 페이지에서는 필요한 구역을 캡처하세요.
- **문서화되지 않은 동작.** Vivaldi는 전체 페이지 이미지를 만드는 방식이나 고정 헤더 처리 방식을 문서화하지 않아요. 이미지의 맨 위와 중간에서 헤더가 빠지거나 반복되지 않았는지 확인하세요.
- **지연 로딩.** `loading="lazy"`로 표시된 이미지는 근처까지 스크롤해야 불러와져요. 캡처하기 전에 페이지를 끝까지 스크롤하세요. 그러지 않으면 이미지 일부가 빈 채로 남을 수 있어요.
- **내부 스크롤 컨테이너.** 개발자들은 Chromium, Firefox, WebKit의 전체 페이지 캡처가 높이가 고정된 틀 안에서 스크롤되는 패널을 한 화면 높이만큼만 보여 준다고 보고해요. Vivaldi는 이 경우의 동작을 문서화하지 않으므로, 콘텐츠 창이 스크롤되는 웹 앱과 문서 사이트를 확인하세요.
- **표시.** Vivaldi는 캡처용 그리기나 표시 도구를 문서화하지 않아요. 화살표나 텍스트를 넣으려면 파일을 다른 앱에서 여세요.

## OpenScreenShot으로 캡처하기

OpenScreenShot은 페이지를 뷰포트 단위로 스크롤하면서 부분들을 하나의 이미지로 이어 붙여요. 고정 헤더는 맨 위에 한 번만 캡처되고, 내부 요소가 스크롤되는 페이지도 동작해요. 높이가 32,000 기기 픽셀을 넘는 페이지는 최대 여섯 개의 이미지로 저장돼요.

1. Vivaldi에서 [OpenScreenShot 페이지](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)를 열고 확장 프로그램을 추가하세요. Vivaldi는 [확장 프로그램 도움말](https://help.vivaldi.com/desktop/appearance-customization/extensions/)에서 Chrome 웹 스토어 설치를 다뤄요.
2. OpenScreenShot 아이콘을 툴바에 고정하세요.
3. 페이지를 열고 아이콘을 클릭하거나 `Ctrl+Shift+S`(macOS에서는 `⌘⇧S`)를 누르세요. 기본 설정에서는 전체 페이지 캡처가 시작되고 결과가 편집기에서 열려요.
4. 맨 위, 맨 아래, 고정 내비게이션을 확인하세요.
5. **이미지 저장**을 클릭하고 PNG, JPEG, WebP, PDF 중에서 고르거나, **복사**를 클릭하세요.

아이콘이 메뉴를 열면 **전체 페이지**를 선택하세요. **원클릭 Express 모드** 설정이 이 동작을 정해요. 편집기에서 내보내기 전에 화살표, 텍스트, 단계 번호, 블러, 자르기를 넣을 수 있어요. [캡처 모드 레퍼런스](/ko/docs/#modes)와 [내보내기 레퍼런스](/ko/docs/#export)에서 모든 옵션을 볼 수 있어요.

## 무엇을 쓸까

- 30,000픽셀보다 짧은 페이지의 PNG나 JPEG가 필요하면 Vivaldi의 Capture 도구를 쓰세요. 캡처를 URL과 함께 메모에 넣고 싶을 때 특히 좋아요.
- 더 긴 페이지, 내부 패널이 스크롤되는 페이지, 표시를 하거나 PDF로 저장하고 싶은 캡처에는 OpenScreenShot을 쓰세요. [도움말 문서와 튜토리얼](/ko/use-cases/documentation/)이나 [디자인 리뷰](/ko/use-cases/design-review/)가 그런 경우예요.
- 자주 캡처하고 표시가 필요 없다면 Vivaldi 단축키를 지정하세요.

[Opera 가이드](/ko/full-page-screenshot/opera/)와 [Brave 가이드](/ko/full-page-screenshot/brave/)에서 자체 캡처 도구가 있는 다른 Chromium 브라우저를 다뤄요. 브라우저 설정처럼 확장 프로그램을 막는 페이지는 [지원 및 알려진 제한 사항](/ko/support/)을 참고하세요.
