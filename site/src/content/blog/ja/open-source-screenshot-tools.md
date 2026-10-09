---
title: あらゆるプラットフォーム向けのオープンソース スクリーンショット ツール
description: OpenScreenShot、Screenity、ShareX、Flameshot、Playwright などのオープンソース ツールを動作環境別に紹介します。
audience: everyday
order: 8
---

オープンソースのスクリーンショット ツールは、キャプチャする対象がどこにあるかで選びます。Windows の画面上のものなら ShareX を使います。Linux、macOS、Windows のデスクトップなら Flameshot を使います。ウェブページなら OpenScreenShot や Firefox に組み込まれた Screenshots ツールなどのブラウザ ツールを使い、スクリプトからのスクリーンショットには shot-scraper、Playwright、Puppeteer を使います。

OpenScreenShot は私たちの製品です。このページでは OpenScreenShot が合わないケースも記載しており、ツールの順位付けはしていません。すべての情報は 2026年10月9日時点のもので、以下にリンクした各プロジェクトのリポジトリ、ストアの掲載ページ、公式サイトに基づいています。

## どのツールがどのプラットフォームに対応するか

| ツール              | 動作環境                                                  | キャプチャ対象                                             | ライセンス     | ページ全体            | 動画                          |
| ------------------- | --------------------------------------------------------- | ---------------------------------------------------------- | -------------- | --------------------- | ----------------------------- |
| OpenScreenShot      | Chrome、Firefox                                           | タブ内のウェブページ                                       | MIT            | はい                  | タブの録画、Chrome 版のみ     |
| Screenity           | Chrome と、Chrome ウェブストア を使う Chromium 系ブラウザ | タブ、範囲、デスクトップ、アプリのウィンドウ、カメラの録画 | GPL-3.0        | 記載なし              | はい                          |
| ShareX              | Windows                                                   | 画面上のあらゆるもの                                       | GPL-3.0        | スクロール キャプチャ | 動画と GIF                    |
| Flameshot           | Linux、macOS、Windows                                     | 画面の範囲                                                 | GPL-3.0        | いいえ                | 記載なし                      |
| Firefox Screenshots | デスクトップ版 Firefox                                    | ウェブページ                                               | Firefox の一部 | はい                  | 記載なし                      |
| shot-scraper        | Python 3.10 以降                                          | ウェブページ（コマンドから）                               | Apache-2.0     | はい、デフォルト      | はい、スクリプト ファイルから |
| Playwright          | Node.js、Python、Java、.NET                               | ウェブページ（コードから）                                 | Apache-2.0     | はい                  | はい                          |
| Puppeteer           | Node.js                                                   | ウェブページ（コードから）                                 | Apache-2.0     | はい                  | はい、Chrome                  |

これらのツールはどれも Android や iOS では動作しません。ブラウザ拡張機能から見えるのは、そのタブ内のウェブページだけです。デスクトップ アプリは画面全体を見られますが、ウェブページがどこで終わるかはわかりません。

## ブラウザ: OpenScreenShot

