---
title: 'Chrome でページ全体のスクリーンショットを撮る方法: DevTools か拡張機能か'
description: Chrome DevTools の Capture full size screenshot コマンドの使い方と弱点を確認し、OpenScreenShot のキャプチャと比べます。
order: 1
---

Chrome では拡張機能なしでページ全体のスクリーンショットを撮れますが、使えるのは DevTools からだけです。DevTools を開き、コマンド メニューを開いて `screenshot` と入力し、**Capture full size screenshot**（フルサイズのスクリーンショットをキャプチャ）を実行します。Chrome はページ全体を PNG ファイルとして保存します。Chrome の通常のメニューにはスクリーンショットの項目がありません。Google のヘルプでは、**Cast, save, and share**（キャスト、保存、共有）の下に Share、Send to your devices、Create QR code が挙げられています。注釈を付けたい、PDF で書き出したい、パネルの中でスクロールするページをキャプチャしたい場合は、OpenScreenShot をインストールしてアイコンをクリックします。

## 標準機能による方法

1. キャプチャしたいページを開きます。
2. [DevTools を開きます](https://developer.chrome.com/docs/devtools/open)。Windows と Linux では `F12` または `Ctrl+Shift+I`、macOS では `Cmd+Option+I` を押します。
3. [コマンド メニュー](https://developer.chrome.com/docs/devtools/command-menu)を開きます。`Ctrl+Shift+P`、macOS では `Cmd+Shift+P` を押します。
4. `screenshot` と入力し、**Capture full size screenshot** を選びます。
5. Chrome がページ全体の PNG ファイルを保存します。

同じキャプチャはデバイスモードにもあります。デバイス ツールバーをオンにし、その **More options**（その他のオプション）メニューを開いて、フルサイズのスクリーンショットの項目を選びます。Google の[デバイスモードのドキュメント](https://developer.chrome.com/docs/devtools/device-mode)では、この項目を **Capture a full size screenshot** と呼んでいます。

この一連の操作を 1 回で行うショートカットはありません。Google はこのキャプチャ用の注釈ツールを記載していないため、矢印、テキスト、マスク処理は別のアプリで行います。

## 制限事項

- **DevTools を開く必要があります。** このコマンドがあるのは、コマンド メニューとデバイスモードのメニューだけです。
- **ページ サイズ。** Chromium は、幅または高さが 131,072 CSS ピクセル以上のページを “Page is too large.”（ページが大きすぎます）というエラーで拒否します。
- **固定要素。** キャプチャの際、Chromium はビューをページ全体のサイズに変更し、スクロールバーを隠します。そのため、ウィンドウの高さに合わせたセクション（`100vh`）や固定ヘッダー / フッターが、その縦長のビューに合わせてレイアウトされることがあります。固定フッターが画像の下端に 1 回だけ表示されたり、全画面の高さのヒーロー セクションが引き伸ばされたりすることがあります。
- **遅延読み込み。** `loading="lazy"` が指定された画像やフレームは、その近くまでスクロールしたときにだけ読み込まれます。コマンドを実行する前にページを最後までスクロールしてください。そうしないと、画像の一部が空白のまま残ることがあります。
- **内側のスクロール コンテナ。** Chromium はページ自体のスクロール サイズからキャプチャのサイズを決めます。高さが固定された枠の中でパネルがスクロールするページ（たとえば、コンテンツ欄がスクロールするウェブアプリやドキュメント サイト）では、そのパネルの 1 画面分の高さしか写りません。

## OpenScreenShot を使う場合

OpenScreenShot はページをビューポート単位でスクロールし、各部分をキャプチャして 1 枚の画像につなぎ合わせます。固定ヘッダーは最初の部分でキャプチャし、最上部に 1 回だけ配置します。ウィンドウの代わりに内側の要素がスクロールするページにも対応しています。高さが 32,000 デバイス ピクセルを超えるページは、最大 6 枚の画像として保存されます。

1. [Chrome ウェブストア から OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) をインストールし、アイコンをツールバーに固定します。
2. ページを開いてアイコンをクリックするか、`Ctrl+Shift+S`（macOS では `⌘⇧S`）を押します。
3. エディタで結果を確認します。特に先頭、末尾、固定されたナビゲーションを確認してください。
4. **画像を保存**をクリックし、PNG、JPEG、WebP、PDF のいずれかを選びます。その横の**コピー**と **PDF** は 1 回のクリックで完了します。

キャプチャではなくメニューが開いた場合は、**ページ全体**を選びます。この動作は**ワンクリック Express モード**の設定で切り替えます。[Chrome でページ全体のスクリーンショットを撮るガイド](/ja/blog/full-page-screenshot-chrome/)では、セクションが欠ける場合や繰り返される場合も含めて、拡張機能の使い方を順に説明しています。すべてのオプションは[キャプチャ モードのリファレンス](/ja/docs/#modes)と[書き出しのリファレンス](/ja/docs/#export)で確認できます。

## DevTools と OpenScreenShot の比較

- **開始:** DevTools では 2 つのショートカットとコマンドの入力が必要です。OpenScreenShot では 1 回のクリックか 1 つのショートカットで済みます。
- **出力:** DevTools は PNG を保存します。OpenScreenShot は PNG、JPEG、WebP、PDF で書き出すか、画像をコピーします。
- **編集:** DevTools には編集機能がありません。OpenScreenShot は、矢印、テキスト、手順番号、ぼかし、切り抜きを備えたエディタを開きます。
- **インストール:** DevTools は Chrome に最初から入っています。OpenScreenShot は MIT ライセンスの拡張機能で、キャプチャをローカルで処理します。

## どちらを使うか

- 拡張機能を追加できないコンピューターで、普通のページの PNG を 1 回だけ撮る場合は DevTools を使います。
- 内側のパネルがスクロールするページ、固定ヘッダーのあるページ、共有前に注釈を付けたいキャプチャには OpenScreenShot を使います。たとえば[バグ報告](/ja/use-cases/bug-reports/)や[デザイン レビュー](/ja/use-cases/design-review/)です。
- どちらも Microsoft Edge で使えます。Edge 独自のスクリーンショット ツールについては [Edge のガイド](/ja/full-page-screenshot/edge/)で説明しています。

`chrome://settings` などのブラウザのページでキャプチャに失敗する場合は、[サポートと既知の制限事項](/ja/support/)を参照してください。
