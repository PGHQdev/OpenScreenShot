---
title: 開発者、CI、AI エージェント向けのウェブサイト スクリーンショット ツール
description: openscreenshot の CLI と MCP サーバー、shot-scraper、Playwright などを、実行環境、ページ全体、CLI、MCP、動画、ライセンスで比較
audience: developers
order: 9
---

シェル スクリプトや CI ジョブで公開ページの PNG を撮るだけなら、コマンド ライン ツールで足ります。openscreenshot、shot-scraper、capture-website-cli、pageres-cli です。キャプチャにログイン、クリック、アサーション、動画が必要な場合は、Playwright か Puppeteer で書いてください。AI エージェント向けには、ローカルの MCP サーバーがスクリーンショットをモデルに返します。`openscreenshot serve` は 1 回の呼び出しで 1 枚のスクリーンショットを撮り、Playwright MCP はブラウザ セッション全体を操作します。

`openscreenshot` パッケージは私たちの製品です。このページでは、それが不利な選択肢になる場面も書いています。機能を比較するもので、ツールの順位付けはしません。すべての情報は 2026年10月9日時点のもので、以下にリンクした各プロジェクトのリポジトリ、パッケージ レジストリ、公式ドキュメントに基づいています。

## ツールの概要

| ツール              | 言語 / 実行環境                                           | ページ全体              | CLI             | MCP                     | 動画                  | ライセンス |
| ------------------- | --------------------------------------------------------- | ----------------------- | --------------- | ----------------------- | --------------------- | ---------- |
| openscreenshot      | Node.js 22.12+、インストール済みの Chrome、Chromium、Edge | `--full`                | あり            | あり、stdio             | なし                  | MIT        |
| shot-scraper        | Python 3.10+、Playwright のブラウザ                       | デフォルト              | あり            | 記載なし                | あり、WebM または MP4 | Apache-2.0 |
| capture-website-cli | Node.js 20+、Puppeteer の Chrome                          | `--full-page`           | あり            | 記載なし                | なし                  | MIT        |
| pageres-cli         | Node.js 20+、Puppeteer の Chrome                          | デフォルト              | あり            | 記載なし                | なし                  | MIT        |
| Playwright          | Node.js、Python、Java、.NET                               | `fullPage: true`        | テスト ランナー | Playwright MCP 経由     | あり                  | Apache-2.0 |
| Puppeteer           | Node.js 22.12+                                            | `fullPage: true`        | 記載なし        | 記載なし                | あり、Chrome で MP4   | Apache-2.0 |
| Playwright MCP      | `npx` 経由の Node.js、または Docker                       | `fullPage` パラメーター | サーバーのみ    | あり、stdio または HTTP | あり、オプトイン      | Apache-2.0 |

「記載なし」は、私たちが確認したプロジェクト自身のドキュメントにその機能の説明がないことを意味します。

## openscreenshot (CLI と MCP サーバー)

