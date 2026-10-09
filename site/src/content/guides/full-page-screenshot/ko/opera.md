---
title: Opera에서 전체 페이지 스크린샷 찍는 방법
description: Opera의 Snapshot은 전체 페이지를 PDF로만 저장해요. 단계와 한계, OpenScreenShot으로 전체 페이지 이미지를 캡처하는 방법을 알아보세요.
order: 6
---

Opera의 기본 Snapshot 도구는 선택 영역이나 보이는 영역은 이미지로, 전체 페이지는 PDF로만 캡처해요. `Shift+Ctrl+5`(macOS에서는 `Shift+Cmd+2`)를 누르고 **Save page as PDF**(페이지를 PDF로 저장)를 선택하세요. 전체 페이지 이미지 파일이 필요하면 OpenScreenShot을 설치하세요. Opera는 Chromium 브라우저이고, Opera의 **Install Chrome Extensions** 부가 기능을 추가하면 Chrome 웹 스토어에서 OpenScreenShot을 설치해요.

## 기본 제공 방법

Opera는 [기능 도움말 페이지](https://help.opera.com/en/latest/features/)와 [Snapshot 페이지](https://www.opera.com/features/snapshot)에서 Snapshot을 설명해요.

1. 캡처할 페이지를 여세요.
2. Windows와 Linux에서는 `Shift+Ctrl+5`를, macOS에서는 `Shift+Cmd+2`를 누르세요. 툴바 오른쪽의 카메라 아이콘을 클릭해도 돼요.
3. **Save page as PDF**를 선택하세요. Opera가 전체 페이지를 위에서 아래까지 PDF로 저장해요.

Snapshot에는 이미지 옵션이 두 가지 있어요. **Capture Full Screen**(전체 화면 캡처)은 페이지의 보이는 영역만 캡처하고, **Capture**(캡처)는 직접 조정한 프레임을 캡처해요. 둘 다 Zoom, Arrow, Blur, Highlight, Pencil, Selfie camera, Emojis, Text로 표시할 수 있는 이미지를 주고, **Save Image**(이미지 저장)로 PNG로 저장하거나 클립보드에 복사할 수 있어요.

## 제한 사항

- **전체 페이지는 PDF로만.** 이미지 캡처는 보이는 영역이나 선택 영역만 담아요. 페이지 전체를 원하면 PDF를 받게 돼요.
- **문서화되지 않은 레이아웃.** Opera는 PDF가 하나의 긴 페이지인지 여러 페이지인지, 고정 헤더를 어떻게 처리하는지, 높이가 고정된 틀 안의 패널이 스크롤되는 페이지를 어떻게 다루는지 문서화하지 않아요. 공유하기 전에 PDF를 열어 확인하세요.
- **지연 로딩.** `loading="lazy"`로 표시된 이미지는 근처까지 스크롤해야 불러와져요. 저장하기 전에 페이지를 끝까지 스크롤하세요. 그러지 않으면 일부가 빈 채로 남을 수 있어요.
- **무한 스크롤.** 계속 불러오는 피드에는 진짜 끝이 없어요. 어떤 캡처든 시작하기 전에 불러온 내용만 담겨요.

## OpenScreenShot으로 캡처하기

OpenScreenShot은 페이지를 스크롤하면서 부분별로 캡처하고, 부분들을 하나의 이미지로 이어 붙여요. 고정 헤더는 맨 위에 한 번만 캡처되고, 내부 요소가 스크롤되는 페이지도 동작해요. 높이가 32,000 기기 픽셀을 넘는 페이지는 최대 여섯 개의 이미지로 저장돼요.

1. Opera 부가 기능에서 **Install Chrome Extensions** 부가 기능을 추가하세요. Opera는 [Using add-ons from Chrome in Opera](https://blogs.opera.com/tips-and-tricks/2021/10/using-addons-from-chrome-in-opera/)에서 이를 설명해요.
2. [OpenScreenShot 페이지](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)를 열고 확장 프로그램을 추가하세요.
3. OpenScreenShot 아이콘을 툴바에 고정하세요.
4. 페이지를 열고 아이콘을 클릭하거나 `Ctrl+Shift+S`(macOS에서는 `⌘⇧S`)를 누르세요. 기본 설정에서는 전체 페이지 캡처가 시작되고 결과가 편집기에서 열려요.
5. 맨 위, 맨 아래, 고정 내비게이션을 확인하세요.
6. **이미지 저장**을 클릭하고 PNG, JPEG, WebP, PDF 중에서 고르거나, **복사**를 클릭하세요.

아이콘이 메뉴를 열면 **전체 페이지**를 선택하세요. **원클릭 Express 모드** 설정이 이 동작을 정해요. OpenScreenShot의 PDF에는 스크린샷이 이미지로 들어 있어서 화면의 페이지와 똑같이 보이지만, 텍스트를 검색하거나 선택할 수 없어요. **페이지 크기**에서 **전체**는 이미지 크기에 맞춘 한 페이지를 만들고, **A4**나 **Letter**는 긴 캡처를 여러 페이지로 나눌 수 있어요. [스크린샷 PDF 저장 가이드](/ko/blog/save-screenshot-as-pdf/)에서 이 레이아웃들을 비교해요.

## 무엇을 쓸까

- 설치 없이 전체 페이지 PDF를 빠르게 만들려면 Snapshot의 **Save page as PDF**를 쓰세요.
- 보이는 영역이나 선택 영역에 표시 몇 개를 넣으려면 Snapshot의 이미지 옵션을 쓰세요.
- 전체 페이지 PNG, JPEG, WebP, 내부 패널이 스크롤되는 페이지, 화면과 똑같은 PDF가 필요하면 OpenScreenShot을 쓰세요. [디자인 리뷰](/ko/use-cases/design-review/)나 [페이지 사본 저장](/ko/use-cases/archive-web-pages/)이 그런 경우예요.

[캡처 모드 레퍼런스](/ko/docs/#modes)와 [내보내기 레퍼런스](/ko/docs/#export)에서 모든 옵션을 볼 수 있어요. [Vivaldi 가이드](/ko/full-page-screenshot/vivaldi/)에서 자체 캡처 도구가 있는 또 다른 Chromium 브라우저를 다뤄요. 브라우저 설정처럼 확장 프로그램을 막는 페이지는 [지원 및 알려진 제한 사항](/ko/support/)을 참고하세요.
