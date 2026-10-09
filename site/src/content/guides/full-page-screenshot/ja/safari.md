---
title: Safari でページ全体のスクリーンショットを撮る方法
description: Mac の Safari にはページ全体の画像キャプチャがありません。ページを PDF で保存するか、Web インスペクタで要素を 1 つキャプチャするか、別のブラウザを使います。
order: 4
---

Mac の Safari には、ページ全体のスクリーンショットを撮るコマンドがありません。標準機能でいちばん近いのは PDF です。**File**（ファイル）> **Print**（プリント）を選び、ダイアログの下部にある **PDF** をクリックしてファイルを保存します。画像ファイルが必要な場合は、Safari の Web インスペクタでページの要素を 1 つキャプチャできます。OpenScreenShot には Safari 版がありません。Safari は Mac App Store から Safari Web Extensions をインストールする仕組みで、Chrome ウェブストア や Firefox アドオンのパッケージはインストールできません。Mac では、Chrome、Firefox、Edge などのブラウザで OpenScreenShot を使えます。

## 標準機能による方法

### ページを PDF で保存する

Apple はこの方法を [Print or create a PDF of a webpage in Safari](https://support.apple.com/guide/safari/print-or-create-a-pdf-of-a-webpage-ibrw1060/18.0/mac/15.0) で説明しています。

1. 残したいページを開きます。
2. 遅れて読み込まれる画像が読み込まれるように、ページを一度最後までスクロールします。
3. **File** > **Print** を選びます。
4. ページの色を残すには、プリントのオプションで背景の画像と色のプリントをオンにします。ヘッダーとフッターに Web アドレスと日付を追加することもできます。
5. ダイアログの下部にある **PDF** をクリックし、ファイルを保存します。

### Web インスペクタで要素をキャプチャする

1. **Safari** > **Settings**（設定）> **Advanced**（詳細）を選び、**Show features for web developers**（Web 開発者向け機能を表示）を選択します。この手順は WebKit の [Enabling Web Inspector](https://webkit.org/web-inspector/enabling-web-inspector/) で説明されています。
2. ページを開き、`Option+Cmd+I` を押して Web インスペクタを開きます。
3. **Elements**（要素）タブで、`<html>` や `<body>` などのノードを右クリックし、**Capture Screenshot**（スクリーンショットを撮る）を選びます。
4. Safari がそのノードのスナップショットをファイルに保存します。

`<html>` のキャプチャにページの表示範囲より下の内容が含まれるかどうか、どの画像形式で書き出されるかについて、Apple は記載していません。使う前にファイルを確認してください。

## 制限事項

- **ページ全体の画像は得られません。** どちらの方法でも、ページ全体をキャプチャするツールで得られるようなスクリーンショットにはなりません。PDF はページのプリント版で、Web インスペクタの項目がキャプチャするのは 1 つのノードです。
- **プリント用のレイアウト。** PDF はプリント用のレイアウトを使うため、ファイル内のページは画面上のページと見た目が異なることがあります。デザインが背景の画像と色に依存している場合は、それらをオンにしてください。
- **遅延読み込み。** `loading="lazy"` が指定された画像は、その近くまでスクロールしたときにだけ読み込まれます。プリントやキャプチャの前にページを最後までスクロールしてください。そうしないと、一部が空白のまま残ることがあります。
- **内側のスクロール コンテナ。** 開発者の報告によると、Safari のエンジンである WebKit で自動化されたページ全体のキャプチャを行うと、高さが固定された枠の中でパネルがスクロールするページでは 1 画面分の高さしか写りません。そのように作られたページは注意して確認してください。
- **固定ヘッダー。** 結果を見て、ヘッダーが欠けていないか、繰り返されていないか、ずれていないかを確認してください。

## OpenScreenShot を使う場合

OpenScreenShot は Safari では使えません。同じ Mac に Chrome、Firefox、Edge、Brave、Opera、Vivaldi、Arc のいずれかがある場合は、そのブラウザでページを開いて拡張機能を使ってください。Chrome とほかの Chromium ブラウザでは [Chrome ウェブストア](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) から、Firefox では [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) からインストールします。

1. 別のブラウザに OpenScreenShot をインストールし、アイコンをツールバーに固定します。
2. ページを開いてアイコンをクリックします。Chrome では `⌘⇧S` でもページ全体のキャプチャが始まります。
3. エディタで結果を確認します。
4. **画像を保存**をクリックし、PNG、JPEG、WebP、PDF のいずれかを選びます。

拡張機能はページをスクロールし、各部分を 1 枚の画像につなぎ合わせ、固定ヘッダーを最上部に 1 回だけ配置します。高さが 32,000 デバイス ピクセルを超えるページは、最大 6 枚の画像として保存されます。[Chrome のガイド](/ja/full-page-screenshot/chrome/)と [Firefox のガイド](/ja/full-page-screenshot/firefox/)では、それぞれのブラウザ標準のツールも含めて手順を説明しています。

## どちらを使うか

- 記事や領収書のページを読める形で残すには、Safari で **File** > **Print** > **PDF** を使います。
- カードやグラフなど、ページの一部の画像には Web インスペクタの **Capture Screenshot** を使います。
- 注釈を付けられるページ全体の画像や、画面上の見た目どおりのページの PDF が必要な場合は、Mac の別のブラウザで OpenScreenShot を使います。PDF のレイアウトの比較は[スクリーンショットを PDF にするガイド](/ja/blog/save-screenshot-as-pdf/)で、名前の付け方と保存については[ページの見た目をコピーとして保存する方法](/ja/use-cases/archive-web-pages/)で説明しています。

そのほかの質問については、[サポートと既知の制限事項](/ja/support/)を参照してください。