[openscreenshot](https://www.npmjs.com/package/openscreenshot) は、`puppeteer-core` を通じて手元のマシンにある Chrome、Chromium、Edge を操作するため、ブラウザをダウンロードしません。1 つのコマンドでページ全体の PNG を保存できます。

```sh
npx openscreenshot shot https://example.com --out example.png --full
```

フラグは `--out` (ファイル、または stdout を表す `-`)、`--full`、`--width` (200～3840、デフォルト 1280)、`--height` (200～2160、デフォルト 800) です。終了コード 0 は PNG が書き込まれたこと、1 はキャプチャの失敗、2 は使い方の誤りを意味します。`openscreenshot serve` は stdio で MCP サーバーを起動します。ツールは `capture_screenshot` の 1 つで、`url`、`fullPage`、`width`、`height` を受け取り、PNG の画像コンテンツを返します。セットアップは [CLI ガイド](/ja/blog/screenshot-cli/)、[MCP ガイド](/ja/blog/screenshot-mcp-server/)、[CI ガイド](/ja/blog/screenshots-for-ci/)で説明しており、[ソース](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src)がリファレンスです。

不利な選択肢になる場面:

- キャプチャのたびに、空のプロファイルで新しいブラウザが起動します。Cookie、ログイン、クリック、セレクターの待機はないため、ログインが必要なページではログイン画面が写ります。
- ページ移動は `networkidle2` を最大 30 秒待ち、追加の待機オプションはありません。ネットワークが落ち着いた後に描画されるページは、読み込みが途中の状態で写ることがあります。
- 出力は PNG のみで、PDF や動画はありません。
- MCP サーバーはローカルの stdio のみで、ホスト型の URL や HTTP トランスポートはありません。ツールは画像を返し、ファイルは書き込みません。
- コンテナーで動作するよう、ブラウザは `--no-sandbox` で実行されます。信頼できる URL だけをキャプチャしてください。
- Windows では、Edge とユーザー単位でインストールした Chrome は検出されません。`CHROME_PATH` を設定してください。

ログインが必要なページ、注釈、手動での PDF 書き出しには、[ブラウザ拡張機能](/ja/docs/)を使ってください。

## shot-scraper

[shot-scraper](https://github.com/simonw/shot-scraper) は、Playwright をベースにした Python のツールです。[スクリーンショットのドキュメント](https://github.com/simonw/shot-scraper/blob/main/docs/screenshots.md)に従って、インストールし、ブラウザをダウンロードし、スクリーンショットを撮ります。

```sh
pip install shot-scraper
shot-scraper install
shot-scraper https://example.com -o example.png
```

`--height` を省くと、スクリーンショットはページ全体になります。`--selector` は 1 つの要素をキャプチャし、`shot-scraper pdf` は PDF を保存し、`multi` は YAML に書いたショットの一覧を実行します。[1.10](https://github.com/simonw/shot-scraper/releases/tag/1.10) で追加された `video` コマンドは、YAML の絵コンテから WebM を録画し、`--mp4` は ffmpeg でそれを変換します。デフォルトのブラウザは Chromium で、Firefox と WebKit もインストールできます。チームが Python を使っている場合や、スクリーンショット、PDF、スクリプトで作るデモ動画を 1 つのツールで扱いたい場合に選んでください。

## capture-website-cli

[capture-website-cli](https://github.com/sindresorhus/capture-website-cli) は、Sindre Sorhus による Node.js のツールで、Puppeteer でページをキャプチャします。デフォルトはビューポートで、`--full-page` でスクロール可能なページ全体をキャプチャします。

```sh
npm install --global capture-website-cli
capture-website https://example.com --output=screenshot.png --full-page
```

`--output` を指定しない場合、画像を stdout に書き出します。出力は PNG、JPEG、WebP です。`--element`、`--hide-elements`、`--remove-elements`、`--click-element`、`--dark-mode`、`--style`、`--script` などのフラグでキャプチャ前にページを準備でき、これは openscreenshot にはできないことです。キャプチャの前に Cookie バナーを隠したり CSS を注入したりする必要がある場合に選んでください。

## pageres-cli

[pageres-cli](https://github.com/sindresorhus/pageres-cli) は、1 回の実行で複数の URL を複数の解像度でキャプチャします。

```sh
pageres https://example.com 1366x768 1600x900
```

URL と解像度のすべての組み合わせを、デフォルトではページ全体でキャプチャします。`--crop` は各画像を指定した高さに制限します。出力は PNG または JPEG で、デフォルトのサイズは 1366x768 です。`iphone5s` などのデバイス キーワードは、現在はサポートされていません。開発の動きは少なく、最後のリリースは 2025年9月9日の v9.0.0 で、Node.js の要件を 20 に引き上げ、フラグを 3 つ追加しました。複数の幅でレスポンシブ表示を手早く確認したい場合に選んでください。

## Playwright

[Playwright](https://github.com/microsoft/playwright) は、Chromium、Firefox、WebKit 向けの Microsoft の自動化・テスト フレームワークで、Node.js、Python、Java、.NET のバインディングがあります。ページ全体のスクリーンショットは、[`page.screenshot`](https://playwright.dev/docs/api/class-page#page-screenshot) のオプションの 1 つです。

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://playwright.dev/docs/api/class-page#page-pdf) はヘッドレスの Chromium でのみ動作します。[動画の録画](https://playwright.dev/docs/videos)はコンテキストのオプションで、テスト ランナーは失敗したテストの動画だけを残すこともできます。スクリーンショットが、ログイン、クリック、アサーションを行うテストの 1 ステップである場合に Playwright を選んでください。

## Puppeteer

[Puppeteer](https://github.com/puppeteer/puppeteer) は、Chrome と Firefox 向けの Google の Node.js ライブラリです。`npm i puppeteer` で Chrome for Testing がダウンロードされます。[スクリーンショットのオプション](https://pptr.dev/api/puppeteer.screenshotoptions)も同じ形です。

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://pptr.dev/api/puppeteer.page.pdf) は印刷用 CSS で PDF を生成します。puppeteer-core 25.10.0 で追加された [`page.record()`](https://pptr.dev/api/puppeteer.page.record) は、Chrome で MP4 を録画します。Firefox は WebDriver BiDi 経由で動作し、一部の機能はサポートされていません。openscreenshot は `puppeteer-core` の薄いラッパーなので、その 4 つのキャプチャ オプション以上のことが必要な場合は、Puppeteer を直接使ってください。

## Playwright MCP

[Playwright MCP](https://github.com/microsoft/playwright-mcp) は、エージェントがアクセシビリティ スナップショットを通じてブラウザを操作できるようにするため、ビジョン モデルは不要です。[README](https://github.com/microsoft/playwright-mcp/blob/v0.0.83/README.md) には、次の標準の設定が載っています。

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

`browser_take_screenshot` ツールは `fullPage` パラメーターを受け取り、PNG、JPEG、WebP を返します。PDF と動画のツールは `--caps` によるオプトインです。ブラウザはデフォルトでヘッド付きで実行され、永続的なプロファイルを保持するため、ログイン状態を引き継げます。`--isolated`、`--storage-state`、`--extension` (実行中の Chrome または Edge に接続) でこの動作を変更できます。`--port` を指定すると、stdio の代わりに HTTP で提供します。まだ 0.0.x のリリース (v0.0.83) です。エージェントがログイン、クリック、フォーム入力を行う必要がある場合は、`openscreenshot serve` より Playwright MCP を選んでください。

## どれを選ぶか

- **スクリプトや CI の成果物として公開ページの PNG を撮る:** openscreenshot、shot-scraper、capture-website-cli。
- **同じページを複数の幅で撮る:** pageres-cli。
- **先に要素を隠すか CSS を注入する:** capture-website-cli または shot-scraper。
- **コマンド ラインで PDF やスクリプトで作るデモ動画を作る:** shot-scraper。
- **テスト スイートでのログイン、クリック、アサーション:** Playwright または Puppeteer。
- **ページを見るだけのエージェント:** `openscreenshot serve`。
- **ページを操作したりログインしたりする必要があるエージェント:** Playwright MCP。
- **ログインが必要なページをキャプチャして注釈を付ける人:** 拡張機能。[ページ全体のスクリーンショット拡張機能の比較](/ja/blog/full-page-screenshot-extensions/)をご覧ください。
