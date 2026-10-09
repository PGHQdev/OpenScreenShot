---
title: Opera でページ全体のスクリーンショットを撮る方法
description: Opera の Snapshot ツールはページ全体を PDF でしか保存できません。手順と制限、OpenScreenShot でページ全体を画像にする方法を説明します。
order: 6
---

Opera 標準の Snapshot ツールは、選択範囲または表示範囲を画像としてキャプチャし、ページ全体は PDF としてのみキャプチャします。`Shift+Ctrl+5`（macOS では `Shift+Cmd+2`）を押し、**Save page as PDF**（ページを PDF として保存）を選びます。ページ全体の画像ファイルが必要な場合は、OpenScreenShot をインストールします。Opera は Chromium ベースのブラウザで、Opera の **Install Chrome Extensions** アドオンを追加すると、Chrome ウェブストア から OpenScreenShot をインストールできます。

## 標準機能による方法

Opera は[機能のヘルプ ページ](https://help.opera.com/en/latest/features/)と [Snapshot のページ](https://www.opera.com/features/snapshot)で Snapshot を説明しています。

1. キャプチャしたいページを開きます。
2. Windows と Linux では `Shift+Ctrl+5`、macOS では `Shift+Cmd+2` を押します。ツールバーの右側にあるカメラのアイコンをクリックすることもできます。
3. **Save page as PDF** を選びます。Opera はページ全体を上から下まで PDF として保存します。

Snapshot には画像の選択肢が 2 つあります。**Capture Full Screen**（全画面をキャプチャ）はページの表示範囲だけをキャプチャし、**Capture**（キャプチャ）は調整した枠の範囲をキャプチャします。どちらも、Zoom、Arrow、Blur、Highlight、Pencil、Selfie camera、Emojis、Text で書き込める画像になり、**Save Image**（画像を保存）で PNG として保存するか、クリップボードにコピーできます。

## 制限事項

- **ページ全体は PDF だけです。** 画像のキャプチャは表示範囲か選択範囲が対象です。ページ全体を取得すると PDF になります。
- **記載されていないレイアウト。** PDF が 1 枚の長いページか複数のページか、固定ヘッダーをどう扱うか、高さが固定された枠の中でパネルがスクロールするページをどう扱うかについて、Opera は記載していません。共有する前に PDF を開いて確認してください。
- **遅延読み込み。** `loading="lazy"` が指定された画像は、その近くまでスクロールしたときにだけ読み込まれます。保存する前にページを最後までスクロールしてください。そうしないと、一部が空白のまま残ることがあります。
- **無限スクロール。** 読み込みが続くフィードには、本当の末尾がありません。どのキャプチャにも、開始前に読み込まれた分だけが入ります。

## OpenScreenShot を使う場合

OpenScreenShot はページをスクロールし、部分ごとにキャプチャして 1 枚の画像につなぎ合わせます。固定ヘッダーは最上部に 1 回だけキャプチャされ、内側の要素がスクロールするページにも対応しています。高さが 32,000 デバイス ピクセルを超えるページは、最大 6 枚の画像として保存されます。

1. Opera アドオンから **Install Chrome Extensions** アドオンを追加します。この手順は Opera の [Using add-ons from Chrome in Opera](https://blogs.opera.com/tips-and-tricks/2021/10/using-addons-from-chrome-in-opera/) で説明されています。
2. [OpenScreenShot の掲載ページ](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)を開き、拡張機能を追加します。
3. OpenScreenShot のアイコンをツールバーに固定します。
4. ページを開いてアイコンをクリックするか、`Ctrl+Shift+S`（macOS では `⌘⇧S`）を押します。初期設定では、ページ全体のキャプチャが始まり、結果がエディタで開きます。
5. 先頭、末尾、固定されたナビゲーションを確認します。
6. **画像を保存**をクリックして PNG、JPEG、WebP、PDF のいずれかを選ぶか、**コピー**をクリックします。

アイコンでメニューが開く場合は**ページ全体**を選びます。この動作は**ワンクリック Express モード**の設定で切り替えます。OpenScreenShot の PDF にはスクリーンショットが画像として入るため、画面上のページと同じ見た目になりますが、文字の検索や選択はできません。**ページ サイズ**で**全体**を選ぶと画像に合わせたサイズの 1 ページになり、**A4** または **Letter** では長いキャプチャを複数のページに分割できます。これらのレイアウトの比較は[スクリーンショットを PDF にするガイド](/ja/blog/save-screenshot-as-pdf/)で確認できます。

## どちらを使うか

- インストールなしで手早くページ全体の PDF を作るには、Snapshot の **Save page as PDF** を使います。
- 表示範囲や選択範囲に少し書き込むだけなら、Snapshot の画像の選択肢を使います。
- ページ全体の PNG、JPEG、WebP、内側のパネルがスクロールするページ、画面どおりの PDF には OpenScreenShot を使います。たとえば[デザイン レビュー](/ja/use-cases/design-review/)や[ページのコピーの保存](/ja/use-cases/archive-web-pages/)です。

すべてのオプションは[キャプチャ モードのリファレンス](/ja/docs/#modes)と[書き出しのリファレンス](/ja/docs/#export)で確認できます。[Vivaldi のガイド](/ja/full-page-screenshot/vivaldi/)では、独自のキャプチャ ツールを持つ別の Chromium ブラウザを説明しています。ブラウザの設定など、拡張機能をブロックするページについては、[サポートと既知の制限事項](/ja/support/)を参照してください。