[OpenScreenShot](https://github.com/pghqdev/OpenScreenShot) は、[Chrome](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) と [Firefox](https://addons.mozilla.org/firefox/addon/openscreenshot/) 向けの MIT ライセンスの拡張機能です。ページ全体、表示領域、選択範囲、1 つの要素をキャプチャできます。その後、矢印、図形、テキスト、手順番号、ぼかし、切り抜きを備えたエディタが開き、PNG、JPEG、WebP、PDF で書き出せます。キャプチャと編集はブラウザ内で実行され、拡張機能がスクリーンショットや録画をアップロードすることはありません。各モードは[ドキュメント](/ja/docs/)で説明しています。

Chrome 版では、任意でマイク、タブの音声、ウェブカメラを加えて[タブを録画](/ja/docs/#record)し、MP4 または WebM で書き出すこともできます。Firefox 版はスクリーンショットのみに対応しています。

必要なものがブラウザのタブの外にある場合、OpenScreenShot は適していません。デスクトップ、ほかのアプリ、ブラウザの設定ページはキャプチャできず、画面全体の録画もできません。

## ブラウザでの録画: Screenity

[Screenity](https://github.com/alyssaxuu/screenity) は、Chrome 向けの画面録画と注釈の拡張機能です。タブ、範囲、デスクトップ、任意のアプリのウィンドウ、カメラを、マイクと内部音声付きで録画できます。MP4、GIF、WebM で書き出すか、Google Drive に保存します。描画、テキスト、矢印、図形の追加や、ページ上の機密情報のぼかしもできます。

ライセンスは [GPL-3.0](https://github.com/alyssaxuu/screenity/blob/master/LICENSE) です。README によると、バージョン 3.0.0 以降の Manifest V3 版でライセンスが GPLv3 に変わりました。拡張機能は無料で、ローカルでの録画にサインインは不要です。[Screenity Pro](https://screenity.io/pro) は 7 日間の試用期間の後に月 $10 または年 $120 で、アカウントを作成すると、エディタ、リンク共有、EU のサーバーでのクラウド ホスティングが加わります。README によると、一部のコードは Screenity Pro に接続し、それが有効になるのは Chrome ウェブストア 版だけです。

Screenity はインストール時にすべてのウェブサイトへのアクセスを求めます。ドキュメントにページ全体のスクリーンショットの記載はありません。デスクトップやほかのアプリを録画する必要がある場合は、OpenScreenShot より Screenity を選んでください。[Screenity の代替ツール](/ja/alternatives/screenity/)をご覧ください。

## Windows: ShareX

[ShareX](https://getsharex.com/) は広告のない無料の Windows アプリで、ライセンスは [GPL-3.0](https://github.com/ShareX/ShareX) です。画面、ウィンドウ、範囲をキャプチャできます。[スクロール キャプチャ](https://getsharex.com/docs/scrolling-screenshot)は連続したスクリーンショットを比較して変化した部分を追加するため、画面の外までスクロールする内容を 1 枚の画像に収められます。動画や GIF の録画もでき、README には OCR と QR コードの読み取りも記載されています。

画像エディタには、図形、矢印、テキスト、吹き出し、ぼかし、ピクセル化、ハイライト、スポットライトがあります。ShareX は多くのサービスにアップロードでき、キャプチャ後のタスクを設定すると自動でアップロードされます。非公開の内容をキャプチャする前に、これらの設定を確認してください。インストーラー、ポータブル版、Microsoft Store、Steam から入手できます。最新リリースの v21.0.0 は 2026年7月3日に公開されました。

ShareX は macOS と Linux では動作しません。

## Linux、macOS、Windows: Flameshot

[Flameshot](https://flameshot.org/) は Linux、macOS、Windows 向けの無料のスクリーンショット ツールで、ライセンスは [GPL-3.0](https://github.com/flameshot-org/flameshot) です。範囲を選択し、その場で矢印、ハイライト、ぼかしまたはピクセル化、テキスト、フリーハンドの線、四角形、カウンター番号で注釈を付けます。コマンド ライン インターフェイスもあります。README には Imgur への任意のアップロードが記載されており、Return キーで開始されます。非公開の内容をキャプチャする前に、このキーを覚えておいてください。

[バージョン 14.0.0](https://github.com/flameshot-org/flameshot/releases/tag/v14.0.0)（2026年6月）では、キャプチャするモニターを尋ね、Linux では xdg-desktop-portal を主なキャプチャ方法として使います。README では、GNOME と Plasma の Wayland 対応は試験的とされています。

Flameshot にスクロール キャプチャはありません。[機能リクエスト](https://github.com/flameshot-org/flameshot/issues/1130)は未解決のままです。ドキュメントに録画機能は見つかりませんでした。Linux でウェブページ全体をキャプチャするには、Flameshot とブラウザ ツールを組み合わせてください。

## 組み込み: Firefox Screenshots

Firefox はオープンソースで、その Screenshots ツールはインストール不要です。[Mozilla のガイド](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/)によると、ページを右クリックして **Take Screenshot**（スクリーンショットを撮影）を選び、範囲、表示領域、**Save full page**（ページ全体を保存）のいずれかを選びます。結果はコピーまたはダウンロードします。Mozilla は Firefox 67（2019年5月）で Screenshots サーバーへの[アップロードを終了](https://blog.mozilla.org/futurereleases/2019/01/24/clarifying-the-future-of-firefox-screenshots/)したため、キャプチャはローカルに残ります。

コマンドで撮影する場合、Firefox DevTools のコンソールで `:screenshot --fullpage` を使うと、PNG が「ダウンロード」に保存されます（[DevTools のドキュメント](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html)による）。Chrome の DevTools のフロントエンドも [BSD-3-Clause](https://github.com/ChromeDevTools/devtools-frontend) のもとでオープンソースで、**Capture full size screenshot**（フルサイズのスクリーンショットをキャプチャ）コマンドで PNG を保存します。各ブラウザについては[ページ全体のスクリーンショット ガイド](/ja/full-page-screenshot/)で説明しています。

## スクリプトから: shot-scraper、Playwright、Puppeteer

これらのツールは、コマンドやコードからウェブページをキャプチャし、繰り返しの作業や CI に使えます。ページを専用のブラウザで読み込むため、サインイン済みのタブは見えません。

- [shot-scraper](https://github.com/simonw/shot-scraper) は Playwright を基盤にした Python のコマンド ライン ツールです。デフォルトでページ全体のスクリーンショットを撮影し、YAML スクリプトから PDF の保存や動画の録画もできます。
- [Playwright](https://github.com/microsoft/playwright) は Microsoft のブラウザ自動化・テスト フレームワークで、Chromium、Firefox、WebKit に対応し、スクリーンショット、PDF、動画の API を備えています。
- [Puppeteer](https://github.com/puppeteer/puppeteer) は Google の Chrome と Firefox 向けの Node.js ライブラリで、スクリーンショット、PDF、MP4 録画の API を備えています。

私たちの MIT ライセンスの `openscreenshot` パッケージは、コマンド ライン ツールと AI エージェント向けの MCP サーバーを提供します。これらすべてについては、コマンド付きで[開発者向けの比較](/ja/blog/website-screenshot-tools-for-developers/)で説明しています。

## どれを選ぶか

- **Windows の画面上のあらゆるもの（スクロール キャプチャ付き）:** ShareX。
- **Linux や macOS の画面の範囲:** Flameshot。
- **注釈と PDF 書き出しに対応したウェブページ全体:** OpenScreenShot。インストールなしで手早くキャプチャするなら Firefox Screenshots。
- **デスクトップやほかのアプリの録画:** Screenity、または Windows なら ShareX。
- **スクリプトや CI からのスクリーンショット:** shot-scraper、Playwright、Puppeteer。

オープンソースである必要がない場合は、[ページ全体のスクリーンショット拡張機能の比較](/ja/blog/full-page-screenshot-extensions/)で GoFullPage、FireShot などを紹介しています。[比較ページ](/ja/compare/)では OpenScreenShot、GoFullPage、FullPage Capture を並べて比べています。
