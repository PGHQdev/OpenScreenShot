---
title: 명령줄에서 웹사이트 스크린샷 찍기
description: OpenScreenShot CLI로 고정 뷰포트, 전체 페이지 캡처, stdout 바이너리 출력으로 PNG 스크린샷을 저장하세요.
audience: developers
order: 4
---

OpenScreenShot CLI는 로컬에 설치된 Chrome 호환 브라우저를 사용해 웹페이지를 PNG로 캡처합니다. 브라우저 확장 프로그램과는 별개의 패키지입니다. Node.js, pnpm, Chrome이 설치되어 있다면 다음을 실행하세요.

```sh
pnpm dlx openscreenshot shot https://example.com --out screenshot.png --full
```

이 명령은 별도의 헤드리스 브라우저를 시작해 URL로 이동하고, 이미지를 기록한 뒤 브라우저를 닫습니다. 평소 사용하는 브라우저의 탭이나 로그인된 프로필에는 연결하지 않습니다.

## 뷰포트를 명시적으로 설정하기

뷰포트 스크린샷을 찍으려면 `--full`을 빼세요. 너비 기본값은 1280픽셀, 높이 기본값은 800픽셀입니다. 레이아웃에 특정 크기가 필요하다면 둘 다 지정하세요.

```sh
pnpm dlx openscreenshot shot https://example.com --out desktop.png --width 1440 --height 900
pnpm dlx openscreenshot shot https://example.com --out narrow.png --width 390 --height 844
```

너비는 200부터 3840까지, 높이는 200부터 2160까지의 정수를 받습니다. 좁은 뷰포트는 해당 너비에서 반응형 레이아웃을 테스트합니다. 휴대폰의 터치 입력, 기기 픽셀 비율, 모바일 브라우저를 에뮬레이션하지는 않습니다. CLI는 데스크톱 사용자 에이전트를 사용합니다.

뷰포트 밖까지 캡처하려면 `--full`을 추가하세요. 헤드리스 브라우저의 전체 페이지 캡처는 확장 프로그램의 스크롤 후 이어 붙이는 방식과 다릅니다. 모든 동적 페이지가 두 방식에서 똑같이 보인다고 가정하지 마세요.

## 파일로 저장하거나 stdout으로 출력하기

`--out` 없이 실행하면 현재 디렉터리에 `screenshot.png`를 기록합니다. 결과물을 쉽게 구분할 수 있도록 파일 이름을 명시하세요. 출력할 상위 디렉터리는 명령을 실행하기 전에 만들어 두세요.

`--out -`는 PNG 바이트를 stdout으로 출력합니다.

```sh
pnpm dlx openscreenshot shot https://example.com --out - > screenshot.png
```

바이너리를 안전하게 다루는 리디렉션을 사용하세요. CLI는 항상 PNG를 만듭니다. 출력 이름을 `capture.jpg`나 `capture.pdf`로 지정해도 형식이 변환되지 않습니다. 주석이 달린 이미지나 PDF 출력이 필요하다면 [확장 프로그램 편집기](/ko/docs/#export)를 사용하세요.

## 자주 발생하는 실패 해결하기

Chrome을 찾을 수 없다면 Chrome을 설치하거나 `CHROME_PATH`를 브라우저 실행 파일로 설정하세요. 예를 들어 Chromium이 다음 경로에 설치된 Linux 시스템에서는 이렇게 실행합니다.

```sh
CHROME_PATH=/usr/bin/chromium pnpm dlx openscreenshot shot https://example.com --out screenshot.png
```

페이지 이동은 30초 제한 시간으로 `networkidle2`를 기다립니다. 현재 명령에는 사용자 지정 대기, 선택자, 쿠키, 로그인 옵션이 없습니다. 캡처에 성공했다고 해서 애플리케이션이 제대로 로드되었다는 뜻도 아닙니다. PNG에 오류 페이지, 로딩 상태, 누락된 리소스가 없는지 확인하세요.

종료 코드 0은 캡처 명령이 완료되었음을, 1은 캡처 실패를, 2는 잘못된 사용법이나 유효성 검사에 걸린 인수를 뜻합니다. 명령을 연결할 때 이 코드를 사용하고, 그다음 이미지 자체를 검토하세요.

반복 가능한 결과물이 필요하다면 [CI 캡처 가이드](/ko/blog/screenshots-for-ci/)를 읽어 보세요. 에이전트가 주도하는 작업 흐름은 [MCP 설정 가이드](/ko/blog/screenshot-mcp-server/)를 참고하세요. 사용 가능한 플래그는 [CLI 소스](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src)가 기준입니다.
