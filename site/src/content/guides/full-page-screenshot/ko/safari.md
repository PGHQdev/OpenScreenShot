---
title: Safari에서 전체 페이지 스크린샷 찍는 방법
description: Mac의 Safari에는 전체 페이지 이미지 캡처가 없어요. 페이지를 PDF로 저장하거나, Web Inspector로 요소를 캡처하거나, 다른 브라우저를 쓰세요.
order: 4
---

Mac의 Safari에는 전체 페이지 스크린샷 명령이 없어요. 가장 가까운 기본 옵션은 PDF예요. **File**(파일) > **Print**(프린트)를 선택하고, 대화상자 아래쪽의 **PDF**를 클릭한 뒤 파일을 저장하세요. 이미지 파일이 필요하면 Safari의 Web Inspector로 페이지의 요소 하나를 캡처할 수 있어요. OpenScreenShot에는 Safari 버전이 없어요. Safari는 Mac App Store에서 Safari Web Extensions를 설치하고, Chrome 웹 스토어나 Firefox 부가 기능 패키지는 설치할 수 없어요. Mac에서는 Chrome, Firefox, Edge와 그 밖의 브라우저로 OpenScreenShot을 실행할 수 있어요.

## 기본 제공 방법

### 페이지를 PDF로 저장하기

Apple은 [Print or create a PDF of a webpage in Safari](https://support.apple.com/guide/safari/print-or-create-a-pdf-of-a-webpage-ibrw1060/18.0/mac/15.0)에서 이 방법을 설명해요.

1. 보관할 페이지를 여세요.
2. 늦게 불러와지는 이미지가 모두 불러와지도록 페이지를 한 번 끝까지 스크롤하세요.
3. **File** > **Print**를 선택하세요.
4. 페이지의 색상을 유지하려면 프린트 옵션에서 배경 이미지와 색상 프린트를 켜세요. 머리글과 바닥글에 웹 주소와 날짜를 넣을 수도 있어요.
5. 대화상자 아래쪽의 **PDF**를 클릭하고 파일을 저장하세요.

### Web Inspector로 요소 캡처하기

1. **Safari** > **Settings**(설정) > **Advanced**(고급)를 선택하고 **Show features for web developers**(웹 개발자용 기능 보기)를 선택하세요. WebKit은 [Enabling Web Inspector](https://webkit.org/web-inspector/enabling-web-inspector/)에서 이를 설명해요.
2. 페이지를 열고 `Option+Cmd+I`를 눌러 Web Inspector를 여세요.
3. **Elements**(요소) 탭에서 `<html>`이나 `<body>` 같은 노드를 마우스 오른쪽 버튼으로 클릭하고 **Capture Screenshot**(스크린샷 캡처)을 선택하세요.
4. Safari가 그 노드의 스냅샷을 파일로 저장해요.

Apple은 `<html>` 캡처에 페이지의 보이는 부분 아래 콘텐츠가 포함되는지, 어떤 이미지 형식으로 저장되는지 문서화하지 않아요. 이 파일에 의존하기 전에 확인하세요.

## 제한 사항

- **전체 페이지 이미지 없음.** 두 방법 모두 전체 페이지 캡처 도구에서 얻는 스크린샷을 주지 않아요. PDF는 페이지의 프린트 버전이고, Web Inspector 항목은 노드 하나를 캡처해요.
- **프린트 레이아웃.** PDF는 프린트 레이아웃을 사용하므로 파일 속 페이지가 화면의 페이지와 다르게 보일 수 있어요. 디자인이 배경 이미지와 색상에 의존한다면 이를 켜세요.
- **지연 로딩.** `loading="lazy"`로 표시된 이미지는 근처까지 스크롤해야 불러와져요. 프린트하거나 캡처하기 전에 페이지를 끝까지 스크롤하세요. 그러지 않으면 일부가 빈 채로 남을 수 있어요.
- **내부 스크롤 컨테이너.** 개발자들은 Safari의 엔진인 WebKit에서 자동화된 전체 페이지 캡처가, 높이가 고정된 틀 안의 패널이 스크롤되는 페이지를 한 화면 높이만큼만 보여 준다고 보고해요. 그렇게 만들어진 페이지는 주의해서 확인하세요.
- **고정 헤더.** 결과에서 헤더가 빠지거나, 반복되거나, 엉뚱한 위치에 있지 않은지 확인하세요.

## OpenScreenShot으로 캡처하기

OpenScreenShot은 Safari용으로 제공되지 않아요. 같은 Mac에 Chrome, Firefox, Edge, Brave, Opera, Vivaldi, Arc가 있다면 그 브라우저에서 페이지를 열고 확장 프로그램을 쓰세요. Chrome과 다른 Chromium 브라우저는 [Chrome 웹 스토어](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)에서 설치해요. Firefox는 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/)에서 설치해요.

1. 다른 브라우저에 OpenScreenShot을 설치하고 아이콘을 툴바에 고정하세요.
2. 페이지를 열고 아이콘을 클릭하세요. Chrome에서는 `⌘⇧S`로도 전체 페이지 캡처가 시작돼요.
3. 편집기에서 결과를 확인하세요.
4. **이미지 저장**을 클릭하고 PNG, JPEG, WebP, PDF 중에서 고르세요.

확장 프로그램은 페이지를 스크롤하면서 부분들을 하나의 이미지로 이어 붙이고, 고정 헤더는 맨 위에 한 번만 넣어요. 높이가 32,000 기기 픽셀을 넘는 페이지는 최대 여섯 개의 이미지로 저장돼요. [Chrome 가이드](/ko/full-page-screenshot/chrome/)와 [Firefox 가이드](/ko/full-page-screenshot/firefox/)에서 각 브라우저의 기본 도구를 포함한 단계를 설명해요.

## 무엇을 쓸까

- 기사나 영수증 페이지를 읽기 좋은 사본으로 남기려면 Safari에서 **File** > **Print** > **PDF**를 쓰세요.
- 카드나 차트 같은 페이지 일부의 이미지가 필요하면 Web Inspector의 **Capture Screenshot**을 쓰세요.
- 표시를 할 수 있는 전체 페이지 이미지나, 화면에 보이는 그대로의 페이지 PDF가 필요하면 Mac의 다른 브라우저에서 OpenScreenShot을 쓰세요. [스크린샷 PDF 저장 가이드](/ko/blog/save-screenshot-as-pdf/)에서 PDF 레이아웃을 비교하고, [페이지의 시각적 사본 저장](/ko/use-cases/archive-web-pages/)에서 이름 짓기와 저장을 다뤄요.

그 밖의 질문은 [지원 및 알려진 제한 사항](/ko/support/)을 참고하세요.
