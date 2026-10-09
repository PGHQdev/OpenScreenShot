---
title: Microsoft Edge에서 전체 페이지 스크린샷 찍는 방법
description: Edge의 Screenshot 도구나 DevTools 명령으로 전체 페이지 캡처, 한계 확인, Chrome 웹 스토어의 OpenScreenShot 사용법.
order: 2
---

Microsoft Edge에는 예전에 Web capture라고 불리던 Screenshot 도구가 기본으로 있어요. `Ctrl+Shift+S`를 누르고 **Capture full page**(전체 페이지 캡처)를 선택한 뒤 캡처를 복사하거나 기기에 저장하세요. OpenScreenShot도 Edge에서 동작해요. Edge는 Chromium 브라우저이고, 다른 스토어의 확장 프로그램을 허용하면 Chrome 웹 스토어에서 OpenScreenShot을 설치해요.

## 기본 제공 방법

Microsoft는 [Edge 스크린샷 가이드](https://www.microsoft.com/en-us/edge/learning-center/screenshot-webpage)에서 이 도구를 설명해요.

1. 캡처할 페이지를 여세요.
2. `Ctrl+Shift+S`를 누르세요. 페이지를 마우스 오른쪽 버튼으로 클릭하고 **Screenshot**(스크린샷)을 선택하거나, **Settings and more**(설정 및 기타)(**...**)를 열고 **Screenshot**을 선택해도 돼요.
3. 가운데 옵션인 **Capture full page**를 선택하세요.
4. 필요하면 미리보기에서 그리기 도구로 캡처에 표시를 하세요.
5. 캡처를 복사하거나 기기에 저장하세요.

Microsoft는 기능 제공 여부가 기기 유형, 시장, 브라우저 버전에 따라 다를 수 있다고 말해요. 관리자는 [WebCaptureEnabled 정책](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled)으로 이 도구를 끌 수도 있어요. 회사 컴퓨터에서 **Screenshot** 항목이 없다면 이 정책이 설정된 것일 수 있어요.

Edge에는 Chromium DevTools 캡처도 있어요. DevTools를 열고, 기기 에뮬레이션을 켜고, **More options**(옵션 더보기)를 연 뒤 **Capture a full size screenshot**(전체 크기 스크린샷 캡처)을 선택하세요. Microsoft는 [기기 모드 문서](https://learn.microsoft.com/en-us/microsoft-edge/devtools/device-mode/)에서 이를 설명해요. [Chrome 가이드](/ko/full-page-screenshot/chrome/)에서 이 방법과 확장 프로그램을 비교해요.

## 제한 사항

- **문서화되지 않은 동작.** Microsoft는 Screenshot 도구가 전체 페이지 이미지를 만드는 방식, 최대 페이지 길이, 고정 헤더·지연 로딩·내부 스크롤 컨테이너 처리 방식을 문서화하지 않아요. 공유하기 전에 캡처를 하나씩 확인하세요.
- **내부 스크롤 컨테이너.** Microsoft Q&A의 사용자들은 콘텐츠 창이 스크롤되는 웹 앱처럼 내부 요소 안에서 스크롤되는 페이지에서 전체 페이지 캡처가 실패했다고 보고해요. Microsoft는 이를 확인하지 않았어요.
- **DevTools 페이지 크기.** DevTools 캡처는 Chromium의 스크린샷 명령을 사용해요. 이 명령은 너비나 높이가 131,072 CSS 픽셀 이상인 페이지를 “Page is too large.” 오류와 함께 거부해요.
- **지연 로딩.** `loading="lazy"`로 표시된 이미지는 근처까지 스크롤해야 불러와져요. 캡처하기 전에 페이지를 끝까지 스크롤하세요. 그러지 않으면 이미지 일부가 빈 채로 남을 수 있어요.
- **고정 헤더.** 스크롤하면서 여러 부분을 이어 붙이는 캡처 도구는 화면에 계속 남는 요소를 반복해서 담아요. 이미지 아래쪽에 헤더가 두 번 이상 나오지 않는지 살펴보세요.

## OpenScreenShot으로 캡처하기

OpenScreenShot은 페이지를 스크롤하면서 부분별로 캡처하고, 부분들을 하나의 이미지로 이어 붙여요. 고정 헤더는 맨 위에 한 번만 캡처되고, 내부 요소가 스크롤되는 페이지도 동작해요. 높이가 32,000 기기 픽셀을 넘는 페이지는 최대 여섯 개의 이미지로 저장돼요.

1. Edge에서 [OpenScreenShot 페이지](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)를 여세요. Edge가 물어보면 **Allow extensions from other stores**(다른 스토어의 확장 허용)를 선택한 뒤 확장 프로그램을 추가하세요. Microsoft는 [확장 프로그램 도움말](https://support.microsoft.com/en-us/edge/add-turn-off-or-remove-extensions-in-microsoft-edge)에서 이 단계를 설명해요.
2. OpenScreenShot 아이콘을 툴바에 고정하세요.
3. 페이지를 열고 아이콘을 클릭하세요. 기본 설정에서는 전체 페이지 캡처가 시작되고 결과가 편집기에서 열려요.
4. 맨 위, 맨 아래, 그리고 스크롤할 때 불러와지는 구역을 확인하세요.
5. **이미지 저장**을 클릭하고 PNG, JPEG, WebP, PDF 중에서 고르거나, **복사**를 클릭하세요.

OpenScreenShot의 전체 페이지 단축키는 `Ctrl+Shift+S`로, Edge의 Screenshot 도구와 같은 키예요. 이 키가 Edge의 도구를 열면 대신 아이콘을 클릭하거나, 캡처 메뉴의 **단축키** 링크에서 다른 키를 지정하세요. [캡처 모드 레퍼런스](/ko/docs/#modes)에서 다른 모드를 볼 수 있어요.

## 무엇을 쓸까

- 창 전체가 스크롤되는 페이지를 펜 표시 몇 개와 함께 빠르게 캡처하려면 Edge의 Screenshot 도구를 쓰세요.
- 내부 패널이 스크롤되는 페이지, PDF·JPEG·WebP 내보내기, 단계 번호와 단색 가리기가 필요할 때는 OpenScreenShot을 쓰세요. [도움말 문서와 튜토리얼](/ko/use-cases/documentation/)이나 [지원 답변](/ko/use-cases/customer-support/)이 그런 경우예요.
- 관리자가 Screenshot 도구를 껐고 확장 프로그램도 설치할 수 없다면 DevTools 캡처를 쓰세요.

[내보내기 레퍼런스](/ko/docs/#export)에서 파일 형식과 배율을 다뤄요. 브라우저 설정처럼 OpenScreenShot이 캡처할 수 없는 페이지는 [지원 및 알려진 제한 사항](/ko/support/)을 참고하세요.
