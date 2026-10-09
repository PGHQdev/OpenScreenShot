---
title: コマンド ラインからウェブサイトのスクリーンショットを撮る
description: OpenScreenShot CLI で、固定ビューポート、ページ全体、stdout へのバイナリ出力で PNG のスクリーンショットを保存します。
audience: developers
order: 4
---

OpenScreenShot CLI は、ローカルにインストールされた Chrome 互換ブラウザを使って、ウェブページを PNG としてキャプチャします。ブラウザ拡張機能とは別のパッケージです。Node.js、pnpm、Chrome がインストールされていれば、次を実行します。

```sh
pnpm dlx openscreenshot shot https://example.com --out screenshot.png --full
```

このコマンドは別のヘッドレス ブラウザを起動し、URL に移動して画像を書き込み、ブラウザを閉じます。普段使っているブラウザのタブやログイン済みのプロファイルには接続しません。

## ビューポートを明示的に設定する

ビューポートのスクリーンショットでは、`--full` を省きます。幅のデフォルトは 1280 ピクセル、高さのデフォルトは 800 ピクセルです。レイアウトに特定のサイズが必要な場合は、両方を設定します。

```sh
pnpm dlx openscreenshot shot https://example.com --out desktop.png --width 1440 --height 900
pnpm dlx openscreenshot shot https://example.com --out narrow.png --width 390 --height 844
```

幅には 200～3840、高さには 200～2160 の整数を指定できます。狭いビューポートでは、その幅でのレスポンシブ レイアウトを確認できます。ただし、スマートフォンのタッチ入力、デバイス ピクセル比、モバイル ブラウザはエミュレートしません。CLI はデスクトップのユーザー エージェントを使います。

ビューポートの外までキャプチャするには、`--full` を追加します。ヘッドレス ブラウザのページ全体のキャプチャは、拡張機能のスクロールしてつなぎ合わせる実装とは異なります。動的なページがどちらでもまったく同じに見えるとは考えないでください。

## ファイルに保存するか stdout に書き出す

`--out` を指定しない場合、コマンドは現在のディレクトリに `screenshot.png` を書き込みます。成果物を見分けやすくするには、ファイル名を明示してください。出力先の親ディレクトリは、コマンドの実行前に作成しておきます。

`--out -` は PNG のバイトを stdout に書き出します。

```sh
pnpm dlx openscreenshot shot https://example.com --out - > screenshot.png
```

バイナリを壊さないリダイレクトを使ってください。CLI は常に PNG を出力します。出力に `capture.jpg` や `capture.pdf` という名前を付けても変換はされません。注釈付きの画像や PDF の出力には、[拡張機能のエディタ](/ja/docs/#export)を使ってください。

## よくある失敗を解決する

Chrome が見つからない場合は、インストールするか、`CHROME_PATH` にブラウザの実行ファイルを設定します。たとえば、Chromium が次のパスにインストールされている Linux システムでは、次のようにします。

```sh
CHROME_PATH=/usr/bin/chromium pnpm dlx openscreenshot shot https://example.com --out screenshot.png
```

ページ移動は `networkidle2` を待ち、タイムアウトは 30 秒です。現在のコマンドには、独自の待機、セレクター、Cookie、ログインのオプションはありません。また、キャプチャが成功しても、アプリケーションが正しく読み込まれたことの証明にはなりません。PNG を開いて、エラー ページ、読み込み中の状態、欠けているアセットがないか確認してください。

終了コード 0 はキャプチャ コマンドが完了したこと、1 はキャプチャの失敗、2 は使い方の誤りまたは引数の検証エラーを示します。コマンドをつなげるときはこれらのコードを使い、そのうえで画像そのものを確認してください。

繰り返し再現できる成果物については、[CI でのキャプチャ ガイド](/ja/blog/screenshots-for-ci/)をご覧ください。エージェントを使う手順については、[MCP のセットアップ ガイド](/ja/blog/screenshot-mcp-server/)をご覧ください。使えるフラグは [CLI のソース](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src)を参照してください。
